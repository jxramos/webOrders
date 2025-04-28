function processCitiPaymentInvoice() {
    console.log("processCitiPaymentInvoice")

    var transaction = {
        "Vendor": "Citi",
        "URL": window.location.href,
        "is_transfer": "scheduled payment authorization"
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
}


/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    print_section  = document.querySelector("#printsec > citi-row > div > citi-column:nth-child(2) > div > citi-row:nth-child(2) > div > citi-column > div")

    // Get Order Number
    transaction["Order#"] = document.getElementsByClassName("refrenceNum")[0].innerText

    // Get OrderDate
    date_str = print_section.children[4].getElementsByTagName("citi-column")[1].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    payment_amount = print_section.children[3].getElementsByTagName("citi-column")[1]
    transaction["Total"] = parsePrice(payment_amount);

    // Get Payment Methods(s) element
    payment_method = print_section.children[6].getElementsByTagName("citi-column")[1].innerText
    transaction["PaymentMethod"] = payment_method;

    target_account = print_section.children[5].getElementsByTagName("citi-column")[1].innerText
}

processCitiPaymentInvoice();
