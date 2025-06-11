function processVitacostInvoice() {
    console.log("processVitacostInvoice")

    var transaction = {
        "Vendor":"Vitacost.com",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
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

    var order_meta_tokens = document.getElementById("IamMasterFrameYesIam_ctl02_panelOrder").innerText.split("Placed");

    // Get Order Number
    transaction["Order#"] = order_meta_tokens[0].split("#")[1].trim();

    // Get OrderDate
    date_str = order_meta_tokens[1].replace("at ", "")
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementsByClassName("total")[1]);
}

/*==========================================================================================
PAYMENT METADATA
==========================================================================================*/

function getPaymentMetaData(transaction) {
    console.log("getPaymentMetaData")

    var payment_metadata = [];

    // Get Payment Methods(s) element
    var xpathPaymentItemRows = "//*[@id='IamMasterFrameYesIam_ctl02_pmtList']/dl/dd[position() < last()]";
    var paymentInfoTableRowsXPR = document.evaluate(xpathPaymentItemRows, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var payment_str = ""
    while ((nodeRow = paymentInfoTableRowsXPR.iterateNext()) != null) {
        payment_str += nodeRow.innerText + " "
    }
    payment_metadata.push(payment_str.trim())

    transaction["PaymentMethod"] = payment_metadata;
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    xpathItemsPurchased = "//*[@id='cartHolder']/div[contains(@class, 'item-row')]";
    itemsPurchasedXPR = document.evaluate(xpathItemsPurchased, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

    // Parse purchased items
    while ((nodePurchasedItem = itemsPurchasedXPR.iterateNext()) != null) {
        var purchased_item = []

        // Drill into purchased item
        var descriptionNodes = nodePurchasedItem.children[0].getElementsByClassName("description")[0].children;
        var priceNodes = nodePurchasedItem.children[1].children

        console.log("Parsing purchased item: " + descriptionNodes[0].innerText)

        //-------------------------
        // Item Description
        var description = "";
        var quantity = priceNodes[1].innerText;
        if (quantity !== "1") {
            description += "QTY: " + quantity + "; "
        }
        description += descriptionNodes[0].innerText +  "; " + descriptionNodes[1].innerText

        var discount = priceNodes[2].innerText;
        if (discount !== "-") {
            description += "; discount: " + discount
        }
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(priceNodes[3]);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    var non_product_elements = document.getElementById("orderSummary").children[1].children[0];
    var non_product_items = non_product_elements.getElementsByTagName("dt");
    var non_product_amounts = non_product_elements.getElementsByTagName("dd");
    var ignoredRows = new RegExp("Subtotal|Order Total:");
    for (var i = 0; i < non_product_items.length; i++) {
        var nodeRow = non_product_items[i];
        // Ignore Irrelevant Rows
        if (ignoredRows.test(nodeRow.innerText)) {
            continue
        }

        purchased_items.push([nodeRow.innerText.replace(":",""), parsePrice(non_product_amounts[i])]);
    }

    transaction["Items"] = purchased_items;
}

processVitacostInvoice();
