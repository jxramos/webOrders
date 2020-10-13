function processWalmartInvoice() {
    console.log("processWalmartInvoice")

    var transaction = {
        "Vendor":"Walmart.com",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getPaymentMetaData(transaction);
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
    downloadContent(transaction['Vendor']+'--'+transaction['Order#']+'.wo.json', transactionJson);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")
}

/*==========================================================================================
PAYMENT METADATA
==========================================================================================*/

function getPaymentMetaData(transaction) {
    console.log("getPaymentMetaData")
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];


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
    } else if (price == "FREE") {
        price = 0.0;
    }
    return parseFloat(price)
}

processWalmartInvoice();
