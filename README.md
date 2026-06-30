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

Credential: **RD Station Marketing (OAuth2)**.

Create an app in the [RD Station App Store](https://developers.rdstation.com/reference/criar-aplicativo-appstore) and use its `client_id` and `client_secret` in the n8n credential. Register the n8n **OAuth Redirect URL** (shown in the credential screen) as the app callback URL — it must match exactly.

Default API base URL: `https://api.rd.services`

| Step | Endpoint |
| ---- | -------- |
| Authorization | `{baseUrl}/auth/dialog` |
| Access token (code exchange) | `{baseUrl}/auth/token?token_by=code` |
| Token refresh | `{baseUrl}/auth/token` |

See the [RD Station Marketing authentication docs](https://developers.rdstation.com/reference/autentica%C3%A7%C3%A3o) for the full OAuth2 flow.

## Local Development

```bash
npm install
npm run build
npm run lint
```

## License

[MIT](./LICENSE)
