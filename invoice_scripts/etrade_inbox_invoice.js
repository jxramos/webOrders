function processETradeInboxInvoice() {
    console.log("processETradeInboxInvoice")

    var transaction = {
        "Vendor": "eTrade.com",
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

    div_details_row = document.querySelector('[class*="InboxDetailsView-module---inbox-alerts-details-row---"').lastChild.firstChild.children
    div_inbox_body = document.querySelector(".inbox-body-content").children
    alert_header = div_details_row[2].innerText

    // Process Dividend Alert
    if (alert_header == "Dividend or interest paid") {

        // Get Order Number
        transaction["Order#"] = "dividend_payment_"

        // Get OrderDate
        date_str = div_details_row[0].innerText.replace(" ET", "")
        processOrderDate(date_str, transaction)

        // Get Order Total
        transaction["Total"] = parsePrice(div_inbox_body[2].childNodes[6].textContent.trimLeft());

        // Get Payment Methods(s) element
        account = div_inbox_body[0].lastChild.textContent
        transaction["PaymentMethod"] = account

        // Description
        description = div_inbox_body[1].innerText
        security_header = div_inbox_body[2].childNodes[1].textContent
        security = div_inbox_body[2].childNodes[2].textContent.trimEnd().replace("   ", " ")
        security_ticker = security.replace(/.*\((.*)\)/, "$1")
        transaction["Description"] = description + " " + security_header + security

        transaction["Order#"] += security_ticker
    } else if (alert_header == "Funds transfer confirmation") {
        transfer_rows = div_inbox_body[1].firstElementChild.children

        // Mark transaction as the transfer that it is
        transaction["is_transfer"] = "account funds transfer"

        // Get Order Number
        order_id = transfer_rows[4].lastElementChild.textContent
        transaction["Order#"] = order_id

        // Get OrderDate
        date_str = transfer_rows[3].lastElementChild.textContent
        processOrderDate(date_str, transaction)

        // Get Order Total
        transaction["Total"] = parsePrice(transfer_rows[2].lastElementChild.textContent);

        // Get Payment Methods(s) element
        account_from = transfer_rows[0].lastElementChild.textContent
        account_to   = transfer_rows[1].lastElementChild.textContent
        transaction["Transfer"] = [account_from, account_to]

        // Description
        transaction["Description"] = "Confirmation: " + order_id + ", " + account_from + " --> " + account_to
    }
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    if ("is_transfer" in transaction) {
        return
    }

    var purchased_items = [
        [transaction["Description"], transaction["Total"]]
    ];
    transaction["Items"] = purchased_items;
}


processETradeInboxInvoice();