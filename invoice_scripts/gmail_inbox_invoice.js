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
    // Scrape Harbor Freight email receipt
    } else if (email_sender == "no-reply@harborfreight.com") {
        div_details = getOrderMetaDataHarborFreight(transaction, div_current_email)
        getOrderItemizationHarborFreight(transaction, div_details)
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

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
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



/*==========================================================================================
HARBOR FREIGHT RECEIPT
==========================================================================================*/

function getOrderMetaDataHarborFreight(transaction, div_current_email) {
    console.log("getOrderMetaDataHarborFreight")

    div_barcode = document.querySelector("[alt=Barcode]")
    div_details = div_barcode.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement

    // Backfill the vendor
    transaction["Vendor"] = "Harbor Freight"

    // Get Order Number
    transaction["Order#"] = div_details.firstElementChild.firstElementChild.firstElementChild.firstElementChild.children[1].textContent.split("#: ")[1]

    // Get OrderDate
    date_str = div_details.firstElementChild.firstElementChild.firstElementChild.firstElementChild.children[2].textContent.split(": ")[1]
    processOrderDate(date_str, transaction)

    // Get Payment Method
    transaction["PaymentMethod"] = div_details.children[div_details.children.length - 5].firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.innerText.replace(/\*+/, "")

    // Get Order Total
    transaction["Total"] = parsePrice(div_details.children[div_details.children.length - 10].firstElementChild.firstElementChild.lastElementChild.innerText);

    return div_details
}

function getOrderItemizationHarborFreight(transaction, div_details){
    console.log("getOrderItemizationHarborFreight");

    // parse the line items
    purchased_items = []

    line_items = []
    var keep_table_w_class = new RegExp("^m_.*col\\b");
    for (var i=0; i < div_details.children.length; i++) {
        line_item = div_details.children[i]
        if (keep_table_w_class.test(line_item.className)){
            line_items.push(line_item)
        }
    }
    for (var i=1; i < line_items.length-8; i++){
        row = line_items[i].firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild

        //-------------------------
        // Item Description
        description = ""
        var quantity = row.children[2].children[2].innerText.trim().split(" ")[1]
        if (quantity !== "1") {
            description += quantity + "x "
        }
        description += row.children[1].innerText.trim().replace("\n", "; ")

        //-------------------------
        // Item Price
        item_price = row.children[2].children[3].lastElementChild.innerText

        // Integrate line item
        purchased_items.push([description, parsePrice(item_price)])
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    non_product_purchased_items = []
    for (var i=line_items.length - 6; i > 0; i--){
        row = line_items[i].firstElementChild.firstElementChild
        if (row.innerText.toLowerCase().includes("subtotal")) {
            break
        }

        non_product_purchased_items.push([row.firstElementChild.innerText.replace(":", ""), parsePrice(row.lastElementChild.innerText)])
    }
    purchased_items.push(...non_product_purchased_items.reverse())

    transaction["Items"] = purchased_items;
}


processGmailInboxInvoice();
