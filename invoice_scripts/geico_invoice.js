function processGeicoInvoice() {
    console.log("processGeicoInvoice")

    var transaction = {
        "Vendor":"Geico",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    retitlePage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getOrderItemization(transaction);
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
    filename = transaction["OrderDateFormatted"] + ' ' + transaction['Vendor']+'--'+transaction['Order#']+'.wo.json'
    downloadContent(filename, transactionJson);
}

function retitlePage(transaction) {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + transaction["Order#"] + " " + pageTitle.singleNodeValue.innerText
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    meta_group1 = document.querySelector("#wrapper > ng-component > section > div.asd-print-hide > edg-confirmation-message > asd-confirmation > div > div > div > div").children

    // Get Order Number
    transaction["Order#"] = meta_group1[1].innerText.split(": ")[1]

    // Get OrderDate
    meta_group1 = meta_group1[2].children
    date_str = meta_group1[1].innerText.split(": ")[1]
    var orderDate = new Date(date_str)
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
                                        "-" + String(orderDate.getMonth()+1).padStart(2, '0') +
                                        "-" + String(orderDate.getDate()).padStart(2, '0');

    // Get policy number
    transaction["Description"] = meta_group1[0].innerText

    // Get Order Total
    meta_group2 = document.querySelector("#wrapper > ng-component > section > div.asd-print-hide > div.confirmation-header-container > div > edg-txn-summary > edg-txn-summary-section > edg-txn-summary-billing-payments > div > div > ul").children
    transaction["Total"] = parsePrice(meta_group2[0].children[1]);

    // Get Payment Methods(s) element
    transaction["PaymentMethod"] = meta_group2[2].children[1].innerText
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [["Total todo", transaction["Total"]]]
    transaction["Items"] = purchased_items;
}

function parsePrice(item){
    // handle literal numeric
    if (isFinite(item)) {
        return item
    }
    var price = item.textContent.trim().replace('$','')

    // handle negative representation
    if (price.includes("(")) {
        price = "-" + price.replace("(","").replace(")", "")
    // handle free literals
    } else if (price == "Free") {
        price = 0.0;
    }
    return parseFloat(price)
}

processGeicoInvoice();
