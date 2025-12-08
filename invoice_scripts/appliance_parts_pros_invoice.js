function processAppliancePartsProsInvoice() {
    console.log("processAppliancePartsProsInvoice")

    var transaction = {
        "Vendor":"Appliance Parts Pros.com",
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

    // Delete the page header and footers
    element = document.getElementsByClassName("checkout-header")[0];
    element.parentElement.removeChild(element);
    element = document.getElementsByClassName("section-delivery")[0];
    element.parentElement.removeChild(element);
    element = document.getElementsByClassName("footer")[0];
    element.parentElement.removeChild(element);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    div_checkout_table = document.getElementsByClassName("checkout-step-table")[0]
    div_checkout_table_rows = div_checkout_table.children[1].getElementsByTagName("tr")

    // Get Order Number
    transaction["Order#"] = div_checkout_table.children[0].getElementsByTagName("th")[1].innerText

    // Get OrderDate
    date_str = div_checkout_table_rows[0].children[1].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(div_checkout_table_rows[3].children[1].innerText);
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    line_items = document.getElementsByClassName("products-col")

    // Parse purchased items
    for (i=0; i < line_items.length; i++) {
        var purchased_item = []

        line_item = line_items[i]

        //-------------------------
        // Item Description
        quantity = line_item.querySelector(".number-product").innerText.split("\n")[1]
        item_description = ""
        if (quantity !== "1") {
            item_description += quantity + "x "
        }
        div_item_detail_parts = line_item.querySelector(".heading").children
        item_description += div_item_detail_parts[0].innerText + ", " +
                            div_item_detail_parts[1].children[0].innerText.replace("\n", " ") + ", " +
                            div_item_detail_parts[1].children[1].innerText.replace("\n", " ")

        purchased_item.push(item_description)

        //-------------------------
        // Item Price
        item_price = line_item.querySelector(".product-price-details").children[1].innerText
        purchased_item.push(parsePrice(item_price));

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    // TODO absent from website, check email

    transaction["Items"] = purchased_items;
}

processAppliancePartsProsInvoice();
