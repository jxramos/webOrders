console.log("Amazon webpage")

var transaction ={};

// Get Order Number
transaction["Order#"] = document.getElementsByClassName("h1")[0].innerText.replace("Final Details for ","");

// Get OrderDate
xpathOrderDate = "/html/body/table/tbody/tr/td/table[1]/tbody/tr[1]/td";
dateText = document.evaluate(xpathOrderDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                   .singleNodeValue.innerText;
transaction["OrderDate"] = dateText.split(": ")[1];

// Get Substribe & Save Status
transaction["IsSubscribeSave"] = dateText.includes("Subscribe and Save");

// Get ShipDate
xpathShipDate = "/html/body/table/tbody/tr/td/table[2]/tbody/tr/td/table/tbody/tr[1]/td/table/tbody/tr/td/b/center";
transaction["ShipDate"] = document.evaluate(xpathShipDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                                  .singleNodeValue.innerText
                                  .replace("Shipped on","");

// Get Order Total
xpathOrderTotal = "/html/body/table/tbody/tr/td/table[1]/tbody/tr[3]/td/b";
transaction["Total"] = parseFloat(document.evaluate(xpathOrderTotal, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                                  .singleNodeValue.innerText
                                  .replace("Order Total: $",""));
