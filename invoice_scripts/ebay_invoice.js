function processEbayInvoice() {
    console.log("processEbayInvoice")

    var transaction = {
        "Vendor":"ebay.com",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    payment_info_div = getOrderMetaData(transaction);
    getOrderItemization(payment_info_div, transaction);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    var order_info_div = document.getElementsByClassName("order-info")[0].getElementsByClassName("section-data-items")[0]

    // Get Order Number
    transaction["Order#"] = order_info_div.children[1].getElementsByTagName("dd")[0].innerText

    // Get OrderDate
    date_str = order_info_div.children[0].getElementsByTagName("dd")[0].innerText.replace("at ", "")
    processOrderDate(date_str, transaction)

    // Get Order Total
    payment_info_div = document.getElementById("payment-info")
    transaction["Total"] = parsePrice(payment_info_div.getElementsByClassName("order-summary-total")[0].getElementsByTagName("dd")[0]);

    // Get Payment Methods(s) element
    payment_method = payment_info_div.getElementsByClassName("payment-instrument-description")[0].innerText.split("\n")[1].replace("credit card ending in ","*")
    transaction["PaymentMethod"] = payment_method;

    return payment_info_div
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(payment_info_div, transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    line_items = document.getElementsByClassName("item-container")

    // Parse purchased items
    for (i=0; i < line_items.length; i++) {
        var purchased_item = []

        line_item = line_items[i]
        //-------------------------
        // Item Description
        item_description = line_item.getElementsByClassName("item-title")[0].innerText
        purchased_item.push(item_description)

        //-------------------------
        // Item Price
        item_price = line_item.getElementsByClassName("item-price")[0].firstChild.firstChild.firstChild
        purchased_item.push(parsePrice(item_price));

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    payment_info_line_items = payment_info_div.getElementsByTagName("dl")
    purchased_items.push(["Shipping", parsePrice(payment_info_line_items[1].children[0].children[1])]);
    purchased_items.push(["Tax"     , parsePrice(payment_info_line_items[2].children[0].children[1])]);

    transaction["Items"] = purchased_items;
}

processEbayInvoice();
