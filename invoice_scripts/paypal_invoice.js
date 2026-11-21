function processPayPalInvoice() {
    console.log("processPayPalInvoice")

    var transaction = {
        "Vendor": "paypal.com",
        "URL": window.location.href,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    seller = document.getElementById("counterparty_name").innerText
    if (seller == "Bank Account") {
        getTxMetaData(transaction);
    } else {
        transaction["Vendor"] = seller
        getOrderMetaData(transaction);
    }
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getTxMetaData(transaction) {
    console.log("getTxMetaData")

    // Get Order Number
    order_id = document.getElementById("td_transactionIdContent").innerText
    transaction["Order#"] = order_id

    // Get Order Date
    date_str = document.getElementById("eta-description").innerText + " " + new Date().getFullYear()
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementById("td_funding_list_value"));

    // Form the accounts transfer list
    account_from = document.getElementById("td_transferFromPaypalBalanceContent").innerText
    account_to   = document.getElementById("source_type").innerText.slice(1,-1)
    transaction["Transfer"] = [account_from, account_to]

    // Description
    transaction["Description"] = "Confirmation: " + order_id + ", " + account_from + " --> " + account_to
}

function getOrderMetaData(transaction) {
    // Get Order Number
    order_id = document.getElementById("td_transactionIdContent").innerText
    transaction["Order#"] = order_id

    // Get Order Date
    txf_description_parts = document.getElementById("transaction_description").innerText.split(" . ")
    date_str = txf_description_parts[0]
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementById("td_funding_list_value"));

    // Get Payment Method
    transaction["PaymentMethod"] = document.getElementById("source_type").innerText.replace(/[()]/g,"")

    // Description
    notes = document.getElementById("td_notesInfoContent").innerText
    transaction["Description"] = "Confirmation: " + order_id + "; " + txf_description_parts[1] + ", " + notes

    // stub transaction items
    var purchased_items = [["items TODO", transaction["Total"]]];
    transaction["Items"] = purchased_items;
}

processPayPalInvoice();
