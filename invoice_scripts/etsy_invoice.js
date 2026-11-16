function processEtsyInvoice() {
    console.log("processEtsyInvoice")

    var transaction = {
        "Vendor":"Etsy",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    line_items = getOrderMetaData(transaction);
    getOrderItemization(transaction, line_items);
}

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    divs_order_details = document.getElementById("content").firstElementChild.firstElementChild.firstElementChild.children

    // Get Order Number
    transaction["Order#"] = divs_order_details[2].textContent.split("#")[1]

    // Get OrderDate
    date_str = divs_order_details[3].textContent.split(" on ")[1]
    processOrderDate(date_str, transaction)

    // Get Order Total
    line_items = Array.from(document.querySelectorAll(".receipt-price-row"))
    transaction["Total"] = parsePrice(line_items.pop().lastElementChild.textContent)

    // Get Payment Method
    transaction["PaymentMethod"] = document.querySelector(".receipt-payment-method").children[1].firstElementChild.firstElementChild.textContent.replace(/[• ]+/g, " ")

    // Form transaction description
    seller = document.querySelector(".receipt-order-notes-title").textContent.split("notes with ")[1]
    seller_name = document.querySelector(".receipt-note-title").innerText.replace("Note from ", "")
    transaction["Description"] = "Artist: " + seller + " (by " + seller_name + ")"

    return line_items
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction, non_product_items){
    console.log("getOrderItemization");


    var purchased_items = [];

    // Parse purchased items
    line_items = document.querySelectorAll(".receipt-product-details")
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        //-------------------------
        // Item Description
        line_item = line_items[i]
        description = line_item.querySelector(".receipt-text-title").innerText

        line_item_file_nodes = line_item.querySelectorAll(".receipt-download-row")
        line_item_files = []
        for(var j = 0; j < line_item_file_nodes.length; j++) {
            line_item_files.push( line_item_file_nodes[j].firstElementChild.firstElementChild.innerText)
        }
        description += " (" + line_item_files.join(", ") + ")"
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_item.querySelector(".currency-value").innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: shipping, sales tax
    for (var i = 1; i < non_product_items.length; i++) {
        var line_item = non_product_items[i]
        purchased_items.push([line_item.children[0].innerText, parsePrice(line_item.children[1].innerText)]);
    }

    transaction["Items"] = purchased_items;
}

processEtsyInvoice();
