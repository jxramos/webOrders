function processIrsPayment() {
    console.log("processIrsPayment")

    var transaction = {
        "Vendor": "US Treasury",
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
    getOrderItemization(transaction);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    order_id = document.getElementById("eftID").innerText
    transaction["Order#"] = order_id

    // Get OrderDate
    date_str = document.getElementById("payment.paymentDatevalue").innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    total = document.querySelector("#main-content > div > div > div > div > div:nth-child(2) > div:nth-child(6) > div.confirmation-value > span").innerText
    transaction["Total"] = parsePrice(total);

    // Hardcode payment element which is not presented
    transaction["PaymentMethod"] = document.querySelector("#main-content > div > div > div > div > div:nth-child(2) > div.confirmation-value > span").innerText +
            " " + document.getElementById("payment.account.accountNumbervalue").innerText;

    // Description
    transaction["Description"] = "Confirmation: " + order_id + "; " +
                                document.getElementById("payment.selectedTaxYearvalue").innerText + " " +
                                document.getElementById("formTypevalue").innerText
}


/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    transaction["Items"] = [["tax return TODO", transaction["Total"]]];
}

processIrsPayment();