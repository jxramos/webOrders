function processEReplacementPartsInvoice() {
    console.log("processEReplacementPartsInvoice")

    var transaction = {
        "Vendor":"eReplacementParts.com",
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

    // cleanup page cruft
    // Delete select elements by ID
    ids = ["quiz-offer",
        "signupbox",
        "contact-cs",
        "back-to-top",
    ]
    for (var i=0; i < ids.length; i++){
        id = ids[i]
        element = document.getElementById(id)
        if (element == null){
            continue;
        }
        element.parentElement.removeChild(element);
    }

    // Delete the page footers
    element = document.getElementsByClassName("email-optin__footer")[0];
    element.parentElement.removeChild(element);
    element = document.getElementsByClassName("footer_full")[0];
    element.parentElement.removeChild(element);
    element = document.getElementsByClassName("brandbar_container")[0];
    element.parentElement.parentElement.removeChild(element.parentElement);
    element = document.getElementsByClassName("subfooter")[0];
    element.parentElement.removeChild(element);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    div_order_details = document.getElementById("order-details").getElementsByClassName("summary-table")[0].children

    // Get Order Number
    transaction["Order#"] = document.getElementById("order_id_display").innerText

    // Get OrderDate
    date_str = div_order_details[1].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(div_order_details[5].innerText);

    // Get Payment Method
    transaction["PaymentMethod"] = div_order_details[7].innerText
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    item_rows = document.getElementById("CartProducts").getElementsByTagName("tbody")[0].children

    for (var i=0; i < item_rows.length - 1; i++){
        item = item_rows[i]
        // product purchases
        if (item.id.startsWith("ProductID")){
            item_quantity = item.children[2].innerText
            item_description = ""
            if (item_quantity != "1") {
                item_description += item_quantity + "x "
            }
            item_description += item.children[1].innerText
            purchased_items.push([item_description, parsePrice(item.children[4])])
        } else if(item.innerText.toLowerCase().includes("total")) {
            continue
        } else {
            // non-product purchases
            purchased_items.push([item.children[1].innerText, parsePrice(item.children[2])])
        }
    }

    transaction["Items"] = purchased_items;
}

processEReplacementPartsInvoice();
