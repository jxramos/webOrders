function processGoSunInvoice() {
    console.log("processGoSunInvoice")

    var transaction = {
        "Vendor":"GoSun",
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
    transaction["Order#"] = document.querySelector(".os-order-number").innerText.split(" #")[1]

    // Get OrderDate
    date_str = new Date().toLocaleDateString("en-US")
    processOrderDate(date_str, transaction)

    // Get Order Total
    parts = document.querySelector(".payment-method-list").firstElementChild.children
    transaction["Total"] = parts[2].innerText.split(" ")[1]

    // Get Payment Method
    transaction["PaymentMethod"] = parts[0].classList[1].split("--")[1] + " " + parts[1].innerText.split(" with ")[1]
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Parse purchased items
    var line_items = document.querySelectorAll("[data-order-summary-section=line-items] > tr")
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        //-------------------------
        // Item Description
        parts = line_items[i].children
        item_count = parseInt(parts[2].innerText)
        description = ""
        if(item_count > 1){
            description += item_count + "x "
        }
        description += parts[1].innerText
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(parts[3].innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: Physician Service Fee, sales tax
    var non_product_items = document.querySelector(".total-line-table__tbody").children
    for (var i = 1; i < non_product_items.length - 1; i++) {
        var line_item = non_product_items[i]
        purchased_items.push([line_item.children[0].innerText, parsePrice(line_item.children[1].children[0].innerText)]);
    }

    transaction["Items"] = purchased_items;
}

processGoSunInvoice();
