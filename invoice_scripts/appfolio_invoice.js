function processAppFolioInvoice() {
    console.log("processAppFolioInvoice")

    var transaction = {
        "Vendor": document.getElementsByClassName("payment-confirmation-notification")[0].innerText.split(", and ")[1].replace(" has been notified.", ""),
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    headers = document.getElementsByTagName("h1")
    order_id = headers[2].innerText
    transaction["Order#"] = order_id

    // Get Order Date
    date_str = document.getElementsByClassName("infobox-body")[1].innerText.split(" is ")[1].replace(")", "")
    processOrderDate(date_str, transaction)

    // Get Order Total
    total = parsePrice(headers[1]);
    transaction["Total"] = total

    // Get Order Description
    transaction["Description"] = order_id + "; " + document.getElementsByClassName("js-property-address")[0].innerText
}

processAppFolioInvoice();
