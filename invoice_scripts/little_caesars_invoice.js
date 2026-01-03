function processLittleCaesarsInvoice() {
    console.log("processLittleCaesarsInvoice")

    var transaction = {
        "Vendor":"Little Caesars",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    cleanupPage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getOrderItemization(transaction);
}

function cleanupPage(transaction) {
    console.log("cleanupPage")
    retitlePage(transaction);

    // cleanup order instructions
    var portal_instruction = document.querySelector("[data-testid=ordConf__portal-instruction]")
    if (portal_instruction) {
        elem  = portal_instruction.parentElement.parentElement.parentElement;
        elem.parentElement.removeChild(elem)
    }

    // cleanup track order button
    var track_order_button = document.querySelector("[data-testid=ordConf__pickup-track-order-button]")
    if (track_order_button) {
        track_order_button.parentElement.removeChild(track_order_button)
    }

    // cleanup campaign images
    var img = document.querySelector('img[src^="/images/campaign"]')
    if (img) {
        elem = img.parentElement.parentElement.parentElement;
        elem.parentElement.removeChild(elem)
    }

    // cleanup footer
    var footer = document.querySelector("footer")
    if (footer) {
        elem = footer
        elem.parentElement.removeChild(elem)
    }

}

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.querySelector("[data-testid=ordConf__confirmation-number]").innerText

    // Get OrderDate
    date_str = new Date().toLocaleDateString();
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.querySelector("[data-testid=ordConf__order-total]").innerText);

    // Get Payment Method
    transaction["PaymentMethod"] = /*document.querySelector("[data-testid=ordConf__payment-method]").innerText*/
                                   document.querySelector("[data-testid=ordConf__cardName]").innerText
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    var line_items = document.querySelector("[data-testid=ordConf__receiptItemList]").children;

    // Parse purchased items
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        // Drill into purchased item
        var line_item = line_items[i].firstChild.children

        //-------------------------
        // Item Description
        description = line_item[0].innerText;
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_item[1].innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    var non_product_items = document.querySelector("[data-testid=ordConf__receiptPriceList]").children;
    for (var i = 1; i < non_product_items.length - 1; i++) {
        var line_item = non_product_items[i].children
        description = line_item[0].innerText;
        if (description.includes("Total")) {
            continue
        }
        purchased_items.push([line_item[0].innerText, parsePrice(line_item[1])]);
    }

    transaction["Items"] = purchased_items;
}

processLittleCaesarsInvoice();
