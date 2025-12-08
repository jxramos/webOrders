function processTrapsDirectInvoice() {
    console.log("processTrapsDirectInvoice")

    var transaction = {
        "Vendor":"trapsdirect.com",
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

    order_details = document.getElementsByClassName("woocommerce-order-overview woocommerce-thankyou-order-details order_details")[0].children

    // Get Order Number
    transaction["Order#"] = order_details[0].getElementsByTagName("strong")[0].innerText

    // Get OrderDate
    date_str = order_details[1].getElementsByTagName("strong")[0].innerText
    processOrderDate(date_str, transaction)

    // Get payment method
    transaction["PaymentMethod"] = order_details[3].getElementsByTagName("strong")[0].innerText

    // Get Order Total
    transaction["Total"] = parsePrice( order_details[2].getElementsByTagName("strong")[0].innerText);
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    transaction["Items"] = [["TODO", transaction["Total"]]];;
}

processTrapsDirectInvoice();

