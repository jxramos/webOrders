function processTuroInvoice() {
    console.log("processTuroInvoice")

    var transaction = {
        "Vendor":"Turo",
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

    // Get Order Number
    div_receipt = document.querySelector("[data-testid=receipt]")
    transaction["Order#"] = div_receipt.children[1].firstElementChild.firstChild.lastElementChild.innerText.split("ID ")[1]

    // Get OrderDate
    div_trip_details = document.querySelector("[data-testid=trip-details-section]")
    date_str = div_trip_details.firstChild.lastChild.innerText.replace("BOOKED ", "").split(" AT ")[0]
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = 0

    // Get Payment Method
    transaction["PaymentMethod"] = document.querySelector("[data-testid^=payment-section]").firstChild.firstChild.lastChild.innerText.split(" on ")[0].replace(/•/g, " ").replace(/ +/, " ")

    // Description
    transaction["Description"] = div_trip_details.firstChild.firstChild.innerText.replace("\n", " ") + " " + div_trip_details.firstChild.lastChild.textContent + "; Trip Start: " + div_trip_details.lastChild.children[1].firstChild.textContent.replace(";", "") + "; Trip End: " + div_trip_details.lastChild.children[1].lastChild.textContent.replace(";", "")

}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // integrate the total
    var line_items = document.querySelector("[data-testid=cost-details-section]").children
    transaction["Total"] = parsePrice(line_items[line_items.length - 1].lastChild.firstChild.innerText)

    // Parse purchased items
    for(var i = 0; i < line_items.length - 1; i++) {
        parts = line_items[i].children

        description = parts[0].textContent
        if (parts[1].childElementCount == 2) {
            description += " " + parts[1].lastChild.textContent.replace("\n", " ")
        }
        price = parsePrice(parts[1].firstChild.innerText);

        // Integrate line item
        purchased_items.push([description, price]);
    }

    transaction["Items"] = purchased_items;
}

processTuroInvoice();
