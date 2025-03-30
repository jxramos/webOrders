function processFcpEuroInvoice() {
    console.log("processFcpEuroInvoice")

    var transaction = {
        "Vendor":"FcpEuro.com",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    retitlePage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getOrderItemization(transaction);
}

function retitlePage(transaction) {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + pageTitle.singleNodeValue.innerText
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    var order_summary_container = document.getElementsByClassName("orderSummary__container")[0]

    // Get Order Number
    transaction["Order#"] = order_summary_container.getElementsByClassName("orderSummary__refNumber")[0].children[1].innerText

    // Get OrderDate
    date_str = new Date().toLocaleDateString();
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(order_summary_container.getElementsByClassName("orderSummary--isComplete")[0].children[1]);

    // Get Payment Method
    transaction["PaymentMethod"] = document.getElementsByClassName("complete__paymentMethod")[0].innerText.replace("\n", " ")
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    var line_items = document.getElementsByClassName("lineItem")

    // Parse purchased items
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        // Drill into purchased item
        var line_item = line_items[i]

        //-------------------------
        // Item Description
        var description = "";
        item_brand = line_item.getElementsByClassName("lineItem__brand")[0].innerText
        item_name = line_item.getElementsByClassName("lineItem__name")[0].innerText
        var quantity = line_item.getElementsByClassName("lineItem__quantity")[0].getElementsByTagName("input")[0].getAttribute("value")
        if (quantity !== "1") {
            description += quantity + "x "
        }
        description += item_brand + "--" + item_name
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_item.getElementsByClassName("lineItem__total")[0]);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    var non_product_items = document.getElementsByClassName("orderSummary__breakdown")[0].children;
    for (var i = 1; i < non_product_items.length - 1; i++) {
        var line_item = non_product_items[i]
        purchased_items.push([line_item.children[0].innerText, parsePrice(line_item.children[1])]);
    }

    transaction["Items"] = purchased_items;
}

processFcpEuroInvoice();
