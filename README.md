# webOrders
chrome extension to write a web order invoice to a locally saved json report file.

## Report Format
Currently renders order history invoices to a json file, one file per invoice, from supported websites
whose order confirmation or order history pages have urls matching known patterns maintained within
the extension. The report will be automatically downloaded to the user's default Downloads folder
with a file name taking the form of the order date, followed by the e-commerce vendor name, followed
by the order number.

If the web order report does not download automatically the user may manually trigger a download by clicking
on the extension's *action icon* found within the Chrome "Extensions" part of the browser which is identified
by the puzzle piece icon to the right of the address bar.


### File Name
    <order_date> <vendor_name>-<order_num>.wo.json
    2020-03-21 Vitacost.com-999999999.wo.json
    2021-08-11 Amazon.com-111-1111111-1111111.wo.json

The extension prefix `.wo` is short for web order.


### File Body
The contents of the file assume the following form given below, albeit in a minified form:
```json
{
    "Vendor": "VendorXYZ",
    "URL": "https://vendor-xyz.com/invoice_q.html",
    "OrderDate": "M/DD/YYYY",
    "OrderDateFormatted": "YYYY-MM-DD",
    "Total": 221.74,
    "PaymentMethod": "VISA 0123",
    "Order#": "XXXXXXXXXX",
    "Items": [
        [
            "Stuff 1",
            99.99
        ],
        [
            "Thing ABC",
            120.4
        ],
        [
            "Tax",
            1.35
        ]
    ]
}
```

## Web Order Support
The current list of vendors supported.
* amazon.com
    + regular orders
    + prime now orders
    + digital orders
* appfolio.com
* chase.com (credit card payments)
* citi.com (credit card payments)
* costco.com
* costcochecks.com
* dmv.ca.gov
* ebay.com
* ereplacementparts.com
* etrade.com
* fcpeuro.com
* geico.com
* homedepot.com
* irs.gov
* mrcooper.com
* rocketmortgage.com
* sutterhealth.org
* trapsdirect.com
* vitacost.com
* walmart.com
* workday.com payslips
