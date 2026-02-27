function processRocketMortgageInvoice() {
    console.log("processRocketMortgageInvoice")

    var transaction = {
        "Vendor":"Rocket Mortgage",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    cleanupPage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    payment_info_div = getOrderMetaData(transaction);
    getOrderItemization(payment_info_div, transaction);
}

function cleanupPage(transaction) {
    retitlePage(transaction);

    // Hide the buttons
    ignoreDivs = document.querySelectorAll(".nova-button");
    for (var i=0; i < ignoreDivs.length; i++){
        ignoreDivs[i].style.visibility = "hidden"
    }
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Order Metadata
    div_metadata = document.querySelector("body > main > div > div.bg-white > div > div > div > div > div > div > div > div").children

    // Get Order Number
    transaction["Order#"] = div_metadata[2].children[2].lastChild.lastChild.textContent.replace("#", "")

    // Get OrderDate
    date_str = div_metadata[2].children[0].lastChild.lastChild.textContent
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(div_metadata[3].lastChild.lastChild.textContent);

    // Get Payment Methods(s) element
    transaction["PaymentMethod"] = div_metadata[2].children[4].lastChild.lastChild.textContent.replace(/[(.)]/g, "")

    return div_metadata[3].children[1].firstChild.children
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(line_items, transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Parse purchased items
    for(i = 0; i < line_items.length; i++) {
        var purchased_item = []
        line_item = line_items[i]

        //-------------------------
        // Item Description
        item_description = line_item.firstChild.textContent
        purchased_item.push(item_description)

        //-------------------------
        // Item Price
        item_price = line_item.lastChild.textContent
        purchased_item.push(parsePrice(item_price));

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    transaction["Items"] = purchased_items;
}

processRocketMortgageInvoice();