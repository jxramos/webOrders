function processSutterHealthInvoice() {
    console.log("processSutterHealthInvoice")

    var transaction = {
        "Vendor":"Sutter Health",
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

    var order_summary_divs = document.querySelector(".payingNowGrid").children

    // Get Order Number
    transaction["Order#"] = order_summary_divs[2].lastChild.innerText

    // Get OrderDate
    date_str = order_summary_divs[1].lastChild.innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.querySelector(".amountInfoAmount").innerText);

    // Get Payment Method
    div_payment_method = document.querySelector(".compactCard")
    card = div_payment_method.lastChild.firstChild.getAttribute("alt")
    card_num = div_payment_method.firstChild.lastChild.firstChild.innerText.split(" ")[1]
    transaction["PaymentMethod"] = card + " " + card_num
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
