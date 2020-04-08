function processAmazonPrimeNowInvoice() {
    console.log("processAmazonPrimeNowInvoice")

    var transaction = {
        "Vendor":"Amazon.com",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getPaymentMetaData(transaction);
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
    downloadContent(transaction['Vendor']+'--'+transaction['Order#']+'.wo.json', transactionJson);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.getElementById("browser-order-status-order-number").innerText.split("Order #: ")[1].trim();

    // Get OrderDate
    var dateText = document.getElementById("browser-order-status-order-date").innerText;
    var dateString = dateText.split(": ")[1];
    var orderDate = new Date(dateString);
    transaction["OrderDate"] = orderDate.toLocaleDateString();

    // TODO Get ShipDate (aka Delivery Time)
    //xpathShipDate = "/html/body/table/tbody/tr/td/table[2]/tbody/tr/td/table/tbody/tr[1]/td/table/tbody/tr/td/b/center";
    //shipDateString = document.evaluate(xpathShipDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
    //                        .singleNodeValue.innerText
    //                        .replace("Shipped on ","");
    //shipDate = new Date(shipDateString)
    //transaction["ShipDate"] = shipDate.toLocaleDateString();

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementById("checkout-total-price-field"));
}

/*==========================================================================================
PAYMENT METADATA
==========================================================================================*/

function getPaymentMetaData(transaction) {
    console.log("getPaymentMetaData")

    var payment_metadata = [];

    // Get Payment Information element
    var xpathPaymentItemRows = "//*[contains(@class, 'pmts-payments-instrument-details')]";
    var paymentInfoTableRowsXPR = document.evaluate(xpathPaymentItemRows, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

    while ((nodeRow = paymentInfoTableRowsXPR.iterateNext()) != null) {
        var paymentMethod = nodeRow.getElementsByTagName("img")[0].alt + ' ' + nodeRow.innerText
        payment_metadata.push(paymentMethod)
    }

    transaction["PaymentMethod"] = payment_metadata;
}
function parsePrice(item){
    return parseFloat(item.textContent.trim().replace('$',''))
}

processAmazonPrimeNowInvoice();
