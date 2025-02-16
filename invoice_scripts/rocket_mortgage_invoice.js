function processRocketMortgageInvoice() {
    console.log("processRocketMortgageInvoice")

    var transaction = {
        "Vendor":"Rocket Mortgage",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    retitlePage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    payment_info_div = getOrderMetaData(transaction);
    getOrderItemization(payment_info_div, transaction);
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

    div_main = document.getElementById("main")
    div_inner = div_main.getElementsByTagName("servicing-web-v2-root")[0].shadowRoot
    div_common = div_inner.querySelector("html > app-root > main > app-payments > rkt-stack > div > div.rkt-Stack__item.ng-star-inserted > app-payment-confirmation > div > div > mat-card > div > div > div.payment-confirmation-display > div:nth-child(2)")

    // Order Metadata
    div_metadata   = div_common.children[0]

    // Get Order Number
    transaction["Order#"] = div_metadata.children[0].children[1].children[1].innerText

    // Get OrderDate
    date_str = div_metadata.children[1].children[1].children[1].innerText
    var orderDate = new Date(date_str)
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
    "-" + String(orderDate.getMonth()+1).padStart(2, '0') +
    "-" + String(orderDate.getDate()).padStart(2, '0');

    // Get Order Total
    div_payment_summary = div_common.children[1].firstChild.firstChild
    transaction["Total"] = parsePrice(div_payment_summary.children[div_payment_summary.children.length - 1].children[1]);

    // Get Payment Methods(s) element
    transaction["PaymentMethod"] = div_metadata.children[2].children[1].children[1].innerText

    return div_payment_summary
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(div_payment_summary, transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Parse purchased items
    for(i = 2; i < div_payment_summary.children.length - 2; i++) {
        var purchased_item = []
        line_item = div_payment_summary.children[i]
        //-------------------------
        // Item Description
        item_description = line_item.children[0].innerText
        purchased_item.push(item_description)

        //-------------------------
        // Item Price
        item_price = line_item.children[1]
        purchased_item.push(parsePrice(item_price));

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    transaction["Items"] = purchased_items;
}

function parsePrice(item){
    // handle literal numeric
    if (isFinite(item)) {
        return item
    }
    var price = item.textContent.trim().replace('$','').replace(",", "")

    // handle negative representation
    if (price.includes("(")) {
        price = "-" + price.replace("(","").replace(")", "")
    // handle free literals
    } else if (price == "Free") {
        price = 0.0;
    }
    return parseFloat(price)
}

processRocketMortgageInvoice();