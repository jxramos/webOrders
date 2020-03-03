function processAmazonDigitalInvoice() {
    console.log("processAmazonInvoice")

    var transaction = {'Vendor':'Amazon.com'};
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

    // Get Order Number
    transaction["Order#"] = document.getElementsByClassName("h1")[0].innerText.split("Details for Order #")[1].trim();

    // Get OrderDate
    xpathOrderDate = "/html/body/div[1]/table[2]/tbody/tr[1]/td";
    dateText = document.evaluate(xpathOrderDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                    .singleNodeValue.innerText;
    dateString = dateText.split(": ")[1];
    orderDate = new Date(dateString);
    transaction["OrderDate"] = orderDate.toLocaleDateString();

    // Get Order Total
    xpathOrderTotal = "/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/div/div[2]/div[last()]";
    transaction["Total"] = parseFloat(document.evaluate(xpathOrderTotal, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                                      .singleNodeValue.innerText.split("$")[1]);
}

/*==========================================================================================
PAYMENT METADATA
==========================================================================================*/

function getPaymentMetaData(transaction) {
    console.log("getPaymentMetaData")

    payment_metadata = [];

    // Get Payment Information element
    var xpathPaymentInfo = "/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/div/div[1]/div[1]/div[2]/ul/li";
    var paymentInfoXPR = document.evaluate(xpathPaymentInfo, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );

    // Parse payment methods
    while ((nodePaymentInfo = paymentInfoXPR.iterateNext()) != null) {

        var paymentInfo = nodePaymentInfo.children;

        // Parse Payment Information
        for(var i = 0; i < paymentInfo.length; i++){
            var payment_text = [];

            // Retrieve the line item payment detail
            var paymentElement = paymentInfo[i];

            if ( paymentElement.childElementCount == 0 ) {
                payment_text.push(paymentElement.textContent)
            } else {
                for (var j=0; j < paymentElement.children.length; j++){
                    paymentToken = paymentElement.children[j];

                    if (paymentToken instanceof Image) {
                        token_text = paymentToken.alt;
                    } else {
                        token_text = paymentToken.innerText;
                    }

                    if (token_text) {
                        payment_text.push(token_text);
                    }
                }
            }

            payment_metadata.push(payment_text.join(' '))
        } // for
    } // while

    transaction["PaymentMethod"] = payment_metadata;
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    // Get digital order (always single items)
    var xpathItemOrdered = "/html/body/div[1]/table[2]/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr[2]";
    var itemTableXPR = document.evaluate(xpathItemOrdered, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                        .singleNodeValue;
    var purchased_item = []

    // Parse purchased item description
    var descriptionElement = itemTableXPR.children[0].childNodes;
    var description = []
    for (var i=0; i < descriptionElement.length; i++){
        var descToken = descriptionElement[i].textContent.trim();

        if ( descToken === "" || descToken.startsWith("Quantity:") || descToken.startsWith("Sold  By:") ) {
            continue;
        }

        description.push(descToken)
    }
    purchased_item.push(description.join(' '))

    // Parse purchase price
    var price = parseFloat(itemTableXPR.children[1].innerText.trim().replace('$',''))
    purchased_item.push(price);

    transaction["Items"] = [purchased_item];
}

processAmazonDigitalInvoice();