function processAmazonDigitalInvoice() {
    console.log("processAmazonInvoice")

    var transaction = {
        "Vendor":"Amazon.com",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    reformatPage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getPaymentMetaData(transaction);
    getOrderItemization(transaction);
}

/*==========================================================================================
WEBSITE BEAUTIFICATION
==========================================================================================*/

function reformatPage(transaction) {
    /*
    Deletes extraneous elements not necessary for printing out the return information.
    Inject order information to make discovery easier
    */
    console.log("reformatPage")

    retitlePage(transaction)

    // Delete the footer elements
    center_tags = document.getElementsByTagName("center")
    while (center_tags.length > 1) {
        center_tags[1].parentElement.removeChild(center_tags[1])
    }
    footer = document.getElementById("navFooter")
    footer.parentElement.removeChild(footer)
}

function retitlePage(transaction) {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + pageTitle.singleNodeValue.innerText.replace(": Digital Order Summary ", "--") + transaction["Order#"]
}

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.getElementsByClassName("h1")[0].innerText.split("Details for Order #")[1].trim();

    // Get OrderDate
    xpathOrderDate = "/html/body/div[1]/div[1]/table[2]/tbody/tr[1]/td";
    dateText = document.evaluate(xpathOrderDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                    .singleNodeValue.innerText;
    dateString = dateText.split(": ")[1];
    orderDate = new Date(dateString);
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
                                        "-" + String(orderDate.getMonth()+1).padStart(2, '0') +
                                        "-" + String(orderDate.getDate()).padStart(2, '0');

    // Get Order Total
    xpathOrderTotal = "/html/body/div[1]/table/tbody/tr[2]/td/table/tbody/tr/td/div/div[2]/div[last()]"
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
    var xpathPaymentInfo = "/html/body/div[1]/table/tbody/tr[2]/td/table/tbody/tr/td/div/div[1]/div[1]/div[2]/ul/li";
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

    purchased_items = [];

    // Get digital order
    var xpathItemOrdered = "/html/body/div[1]/div[1]/table[2]/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr[2]";
    var itemTableXPR = document.evaluate(xpathItemOrdered, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                        .singleNodeValue.parentElement.children;

    for (var i_row=1; i_row < itemTableXPR.length - 1; i_row++){
        line_item = itemTableXPR[i_row]
        var purchased_item = []

        //-------------------------
        // Parse purchased item description
        var descriptionElement = line_item.children[0].childNodes;
        var description = []
        for (var i=0; i < descriptionElement.length; i++){
            var descToken = descriptionElement[i].textContent.trim();

            if ( descToken === "" || descToken.startsWith("Quantity:") || descToken.startsWith("Sold  By:") ) {
                continue;
            }

            description.push(descToken)
        }
        purchased_item.push(description.join(' '))

        //-------------------------
        // Item Price
        var price =  parsePrice(line_item.children[1]);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Non-Product Itemization: shipping, sales tax, promotions, subscribe & save
    var xpathPaymentItemRows = "//*[contains(@class, 'pmts-amount-breakdown-sub-totals')]";
    var paymentInfoTableRowsXPR = document.evaluate(xpathPaymentItemRows, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var ignoredRows = new RegExp("Item\\(s\\) Subtotal:|Total Before Tax:");

    while ((nodeRow = paymentInfoTableRowsXPR.iterateNext()) != null) {
        // Ignore Irrelevant Rows
        if (ignoredRows.test(nodeRow.innerText)) {
            continue
        }

        purchased_items.push([nodeRow.children[0].innerText.replace(":",""), parsePrice(nodeRow.children[1])]);
    }

    transaction["Items"] = purchased_items;
}

function parsePrice(item){
    return parseFloat(item.textContent.trim().replace('$',''))
}

processAmazonDigitalInvoice();