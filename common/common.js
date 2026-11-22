//#region Currency and Date Functions
function parsePrice(item) {
    // handle literal numeric
    if (isFinite(item)) {
        return parseFloat(item)
    }

    // Get the price string value
    if (typeof item === 'string' || item instanceof String) {
        price_value = item
    } else {
        price_value = item.textContent
    }

    // Clean and process the price string value
    price_value = price_value.trim().replace(/[$, ]/g, "")
    if (price_value.includes("(") | price_value.endsWith("-")) {
        // handle parenthetical or suffixed negative representations
        price_value = "-" + price_value.replace(/[()-]/g, "")
    } else if (price_value.toLowerCase() == "free") {
        // handle free literals
        price_value = 0.0;
    }

    // Parse the price string value
    return parseFloat(price_value)
}

function validateTotal(transaction) {
    // aggregate all item amounts
    items = transaction["Items"]
    item_total = 0.0
    for (i = 0; i < items.length; i++) {
        item_total += items[i][1]
    }
    item_total = roundCurrency(item_total)

    // feedback total mismatches
    transaction_total = transaction["Total"]
    has_matching_total = item_total == transaction_total
    if (!has_matching_total) {
        error_message = "ERROR--item total '" + item_total + "' not equal to transaction total '" + transaction_total + "'"
        alert(error_message)
        console.warn(error_message)
    }
    return has_matching_total
}

function roundCurrency(val) {
    return Math.round(val * 100) / 100
}

function processOrderDate(date_str, transaction) {
    orderDate = new Date(date_str);
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
        "-" + String(orderDate.getMonth() + 1).padStart(2, '0') +
        "-" + String(orderDate.getDate()).padStart(2, '0');
}

//#endregion Currency and Date Functions

//#region File Export Functions

function downloadContent(filename, content) {
    let a = document.createElement('a');
    a.href = "data:application/octet-stream," + encodeURIComponent(content);
    a.download = filename;
    a.click();
}

function downloadJsonTransaction(transaction) {
    console.log("downloadJsonTransaction")

    // validate transaction order itemization before downloading a malformed web order
    if ("Items" in transaction && !validateTotal(transaction)) {
        return
    }

    var transactionJson = JSON.stringify(transaction, null, 4);
    filename = transaction["OrderDateFormatted"] + ' ' + transaction['Vendor'].replace(" ", "") + '--' + transaction['Order#'] + '.wo.json'
    downloadContent(filename, transactionJson);
}

//#endregion File Export Functions

//#region DOM Transformation Functions

function retitlePage(transaction, suffix = "") {
    console.log("retitlePage")

    // Rename title bar to prefix with order date to keep printed invoices sorted by order date
    xpathPageTitle = "/html/head/title";
    pageTitle = document.evaluate(xpathPageTitle, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    pageTitle.singleNodeValue.innerText = transaction["OrderDateFormatted"] + " " + transaction["Vendor"] + "--" + transaction["Order#"] + suffix
}

function removeElement(selector) {
    var element = document.querySelector(selector);
    if (element) {
        element.remove();
    } else {
        console.warn("removeElement: no match for" + selector)
    }
}

function removeTagElement(tagName) {
    document.querySelectorAll(tagName).forEach(e => e.remove());
}

function stripAttributesDeep(element) {
    while (element.attributes.length > 0) {
        element.removeAttribute(element.attributes[0].name);
    }

    if (element.shadowRoot) {
        for (const shadowChild of element.shadowRoot.children) {
            stripAttributesDeep(shadowChild);
        }
    }

    for (const child of element.children) {
        stripAttributesDeep(child);
    }
}

function pruneEmptyElements(root) {
    // Iterate backwards to safely remove elements while looping through live children
    for (let i = root.children.length - 1; i >= 0; i--) {
        pruneEmptyElements(root.children[i]);
    }

    // Check if the current element is now empty (excluding the root container itself)
    if (
        root !== document.body &&
        root !== document.documentElement &&
        root.children.length === 0 &&
        root.textContent.trim() === ''
    ) {
        root.remove();
    }
}

/**
 * Collapses redundant single-child element wrappers while keeping the
 * innermost element tag around text nodes to preserve sibling boundaries.
 * 
 * @param {HTMLElement} root - The root element to prune.
 * @param {Object} [options]
 * @param {boolean} [options.preserveAttributes=false] - Keep wrappers that have attributes.
 * @param {Set<string>} [options.protectedTags] - Tag names that should never be unwrapped.
 */
function pruneWrapperPaths(root, options = {}) {
  const {
    preserveAttributes = false,
    protectedTags = new Set(['HTML', 'BODY', 'TABLE', 'TR', 'TD', 'TH', 'UL', 'OL', 'LI', 'A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'])
  } = options;

  function traverse(node) {
    // 1. Process children bottom-up first
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        traverse(child);
      }
    }

    // Never unwrap the root container itself or protected semantic tags
    if (node === root || protectedTags.has(node.tagName)) {
      return;
    }

    // Optionally keep wrappers that carry attributes (useful for links, inputs, or semantic hooks)
    if (preserveAttributes && node.attributes.length > 0) {
      return;
    }

    // 2. Filter out whitespace-only text nodes and comments
    const meaningfulChildren = Array.from(node.childNodes).filter(child => {
      if (child.nodeType === Node.ELEMENT_NODE) return true;
      if (child.nodeType === Node.TEXT_NODE) return child.textContent.trim().length > 0;
      return false;
    });

    // 3. Remove completely empty elements
    if (meaningfulChildren.length === 0) {
      node.remove();
      return;
    }

    // 4. Only bubble up if the single child is an ELEMENT_NODE (do not unwrap text nodes)
    if (meaningfulChildren.length === 1 && meaningfulChildren[0].nodeType === Node.ELEMENT_NODE) {
      node.replaceWith(meaningfulChildren[0]);
    }
  }

  traverse(root);
  return root;
}

function truncatePage() {
    document.head?.remove();

    // remove all irrelevant non-content producing element tags
    tags_to_remove = ["script", "style", "noscript", "link", "br", "meta", "base", "wbr", "source", "track", "area"]
    tags_to_remove.forEach(e => removeTagElement(e))

    // remove all elements that are void
    pruneEmptyElements(document.body)

    // remove all attributes across the entire body
    stripAttributesDeep(document.body)

    // remove all extraneous wrapper paths to elements
    pruneWrapperPaths(document.body)
}

//#endregion DOM Transformation Functions