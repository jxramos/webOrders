// TODO need to get SPA to trigger the lookup logic once the user entry is complete
// https://www.walmart.com/receipt-lookup

async function processWalmartInvoice() {
    console.log("processWalmartInvoice")
    await new Promise(r => setTimeout(r, 500));

    var transaction = {
        "Vendor":"Walmart.com",
        "URL": window.location.href
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

    // Clean up the page of cruft
    footer_element = document.getElementById("walmart-footer");
    footer_element.parentElement.removeChild(footer_element)
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.querySelector(".tc-number").innerText

    // Get OrderDate
    receipt_head = document.querySelector(".receipt-head-split")
    date_str = receipt_head.children[1].innerText.split("|")[0].trim().replace(/(th|rd),/, '');
    processOrderDate(date_str, transaction)

    // Get Payment Method
    order_summary_table = document.querySelector(".receipt-total").rows
    transaction["PaymentMethod"] = order_summary_table[1].children[0].innerText

    // Get Order Total
    transaction["Total"] = parsePrice(order_summary_table[0].children[1].innerText);

    // Update vendor if this is in fact an in-store purchase
    is_in_store_purchase = receipt_head.children[0].innerText == 'Store purchase'
    if (is_in_store_purchase) {
        transaction["Vendor"] = "Walmart"
    }
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // get purchased items
    order_elements = document.querySelector(".results-list").firstChild.querySelectorAll(".item-details")

    // Parse purchased items
    for(var i = 0; i < order_elements.length; i++) {
        purchased_item = []
        order_element = order_elements[i].children

        //-------------------------
        // Item Description
        purchased_item.push(order_element[0].innerText);

        //-------------------------
        // Item Price
        var price = parsePrice(order_element[1].innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Integrate any sales tax
    summary_section = document.querySelector('[data-automation-id="receipt-summary"]').firstChild
    var sales_tax = parsePrice(summary_section.children[1].rows[1].lastChild.innerText);
    purchased_item = ["Tax", sales_tax];
    purchased_items.push(purchased_item);

    // Integrate all found purchased items into the transaction
    transaction["Items"] = purchased_items;
}

processWalmartInvoice();
