function processGeicoInvoice() {
    console.log("processGeicoInvoice")

    var transaction = {
        "Vendor":"Geico",
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
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + transaction["Order#"] + " " + pageTitle.singleNodeValue.innerText
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    meta_group1 = document.querySelector("#wrapper > ng-component > section > div.asd-print-hide > edg-confirmation-message > asd-confirmation > div > div > div > div").children

    // Get Order Number
    transaction["Order#"] = meta_group1[1].innerText.split(": ")[1]

    // Get OrderDate
    meta_group1 = meta_group1[2].children
    date_str = meta_group1[1].innerText.split(": ")[1]
    processOrderDate(date_str, transaction)

    // Get policy number
    transaction["Description"] = meta_group1[0].innerText

    // Get Order Total
    meta_group2 = document.querySelector("#wrapper > ng-component > section > div.asd-print-hide > div.confirmation-header-container > div > edg-txn-summary > edg-txn-summary-section > edg-txn-summary-billing-payments > div > div > ul").children
    transaction["Total"] = parsePrice(meta_group2[0].children[1]);

    // Get Payment Methods(s) element
    transaction["PaymentMethod"] = meta_group2[2].children[1].innerText
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [["Total todo", transaction["Total"]]]
    transaction["Items"] = purchased_items;
}

processGeicoInvoice();
