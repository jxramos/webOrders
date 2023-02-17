summary_xpath = "/html/body/div[1]/div[1]/div/div/div/div/section/div[2]/div/main/div[2]/div[2]/div/div[4]"

async function processWalmartInvoice() {
    console.log("processWalmartInvoice")
    await new Promise(r => setTimeout(r, 500));

    var transaction = {
        "Vendor":"Walmart.com",
        "URL": window.location.href
    };

    var order = document.getElementsByClassName("print-bill-body")[0];
    scrapeOrderData(order, transaction);
    retitlePage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(order, transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(order, transaction);
    getOrderItemization(order, transaction);
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
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + pageTitle.singleNodeValue.innerText.replace("Manage Account - Purchase history - ", "") + " " + transaction["Order#"]
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(order, transaction) {
    console.log("getOrderMetaData")

    var order_header_elements = order.firstElementChild.firstElementChild.children;

    // Get Order Number
    transaction["Order#"] = order_header_elements[2].innerText;

    // Get OrderDate
    var orderDate = new Date(order_header_elements[0].innerText.replace(" purchase", "").replace("order", ""));
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
                                        "-" + String(orderDate.getMonth()+1).padStart(2, '0') +
                                        "-" + String(orderDate.getDate()).padStart(2, '0');

    // Get Payment Method
    payment_section = document.getElementsByClassName("bill-order-payment-cards")[0]
    transaction["Account"] = payment_section.innerText.split("\n")[1].replace(" ending in", "")

    // Get Order Total
    summary_section = document.getElementsByClassName("bill-order-total-payment")[0]
    transaction["Total"] = parsePrice(summary_section.innerText.split("\n")[1]);

    // Update vendor if this is in fact an in-store purchase
    is_instore_purchase = Boolean(document.evaluate("//*[contains(@id,'Store_purchase')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue)
    if (is_instore_purchase) {
        transaction["Vendor"] = "Walmart"
    }
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(order, transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // get purchased items
    xpathPaymentInfo = "//*[@data-testid='productName']"
    var paymentInfoXPR = document.evaluate(xpathPaymentInfo, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );

    // Parse purchased items
    while ((nodePaymentInfo = paymentInfoXPR.iterateNext()) != null) {
        purchased_item = []

        // TODO handle Qty > 1
        //-------------------------
        // Item Description
        purchased_item.push(nodePaymentInfo.innerText);

        //-------------------------
        // Item Price
        var price = parsePrice(nodePaymentInfo.parentElement.parentElement.parentElement.parentElement.parentElement.lastElementChild.innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Integrate any sales tax
    summary_section = document.evaluate(summary_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.children;
    for (var i = 0; i < summary_section.length; i++) {
        var row = summary_section[i];
        // ignore non-div elements
        if (!(row instanceof HTMLDivElement)) {
            continue
        }

        if(row.children[0].innerText.match("Tax")){
            var sales_tax = parsePrice(row.children[1].innerText);
            purchased_item = ["Tax", sales_tax];
            purchased_items.push(purchased_item);
        }
    }

    transaction["Items"] = purchased_items;
}

function parsePrice(item){
    // handle literal numeric
    if (isFinite(item)) {
        return item
    }
    if (typeof item === 'string' || item instanceof String){
        price_value = item
    } else {
        price_value = item.textContent
    }
    price_value = price_value.trim().replace('$','')

    // handle negative representation
    if (price_value.includes("(")) {
        price_value = "-" + price_value.replace("(","").replace(")", "")
    // handle free literals
    } else if (price_value == "FREE") {
        price_value = 0.0;
    }
    return parseFloat(price_value)
}

processWalmartInvoice();
