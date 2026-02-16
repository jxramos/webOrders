function processPgeInvoice() {
  console.log("processPgeInvoice")
  var transaction = {
    "Vendor":"PG&E",
    "URL": window.location.href,
    "is_delete_after_ingest": true,
  };
  scrapeOrderData(transaction);
  downloadJsonTransaction(transaction);
  retitlePage(transaction);
  console.warn("WARNING: you must first click the payment page popup, manually copy/paste the common.js and this content script and paste it into the Console to avoid the cross site limitations from their iframe usage")
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

  var payment_block = document.getElementsByClassName("pay-block-summary")[0].children

  // Get Order Number
  transaction["Order#"] = payment_block[2].children[1].innerText

  // Get OrderDate
  date_str = payment_block[1].children[1].innerText
  processOrderDate(date_str, transaction)

  // Hardcode payment field which is not presented
  transaction["PaymentMethod"] = "Checking";

  // Get Order Total
  transaction["Total"] = parsePrice(payment_block[3].children[1].innerText);
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
  console.log("getOrderItemization");

  var purchased_items = [["utils TODO", transaction["Total"]]];
  // TODO bill details anywhere outside of PDF?

  transaction["Items"] = purchased_items;
}

processPgeInvoice();
