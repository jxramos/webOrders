function parsePrice(item) {
    // handle literal numeric
    if (isFinite(item)) {
        return parseFloat(item)
    }

    // Get the price string value
    if (typeof item === 'string' || item instanceof String) {
        price_value = item
    } else {
        price_value = item.textContent
    }

    // Clean and process the price string value
    price_value = price_value.trim().replace(/[$, ]/g, "")
    if (price_value.includes("(") | price_value.endsWith("-")) {
        // handle parenthetical or suffixed negative representations
        price_value = "-" + price_value.replace(/[()-]/g, "")
    } else if (price_value.toLowerCase() == "free") {
        // handle free literals
        price_value = 0.0;
    }

    // Parse the price string value
    return parseFloat(price_value)
}

function validateTotal(transaction) {
    // aggregate all item amounts
    items = transaction["Items"]
    item_total = 0.0
    for(i = 0; i < items.length; i++) {
        item_total += items[i][1]
    }
    item_total = Math.round(item_total * 100) / 100

    // feedback total mismatches
    transaction_total = transaction["Total"]
    has_matching_total = item_total == transaction_total
    if(!has_matching_total) {
        error_message = "ERROR--item total '" + item_total + "' not equal to transaction total '" + transaction_total + "'"
        alert(error_message)
        console.warn(error_message)
    }
    return has_matching_total
}

function processOrderDate(date_str, transaction) {
    orderDate = new Date(date_str);
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
        "-" + String(orderDate.getMonth() + 1).padStart(2, '0') +
        "-" + String(orderDate.getDate()).padStart(2, '0');
}

function retitlePage(transaction, suffix="") {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + transaction["Vendor"] + "--" + transaction["Order#"] + suffix
}


function downloadContent(filename, content) {
    let a = document.createElement('a');
    a.href = "data:application/octet-stream," + encodeURIComponent(content);
    a.download = filename;
    a.click();
}

function downloadJsonTransaction(transaction) {
    console.log("downloadJsonTransaction")

    // validate transaction order itemization before downloading a malformed web order
    if (! validateTotal(transaction)) {
        return
    }

    var transactionJson = JSON.stringify(transaction, null, 4);
    filename = transaction["OrderDateFormatted"] + ' ' + transaction['Vendor'].replace(" ", "") + '--' + transaction['Order#'] + '.wo.json'
    downloadContent(filename, transactionJson);
}
