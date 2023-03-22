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

    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    table_rows = document.getElementsByTagName("table")[0].children[1].children
    idx_meta = getOrderItemization(table_rows, transaction)
    getOrderMetaData(idx_meta, table_rows, transaction)
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

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(idx_meta, table_rows, transaction) {
    console.log("getOrderMetaData")

    // Get Order Total
    transaction["Total"] = parsePrice(table_rows[idx_meta].children[3].innerText)

    // Get Order Date
    date_str = table_rows[idx_meta + 6].children[0].innerText.split(" ")[0]
    var orderDate = new Date(date_str);
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    order_date_formatted = orderDate.getFullYear() +
                            "-" + String(orderDate.getMonth()+1).padStart(2, '0') +
                            "-" + String(orderDate.getDate()).padStart(2, '0');
    transaction["OrderDateFormatted"] = order_date_formatted

    // Get Payment Method
    account_name = table_rows[idx_meta + 7].children[0].innerText
    account_num  = table_rows[idx_meta + 3].children[0].innerText
    transaction["PaymentMethod"] = account_name + " " + account_num

    // Get Order Number
    img = document.querySelector("img[alt*=barcode]")
    transaction["Order#"] = img.alt.split(" ")[1]
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(table_rows, transaction){
    console.log("getOrderItemization");

    var line_items = [];

    // Scrape line items
    for (let i = 0; i < table_rows.length - 1; i++) {
        row = table_rows[i]
        line_sku = row.children[1].innerText
        line_product = row.children[2].innerText

        // check if we reached the end of the line items
        if (line_product == "SUBTOTAL") {
            // grab the next row which is the sales tax
            row = table_rows[i+1]
            line_product = row.children[2].innerText
            line_amount = row.children[3].innerText.replace
            line_item = [line_product, parsePrice(line_amount)]
            line_items.push(line_item)
            transaction["Items"] = line_items;

            // return the index to the next row after sales tax, which should be the TOTAL row
            return i+2
        }

        // integrate line item
        line_amount = row.children[3].innerText.replace(" A", "")
        if (line_amount.substr(-1) == "-") {
            line_description = line_product + " (coupon)"
            line_amount = "-" + line_amount.substr(0, line_amount.length-1)
        } else {
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

console.log("processCostcoInvoice();") // TODO button press callback because this is a SPA.
