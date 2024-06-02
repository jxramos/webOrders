async function crawlHomeDepotReceipts() {
    console.log("crawlHomeDepotReceipts")

    await new Promise(r => setTimeout(r, 11000));
    while(document.getElementsByClassName("segment-spinner").length > 0){
        console.log("waiting for data")
        await new Promise(r => setTimeout(r, 500));
    }

    // navigate to every button and view receipts
    var is_continue = true;
    while(is_continue) {
        receipt_buttons = document.getElementsByClassName("accordion__input")
        for(i = 0; i < receipt_buttons.length; i++){
            receipt_button = receipt_buttons[i]

            // Check if order history is displayed, if not open it
            order_element = receipt_button.parentElement.parentElement
            is_receipt_open = order_element.children[1].className.endsWith("--open")
            if(!is_receipt_open) {
                receipt_button.click()
                await new Promise(r => setTimeout(r, 2500));

                while(document.getElementsByClassName("segment-spinner").length > 0){
                    console.log("waiting for transaction data")
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            processHomeDepotInvoice(order_element)

            // prompt user to continue to the next receipt
            is_continue = confirm("Do you wish to continue to the next HomeDepot receipt?")
        }

        // advance to the next page if desired
        if(is_continue) {
            current_page = document.getElementsByClassName("hd-pagination__current")[0]

            // find the current page selector index
            page_selector = current_page.parentElement.parentElement.children
            idx_selector_current_page = Array.from(page_selector).findIndex((e) => e.innerText == current_page.innerText)

            // get the element of the next page
            idx_selector_next_page = idx_selector_current_page + 1

            if (idx_selector_next_page == page_selector.length) {
                alert("No more receipts to process.")
                break
            }
            next_page = page_selector[idx_selector_next_page].firstChild
            console.log(" --> advance to next page: " + next_page.innerText)
            next_page.click()
        }
    }
}

function processHomeDepotInvoice(order_element) {
    console.log("processHomeDepotInvoice")

    var transaction = {
        "Vendor": "HomeDepot",
        "URL": window.location.href,
        "Order#": "",
        "OrderDate": "",
        "Total" : 0,
        "PaymentMethod": "",
    };

    scrapeOrderData(order_element, transaction);
    downloadJsonTransaction(transaction);
    cleanupPage();
}

function scrapeOrderData(order_element, transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(order_element, transaction)
    getOrderItemization(order_element, transaction)
}

function downloadContent(filename, content) {
    let a = document.createElement('a');
    a.href = "data:application/octet-stream,"+encodeURIComponent(content);
    a.download = filename;
    a.click();
}

function downloadJsonTransaction(transaction) {
    console.log("downloadJsonTransaction")

    var transactionJson = JSON.stringify(transaction);
    filename = transaction["OrderDateFormatted"] + ' ' + transaction['Vendor']+'--'+transaction['Order#'].split(" ")[0]+'.wo.json'
    downloadContent(filename, transactionJson);
}

function cleanupPage(){
    // ignore info & guides link
    ignoreDivs = Array.from(document.getElementsByClassName("infoGuides-inline"));

    // ignore buy again buttons
    buy_again_buttons = document.getElementsByClassName("bttn-outline bttn-outline--primary bttn-outline--dark");
    for(i = 0; i < buy_again_buttons.length; i++){
        ignoreDivs.push(buy_again_buttons[i].parentElement)
    }

    // ignore the in store card grey box notice
    in_store_card_notice = document.querySelectorAll('[data-automation-id="ereceipt-summary-payment-cards"]')
    for(i=0; i < in_store_card_notice.length; i++){
        ignoreDivs.push(in_store_card_notice[i].parentElement)
    }

    // delete the header navigation buttons
    header_nav = document.getElementById("header-nav-container")
    if(header_nav){
        ignoreDivs.push(header_nav)
    }

    // delete the search bar
    search_bar = document.getElementsByClassName("sui-w-full");
    for(i = 0; i < search_bar.length; i++){
        ignoreDivs.push(search_bar[i])
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

function getOrderMetaData(order_element, transaction) {
    console.log("getOrderMetaData")

    // Get Order Total
    transaction["Total"] = parsePrice(order_element.querySelectorAll('[data-automation-id="eReceiptsHeaderOrderTotalValue"]')[0].innerText);

    // Get Order Date
    date_str = order_element.querySelectorAll('[data-automation-id="eReceiptsHeaderDateOrderedValue"]')[0].innerText;
    var orderDate = new Date(date_str);
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    order_date_formatted = orderDate.getFullYear() +
                            "-" + String(orderDate.getMonth()+1).padStart(2, '0') +
                            "-" + String(orderDate.getDate()).padStart(2, '0');
    transaction["OrderDateFormatted"] = order_date_formatted

    // Get Order Number
    transaction["Order#"] = order_element.querySelectorAll('[data-automation-id="eReceiptsHeaderOrderNumberValue"]')[0].innerText;

    // Get Payment Method
    payment_method_elements = order_element.querySelectorAll('[data-automation-id="orderFooterPaymentMethodTitle"]')[0].parentElement.children[1].getElementsByTagName("span")
    account_name = payment_method_elements[0].className.replace(' card-', '')
    account_num  = payment_method_elements[1].innerText.substr(14)
    transaction["PaymentMethod"] = account_name + account_num
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(order_element, transaction){
    console.log("getOrderItemization");

    var line_items = [];

    // Scrape line items
    order_group = order_element.getElementsByClassName("u__order--group")[0].lastChild.children
    for (let i = 0; i < order_group.length; i+=2) {
        purchased_item = []
        item_data = order_group[i].lastChild.children

        //-------------------------
        // Item Description
        line_product = item_data[0].innerText
        line_qty = item_data[1].children[0].innerText.replace("Qty: ", "").split("\n")[0]
        item_count = parseInt(line_qty)
        line_amount = item_data[1].children[1].innerText
        description = ""
        if(item_count > 1){
            description += line_qty + "x "
        }
        description += line_product
        purchased_item.push(description)

        //-------------------------
        // Item Price
        price = parsePrice(line_amount)
        purchased_item.push(price)

        // integrate line item
        line_items.push(purchased_item)
    }

    // Sales tax
    sales_tax = order_element.querySelector('[data-automation-id="ereceiptPaymentDetailsSalesTaxValue"]')
    if(sales_tax){
        // sales tax isn't listed on return receipts
        line_items.push(["sales tax", parsePrice(sales_tax.innerText)])
    }

    // Integrate all found purchased items into the transaction
    transaction["Items"] = line_items;

    // close the order
    order_element.children[0].children[1].click()

}

function parsePrice(item){
    // handle literal numeric
    if (isFinite(item)) {
        return parseFloat(item)
    }
    if (typeof item === 'string' || item instanceof String){
        price_value = item
    } else {
        price_value = item.textContent
    }
    price_value = price_value.trim().replace('$','').replace(',', '')

    // handle negative representation
    if (price_value.includes("(")) {
        price_value = "-" + price_value.replace("(","").replace(")", "")
    // handle free literals
    } else if (price_value == "FREE") {
        price_value = 0.0;
    }
    return parseFloat(price_value)
}


crawlHomeDepotReceipts()