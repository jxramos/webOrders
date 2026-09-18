function processETradeInboxInvoice() {
    console.log("processETradeInboxInvoice")

    transactions = scrapeOrderData();
    for (var i=0; i < transactions.length; i++){
        downloadJsonTransaction(transactions[i]);
    }
    cleanupPage(transactions[0]);
}

function scrapeOrderData() {
    console.log("scrapeOrderData")

    transactions = []
    getOrderMetaData(transactions);
    getOrderItemization(transactions);

    return transactions
}

function cleanupPage(transaction) {
    console.log("cleanupPage")
    retitlePage(transaction)

    removeElement("etrade-footer")
    removeElement(".sa-inbox-footer")
    removeElement("#cobrowsing-mouse-container")
    removeElement("#salemove")
    removeElement(".kore-chat-window")
    removeElement("[id^=batBeacon]")
}


function createTransaction() {
    var transaction = {
        "Vendor": "eTrade.com",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    return transaction
}

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transactions) {
    console.log("getOrderMetaData")

    div_details_row = document.querySelector('[class*="InboxDetailsView-module---inbox-alerts-details-row---"').lastChild.firstChild.children
    div_inbox_body = document.querySelector(".inbox-body-content").children
    alert_header = div_details_row[2].innerText.toLowerCase()

    // Get OrderDate
    date_str = div_details_row[0].innerText.replace(" ET", "")

    // Process Dividend Alert
    if (alert_header == "dividend or interest paid") {
        // Get the account and security header
        account = div_inbox_body[0].lastChild.textContent
        security_header = div_inbox_body[1].textContent

        // detect multiple dividends paid on the same date
        for (var i=0; i < div_inbox_body.length; i++){
            if(! div_inbox_body[i].innerText.startsWith("Security: ")) {
                continue
            }

            var transaction = createTransaction()
            processOrderDate(date_str, transaction)

            // Get Order Number
            transaction["Order#"] = "dividend_payment_"

            // Get Order Total
            transaction["Total"] = parsePrice(div_inbox_body[i].childNodes[6].textContent.trimLeft());

            // Get Payment Methods(s) element
            transaction["PaymentMethod"] = account

            // Description
            security = div_inbox_body[i].childNodes[2].textContent.trimEnd().replace("   ", " ")
            security_ticker = security.replace(/.*\((.*)\)/, "$1")
            description = div_inbox_body[i].childNodes[1].textContent + security
            transaction["Description"] = security_header + " " + description

            transaction["Order#"] += security_ticker

            transactions.push(transaction)
        }
    } else if (alert_header == "funds transfer complete") {
        var transaction = createTransaction()
        transfer_rows = div_inbox_body[1].firstElementChild.children

        // Get Order Number
        order_id = transfer_rows[4].lastElementChild.textContent
        transaction["Order#"] = order_id

        // Get OrderDate
        processOrderDate(date_str, transaction)

        // Get Order Total
        transaction["Total"] = parsePrice(transfer_rows[2].lastElementChild.textContent);

        // Form the accounts transfer list
        account_from = transfer_rows[0].lastElementChild.textContent
        account_to   = transfer_rows[1].lastElementChild.textContent
        transaction["Transfer"] = [account_from, account_to]

        // Description
        transaction["Description"] = "Confirmation: " + order_id + ", " + account_from + " --> " + account_to

        transactions.push(transaction)
    } else if (alert_header == "funds transfer confirmation") {
        var transaction = createTransaction()
        transfer_rows = div_inbox_body[0].childNodes

        // Get Order Number
        order_id = transfer_rows[6].textContent.replace(/.*\(reference #(.*)\).*/, "$1")
        transaction["Order#"] = order_id

        // Get OrderDate
        processOrderDate(date_str, transaction)

        // Get Order Total
        transaction["Total"] = parsePrice(transfer_rows[1].textContent);

        // Form the accounts transfer list
        account_from = transfer_rows[3].textContent
        account_to   = transfer_rows[5].textContent
        transaction["Transfer"] = [account_from, account_to]

        // Description
        transaction["Description"] = "Confirmation: " + order_id + ", " + account_from + " --> " + account_to

        transactions.push(transaction)
    } else if (alert_header == "funds transfer request received") {
        var transaction = createTransaction()
        transfer_rows = div_inbox_body[1].firstElementChild.children

        // Get Order Number
        order_id = transfer_rows[3].lastElementChild.textContent
        transaction["Order#"] = order_id

        // Get OrderDate
        processOrderDate(date_str, transaction)

        // Get Order Total
        transaction["Total"] = parsePrice(transfer_rows[1].textContent);

        // Form the accounts transfer list
        account_from = transfer_rows[0].innerText
        account_to   = transfer_rows[1].innerText
        transaction["Transfer"] = [account_from, account_to]

        // Description
        transaction["Description"] = "Confirmation: " + order_id + ", " + account_from + " --> " + account_to

        transactions.push(transaction)
    }
    else {
        console.warn("Running on unrecognized or not applicable alert page: " + alert_header)
    }
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transactions){
    console.log("getOrderItemization");

    for (var i=0; i < transactions.length; i++){
        transaction = transactions[i]
        if ("Transfer" in transaction) {
            continue
        }

        var purchased_items = [
            [transaction["Description"], transaction["Total"]]
        ];
        transaction["Items"] = purchased_items;
    }
}


processETradeInboxInvoice();