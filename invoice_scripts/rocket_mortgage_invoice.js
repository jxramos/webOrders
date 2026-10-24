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
    selector_for_metadata_elements = "#main-content > div > dialog > div.flex.h-full.flex-col > div.min-h-0.flex-1.overflow-y-auto.overscroll-contain > div > div.w-full.rounded-2xl.bg-gray-50.p-6"
    div_metadata = document.querySelector(selector_for_metadata_elements)
    div_metadata_elements = div_metadata.children
    div_count = div_metadata_elements.length

    // Get Order Number
    transaction["Order#"] = div_metadata_elements[div_count-1].lastChild.textContent

    // Get OrderDate
    date_str = div_metadata_elements[div_count-5].lastChild.textContent
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(div_metadata_elements[0].lastChild.textContent);

    // Get Payment Methods(s) element
    transaction["PaymentMethod"] = div_metadata_elements[div_count-3].lastChild.textContent

    return Array.from(div_metadata.querySelectorAll('.text-\\(--nova-text-subtle\\)')).map((el) => el.parentElement)
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