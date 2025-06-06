async function processWorkdayPayslip() {
    console.log("processWorkdayPayslip")
    await new Promise(r => setTimeout(r, 4200));

    var transaction = {
        "Vendor": "CompanyXYZ",
        "URL": window.location.href
    };

    var table_captions = document.getElementsByTagName("caption")
    scrapePayslip(table_captions, transaction);
    downloadJsonTransaction(transaction);
}

function scrapePayslip(table_captions, transaction) {
    console.log("scrapeOrderData")

    getPayslipMetaData(table_captions, transaction);
    getPayslipItemization(table_captions, transaction);
}

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getPayslipMetaData(table_captions, transaction) {
    console.log("getPayslipMetaData")

    //------------------------------------------------------------------------
    // Table: Payslip Information
    table_payslip_information = table_captions[1].parentElement
    cells = table_payslip_information.children[2].getElementsByTagName("td")

    pay_period_begin = cells[2].innerText
    pay_period_end = cells[3].innerText
    transaction["Description"] = "Pay period: " +
                                        pay_period_begin.substring(6) + "/" +
                                        pay_period_begin.substring(0,5) +
                                        " - " +
                                        pay_period_end.substring(6) + "/" +
                                        pay_period_end.substring(0,5)

    // Use Pay Date to serve as the "OrderDate"
    date_str = cells[4].innerText
    processOrderDate(date_str, transaction)

    //------------------------------------------------------------------------
    // Table: Payment Information
    table_payment_information = table_captions[11].parentElement
    rows = table_payment_information.children[2].children

    // Get Order Total (same as Current Net Pay)
    var total = parsePrice(table_captions[2].parentElement.rows[1].lastChild.innerText);
    if (total == 0.0) {
        // handle RSU vesting full cash payment case
        employee_post_tax_deduction_rows = table_captions[6].parentElement.rows
        for (let i = 1; i < employee_post_tax_deduction_rows.length - 1; i++) {
            row = employee_post_tax_deduction_rows[i]
            if (row.children[0].innerText == "RSU Value Vested" && row.children[1].innerText != "") {
                total = parsePrice(row.children[1].innerText)
                break
            }
        }
    }
    transaction["Total"] = total

    // Get Payment Method
    row_payment_info = rows[0]
    account_name = row_payment_info.children[1].innerText
    account_num  = row_payment_info.children[2].innerText
    transaction["PaymentMethod"] = account_name + " " + account_num

    // Get Order Number
    transaction["Order#"] = "payslip " + transaction["OrderDateFormatted"]
}

/*==========================================================================================
ORDER ITEMIZATION
==========================================================================================*/

function getPayslipItemization(table_captions, transaction){
    console.log("getPayslipItemization");

    var line_items = [];

    //------------------------------------------------------------------------
    // Table: Current and YTD Totals
    table_current_totals = table_captions[2].parentElement
    gross_pay = parsePrice(table_current_totals.children[2].children[0].children[2].innerText)

    //------------------------------------------------------------------------
    // Table: Earnings
    table_earnings = table_captions[3].parentElement.children[2].children
    for (let i = 1; i < table_earnings.length - 1; i++) {
        row_earning = table_earnings[i]
        line_item = []
        line_amount = row_earning.children[4].innerText

        // ignore absent items not used in this payslip
        if (line_amount == "") {
            continue
        }

        // Description
        line_description = row_earning.children[0].innerText
        line_dates = row_earning.children[1].innerText
        line_hours = row_earning.children[2].innerText
        line_rate = row_earning.children[3].innerText
        description = line_description + " " +
                      line_dates + " " +
                      line_hours + "hrs $" +
                      line_rate + "/hr"
        line_item.push(description)

        // Amount
        line_item.push(parsePrice(line_amount))
        line_items.push(line_item)
    }

    //------------------------------------------------------------------------
    // Table: Deductions
    for (let i = 4; i <= 6; i++) {
        table_deduction = table_captions[i].parentElement
        process_deductions(table_deduction, gross_pay, line_items)
    }

    transaction["Items"] = line_items;
}

function process_deductions(table_deduction, gross_pay, line_items) {
    rows_deduction = table_deduction.children[2].children
    for (let i = 0; i < rows_deduction.length - 1; i++) {
        row_deduction = rows_deduction[i]
        line_item = []

        // Amount
        line_amount = row_deduction.children[1].innerText
        if (line_amount == "" || row_deduction.childElementCount == 2 /* YTD only table */ ) {
            line_amount = 0.0
        }
        line_amount = parsePrice(line_amount)

        // Percent of gross pay
        pct_gross = Number(line_amount / gross_pay).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2});

        // Description
        description = row_deduction.children[0].innerText + " (" + pct_gross + ")"

        line_item.push(description)
        line_item.push(-1 * line_amount)
        line_items.push(line_item)
    }
}

processWorkdayPayslip();
