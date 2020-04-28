# webOrders
chrome extension to write web order history to a report.

## Report Format
Currently renders order history to a json file from select website url filters mapped in the plugin's `manifest.json` file. The report will be automatically downloaded to the default Downloads folder with a file name taking the form of the e-commerce vendor name followed by the order number.

    <vendor_name>-<order_num>.wo.json
    Vitacost.com-999999999.wo.json
    Amazon.com-111-1111111-1111111.wo.json

The extension prefix `.wo` is short for web order.

## Web Order Support
The current list of vendors supported.
* amazon.com
    + regular orders
    + prime now orders
    + digital orders
* vitacost.com
