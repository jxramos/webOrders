function processCitiPaymentInvoice() {
    console.log("processCitiPaymentInvoice")

    var transaction = {
        "Vendor": "Citi",
        "URL": window.location.href,
        "is_transfer": "scheduled payment authorization",
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

    payment_success_details = document.querySelectorAll(".cds-payment-suc-details-txt")

    // Get Order Number
    transaction["Order#"] = document.getElementsByClassName("cds-payment-suc-ref ng-star-inserted")[0].innerText.split(": ")[1]

    // Get OrderDate
    date_str = payment_success_details[2].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    payment_amount = document.querySelector(".cds-payment-suc-amountlg").innerText
    transaction["Total"] = parsePrice(payment_amount);

    // Get Payment Methods(s) element
    payment_method = payment_success_details[0].innerText
    transaction["PaymentMethod"] = payment_method;

    target_account = payment_success_details[1].innerText
}

processCitiPaymentInvoice();
