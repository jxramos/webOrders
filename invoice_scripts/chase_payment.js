function processChasePaymentInvoice() {
    console.log("processChasePaymentInvoice")

    var transaction = {
        "Vendor": "Chase",
        "URL": window.location.href,
        "is_transfer": "scheduled payment authorization"
    };
    scrapeOrderData(transaction);
    retitlePage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
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

    var payment_detail_divs = document.getElementsByClassName("ccFastPayDescriptionList")[0].children[0].shadowRoot.children[1].getElementsByTagName("div")

    // Get Order Number
    transaction["Order#"] = payment_detail_divs[0].children[1].innerText

    // Get OrderDate
    date_str = payment_detail_divs[2].children[1].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    payment_amount = document.getElementsByClassName("verifyConfirmAmount-fastPay row")[0].children[1].children[0]
    transaction["Total"] = parsePrice(payment_amount);

    // Get Payment Methods(s) element
    payment_method = payment_detail_divs[3].children[1].innerText
    transaction["PaymentMethod"] = payment_method;
}

processChasePaymentInvoice();
