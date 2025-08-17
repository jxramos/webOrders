function processGmailInboxInvoice() {
    console.log("processGmailInboxInvoice")

    var transaction = {
        "Vendor":"",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    // Access the currently displayed email body
    div_current_email = document.querySelector("[role=listitem][aria-expanded=true]")
    email_sender = div_current_email.querySelector("span[email]").getAttribute("email")

    // Scrape Square email receipt
    if (email_sender == "messenger@messaging.squareup.com") {
        cell_main_frame_elements = document.querySelector("table[role=contentinfo]").parentElement.children

        getOrderMetaDataSquare(transaction, cell_main_frame_elements);
        getOrderItemizationSquare(transaction, cell_main_frame_elements);
    } else {
        console.warn("No detected gmail receipt")
    }
}


/*==========================================================================================
SQUARE RECEIPT
==========================================================================================*/

function getOrderMetaDataSquare(transaction, cell_main_frame_elements) {
    console.log("getOrderMetaDataSquare")

    // Backfill the vendor
    transaction["Vendor"] = cell_main_frame_elements[0].innerText.trimLeft()

    // Get Order Number
    payment_details = cell_main_frame_elements[9].firstChild.firstChild.children[1].firstChild.firstChild.children[2].children
    transaction["Order#"] = payment_details[1].children[2].innerText.split(" ")[2]

    // Get OrderDate
    date_str = payment_details[1].children[0].innerText.replace(" at", "")
    processOrderDate(date_str, transaction)

    // Get Payment Method
    transaction["PaymentMethod"] = payment_details[0].innerText

    // Get Order Total
    transaction["Total"] = parsePrice(cell_main_frame_elements[3]);
}

function getOrderItemizationSquare(transaction, cell_main_frame_elements){
    console.log("getOrderItemizationSquare");

    // parse the line items
    purchased_items = []
    line_items = cell_main_frame_elements[4].firstChild.firstChild.getElementsByTagName("tr")
    for (var i=0; i < line_items.length; i++){
        row = line_items[i]
        // skip blank rows
        if (row.innerText == "") {
            continue
        }
        // description sub detail (integrate into previous line item's description)
        if (row.children.length == 1) {
            prev_row = purchased_items[purchased_items.length-1]
            prev_row[0] = prev_row[0] + "; " + row.children[0].innerText
            continue
        }
        purchased_items.push([row.children[0].innerText, parsePrice(row.children[1].innerText)])
    }

    // parse the sales tax, etc
    line_items = cell_main_frame_elements[5].firstChild.firstChild.children[1].firstChild.getElementsByTagName("tr")
    for (var i=0; i < line_items.length; i++){
        row = line_items[i]
        if (row.innerText == "" || row.innerText.toLowerCase().includes("total")) {
            continue
        }
        purchased_items.push([row.children[0].innerText, parsePrice(row.children[1].innerText)])
    }

    transaction["Items"] = purchased_items;
}

processGmailInboxInvoice();
