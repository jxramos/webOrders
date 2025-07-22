function processSutterHealthInvoice() {
    console.log("processSutterHealthInvoice")

    var transaction = {
        "Vendor":"Sutter Health",
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


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    var order_summary_divs = document.getElementsByClassName("paymentSummarySection col-4")

    // Get Order Number
    transaction["Order#"] = order_summary_divs[1].children[1].innerText

    // Get OrderDate
    date_str = order_summary_divs[0].children[1].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementById("PaymentAmount"));

    // Get Payment Method
    div_payment_method = document.getElementsByClassName("paymentSummarySection col-6")[1].children[1]
    card = div_payment_method.children[0].children[0].attributes["alt"].textContent
    card_num = div_payment_method.children[1].children[1].innerText.replace("x", " *")
    transaction["PaymentMethod"] = card + card_num
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    // TODO payment details not reflected in the confirmation page, must split later
    var purchased_items = [["medical TODO", transaction["Total"]]];
    transaction["Items"] = purchased_items;
}

processSutterHealthInvoice();
