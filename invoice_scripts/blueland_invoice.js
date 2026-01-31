function processBluelandInvoice() {
    console.log("processBluelandInvoice")

    var transaction = {
        "Vendor":"Blueland",
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

    div_checkout_main = document.getElementById("checkout-main").lastElementChild.firstElementChild

    // Get Order Number
    transaction["Order#"] = div_checkout_main.firstChild.firstChild.lastChild.firstChild.innerText.split(" #")[1]

    // Get OrderDate
    date_str = new Date().toLocaleDateString("en-US")
    processOrderDate(date_str, transaction)

    // Get Order Total
    parts = div_checkout_main.querySelector('[aria-label="Order details"]').firstChild.lastChild.lastChild.firstChild.firstChild.lastChild.firstChild.firstChild.firstChild.children
    transaction["Total"] = parsePrice(parts[1].lastChild.lastChild.textContent.split(" ")[0])

    // Get Payment Method
    transaction["PaymentMethod"] = parts[0].getAttribute("alt") + " " + parts[1].firstChild.textContent
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Parse purchased items
    var line_items = document.querySelectorAll('[aria-label="Shopping cart"]')
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        //-------------------------
        // Item Description
        parts = line_items[i].children[0].querySelectorAll("[role=cell]")

        item_count = parseInt(parts[0].querySelector("[aria-hidden=true]").innerText)
        description = ""
        if(item_count > 1){
            description += item_count + "x "
        }
        description += parts[1].innerText.replace(/\n+/g, " ")
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(parts[3].querySelector("p").innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: shipping, sales tax
    var non_product_items = document.querySelector("[aria-labelledby=MoneyLine-Heading1]").querySelectorAll("[role=row]")
    for (var i = 2; i < non_product_items.length - 2; i++) {
        var line_item = non_product_items[i]
        if (line_item.children.length < 2 ){
            continue
        }
        purchased_items.push([line_item.children[0].innerText, parsePrice(line_item.children[1].innerText)]);
    }

    transaction["Items"] = purchased_items;
}

processBluelandInvoice();
