# n8n-nodes-rdsm

Community node to integrate n8n with RD Station Marketing.

## Implemented Resources

| Resource                 | Operations                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Contact                  | Create, Get, Update, Delete, Add Tags, Get Events                                                                       |
| Conversion and Trigger   | Create Conversion Event                                                                                                 |
| Custom Field             | Get Many, Create, Update, Delete                                                                                        |
| E-Commerce Event         | Checkout Started, Abandoned Cart, Order Paid, Order Canceled, Order Fulfilled, Shipment Delivered                       |
| Qualification and Funnel | Get Contact Funnels, Mark Lead as Opportunity, Mark Opportunity as Won, Mark Opportunity as Lost, Update Contact Funnel |

## Implemented Triggers

| Trigger                      | Events                        |
| ---------------------------- | ----------------------------- |
| RD Station Marketing Trigger | Converted, Marked Opportunity |

## Authentication

Credential: RD Station Marketing (OAuth2).

The credential supports a configurable Base URL for the RD Station Marketing API.

Default API base URL: `https://api.rd.services`

OAuth authorization always uses `https://accounts.rdstation.com/oauth/authorize`, and the access token endpoint is derived from the Base URL.

## Local Development

```bash
npm install
npm run build
npm run lint
```

## License

[MIT](./LICENSE)
