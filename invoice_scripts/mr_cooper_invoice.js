function processMrCooperInvoice() {
    console.log("processMrCooperInvoice")

    var transaction = {
        "Vendor":"Mr Cooper",
        "URL": window.location.href
    };
    scrapeOrderData(transaction);
    retitlePage(transaction);
    downloadJsonTransaction(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getOrderItemization(transaction);
}

function retitlePage(transaction) {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + transaction["Order#"] + " " + pageTitle.singleNodeValue.innerText

    // clean up page kruft
    ignoreDivs = ["#home-video","#footer-component", "#interact-banner-container", "#oc-lcw-container"]
    for (var i=0; i < ignoreDivs.length; i++){
        ignoreDiv = document.querySelector(ignoreDivs[i])
        ignoreDiv.parentElement.removeChild(ignoreDiv)
    }
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Order Metadata
    div_payment_details = document.querySelector("#payment-details").children[0].children

    // Get Order Number
    transaction["Order#"] = div_payment_details[2].children[1].innerText

    // Get OrderDate
    date_str = div_payment_details[4].children[1].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(div_payment_details[3].children[1]);

    // Get Payment Methods(s) element
    transaction["PaymentMethod"] = div_payment_details[5].children[1].innerText.replace("\n", " ")
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    // TODO payment details not reflected in the confirmation page, must split later
    var purchased_items = [["mortgage TODO", transaction["Total"]]];
    transaction["Items"] = purchased_items;
}


processMrCooperInvoice();