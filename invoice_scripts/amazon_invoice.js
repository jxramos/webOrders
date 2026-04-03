function processAmazonInvoice() {
    console.log("processAmazonInvoice")

    var transaction = {
        "Vendor":"Amazon.com",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    cleanupPage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    div_charge_summary = getOrderMetaData(transaction);
    getOrderItemization(div_charge_summary, transaction);
}

function cleanupPage(transaction) {
    console.log("cleanupPage")
    retitlePage(transaction)

    // hide extraneous elements
    document.getElementById("navFooter").style.visibility = "hidden"
    document.querySelector("[data-component=saveButton]").style.visibility = "hidden"
    document.querySelector(".pmts-payments-instrument-supplemental-box-paystationpaymentmethod").style.visibility = "hidden"
    document.querySelector(".pmts-view-your-transactions-button").style.visibility = "hidden"
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    var div_charge_summary = document.querySelector("[data-component=chargeSummary]").firstElementChild.lastElementChild.children

    // Get Order Number
    transaction["Order#"] = document.querySelector("[data-component=orderId]").innerText

    // Get OrderDate
    date_str = document.querySelector("[data-component=orderDate]").innerText.trimRight()
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(div_charge_summary[div_charge_summary.length-1].firstElementChild.firstElementChild.lastElementChild.innerText);

    // Get Payment Method
    transaction["PaymentMethod"] = document.querySelector(".pmts-payments-instrument-detail-box-paystationpaymentmethod").innerText.replace("Amazon ", "").replace(" ending in", "").trimRight()

    return div_charge_summary
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(div_charge_summary, transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    var line_items = document.querySelector("[data-component=purchasedItems]").firstElementChild.children

    // Parse purchased items
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        // Drill into purchased item
        var line_item = line_items[i].querySelector("[data-component=purchasedItemsRightGrid]").firstElementChild

        //-------------------------
        // Item Description
        var description = line_item.querySelector(["[data-component=itemTitle]"]).innerText
        item_condition = line_item.querySelector(["[data-component=itemCondition]"]).innerText
        if(item_condition) {
            description += "; " + item_condition
        }
        var quantity = line_item.querySelector(["[data-component=quantity]"]).innerText
        if (quantity) {
            description += quantity + "x "
        }
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_item.querySelector("[data-component=unitPrice]").lastElementChild.firstElementChild.innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    var non_product_items = div_charge_summary;
    for (var i = 1; i < non_product_items.length - 1; i++) {
        var line_item = non_product_items[i].firstChild.firstElementChild
        description = line_item.firstElementChild.innerText.replace(":", "")
        if(description.toLowerCase().includes("total")){
            continue
        }
        purchased_items.push([description, parsePrice(line_item.lastElementChild.innerText)]);
    }

    transaction["Items"] = purchased_items;
}

processAmazonInvoice();
