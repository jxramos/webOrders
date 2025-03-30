function processAppFolioInvoice() {
    console.log("processAppFolioInvoice")

    var transaction = {
        "Vendor": document.getElementsByClassName("payment-confirmation-notification")[0].innerText.split(", and ")[1].replace(" has been notified.", ""),
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    retitlePage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
}

function retitlePage(transaction) {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + pageTitle.singleNodeValue.innerText
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    headers = document.getElementsByTagName("h1")
    order_id = headers[2].innerText
    transaction["Order#"] = order_id

    // Get Order Date
    var orderDate = new Date(document.getElementsByClassName("infobox-body")[1].innerText.split(" is ")[1].replace(")", ""))
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
        "-" + String(orderDate.getMonth() + 1).padStart(2, '0') +
        "-" + String(orderDate.getDate()).padStart(2, '0');

    // Get Order Total
    total = parsePrice(headers[1]);
    transaction["Total"] = total

    // Get Order Description
    transaction["Description"] = order_id + "; " + document.getElementsByClassName("js-property-address")[0].innerText
}


function parsePrice(item) {
    // handle literal numeric
    if (isFinite(item)) {
        return item
    }
    var price = item.textContent.trim().replace('$', '').replace(',', '')

    // handle negative representation
    if (price.includes("(")) {
        price = "-" + price.replace("(", "").replace(")", "")
        // handle free literals
    } else if (price == "FREE") {
        price = 0.0;
    }
    return parseFloat(price)
}

processAppFolioInvoice();
