function isValidUrl(value) {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

async function readSavedPageUrl(tab) {
    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            tab_url = document.childNodes[1].textContent.trim()

            // guard clause: only local saved archives shall be permitted
            if (!tab_url.startsWith("saved from url=")) {
                console.warn("Only local files saved as archives are permitted.")
                return ""
            }

            // parse and return the archived URL
            tab_url = tab_url.replace(/^saved from url=\(\d+\)/, "")
            return tab_url
        }
    });

    // Extract the returned value from the frame result
    return results[0]?.result;
}


chrome.action.onClicked.addListener(async (tab) => {
    // get the URL of the active tab (or its archived copy if a local file was loaded)
    let tab_url;
    if (tab.url.startsWith('file:///')) {
        tab_url = await readSavedPageUrl(tab)

        // validate the URL
        if (!isValidUrl(tab_url)) {
            console.warn("invalid page URL ")
            return
        }
    } else {
        tab_url = tab.url
    }
    console.log("Downloading web order for " + tab_url)

    // Augment the content scripts with "user trigger only" webpages.
    //   these websites are not exclusively rendering web order receipts and therefore we don't want
    //   the content scripts loading automatically but only per user action that they initiate.
    content_scripts = chrome.runtime.getManifest().content_scripts
    content_scripts.push({
        "matches": [
            "https://mail.google.com/mail*"
        ],
        "js": [
            "common/common.js",
            "invoice_scripts/gmail_inbox_invoice.js"
        ]
    })

    // Match the URL of the active tab to its corresponding content scripts
    content_script_js_files = []
    for (const content_script of content_scripts) {
        for (const match of content_script.matches) {
            // transform the manifest matches glob syntax to regular expression syntax
            match_re = match.replace(/[.?*]/g, (m) => m === '.' ? '\\.' : m === '?' ? '\\?' : '.*');
            const re = new RegExp(match_re);
            if (re.test(tab_url)) {
                content_script_js_files = content_script.js
                break;
            }
        }
        if (content_script_js_files.length != 0) {
            break
        }
    }

    // Inject the matched content scripts to the current active tab
    if (content_script_js_files.length == 0) {
        console.log("page URL no match found")
        return
    }
    console.log("injecting content scripts " + content_script_js_files)
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: content_script_js_files
    });
});
