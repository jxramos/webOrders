console.log("Amazon webpage")

var transaction ={};

// Get Order Number
transaction["Order#"] = document.getElementsByClassName("h1")[0].innerText.replace("Final Details for ","");

// Get OrderDate
xpathOrderDate = "/html/body/table/tbody/tr/td/table[1]/tbody/tr[1]/td";
dateText = document.evaluate(xpathOrderDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                   .singleNodeValue.innerText;
dateString = dateText.split(": ")[1];
orderDate = new Date(dateString);
transaction["OrderDate"] = orderDate.toLocaleDateString();

// Get ShipDate
xpathShipDate = "/html/body/table/tbody/tr/td/table[2]/tbody/tr/td/table/tbody/tr[1]/td/table/tbody/tr/td/b/center";
shipDateString = document.evaluate(xpathShipDate, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                                  .singleNodeValue.innerText
                         .replace("Shipped on ","");
shipDate = new Date(shipDateString)
transaction["ShipDate"] = shipDate.toLocaleDateString();

// Get Substribe & Save Status
transaction["IsSubscribeSave"] = dateText.includes("Subscribe and Save");

// Get Order Total
xpathOrderTotal = "/html/body/table/tbody/tr/td/table[1]/tbody/tr[3]/td/b";
transaction["Total"] = parseFloat(document.evaluate(xpathOrderTotal, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
                                  .singleNodeValue.innerText
                                  .replace("Order Total: $",""));
