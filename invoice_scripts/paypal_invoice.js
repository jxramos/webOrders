function processPayPalTxInvoice() {
    console.log("processPayPalTxInvoice")

    if (document.getElementById("counterparty_name").innerText != "Bank Account") {
        console.log("Not a bank transfer, exiting")
        return
    }

    var transaction = {
        "Vendor": "paypal.com",
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

    // Get Order Number
    order_id = document.getElementById("td_transactionIdContent").innerText
    transaction["Order#"] = order_id

    // Get OrderDate
    date_str = document.getElementById("eta-description").innerText + " " + new Date().getFullYear()
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementById("td_funding_list_value"));

    // Get Payment Methods(s) element
    account_from = document.getElementById("td_transferFromPaypalBalanceContent").innerText
    account_to   = document.getElementById("source_type").innerText.slice(1,-1)
    transaction["Transfer"] = [account_from, account_to]

    // Description
    transaction["Description"] = "Confirmation: " + order_id + ", " + account_from + " --> " + account_to
}

processPayPalTxInvoice();
