function processAmazonPrimeNowInvoice() {
    console.log("processAmazonPrimeNowInvoice")

    var transaction = {
        "Vendor":"Amazon.com",
        "URL": window.location.href,
        "is_prime_now": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getPaymentMetaData(transaction);
    getOrderItemization(transaction);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.getElementById("browser-order-status-order-number").innerText.split("Order #: ")[1].trim();

    // Get OrderDate
    date_str = document.getElementById("browser-order-status-order-date").innerText.split(": ")[1];
     processOrderDate(date_str, transaction)

    // TODO Get ShipDate (aka Delivery Time)
    //xpathShipDate = "/html/body/table/tbody/tr/td/table[2]/tbody/tr/td/table/tbody/tr[1]/td/table/tbody/tr/td/b/center";
    //shipDateString = document.evaluate(xpathShipDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
    //                        .singleNodeValue.innerText
    //                        .replace("Shipped on ","");
    //shipDate = new Date(shipDateString)
    //transaction["ShipDate"] = shipDate.toLocaleDateString();

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementById("checkout-total-price-field"));

    transaction["is_split_tip_across_statements"] = false
}

/*==========================================================================================
PAYMENT METADATA
==========================================================================================*/

function getPaymentMetaData(transaction) {
    console.log("getPaymentMetaData")

    var payment_metadata = [];

    // Get Payment Information element
    var xpathPaymentItemRows = "//*[contains(@class, 'pmts-payments-instrument-details')]";
    var paymentInfoTableRowsXPR = document.evaluate(xpathPaymentItemRows, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

    while ((nodeRow = paymentInfoTableRowsXPR.iterateNext()) != null) {
        var paymentMethod = nodeRow.getElementsByTagName("img")[0].alt + ' ' + nodeRow.innerText
        payment_metadata.push(paymentMethod)
    }

    transaction["PaymentMethod"] = payment_metadata;
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    xpathItemsPurchased = "/html/body/div[1]/div[1]/div[4]/div[3]/div[3]/div[2]/div/div[position() > 1] | /html/body/div[1]/div[1]/div[4]/div[3]/div[3]/div[1]/div/div[position() > 1]";
    itemsPurchasedXPR = document.evaluate(xpathItemsPurchased, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

    // Parse purchased items
    while ((nodePurchasedItem = itemsPurchasedXPR.iterateNext()) != null) {
        var purchased_item = []

        // Drill into purchased item
        var xpathItem = "./div/a/div/div/div[2] | ./div/div/div/div[1]/a"
        var itemXPR = document.evaluate(xpathItem, nodePurchasedItem, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if ( itemXPR.singleNodeValue === null ) {
            continue
        }

        var itemNode = itemXPR.singleNodeValue.childNodes;
        console.log("Parsing purchased item: " + itemNode[1].innerText)
        var priceNodes = itemNode[3].children;
        var priceNode = priceNodes[1];
        var weightElementIndex = 1;

        //-------------------------
        // Item Description
        var quantity = priceNodes[0].innerText.split("$")[0].trim();
        if (quantity === "") {
            // fill in for omitted quantity
            quantity = "QTY: 1"
            weightElementIndex = 0
        }
        var description = quantity + "; " + itemNode[1].innerText;

        // handle special annotated cases
        if (itemNode.length > 5) {
            var node_annotation = itemNode[5];

            // handle weighed product case
            var is_weighed = priceNodes[weightElementIndex].innerText.includes("per pound")
            if (is_weighed) {
                var weight_data = node_annotation.children[itemNode[5].childElementCount-1]

                // parse actual weight
                var weight = weight_data.children[1].innerText;

                // tag on unit price
                description += "; " + weight + " @ " + priceNodes[weightElementIndex].innerText;

                // select correct price node
                priceNode = weight_data.children[2];
            }

            // handle out of stock case
            var is_out_of_stock = node_annotation.innerText.includes("Out of stock")
            if (is_out_of_stock) {
                // Correct quantity
                var qty_out_of_stock = node_annotation.children[0].innerText;
                var pos_lparens = qty_out_of_stock.indexOf("(")+1;
                var pos_rparens = qty_out_of_stock.lastIndexOf(")");
                var qty_out_of_stock = parseInt(qty_out_of_stock.slice(pos_lparens, pos_rparens));
                var tokens_desc = description.split("; ");
                var tokens_count = tokens_desc[0].split(" ");
                var qty_ordered = parseInt(tokens_count[1]) - qty_out_of_stock;
                description = tokens_count[0] + " " + qty_ordered + "; " + tokens_desc[1] + "(" + qty_out_of_stock + "x out of stock)";

                // Correct price
                var price_adjustment = parsePrice(node_annotation.children[1]);
                var price = parsePrice(priceNode) + price_adjustment;
                priceNode = price
            }
        }

        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(priceNode);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    var xpathOrderSummary = "/html/body/div[1]/div[1]/div[4]/div[3]/div[1]/div[2]/div[2 < position() and position() < last()]"
    var orderSummaryXPR = document.evaluate(xpathOrderSummary, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null )
    var ignoredRows = new RegExp("Total before tax & tip:|Order total:|Refund:");
    while ((nodeRow = orderSummaryXPR.iterateNext()) != null) {
        // Ignore Irrelevant Rows
        if (ignoredRows.test(nodeRow.innerText)) {
            continue
        }

        // Handle refund case for original total
        if (nodeRow.children[0].innerText.includes("Original Charge:"))
        {
            transaction["Total"] = parsePrice(nodeRow.children[1]);
            continue
        }

        // Split tip across statements
        if (nodeRow.innerText.includes("The tip will appear as a separate charge on your statement.")){
            transaction["is_split_tip_across_statements"] = true;
            continue
        }

        purchased_items.push([nodeRow.children[0].innerText.replace(":",""), parsePrice(nodeRow.children[1])]);
    }

    transaction["Items"] = purchased_items;
}

processAmazonPrimeNowInvoice();
