function downloadQifTransaction(transaction) {
  // Header
  var transactionQif = "!Type:Bank\n";

  // Date
  transactionQif += "D" + transaction["OrderDate"] + "\n";

  // Payee
  transactionQif += "P" + transaction["Vendor"] + "\n";

  // Total Amount
  transactionQif += "T-" + transaction["Total"] + "\n";

  // Memo
  memo = "M" + transaction["Order#"]
  if (transaction["PaymentMethod"].length > 1) {
    memo += "; (split payment, " + transaction["PaymentMethod"].slice(1,) + ")"
  }
  transactionQif += memo + "\n";

  // Splits
  items = transaction["Items"];
  for (let i = 0; i < items.length; i++) {
    item = items[i];
    transactionQif += "E" + item[0] + "\n";
    transactionQif += "$-" + item[1] + "\n";
  }
  transactionQif += "^\n"

  // Save to disk
  downloadContent(transaction['Vendor'] + '--' + transaction['Order#'] + '.qif', transactionQif);
}