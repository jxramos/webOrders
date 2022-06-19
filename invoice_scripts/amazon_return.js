/*==========================================================================================
WEBSITE BEAUTIFICATION
==========================================================================================*/

function reformatPage() {
    /*
    Deletes extraneous elements not necessary for printing out the return information.
    Inject order information to make discovery easier
    */
    console.log("reformatPage")

    // Delete the continue shopping button
    element = document.getElementById("summary-section")
    element.parentElement.removeChild(element);

    // Delete the page footer
    element = document.getElementsByClassName("navLeftFooter")[0];
    element.parentElement.removeChild(element);

    // Delete the cart checkout flyout
    element = document.getElementById("nav-flyout-ewc")
    element.parentElement.removeChild(element);

    //----------------------------------------------------------------------------
    // Refine line items
    return_section = document.getElementById("returning-items-section")
    return_items = return_section.children
    elements_to_remove = []
    is_remove_next_element = false
    for(var i = 0; i < return_items.length; i++){
        // Retrieve the line item payment detail
        var return_element = return_items[i];

        // delete any applicable horizontal row and reset the removal flag
        if (is_remove_next_element) {
            elements_to_remove.push(return_element)
            is_remove_next_element = false
        }

        // ignore non-div elements
        if (!(return_element instanceof HTMLDivElement)) {
            continue
        }

        // determine return status of line item
        is_not_returned_item = return_element.firstElementChild.children[2].innerText.indexOf("Refund issued") == -1
        if (is_not_returned_item){
            // is not a returned item, mark for deletion along with its subsequent horizontal row
            elements_to_remove.push(return_element)
            is_remove_next_element = true
        } else {
            // is a returned item
            // TODO handle multiple returns in a single order
            is_remove_next_element = false
            return_item_instance = return_element
        }
    }

    // Remove all identified irrelevant/non-return items
    for(var i = 0; i < elements_to_remove.length; i++){
        return_section.removeChild(elements_to_remove[i])
    }

    //----------------------------------------------------------------------------
    // Inject the order number to the section details
    popup_element = return_item_instance.getElementsByClassName("a-popover-preload")[0]
    order_number = popup_element.children[3].innerText.replaceAll(" ", "").replaceAll("\n", "").replace(":", ": ")
    xpath_title = "/html/body/div[1]/div[2]/div/div/div/div[1]/div[1]/div[1]/div/div/div/div[1]/div[1]/form/div/div/div/div[2]/div/div[1]/div/div[2]/span/a/span"
    returnedItemDetails = document.evaluate(xpath_title, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    returnedItemDetails.singleNodeValue.innerText = order_number

    //----------------------------------------------------------------------------
    // Rename title bar to prefix with return date and order number to keep printed invoices sorted by order date
    return_date_str = return_item_instance.getElementsByTagName("li")[0].innerText
    neighbor_text = "efund issued on"
    idx = return_date_str.indexOf(neighbor_text)
    return_date = new Date(return_date_str.substr(idx+neighbor_text.length).replace(":", ""))
    return_date_formatted = return_date.getFullYear() +
                            "-" + String(return_date.getMonth()+1).padStart(2, '0') +
                            "-" + String(return_date.getDate()).padStart(2, '0');

    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null )
    pageTitle.singleNodeValue.innerText = return_date_formatted + " " + pageTitle.singleNodeValue.innerText + " " + order_number
}

reformatPage()