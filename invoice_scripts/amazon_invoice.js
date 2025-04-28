function processAmazonInvoice() {
    console.log("processAmazonInvoice")

    var transaction = {
        "Vendor":"Amazon.com",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
    cleanupPage();
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    payment_information_div = getOrderMetaData(transaction);
    getOrderItemization(payment_information_div, transaction);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.getElementsByClassName("h1")[0].innerText.split("Details for Order #")[1].trim();

    // Get OrderDate
    xpathOrderDate = "/html/body/div[1]/div[1]/table/tbody/tr/td/table/tbody/tr[1]/td";
    date_str = document.evaluate(xpathOrderDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                    .singleNodeValue.innerText;
    processOrderDate(date_str.split(": ")[1], transaction)

    // Get ShipDate
    xpathShipDate = "/html/body/div[1]/div[1]/table/tbody/tr/td/div[1]/table[1]/tbody/tr/td/table/tbody/tr[1]/td/table/tbody/tr/td/b/center";
    shipDateString = document.evaluate(xpathShipDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                            .singleNodeValue.innerText
                            .replace("Shipped on ","");
    shipDate = new Date(shipDateString)
    transaction["ShipDate"] = shipDate.toLocaleDateString();

    // Get Subscribe & Save Status
    transaction["IsSubscribeSave"] = date_str.includes("Subscribe and Save");

    // Get Order Total
    payment_information_div = document.querySelectorAll("[id='pos_view_section']")[1]; // invalid HTML reuses ID, last match is the metadata div
    xpathOrderTotal = '//b[text()="Grand Total:"]/../../td[2]';
    order_total = document.evaluate(xpathOrderTotal, payment_information_div, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerText
    transaction["Total"] = parsePrice(order_total);

    // Parse Payment Information
    payment_metadata = {};
    payment_nodes = payment_information_div.getElementsByClassName("pmts-payment-instrument-billing-address")[0].children
    for(i = 0; i < payment_nodes.length; i++){
        payment_node = payment_nodes[i]
        if (payment_node.tagName == "SPAN" && !payment_node.innerText.includes("% back")) {
            account = payment_nodes[i].innerText.trim().replace("Amazon.com ", "").replace("ending in ", "*")
            payment_metadata[account] = 0 // start with zero to be populated later
        }
    }
    transaction["PaymentMethod"] = payment_metadata;

    // Detect divided transactions
    xpathCreditCardTransactions = '//b[contains(.,"Credit Card transactions")]/../../../td[2]'
    cc_transactions_cell = document.evaluate(xpathCreditCardTransactions, payment_information_div, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    if (cc_transactions_cell) {
        cc_transactions = cc_transactions_cell.getElementsByTagName("tr")
    if(cc_transactions.length > 1){
        divided_payments = []
        for(i = 0; i < cc_transactions.length; i++){
                cc_transaction = cc_transactions[i]
                account = cc_transaction.children[0].innerText.split(":")[0].trim().replace("Amazon.com ", "").replace("ending in ", "*")
                amount = parsePrice(cc_transaction.children[1].innerText)
                divided_payments.push([account, amount])
        }
        transaction["divided_payment"] = divided_payments
    }
    }
    return payment_information_div
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(payment_information_div, transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // Get Shipments in order, ie primary table elements
    itemization_div = document.getElementById("pos_view_section");
    xpathShipments = "./table";
    shipmentTablesXPR = document.evaluate(xpathShipments, itemization_div, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

    // Parse purchased items within shipment in the secondary nested table elements
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

            // pull in unit price rate if present
            price_text = lineItem[1].innerText
            if ( price_text.indexOf("/lb)") != -1 ){
                price_tokens = price_text.trim().split(" ")
                description += " " + price_tokens[0].trim()
                price_text = price_tokens[1].trim()

                // weighted items counts don't factor in
                item_count = 1
            }
            purchased_item.push(description)

            //-------------------------
            // Item Price
            unit_price = parsePrice(price_text);
            price = item_count*unit_price;
            purchased_item.push(price);

            // Integrate line item
            purchased_items.push(purchased_item);
        }
    }

    // Non-Product Itemization: shipping, sales tax, promotions, subscribe & save discount
    var xpathPaymentItemRows = "./table/tbody/tr/td/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr";
    var paymentInfoTableRowsXPR = document.evaluate(xpathPaymentItemRows, payment_information_div, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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

function cleanupPage(){
    // delete the last two trailing details at the footer
    var center_elems = document.getElementsByTagName('center');
    center_elems[center_elems.length-1].remove() // to view the status of you order
    center_elems[center_elems.length-1].remove() // copyright stuff

    // delete footer
    footer = document.getElementById("navFooter")
    footer.parentElement.removeChild(footer)

    // delete print notice text
    print_page_link = document.querySelector("#pos_view_content > center > a")
    print_page_link.parentElement.removeChild(print_page_link)
}

processAmazonInvoice();