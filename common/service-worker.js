chrome.action.onClicked.addListener((tab) => {
    console.log("Downloading web order for " + tab.url)

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
            if (re.test(tab.url)){
                content_script_js_files = content_script.js
                break;
            }
        }
        if (content_script_js_files.length != 0){
            break
        }
    }

    // Inject the matched content scripts to the current active tab
    if (content_script_js_files.length == 0){
        console.log("page URL no match found")
        return
    }
    console.log("injecting content scripts " + content_script_js_files)
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: content_script_js_files
    });
});
