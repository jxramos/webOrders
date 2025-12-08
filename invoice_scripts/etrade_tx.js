function processETradeTxInvoice() {
    console.log("processETradeTxInvoice")

    var transaction = {
        "Vendor": "eTrade.com",
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

    order_details = document.querySelector("[data-test-id=confirmListData]").children[2].children

    if (order_details[0].innerText == "Amount") {
        order_id = "TODO_get_confirmation"
        idx_offset = 2
    } else {
        order_id = order_details[1].innerText
        idx_offset = 0
    }

    // Get Order Number
    transaction["Order#"] = order_id

    // Get OrderDate
    date_str = order_details[9 - idx_offset].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(order_details[3-idx_offset]);

    // Get Payment Methods(s) element
    account_from = order_details[5-idx_offset].innerText
    account_to   = order_details[7-idx_offset].innerText
    transaction["Transfer"] = [account_from, account_to]

    // Description
    transaction["Description"] = "Confirmation: " + order_id + ", " + account_from + " --> " + account_to
}

processETradeTxInvoice();