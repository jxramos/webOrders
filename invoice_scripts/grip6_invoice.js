function processGrip6Invoice() {
    console.log("processGrip6Invoice")

    var transaction = {
        "Vendor":"Grip6",
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
    transaction["Order#"] = document.querySelector("#checkout-main > div > div._1fragem32._1fragemn2 > div > div > div > div._5uqybw0._1fragemn2._1fragem3c._1fragem8w > header > div:nth-child(2) > p").innerText.split(" #")[1]

    // Get OrderDate
    date_str = new Date().toLocaleDateString("en-US")
    processOrderDate(date_str, transaction)

    // Get Order Total
    parts = document.querySelector("#checkout-main > div > div._1fragem32._1fragemn2 > div > div > div > div._1fragem32._1fragemn2 > div > div._1ip0g651._1ip0g650._1fragemn2._1fragem50._1fragem6t._1fragem41 > section:nth-child(3) > div._1ip0g651._1ip0g650._1fragemn2._1fragem50._1fragem6t._1fragemg4._1fragemhx._1fragemeb._1fragemjq._1fragem41 > div._4jeq6k0._1fragemn2._1fragem4q._1fragem6j._1fragem41._1fragemnm._16s97g7f._16s97g7h._16s97g7p._16s97g71j._16s97g71l._16s97g71t > section:nth-child(2) > div > div:nth-child(1) > div > div > div > div > p").innerText.split(" · ")
    transaction["Total"] = parsePrice(parts[1].replace(" USD", ""))

    // Get Payment Method
    transaction["PaymentMethod"] = document.querySelector("[role=img]").getAttribute("alt") + " " + parts[0].split(" ")[1]
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Parse purchased items
    var line_items = document.querySelector('[aria-label="Shopping cart"]').querySelectorAll("[role=cell]")

    for(var i = 0; i < line_items.length / 4; i++) {
        var purchased_item = []

        //-------------------------
        // Item Description
        parts = line_items[i+1].firstChild.children
        var description = parts[0].innerText + "; " + parts[1].innerText
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_items[i+3].innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: Physician Service Fee, sales tax
    var non_product_items = document.querySelector("[aria-labelledby=MoneyLine-Heading1]").children[1].children
    for (var i = 1; i < non_product_items.length - 1; i++) {
        var line_item = non_product_items[i]
        purchased_items.push([line_item.children[0].innerText, parsePrice(line_item.children[1])]);
    }

    transaction["Items"] = purchased_items;
}

processGrip6Invoice();
