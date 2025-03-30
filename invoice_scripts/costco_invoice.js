async function crawlCostcoReceipts() {
    console.log("crawlCostcoReceipts")
    await new Promise(r => setTimeout(r, 2700));

    // select the In-Warehouse tab
    document.querySelector('[automation-id="myWarehouseOrdersTab"]').click()
    await new Promise(r => setTimeout(r, 1200));

    // navigate to every button and view receipts
    var is_continue = true;
    while(is_continue) {
        receipt_buttons = document.querySelectorAll('[automation-id="ViewInWareHouseReciept"]')
        for(i = 0; i < receipt_buttons.length; i++){
            receipt_button = receipt_buttons[i]
            receipt_button.click()
            await new Promise(r => setTimeout(r, 1200));

            processCostcoInvoice()

            // prompt user to continue to the next receipt
            is_continue = confirm("Do you wish to continue to the next Costco receipt?")
            if(!is_continue) {
                break;
            }
        }

        // advance to the next page
        current_page = document.querySelector('[aria-current="true"]')

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

function processCostcoInvoice() {
    console.log("processCostcoInvoice")

    var transaction = {
        "Vendor": "Costco",
        "URL": window.location.href,
        "Order#": "",
        "OrderDate": "",
        "Total" : 0,
        "PaymentMethod": "",
    };

    // scrape order data
    if (document.getElementById("alert-dialog-title").innerText == "Gas Station Receipt") {
        scrapeGasOrderData(transaction)
    } else {
        scrapeOrderData(transaction);
    }

    downloadJsonTransaction(transaction);
}

function scrapeGasOrderData(transaction) {
    console.log("scrapeGasOrderData")

    transaction["Vendor"] += " Gasoline"
    getGasOrderMetaData(transaction)
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    table_rows = document.querySelector(".printWrapper").children[1].rows
    idx_meta = getOrderItemization(table_rows, transaction)
    getOrderMetaData(idx_meta, table_rows, transaction)
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/
function getGasOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    div_sections = document.getElementById("dataToPrint").children[1].children

    // Get Order Number
    transaction["Order#"] = div_sections[6].children[2].innerText.split("# ")[1]

    // Get Order Date
    date_str = div_sections[2].children[5].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    div_sale = div_sections[5]
    transaction["Total"] = parsePrice(div_sale.children[5].innerText)

    // Get Payment Method
    transaction["PaymentMethod"] = div_sections[3].children[1].innerText

    // itemization
    transaction["Items"] = [["gasoline", transaction["Total"]]];

    // Memo
    div_quantity     = div_sections[4]
    gallons          = div_quantity.children[4].innerText
    price_per_gallon = div_quantity.children[5].innerText
    gas_type         = div_sale.children[2].innerText
    transaction["Description"] = gallons + "gal " + gas_type + " @ " + price_per_gallon + "/gal, "

    // close the order
    document.querySelector('[automation-id="closePopup"]').click()
}


function getOrderMetaData(idx_meta, table_rows, transaction) {
    console.log("getOrderMetaData")

    // Get Order Total
    transaction["Total"] = parsePrice(table_rows[idx_meta].children[3].innerText)

    // Get Order Date
    date_str = table_rows[idx_meta + 5].children[0].innerText.substr(0,10)
    processOrderDate(date_str, transaction)

    // Get Payment Method
    account_name = table_rows[idx_meta + 6].children[0].innerText
    account_num  = table_rows[idx_meta + 2].children[0].innerText.substr(11)
    transaction["PaymentMethod"] = account_name + " " + account_num

    // Get Order Number
    transaction["Order#"] = document.querySelector(".barcode").innerText

    // close the order
    document.querySelector('[automation-id="closePopup"]').click()
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(table_rows, transaction){
    console.log("getOrderItemization");

    var line_items = [];

    // Scrape line items
    for (let i = 0; i < table_rows.length; i++) {
        row = table_rows[i]

        // check if we reached the end of the line items
        if (row.innerText.includes("SUBTOTAL")) {
            // grab the next row which is the sales tax
            row = table_rows[i+1].children
            line_product = row[1].innerText
            meta_data_row = i+1
            if (line_product == "TAX"){
                line_amount = row[2].innerText
                line_item = [line_product, parsePrice(line_amount)]
                line_items.push(line_item)
                meta_data_row += 1
            }
            transaction["Items"] = line_items;

            // return the index to the next row after sales tax, which should be the TOTAL row
            return meta_data_row
        }

        // integrate line item
        row = row.children
        line_sku = row[1].innerText
        line_product = row[2].innerText
        line_amount = row[3].innerText.replace(/ [AYN]$/, "")
        is_coupon = false
        if (line_amount.substr(-1) == "-") {
            // detect if coupon
            if (line_product.startsWith("/")){
                line_description = line_product + " (coupon) " + line_items[i-1][0]
                is_coupon = true
            }
            line_amount = "-" + line_amount.substr(0, line_amount.length-1)
        }
        if (!is_coupon) {
            line_description = line_product + " (SKU " + line_sku + ")"
        }
        line_item = [line_description, parsePrice(line_amount)]
        line_items.push(line_item)
    }
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


crawlCostcoReceipts()