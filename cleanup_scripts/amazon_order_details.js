function processAmazonOrderDetails() {
    console.log("processAmazonOrderDetails")

    var transaction = {
        "Vendor":"Amazon.com",
        "URL": window.location.href
    };
    getOrderMetaData(transaction);
    retitlePage(transaction);
    reformatPage();
}


function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.querySelector("[data-component=orderId").innerText

    // Get OrderDate
    dateString = document.querySelector("[data-component=orderDate").innerText
    orderDate = new Date(dateString);
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
                                        "-" + String(orderDate.getMonth()+1).padStart(2, '0') +
                                        "-" + String(orderDate.getDate()).padStart(2, '0');
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

    // retain link to invoice view by moving it to the order ID label
    invoice_url = document.querySelector("[data-component=orderInvoice]").getElementsByTagName("a")[0]
    order_id_label = document.querySelector("[data-component=orderIdLabel]")
    invoice_url.removeAttribute("class")
    invoice_url.innerText = order_id_label.innerText
    order_id_label.replaceChild(invoice_url, order_id_label.children[0])

    // Delete select elements by ID
    ids = ["nav-top",
           "skiplink",
           "navbar-main",
           "navFooter",
           "recsWidget",
           "rhf",
           "nav-flyout-ewc",
           "a-autoid-1",
    ]
    for (var i=0; i < ids.length; i++){
        id = ids[i]
        element = document.getElementById(id)
        if (element == null){
            continue;
        }
        element.parentElement.removeChild(element);
    }

    // delete the shipping address and order summary table
    deleted_data_components = [
        "breadcrumb",
        "personalization",
        "orderSummary",
        "itemConnections",
    ]
    for(var i=0; i<deleted_data_components.length; i++){
        data_component = deleted_data_components[i];
        elements = document.querySelectorAll("[data-component=" + data_component + "]");
        for(var j=0; j < elements.length; j++){
            element = elements[j]
            if (element != null) {
                element.parentElement.removeChild(element);
            } else {
                console.warn("ERROR--data component " + data_component + " not found")
            }
        }
    }

    // delete irrelevant divs
    xpathIgnoreDivs = "//div[contains(text(),'Your package was left near') or contains(text(),'Return eligible through') or contains(text(),'Return window closed on')]|//a[contains(text(),'View or Print invoice') or contains(text(), 'View your item') or contains(text(), 'Buy it again')]/../..";
    var ignoreDivsXPR = document.evaluate(xpathIgnoreDivs, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
    ignoreDivs = []
    while ((ignoreDiv = ignoreDivsXPR.iterateNext()) != null) {
        ignoreDivs.push(ignoreDiv)
    }

    // delete interaction buttons on  the right div
    ignoreClasses = ["a-fixed-right-grid-col a-col-right", "actions"]
    for (var c=0; c < ignoreClasses.length; c++) {
        div_buttons = document.getElementsByClassName(ignoreClasses[c]);
        for (var i=0; i < div_buttons.length; i++){
            ignoreDiv = div_buttons[i]
            ignoreDivs.push(ignoreDiv)
        }
    }

    // delete buy it again rows (skip the first element which is always the big container)
    div_buttons = document.getElementsByClassName("a-row");
    for (var i=1; i < div_buttons.length; i++){
        div_button = div_buttons[i]
        if (div_button.innerText == "Buy it again") {
            ignoreDivs.push(div_button)
        }
    }

    // delete all identified ignore divs
    for (var i=0; i < ignoreDivs.length; i++){
        ignoreDiv = ignoreDivs[i]
        ignoreDiv.remove()
    }

    // delete footer (related to items you've viewed, continue series you started, etc)
    footer = document.getElementById("desktop-yo-orderdetails_ALL_desktop-yo-orderdetails_0_container")
    if (footer != null) {
        footer.parentElement.removeChild(footer)
    }

    // delete buttons, such as buy it again variants
    buttons = document.getElementsByClassName("a-button ")
    for(var i=0; i<buttons.length; i++){
        button = buttons[i]
        button.parentElement.removeChild(button);
    }
}

function retitlePage(transaction) {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " Amazon.com--" + transaction["Order#"] + "_details"
}

processAmazonOrderDetails()
