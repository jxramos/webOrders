function processOverstockInvoice() {
    console.log("processOverstockInvoice")

    var transaction = {
        "Vendor":"Overstock.com",
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

    var order_summary_container = document.getElementsByClassName("orderSummary__container")[0]

    // Get Order Number
    transaction["Order#"] = document.querySelector("[data-testid=order-conf-order-number]").childNodes[1].textContent

    // Get OrderDate
    date_str = new Date().toLocaleDateString();
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(document.querySelector("[data-testid=order-summary-total]").lastChild.innerText);

    // Get Payment Method
    transaction["PaymentMethod"] = document.querySelector("[data-testid=order-confirmation-payment-details]").firstChild.lastChild.textContent.replace(" ending in ", "")
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    var line_items = document.querySelector("[data-testid=order-conf-items-container]").children

    // Parse purchased items
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        // Drill into purchased item
        var line_item = line_items[i]

        //-------------------------
        // Item Description
        var description = "";
        var quantity = parseInt(line_item.querySelector("[data-testid=item-quantity]").childNodes[1].textContent)
        if (quantity !== "1") {
            description += quantity + "x "
        }
        description += line_item.querySelector("[data-testid=item-name]").innerText + ", " + line_item.querySelector("[data-testid=item-description]").innerText
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_item.querySelector("[data-testid=item-price]").innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, etc
    var non_product_items = document.querySelector("[data-testid=billing-overview__content]").children
    for (var i = 1; i < non_product_items.length - 1; i++) {
        var line_item = non_product_items[i]
        purchased_items.push([line_item.children[0].innerText, parsePrice(line_item.children[1])]);
    }

    transaction["Items"] = purchased_items;
}

processOverstockInvoice();
