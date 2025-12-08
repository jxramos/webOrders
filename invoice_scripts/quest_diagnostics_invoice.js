function processQuestDiagnosticsPatientBillInvoice() {
    console.log("processQuestDiagnosticsPatientBillInvoice")

    var transaction = {
        "Vendor":"Quest Diagnostics",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };
    scrapeOrderData(transaction);
    downloadJsonTransaction(transaction);
    retitlePage(transaction);
}

function scrapeOrderData(transaction) {
    console.log("scrapeOrderData")

    getOrderMetaData(transaction);
    getOrderItemization(transaction);
}

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getOrderMetaData(transaction) {
    console.log("getOrderMetaData")

    // Get Order Number
    transaction["Order#"] = document.querySelector("#portlet_com_quest_bwportal_consolidatedbills > div > div > div > section > div > div > div:nth-child(1) > div > div.ds-card.ds-mt-32.--md-mt-24 > div > div:nth-child(3) > div.ds-col-12.ds-mt-4.ds-flex.--start-start > span:nth-child(2)").innerText

    // Get OrderDate
    div_table = document.querySelector("#portlet_com_quest_bwportal_consolidatedbills > div > div > div > section > div > div > div:nth-child(1) > div > div.ds-card.ds-mt-32.--md-mt-24 > div > div:nth-child(4)").children
    date_str = div_table[7].innerText
    processOrderDate(date_str, transaction)

    // Get Order Total
    transaction["Total"] = parsePrice(div_table[1].innerText);

    // Get Payment Method
    transaction["PaymentMethod"] = div_table[5].innerText
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [["bill itemization TODO", transaction["Total"]]];
    transaction["Items"] = purchased_items;
}

processQuestDiagnosticsPatientBillInvoice();
