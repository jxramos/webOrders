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
    cleanupPage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
}

function cleanupPage(transaction) {
    console.log("reformatPage")
    retitlePage(transaction)

    // Delete the message elements
    ignoreDivs = document.querySelectorAll(".cds-message-bar, .pega-div");
    for (var i=0; i < ignoreDivs.length; i++){
        element = ignoreDivs[i]
        element.parentElement.removeChild(element);
    }
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
    payment_amount = document.querySelector(".cds-payment-suc-amount").innerText
    transaction["Total"] = parsePrice(payment_amount);

    // Get Payment Methods(s) element
    payment_method = payment_success_details[0].innerText // aka Payment Account
    transaction["PaymentMethod"] = payment_method;

    // Form the accounts transfer list
    target_account = payment_success_details[1].innerText // aka To Account
    transaction["Transfer"] = [payment_method, target_account]
}

processCitiPaymentInvoice();
