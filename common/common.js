function processOrderDate(date_str, transaction) {
    orderDate = new Date(date_str);
    transaction["OrderDate"] = orderDate.toLocaleDateString();
    transaction["OrderDateFormatted"] = orderDate.getFullYear() +
        "-" + String(orderDate.getMonth() + 1).padStart(2, '0') +
        "-" + String(orderDate.getDate()).padStart(2, '0');
}

function downloadContent(filename, content) {
    let a = document.createElement('a');
    a.href = "data:application/octet-stream," + encodeURIComponent(content);
    a.download = filename;
    a.click();
}

function downloadJsonTransaction(transaction) {
    console.log("downloadJsonTransaction")

    var transactionJson = JSON.stringify(transaction);
    filename = transaction["OrderDateFormatted"] + ' ' + transaction['Vendor'].replace(" ", "") + '--' + transaction['Order#'] + '.wo.json'
    downloadContent(filename, transactionJson);
}
