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
    if (price_value.includes("(")) {
        // handle parenthetical negative representation
        price_value = "-" + price_value.replace("(", "").replace(")", "")
    } else if (price_value.toLowerCase() == "free") {
        // handle free literals
        price_value = 0.0;
    }

    // Parse the price string value
    return parseFloat(price_value)
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

    var transactionJson = JSON.stringify(transaction, null, 4);
    filename = transaction["OrderDateFormatted"] + ' ' + transaction['Vendor'].replace(" ", "") + '--' + transaction['Order#'] + '.wo.json'
    downloadContent(filename, transactionJson);
}
