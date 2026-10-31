async function processWorkdayPayslip() {
    console.log("processWorkdayPayslip")

    var transaction = {
        "Vendor": "CompanyXYZ",
        "URL": window.location.href,
        "is_delete_after_ingest": true,
    };

    // convert table captions to table mapping
    var table_captions = document.getElementsByTagName("caption")
    tables = new Map();
    for (let i = 0; i < table_captions.length; i++) {
        table_caption = table_captions[i].textContent

        // ignore non-contributing tables
        if (['Taxable Wages', 'Withholding', 'Employer Paid Benefits'].includes(table_caption)) {
            continue
        }
        tables.set(table_caption, table_captions[i].parentElement)
    }

    scrapePayslip(tables, transaction);
    downloadJsonTransaction(transaction);
}

function scrapePayslip(tables, transaction) {
    console.log("scrapeOrderData")

    getPayslipMetaData(tables, transaction);
    getPayslipItemization(tables, transaction);
}

/*==========================================================================================
ORDER METADATA
==========================================================================================*/

function getPayslipMetaData(tables, transaction) {
    console.log("getPayslipMetaData")

    //------------------------------------------------------------------------
    // Table: Company Information
    transaction["Vendor"] = tables.get('Company Information').children[2].children[0].children[0].innerText
    tables.delete('Company Information')

    //------------------------------------------------------------------------
    // Table: Payslip Information
    table_payslip_information = tables.get('Payslip Information')
    tables.delete('Payslip Information')
    cells = table_payslip_information.children[2].getElementsByTagName("td")

    pay_period_begin = cells[3].innerText
    pay_period_end = cells[4].innerText
    transaction["Description"] = "Pay period: " +
                                        pay_period_begin.substring(6) + "/" +
                                        pay_period_begin.substring(0,5) +
                                        " - " +
                                        pay_period_end.substring(6) + "/" +
                                        pay_period_end.substring(0,5)

    // Use Pay Date to serve as the "OrderDate"
    date_str = cells[5].innerText
    processOrderDate(date_str, transaction)

    //------------------------------------------------------------------------
    // Table: Payment Information
    table_payment_information = tables.get('Payment Information')
    tables.delete('Payment Information')
    rows = table_payment_information.children[2].children

    // Get Order Total (same as Current Net Pay)
    var total = parsePrice(tables.get('Current and YTD Totals').rows[1].lastChild.innerText);
    if (total == 0.0) {
        // handle RSU vesting full cash payment case
        employee_post_tax_deduction_rows = tables.get('Employee Post Tax Deductions').rows
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

function getPayslipItemization(tables, transaction){
    console.log("getPayslipItemization");

    var line_items = [];

    //------------------------------------------------------------------------
    // Table: Current and YTD Totals
    table_current_totals = tables.get('Current and YTD Totals')
    tables.delete('Current and YTD Totals')
    gross_pay = parsePrice(table_current_totals.children[2].children[0].children[2].innerText)

    //------------------------------------------------------------------------
    // Table: Earnings
    table_earnings = tables.get('Earnings').children[2].children
    tables.delete('Earnings')
    for (let i = 0; i < table_earnings.length - 1; i++) {
        row_earning = table_earnings[i]
        line_item = []
        line_description = row_earning.children[0].innerText
        line_amount = row_earning.children[4].innerText

        // ignore absent items not used in this payslip
        if (line_amount == "" || line_description.includes("Basic Life GTL")) {
            continue
        }

        // Description
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
    for (const [table_caption, table_deduction] of tables) {
        process_deductions(table_caption, table_deduction, gross_pay, line_items)
    }

    transaction["Items"] = line_items;
}

function process_deductions(table_caption, table_deduction, gross_pay, line_items) {
    console.log("-- processing deduction " + table_caption)
    rows_deduction = table_deduction.children[2].children
    for (let i = 0; i < rows_deduction.length - 1; i++) {
        row_deduction = rows_deduction[i]
        line_item = []

        // Amount
        line_amount = row_deduction.children[1].innerText
        if (line_amount == "" || row_deduction.childElementCount == 2 /* YTD only table */ ) {
            // ignore absent items not used in this payslip
            continue
        }
        line_amount = parsePrice(line_amount)

        // Description
        description = row_deduction.children[0].innerText
        if (description == "RSU Value Vested" || line_amount == 0) {
            // ignore RSU tax offset for the line itemization to equal this expected value
            continue
        }

        // Percent of gross pay
        pct_gross = Number(line_amount / gross_pay).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2});
        description += " (" + pct_gross + ")"

        line_item.push(description)
        line_item.push(-1 * line_amount)
        line_items.push(line_item)
    }
}

processWorkdayPayslip();
