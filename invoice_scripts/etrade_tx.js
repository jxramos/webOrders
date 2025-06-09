function processETradeTxInvoice() {
    console.log("processETradeTxInvoice")

    var transaction = {
        "Vendor": "eTrade.com",
        "URL": window.location.href,
        "is_transfer": "scheduled payment authorization"
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

    order_details = document.querySelector("[data-test-id=confirmListData]").children[2].children

    // Get Order Number
    order_id = order_details[1].innerText
    transaction["Order#"] = order_id

    // Get OrderDate
    date_str = order_details[9].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(order_details[3]);

    // Get Payment Methods(s) element
    account_from = order_details[5].innerText
    account_to   = order_details[7].innerText
    transaction["Transfer"] = [account_from, account_to]

    // Description
    transaction["Description"] = "Confirmation: " + order_id + ", " + account_from + " --> " + account_to
}

processETradeTxInvoice();