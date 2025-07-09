function processCostcoChecksInvoice() {
    console.log("processCostcoChecksInvoice")

    var transaction = {
        "Vendor": "Costco",
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

    payment_details_div = document.querySelector("#paySubmitSuccessDiv > div.CostcoChecks_coc-dashboard-viewPay_billPay_success_pay_details_block")

    // Get Order Number
    transaction["Order#"] = document.getElementById("MainContent_orderNumber").innerText

    // Get OrderDate
    date_str = document.getElementById("MainContent_currentDate").innerText
    processOrderDate(date_str, transaction)

    // Hardcode payment field which is not presented
    transaction["PaymentMethod"] = document.getElementById("MainContent_PaymentMethodDisplay1_cctype").innerText + document.getElementById("MainContent_PaymentMethodDisplay1_ccnumber").innerText

    // Get Order Total
    transaction["Total"] = parsePrice(document.getElementById("MainContent_ShoppingCart_TotalPriceLabel"));
  }

  /*==========================================================================================
  ORDER ITEMIZATION
  ==========================================================================================*/

  function getOrderItemization(transaction){
    console.log("getOrderItemization");

    var purchased_items = [];

    // scrape the check order
    item = document.getElementById("MainContent_ShoppingCart_PaymentCartItems_OrderItemID_0").parentElement.children[1].children
    item_description = item[1].getElementsByClassName("productName")[0].innerText.replace("\n", " ") + item[2].innerText
    item_price = parsePrice(item[4].innerText.trim())
    purchased_items.push([item_description, item_price])

    // scrape shipping and handling
    purchased_items.push([document.getElementById("MainContent_ShoppingCart_ShippingHandlingDescriptionLabel").innerText.replace(":", ""),
                        parsePrice(document.getElementById("MainContent_ShoppingCart_ShippingHandlingPriceLabel").innerText)])

    // scrape any taxes
    purchased_items.push([document.getElementById("MainContent_ShoppingCart_SalesTaxDescriptionLabel").innerText.replace(":", ""),
                        parsePrice(document.getElementById("MainContent_ShoppingCart_SalesTaxPriceLabel").innerText)])

    transaction["Items"] = purchased_items;
  }

  processCostcoChecksInvoice();
