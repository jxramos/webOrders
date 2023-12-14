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
    order_ids = []
    detail_items = []
    for (const s of document.querySelectorAll("span")) {
        if (s.textContent == " Order #:  ") {
            order_ids.push(s.parentElement.textContent.trim())
        } else if (s.textContent == " Details ") {
            detail_items.push(s)
        }
    }
    for(var i = 0; i < detail_items.length; i++){
        detail_items[i].innerText = order_ids[i]
    }

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