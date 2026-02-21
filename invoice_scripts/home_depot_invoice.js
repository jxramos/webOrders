function processHomeDepotInvoice() {
    console.log("processHomeDepotInvoice")

    var transaction = {
        "Vendor": "Home Depot",
        "URL": window.location.href,
    };

    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    cleanupPage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    non_product_items = getOrderMetaData(transaction)
    getOrderItemization(non_product_items, transaction)
}

function cleanupPage(transaction){
    retitlePage(transaction);

    ignoreDivs = []

    // ignore start a return button
    div_sar = document.querySelector("[data-testid=sar-button]")
    if(div_sar){
        div_sar = div_sar.parentElement
        ignoreDivs.push(div_sar)
    }

    // delete the header navigation buttons
    header_nav = document.getElementById("header-nav-container")
    if(header_nav){
        ignoreDivs.push(header_nav)
    }

    // ignore the live chat button
    div_live_chat = document.getElementById("spr-live-chat-app")
    if(div_live_chat){
        ignoreDivs.push(div_live_chat)
    }

    // ignore the feedback link
    div_feedback = document.querySelector(".QSIFeedBackLink")
    if(div_feedback){
        ignoreDivs.push(div_feedback)
    }

    // delete the footer
    footer = document.getElementById("footer-static")
    if(footer){
        ignoreDivs.push(footer)
    }

    // delete all identified ignore divs
    for (var i=0; i < ignoreDivs.length; i++){
        ignoreDiv = ignoreDivs[i]
        ignoreDiv.remove()
    }
}

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    div_order = document.getElementById("root").firstChild.firstChild.lastChild.lastChild.lastChild

    // Get Order Number
    transaction["Order#"] = div_order.firstChild.firstChild.firstChild.textContent.split(" # ")[1]

    // Get OrderDate
    div_order_details = div_order.children[1].firstChild.children
    date_str = div_order_details[0].lastChild.textContent
    processOrderDate(date_str, transaction)

    // Get Order Total
    div_total = document.querySelector("[data-testid=order-total-value]")
    transaction["Total"] = parsePrice(div_total.innerText);

    // Get Payment Method
    div_payment_method = div_order_details[2].lastChild.firstChild
    transaction["PaymentMethod"] = div_payment_method.firstChild.getAttribute("alt").split('-')[0] + " " + div_payment_method.lastChild.textContent

    // select the non_product_items for later use in itemization
    var non_product_items = div_order.children[3].firstChild.getElementsByTagName("div")

    return non_product_items
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(non_product_items, transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Items Purchased
    var line_items = document.querySelectorAll("[data-testid=lineitems]")

    // Parse purchased items
    for(var i = 0; i < line_items.length; i++) {
        var purchased_item = []

        // Drill into purchased item
        var line_item = line_items[i]
        line_item_parts = line_item.firstChild.lastChild.firstChild.lastChild.children

        //-------------------------
        // Item Description
        var description = "";
        var quantity = line_item_parts[1].textContent.split(": ")[1]
        if (quantity !== "1") {
            description += quantity + "x "
        }
        description += line_item_parts[0].textContent
        purchased_item.push(description)

        //-------------------------
        // Item Price
        var price = parsePrice(line_item_parts[2].textContent);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);

        //---------------------------------------------------------
        // clean up the line item kruft
        is_online_order = Boolean(document.querySelector("[data-testid=order-barcode]"))
        if (is_online_order) {
            // hide the shipping details
            line_item.parentElement.parentElement.lastChild.style.visibility = "hidden"

            // hide the return deadline details
            line_item.firstChild.firstChild.style.visibility = "hidden"
        }

        // hide the buy again button
        line_item.firstChild.lastChild.lastChild.style.visibility = "hidden"

        // hide the info & guides link
        line_item.firstChild.lastChild.firstChild.lastChild.lastChild.style.visibility = "hidden"
    }

    // Non-Product Itemization: delivery fee, sales tax, tip, promotions, etc
    for (var i = 1; i < non_product_items.length - 1; i++) {
        var line_item = non_product_items[i]

        description = line_item.children[0].innerText.replace(":", "")
        if (description == "Savings") {
            continue
        }

        purchased_items.push([description, parsePrice(line_item.children[1])]);
    }

    transaction["Items"] = purchased_items;
}

processHomeDepotInvoice();
