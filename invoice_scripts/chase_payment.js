function processChasePaymentInvoice() {
    console.log("processChasePaymentInvoice")

    var transaction = {
        "Vendor": "Chase",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
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
    payment_method = payment_detail_divs[3].children[1].innerText // aka Pay from
    transaction["PaymentMethod"] = payment_method;

    // Form the accounts transfer list
    target_account = document.getElementById("creditCardPayeeName").innerText
    transaction["Transfer"] = [payment_method, target_account]
}

processChasePaymentInvoice();
