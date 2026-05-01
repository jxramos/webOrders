function processSupplyHouseInvoice() {
    console.log("processSupplyHouseInvoice")

    var transaction = {
        "Vendor":"supplyhouse.com",
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
    retitlePage(transaction)

    // hide extraneous elements
    document.querySelector("[name=reviews]").style.visibility = "hidden"
    document.querySelector("[name=questions-and-answers]").style.visibility = "hidden"
    document.getElementById("live-chat-product-2").style.visibility = "hidden"
    document.getElementById("live-chat-footer-2").style.visibility = "hidden"
    document.getElementById("headerSearchContainer").style.visibility = "hidden"
    document.getElementById("sticky-header").style.visibility = "hidden"
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.querySelector("[data-testid=order-confirmation-number]").innerText.split("# ")[1]

    // Get OrderDate
    date_str = new Date().toLocaleDateString();
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.querySelector("[data-testid=order-price-text]").innerText);

    // Get Payment Methods(s) element
    transaction["PaymentMethod"] = document.querySelector("[data-testid=payment-method-credit-card]").children[1].innerText
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Purchased Item Groups
    var line_item_groups = document.querySelectorAll("div[data-testid^=delivery-group]")
    for(var i = 0; i < line_item_groups.length; i++) {
        // Drill into purchased item(s)
        var line_items = line_item_groups[i].querySelectorAll("[data-testid^=item-image-link-]")
        for(var j = 0; j < line_items.length; j++) {
            var purchased_item = []
            line_item = line_items[j].parentElement

            //-------------------------
            // Item Description
            var description = line_item.querySelector("[data-testid^=item-name-link-]").innerText + " " + line_item.querySelector("[data-testid^=item-sku-text-]").innerText
            var quantity = line_item.querySelector("[data-testid^=item-quantity-text-]").innerText.replace(" unit", "")
            if (quantity != "1") {
                description = quantity + "x " + description
            }
            quantity = parseInt(quantity)
            purchased_item.push(description)

            //-------------------------
            // Item Price
            var price = parsePrice(line_item.querySelector("[data-testid^=item-unit-price-text-]").innerText);
            purchased_item.push(roundCurrency(quantity * price));

            // Integrate line item
            purchased_items.push(purchased_item);
        }
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    var non_product_items = document.querySelector("[data-testid=sub-total-text]").parentElement.parentElement.parentElement.children
    for (var i = 3; i < non_product_items.length - 1; i++) {
        line_item = non_product_items[i]
        if (line_item.tagName != "DIV") {
            continue
        }
        description = line_item.firstElementChild.innerText
        price = parsePrice(line_item.lastElementChild.innerText)
        purchased_items.push([description, price]);
    }

    transaction["Items"] = purchased_items;
}

processSupplyHouseInvoice();
