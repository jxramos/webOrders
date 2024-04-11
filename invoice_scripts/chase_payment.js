function processChasePaymentInvoice() {
    console.log("processChasePaymentInvoice")

    var transaction = {
        "Vendor": "Chase",
        "URL": window.location.href,
        "is_transfer": "scheduled payment authorization"
    };
    scrapeOrderData(transaction);
    retitlePage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
}

function downloadContent(filename, content) {
    let a = document.createElement('a');
    a.href = "data:application/octet-stream," + encodeURIComponent(content);
    a.download = filename;
    a.click();
}

function downloadJsonTransaction(transaction) {
    console.log("downloadJsonTransaction")

    var transactionJson = JSON.stringify(transaction);
    filename = transaction["OrderDateFormatted"] + ' ' + transaction['Vendor'] + '--' + transaction['Order#'] + '.wo.json'
    downloadContent(filename, transactionJson);
}

function retitlePage(transaction) {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + transaction["Order#"] + " " + pageTitle.singleNodeValue.innerText
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    var payment_detail_divs = document.getElementsByClassName("ccFastPayDescriptionList")[0].children[0].shadowRoot.children[1].getElementsByTagName("div")

    // Get Order Number
    transaction["Order#"] = payment_detail_divs[0].children[1].innerText

    // Get OrderDate
    date_str = payment_detail_divs[2].children[1].innerText
    var orderDate = new Date(date_str)
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
        "-" + String(orderDate.getMonth() + 1).padStart(2, '0') +
        "-" + String(orderDate.getDate()).padStart(2, '0');

    // Get Order Total
    payment_amount = document.getElementsByClassName("verifyConfirmAmount-fastPay row")[0].children[1].children[0]
    transaction["Total"] = parsePrice(payment_amount);

    // Get Payment Methods(s) element
    payment_method = payment_detail_divs[3].children[1].innerText
    transaction["PaymentMethod"] = payment_method;
}


function parsePrice(item) {
    // handle literal numeric
    if (isFinite(item)) {
        return item
    }
    var price = item.textContent.trim().replace('$', '').replace(",", "")

    // handle negative representation
    if (price.includes("(")) {
        price = "-" + price.replace("(", "").replace(")", "")
        // handle free literals
    } else if (price == "Free") {
        price = 0.0;
    }
    return parseFloat(price)
}

processChasePaymentInvoice();
