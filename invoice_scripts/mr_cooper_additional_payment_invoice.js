function processMrCooperInvoice() {
    console.log("processMrCooperInvoice")

    var transaction = {
        "Vendor":"Mr Cooper",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
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
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + transaction["Order#"] + " " + pageTitle.singleNodeValue.innerText
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Order Metadata
    div_payment_details = document.querySelector("#payment-details > div > div.small-12.xlarge-8.columns.no-l-pad-xl.no-pad-ld > div > div.small-12.large-12.columns > dl").children

    // Get Order Number
    transaction["Order#"] = div_payment_details[0].children[1].innerText

    // Get OrderDate
    date_str = div_payment_details[2].children[1].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(div_payment_details[1].children[1]);

    // Get Payment Methods(s) element
    transaction["PaymentMethod"] = div_payment_details[3].children[1].children[0].innerText
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [["mortgage additional payment principal only", transaction["Total"]]];
    transaction["Items"] = purchased_items;
}


processMrCooperInvoice();