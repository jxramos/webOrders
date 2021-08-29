async function processWalmartInvoice() {
    console.log("processWalmartInvoice")
    await new Promise(r => setTimeout(r, 4000));

    // Get the multiple Walmart orders listed per page
    var orders = document.getElementsByClassName("order-new");

    // Process all orders found on the current page
    for (var i = 0; i < orders.length; i++) {
        console.log("order[i="+i+"]")
        var transaction = {
            "Vendor":"Walmart.com",
            "URL": window.location.href
        };

        var order = orders[i];

        scrapeOrderData(order, transaction);
        downloadJsonTransaction(transaction);
    }
}

function scrapeOrderData(order, transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(order, transaction);
    getPaymentMetaData(order, transaction);
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


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(order, transaction) {
    console.log("getOrderMetaData")

    var order_header_element = order.getElementsByClassName("order-tile-head")[0];

    // Get Order Number
    var order_number = order_header_element.children[1].firstElementChild.innerText;
    transaction["Order#"] = order_number.replace("Order #", "");

    // Get OrderDate
    var order_header = order_header_element.children[0];
    var orderDate = new Date(order_header.children[0].innerText);
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
                                        "-" + String(orderDate.getMonth()+1).padStart(2, '0') +
                                        "-" + String(orderDate.getDate()).padStart(2, '0');

    // Get Order Total
    transaction["Total"] = parsePrice(order_header.children[1].innerText);
}

/*==========================================================================================
PAYMENT METADATA
==========================================================================================*/

function getPaymentMetaData(order, transaction) {
    console.log("getPaymentMetaData")

    // Get Payment Method
    var payment_method = order.getElementsByClassName("payment-method-row")[0].innerText;
    if (transaction["Order#"].match("In-store")) {
        payment_method = payment_method.split("\n")[1].trim();
    }
    transaction["Account"] = payment_method;
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(order, transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // get purchased items
    var item_elements = order.getElementsByClassName("product-block-info");

    // Process all items under the given orders
    for (var i = 0; i < item_elements.length; i++) {
        purchased_item = []
        var item = item_elements[i];

        //-------------------------
        // Item Description
        var description = item.getElementsByClassName("product-info-beacon-on-link-wrapper")[0].innerText;
        purchased_item.push(description);

        //-------------------------
        // Item Price
        var price = parsePrice(item.getElementsByClassName("price-group")[0].innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Integrate any sales tax
    var order_summary_details_element = order.getElementsByClassName("order-summary-details")[0];
    var order_summary_subtotal = order_summary_details_element.children[0].getElementsByTagName("tr");
    for (var i = 0; i < order_summary_subtotal.length; i++) {
        var row = order_summary_subtotal[i];
        if(row.children[0].innerText.match("Tax")){
            var sales_tax = row.children[1].innerText;
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
