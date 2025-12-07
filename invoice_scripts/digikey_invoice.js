function processDigikeyInvoice() {
    console.log("processDigikeyInvoice")

    var transaction = {
        "Vendor":"digikey.com",
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
    transaction["Order#"] = document.querySelector("[for=WebID]").parentElement.children[1].innerText

    // Get OrderDate
    date_str = document.querySelector("[for=DateSubmitted]").parentElement.children[1].innerText
    processOrderDate(date_str, transaction)

    // Payment Method
    transaction["PaymentMethod"] = document.querySelector("[for=PaymentType]").parentElement.children[1].innerText

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementById("SummaryBoxTotalSpan").innerText);
}


/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    rows = document.getElementById("ordDetails").getElementsByClassName("detailRow")

    // Parse purchased items
    for(i = 0; i < rows.length; i++) {
        row = rows[i]
        var purchased_item = []

        //-------------------------
        // Item Description
        var description = "";
        var quantity = row.children[31].innerText
        if (quantity !== "1") {
            description += quantity + "x "
        }
        
        for(j = 0; j < row.children[30].children.length; j++) {
            td = row.children[30].children[j]
            description += td.innerText.replace(/[\u{0080}-\u{FFFF}]/gu,"") + "; "
        }
        purchased_item.push(description.replace(/; $/, ""));

        //-------------------------
        // Item Price
        var price = parsePrice(row.children[34].innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    rows = document.querySelector(".right-column__headline-box").children[1].children
    for (var i = 0; i <= 3; i++) {
        row = rows[i]
        purchased_items.push([row.children[0].innerText.replace(":",""), parsePrice(row.children[1].innerText)]);
    }

    transaction["Items"] = purchased_items;
}

processDigikeyInvoice();
