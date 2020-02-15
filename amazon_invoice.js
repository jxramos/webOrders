function processAmazonInvoice() {
    console.log("processAmazonInvoice")

    var transaction = {'type':'Amazon'};
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getPaymentMetaData(transaction);
    getOrderItemization(transaction);
}

function downloadJsonTransaction(transaction) {
    console.log("downloadJsonTransaction")

    var transactionJson = JSON.stringify(transaction);
    let a = document.createElement('a');
    a.href = "data:application/octet-stream,"+encodeURIComponent(transactionJson);
    a.download = transaction['type']+'--'+transaction['Order#']+'.json';
    a.click();
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.getElementsByClassName("h1")[0].innerText.replace("Final Details for ","");

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

    // Get Substribe & Save Status
    transaction["IsSubscribeSave"] = dateText.includes("Subscribe and Save");

    // Get Order Total
    xpathOrderTotal = "/html/body/table/tbody/tr/td/table[1]/tbody/tr[3]/td/b";
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

            // Item Description
            item_data = lineItem[0].childNodes
            description = item_data[0].textContent.trim().replace(/\s+/g, ' ');
            item_count = parseInt(description.replace(" of:", ""));
            description += ' ' + item_data[1].textContent.trim();
            purchased_item.push(description)

            // Item Price
            unit_price = parseFloat(lineItem[1].textContent.trim().replace('$',''));
            price = item_count*unit_price;
            purchased_item.push(price);

            // Integrate line item
            purchased_items.push(purchased_item);
        }
    }

    transaction["Items"] = purchased_items;
}

processAmazonInvoice();