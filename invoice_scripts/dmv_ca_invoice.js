function processCaDmvInvoice() {
    console.log("processCaDmvInvoice")

    var transaction = {
        "Vendor":"Department of Motor Vehicles",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    cleanupPage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getPaymentMetaData(transaction);
    getOrderItemization(transaction);
}

function cleanupPage(transaction) {
    console.log("cleanupPage")
    retitlePage(transaction)
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // receipts
    receipt_div  = document.querySelector("#PaymentInformationForm > div:nth-child(8)")
    item_desc    = receipt_div.children[1].children[1].innerText
    vehicle_year = receipt_div.children[3].children[1].innerText
    vehicle_make = receipt_div.children[2].children[1].innerText
    vehicle_license_plate  = receipt_div.children[4].children[1].innerText
    transaction["Description"] = new Date().getFullYear() + " " + item_desc + " " + vehicle_year + " " + vehicle_make + "(" +  vehicle_license_plate + ")"

    // Payment Summary
    div_payment_summary = document.querySelector("#PaymentInformationForm > div:nth-child(9) > div:nth-child(2)")

    // Get Order Number
    transaction["Order#"] = order_num = div_payment_summary.children[2].innerText.split("Number: ")[1].trim()

    // Get OrderDate
    date_str = div_payment_summary.children[0].innerText.split(" : ")[1].split(" - ")[0].trim()
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(receipt_div.children[5].children[1].innerText);
}


/*==========================================================================================
PAYMENT METADATA
==========================================================================================*/

function getPaymentMetaData(transaction) {
    console.log("getPaymentMetaData")

    var payment_metadata = [];

    // Get Payment Methods(s) element
    // TODO absent

    transaction["PaymentMethod"] = payment_metadata;
}


/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    // TODO locate bill details anywhere outside of PDF?
    var purchased_items = [["vehicle registration todo", transaction["Total"]]]
    transaction["Items"] = purchased_items;
}

processCaDmvInvoice();
