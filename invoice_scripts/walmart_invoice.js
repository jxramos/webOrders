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
    downloadJsonTransaction(transaction);
    cleanupPage(transaction);
}

function scrapeOrderData(order, transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(order, transaction);
    getOrderItemization(order, transaction);
}

function cleanupPage(transaction) {
    console.log("cleanupPage")
    retitlePage(transaction)

    // Clean up the page of cruft
    footer_element = document.getElementsByTagName("footer")[0]
    footer_element.parentElement.removeChild(footer_element)
    header_element = document.getElementsByTagName("header")[0]
    header_element.parentElement.removeChild(header_element)
    ad_banner = document.getElementById("ORDERDETAILS-SkylineDisplayAd-top");
    ad_banner.parentElement.removeChild(ad_banner)
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
    date_str = order_header_elements[0].innerText.replace(" purchase", "").replace("order", "");
    processOrderDate(date_str, transaction)

    // Get Payment Method
    payment_section = document.getElementsByClassName("bill-order-payment-cards")[0]
    transaction["PaymentMethod"] = payment_section.innerText.split("\n")[1].replace(" ending in", "")

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

    // bring itemization into view
    button_items_toggler = document.querySelectorAll('[data-automation-id="items-toggle-link"]')
    if (button_items_toggler.length > 0){
        button_items_toggler[0].click()
    }

    var purchased_items = [];

    // get purchased items
    xpathPaymentInfo = "//*[@data-testid='category-accordion-']"
    var paymentInfoXPR = document.evaluate(xpathPaymentInfo, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue.children;

    // Parse purchased items
    for(var i = 1; i < paymentInfoXPR.length; i += 2) {  // take every second element
        purchased_item = []
        nodePaymentInfo = paymentInfoXPR[i]

        // TODO handle Qty > 1
        //class="bill-order-weight-adjust"
        //-------------------------
        // Item Description
        purchased_item.push(nodePaymentInfo.getElementsByClassName("print-item-title")[0].innerText.replace("\n", " "));

        //-------------------------
        // Item Price
        var price = parsePrice(nodePaymentInfo.getElementsByClassName("black tr")[0].innerText);
        purchased_item.push(price);

        // Integrate line item
        purchased_items.push(purchased_item);
    }

    // Integrate any sales tax
    summary_section = document.getElementsByClassName("bill-order-payment-spacing")[0].children;
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
            break
        }
    }

    transaction["Items"] = purchased_items;
}

processWalmartInvoice();
