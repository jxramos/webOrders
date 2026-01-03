function processLandsEndInvoice() {
    console.log("processLandsEndInvoice")

    var transaction = {
        "Vendor":"Lands End",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };

    if(window.location.href.includes("order-confirm")) {
        scrapeOrderData(transaction);
    }
    else if(window.location.href.includes("order-history")) {
        scrapeOrderHistoryData(transaction);
    }

    downloadJsonTransaction(transaction);
    cleanupPage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getOrderItemization(transaction);
}

function scrapeOrderHistoryData(transaction) {
    console.log("scrapeOrderHistoryData")

    getOrderMetaDataFromHistoryPage(transaction);
    getOrderItemization(transaction);
}

function cleanupPage(transaction) {
    console.log("cleanupPage")
    retitlePage(transaction);

    var order_again_sections = document.querySelectorAll(".order-again-section");
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    var order_info_container = document.querySelector(".order-info")

    // Get Order Number
    transaction["Order#"] = order_info_container.firstChild.firstChild.firstElementChild.lastElementChild.innerText

    // Get OrderDate
    date_str = order_info_container.lastElementChild.firstElementChild.lastElementChild.innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.querySelector(".order-totals-value").innerText);

    // Get Payment Method
    transaction["PaymentMethod"] = "TODO absent from page, contact seller webmaster to include on invoice"
}

function getOrderMetaDataFromHistoryPage(transaction) {
    console.log("getOrderMetaData")

    var order_detail_container = document.querySelector("account-order-detail-header")

    // Get Order Number
    transaction["Order#"] = document.querySelector("app-page-header").innerText.split("#")[1]

    // Get OrderDate
    date_str = order_detail_container.firstElementChild.lastElementChild.firstElementChild.firstElementChild.lastElementChild.innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.querySelector(".order-totals-label-final").parentElement.lastElementChild.innerText);

    // Get Payment Method
    order_totals_values = document.querySelectorAll(".order-totals-value")
    payment_method = order_totals_values[order_totals_values.length-1].parentElement.firstElementChild.innerText.split(" ")
    transaction["PaymentMethod"] = payment_method[0] + " " + payment_method[4]
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    var line_items = document.querySelectorAll("account-order-detail-item-info")

    // Parse purchased items
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        // Drill into purchased item
        var line_item = line_items[i].firstElementChild

        //-------------------------
        // Item Description
        var description = "";
        var quantity = line_item.querySelector(".quantity-wrap").innerText.split(" ")[1]
        if (quantity !== "1") {
            description += quantity + "x "
        }
        description += line_item.querySelector(".product-name").innerText

        item_details = line_item.querySelectorAll(".description")
        item_id = item_details[0].innerText
        item_attributes = item_details[1].children
        description += ", " + item_attributes[0].innerText.replace("\n", " ") // size
                     + ", " + item_attributes[1].innerText.replace("\n", " ") // color
                     + ", " + item_id
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_item.querySelector(".total-price").innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    var non_product_items = document.querySelectorAll(".order-totals-label")
    for (var i = 1; i < non_product_items.length; i++) {
        var line_item = non_product_items[i]
        if (line_item.innerText.match(/Merchandise|discount/)) {
            // price includes discounts already
            continue;
        }
        purchased_items.push([line_item.innerText, parsePrice(line_item.parentElement.lastElementChild.innerText)]);
    }

    transaction["Items"] = purchased_items;
}

processLandsEndInvoice();
