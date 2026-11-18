# Frequently Asked Questions: Vanta & DigitalOcean Integration

Source: https://help.vanta.com/en/articles/11346113-frequently-asked-questions-vanta-digitalocean-integration
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

DigitalOcean, Inc. is an American cloud infrastructure provider that can integrate with Vanta. Due to API limitations, some things must be considered before moving forward with the integration.
 
Access page
- 
The API doesn't allow Vanta to fetch account info, so the access page cannot be populated.
Monitoring tests
- 
DigitalOcean does have a monitoring feature, but it's not accessible from the API, so Vanta does not have equivalent tests.
Spaces require separate credentials
- 
Spaces are the DigitalOcean S3 equivalent; unfortunately, it can't be accessed with OAuth, only with API keys.
- 
Because this requires a separate credential, we treat it as a separate service with a different linking flow.
- 
If you link either DigitalOcean or DigitalOcean Spaces, if you haven't linked the other, we'll prompt you also to link that.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769192/63dbd2381a1fd3774c61164a4468/27568669850772?expires=1794967200&signature=98795bde365d8d3a69ac74782bcad84488eaadf5db2d5c840f7c4e52f8715f87&req=dSUmEM54lIBWW%2FMW1HO4zQrLKrUOpz0d10wB%2BP752KeV%2Bgf7DON1Ygqn30K9%0A0cy9iL7Lu3e10jrRzjQ%3D%0A>
 
Spaces don't support tags
- 
Vanta users must use the scoping dialog to remove things from the scope.
- 
To mark things as containing user data, you will have to click the checkboxes on the inventory
Please let us know if you have feedback, questions, or concerns about the DigitalOcean integration at [email protected].

## Images

- [image 01] ../../images/ux/integrations/frequently-asked-questions-vanta-digitalocean-integration--01.png
