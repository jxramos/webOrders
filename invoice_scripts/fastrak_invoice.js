function processFastrakInvoice() {
    console.log("processFastrakInvoice")
    var transaction = {
        "Vendor": "FasTrak",
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

    rows = document.getElementsByTagName("ecust:errormsg")[1].firstElementChild.children

    // Get Order Number
    transaction["Order#"] = "TODO"

    // Get OrderDate
    date_str = new Date().toLocaleDateString("en-US")
    processOrderDate(date_str, transaction)

    // Invoice detail, no payment method shown
    transaction["PaymentMethod"] = "TODO";

    // Get Order Total
    transaction["Total"] = parsePrice(rows[12].children[2].innerText);

    // Description
    invoice_num    = rows[8].innerText.trimRight().replace(" # ", "# ")
    license_plate  = rows[4].children[1].childNodes[0].textContent.trim().replace("\n", " ")
    event_details  = rows[10].firstElementChild.firstElementChild.children
    event_date     = event_details[1].firstElementChild.children[0].innerText
    event_facility = event_details[0].firstElementChild.children[1].innerText + " " + event_details[1].firstElementChild.children[1].innerText
    event_lane     = event_details[0].firstElementChild.children[2].innerText + " " + event_details[1].firstElementChild.children[2].innerText
    transaction["Description"] = invoice_num + "; " + license_plate + " " + event_date + " " + event_facility + ", " + event_lane
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction) {
    console.log("getOrderItemization");

    var purchased_items = [["bills TODO", transaction["Total"]]];

    transaction["Items"] = purchased_items;
}

processFastrakInvoice();
