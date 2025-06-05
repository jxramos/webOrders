# webOrders
chrome extension to write web order history to a report.

## Report Format
Currently renders order history to a json file from select website url filters mapped in the plugin's `manifest.json` file. The report will be automatically downloaded to the default Downloads folder with a file name taking the form of the order date, followed by the e-commerce vendor name, followed by the order number.

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
* dmv.ca.gov
* ebay.com
* ereplacementparts.com
* fcpeuro.com
* geico.com
* homedepot.com
* mrcooper.com
* rocketmortgage.com
* vitacost.com
* walmart.com
* workday.com payslips
