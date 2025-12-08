function processQuestDiagnosticsInvoice() {
    console.log("processQuestDiagnosticsInvoice")

    var transaction = {
        "Vendor":"Quest Diagnostics",
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
    transaction["Order#"] = document.querySelector(".confirmation-order-number").firstElementChild.innerText

    // Get OrderDate
    date_str = document.querySelector(".confirmation-detail").children[1].innerText.split(" at ")[0]
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.querySelector(".cart-totals-total").children[1].innerText);

    // Get Payment Method
    transaction["PaymentMethod"] = document.querySelector(".instrument").innerText
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    var line_items = document.querySelectorAll(".qd-cart-item-detail");

    // Parse purchased items
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        // Drill into purchased item
        var line_item = line_items[i].children

        //-------------------------
        // Item Description
        var description = "";
        var quantity = line_item[2].children[0].childNodes[2].textContent
        if (quantity !== "1") {
            description += quantity + "x "
        }
        description += line_item[0].innerText
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_item[2].children[1].innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: Physician Service Fee, sales tax
    var non_product_items = document.querySelectorAll(".cart-totals-item")
    for (var i = 1; i < non_product_items.length - 1; i++) {
        var line_item = non_product_items[i]
        purchased_items.push([line_item.children[0].innerText, parsePrice(line_item.children[1])]);
    }

    transaction["Items"] = purchased_items;
}

processQuestDiagnosticsInvoice();
