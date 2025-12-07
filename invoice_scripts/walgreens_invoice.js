function processWalgreensInvoice() {
    console.log("processWalgreensInvoice")

    var transaction = {
        "Vendor":"Walgreens",
        "URL": window.location.href
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
    transaction["Order#"] = document.querySelector("[title^=Order]").getElementsByTagName("span")[0].innerText

    // Get OrderDate
    date_str = document.getElementById("createdTime").innerText
    processOrderDate(date_str, transaction)

    // Payment Method
    transaction["PaymentMethod"] = document.querySelector(".wag-checkout-card-info").innerText.split("\n")[0]

    // Get Order Total
    transaction["Total"] = parsePrice(document.querySelector(".order-orderPriceInfo.product__price").firstElementChild.innerText);
}


/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    rows = document.querySelector(".wag-checkout-box").querySelectorAll(".order-card-info-container")

    // Parse purchased items
    for(i = 0; i < rows.length; i++) {
        row = rows[i]
        var purchased_item = []

        //-------------------------
        // Item Description
        var description = "";
        var quantity = row.querySelector(".order-product-quantity").firstElementChild.innerText
        if (quantity !== "1") {
            description += quantity + "x "
        }
        description += row.querySelector(".product__title").innerText
        purchased_item.push(description);

        //-------------------------
        // Item Price
        price_parts = row.querySelector(".product__price ").children
        price_str = price_parts[1].innerText + "." + price_parts[2].innerText
        var price = parsePrice(price_str);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    rows = document.querySelector(".card-order-summary").firstElementChild.firstElementChild.children
    for (var i = 1; i < rows.length; i++) {
        row = rows[i]
        purchased_items.push([row.children[0].innerText.replace(":",""), parsePrice(row.children[1].innerText)]);
    }

    transaction["Items"] = purchased_items;
}

processWalgreensInvoice();
