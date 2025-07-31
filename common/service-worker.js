chrome.action.onClicked.addListener((tab) => {
    console.log("Downloading web order for " + tab.url)
    // Match the URL of the active tab to its corresponding content scripts
    content_script_js_files = []
    for (const content_script of chrome.runtime.getManifest().content_scripts) {
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
