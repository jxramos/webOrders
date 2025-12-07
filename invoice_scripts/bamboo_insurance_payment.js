function processBambooInvoice() {
  console.log("processBambooInvoice")
  var transaction = {
    "Vendor":"Bamboo",
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

  var payment_block = document.getElementById("policyPaymentResultRows").children[0].children

  // Get Order Number
  transaction["Order#"] = payment_block[2].innerText

  // Get OrderDate
  date_str = new Date().toLocaleDateString();
  processOrderDate(date_str, transaction)

  // Hardcode payment field which is not presented
  transaction["PaymentMethod"] = "Checking";

  policy_number = payment_block[0].innerText
  transaction["Description"] = "Policy " + policy_number + " renewal" 

  // Get Order Total
  transaction["Total"] = 0
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getOrderItemization(transaction){
  console.log("getOrderItemization");

  var purchased_items = [["insurance TODO itemize from Declaration", transaction["Total"]]];
  transaction["Items"] = purchased_items;
}

processBambooInvoice();

