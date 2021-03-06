function processAmazonInvoice() {
    console.log("processAmazonInvoice")

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

function downloadQifTransaction(transaction) {
    // Header
    var transactionQif = "!Type:Bank\n";

    // Date
    transactionQif += "D" + transaction["OrderDate"] + "\n";

    // Payee
    transactionQif += "P" + transaction["Vendor"] + "\n";

    // Total Amount
    transactionQif += "T-" + transaction["Total"] + "\n";

    // Memo
    memo = "M" + transaction["Order#"]
    if (transaction["PaymentMethod"].length > 1 ) {
        memo += "; (split payment, " + transaction["PaymentMethod"].slice(1,) + ")"
    }
    transactionQif += memo + "\n";

    // Splits
    items = transaction["Items"];
    for (let i = 0; i < items.length; i++) {
        item = items[i];
        transactionQif += "E"  + item[0] + "\n";
        transactionQif += "$-" + item[1] + "\n";
    }
    transactionQif += "^\n"

    // Save to disk
    downloadContent(transaction['Vendor']+'--'+transaction['Order#']+'.qif', transactionQif);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.getElementsByClassName("h1")[0].innerText.split("Details for Order #")[1].trim();

    // Get OrderDate
    xpathOrderDate = "/html/body/table/tbody/tr/td/table[1]/tbody/tr[1]/td";
    dateText = document.evaluate(xpathOrderDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                    .singleNodeValue.innerText;
    dateString = dateText.split(": ")[1];
    orderDate = new Date(dateString);
    transaction["OrderDate"] = orderDate.toLocaleDateString();

    // Get ShipDate
    xpathShipDate = "/html/body/table/tbody/tr/td/table[2]/tbody/tr/td/table/tbody/tr[1]/td/table/tbody/tr/td/b/center";
    shipDateString = document.evaluate(xpathShipDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                            .singleNodeValue.innerText
                            .replace("Shipped on ","");
    shipDate = new Date(shipDateString)
    transaction["ShipDate"] = shipDate.toLocaleDateString();

    // Get Subscribe & Save Status
    transaction["IsSubscribeSave"] = dateText.includes("Subscribe and Save");

    // Get Order Total
    xpathOrderTotal = "/html/body/table/tbody/tr/td/table[1]/tbody/tr[contains(., 'Order Total')]/td/b";
    transaction["Total"] = parseFloat(document.evaluate(xpathOrderTotal, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                                    .singleNodeValue.innerText
                                    .replace("Order Total: $",""));
}

/*==========================================================================================
PAYMENT METADATA
==========================================================================================*/

function getPaymentMetaData(transaction) {
    console.log("getPaymentMetaData")

    payment_metadata = [];

    // Get Payment Information element
    xpathPaymentInfo = "/html/body/table/tbody/tr/td/table[last()]/tbody/tr/td/table/tbody/tr[2]/td/table/tbody/tr/td";
    paymentInfo = document.evaluate(xpathPaymentInfo, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
    .singleNodeValue
    .childNodes;

    // Parse Payment Information
    payment_text = "";
    for( var i = 0; i < paymentInfo.length; i++){
        child = paymentInfo[i];

        // ignore irrelevant elements
        if (child instanceof HTMLBRElement || child instanceof HTMLTableElement) {
            continue;
        }
        if (child.innerText == "Billing address") {
            break;
        }
        if (child.nodeName == "#text") {
            payment_text = child.textContent.trim()

            if (payment_text) {
                payment_metadata.push(payment_text);
            }
        } else if (child.tagName == "NOBR") {
            payment_metadata[payment_metadata.length - 1] += child.textContent;
        }
    }

    transaction["PaymentMethod"] = payment_metadata;
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    purchased_items = [];

    // Get Shipment / secondary table elements
    xpathShipments = "/html/body/table/tbody/tr/td/table[1 < position() and position() < last()]";
    shipmentTablesXPR = document.evaluate(xpathShipments, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

    // Parse purchased items
    while ((nodeShipTable = shipmentTablesXPR.iterateNext()) != null) {
        // Iterate shipment items (skipping header row)
        xpathShipmentTableRows = "./tbody/tr/td/table/tbody/tr[2]/td/table/tbody/tr/td/table[2]/tbody/tr[position() > 1]";
        shipmentTableRowsXPR = document.evaluate(xpathShipmentTableRows, nodeShipTable, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        // Parse purchased item / rows
        while ((nodeRow = shipmentTableRowsXPR.iterateNext()) != null) {
            purchased_item = []
            lineItem = nodeRow.getElementsByTagName("td");

            //-------------------------
            // Item Description
            item_data = lineItem[0].childNodes
            description = item_data[0].textContent.trim().replace(/\s+/g, ' ');
            item_count = parseInt(description.replace(" of:", ""));

            for (let i = 1; i < item_data.length; i++) {
                var desc_token = item_data[i]
                if (desc_token instanceof HTMLSpanElement && desc_token.classList.contains("tiny")) {
                    break;
                }
                desc_token = desc_token.textContent.trim()
                if ( desc_token == "") {
                    continue
                }
                description += ' ' + desc_token;
            }

            // clean up description
            description = description.replace("1 of: ", "")
            purchased_item.push(description)

            //-------------------------
            // Item Price
            unit_price = parsePrice(lineItem[1]);
            price = item_count*unit_price;
            purchased_item.push(price);

            // Integrate line item
            purchased_items.push(purchased_item);
        }
    }

    // Non-Product Itemization: shipping, sales tax, promotions, subscribe & save
    var xpathPaymentItemRows = "/html/body/table/tbody/tr/td/table[last()]/tbody/tr/td/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr";
    var paymentInfoTableRowsXPR = document.evaluate(xpathPaymentItemRows, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var ignoredRows = new RegExp("Item\\(s\\) Subtotal:|Total before tax:|Grand Total:|-----");

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

processAmazonInvoice();