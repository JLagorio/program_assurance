# Vanta & ZIP Integration: Third Party Risk Management

Source: https://help.vanta.com/en/articles/11345554-vanta-zip-integration-third-party-risk-management
Collection: Risk, TPRM & AI Gov ; Risk, TPRM & AI Gov › Third-Party Risk Management
Fetched: 2026-11-17

## Article text

Feature availability: This article discusses Third Party Risk Management  features, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
This integration is available for Vanta Third-Party Risk Management (TPRM) customers who also have Zip accounts. 
 
With this integration, when a vendor in Zip is identified as needing a security review, the vendor will automatically be added to your Vanta TPRM tool. Once the security review is complete, the outcome will be pulled back into Zip.
 
If you are interested in this integration, please share your email in this form <https://airtable.com/appfWs8axRSwaQb6q/pagTLZvdNvjdHSQP3/form> If this integration fits you well, the Zip team will discuss the next steps. When Zip notifies you that your integration is ready for implementation, return to this article for step-by-step guidance. 
 
If you need help troubleshooting the Zip workflow, please refer to Zip's Help Center <https://help.us.zip.co/hc/en-us>, or contact the Zip support team from their help center. If you have trouble connecting the TPRM integration, don't hesitate to contact your Vanta account manager.
 
The following document describes how to Integrate ZIP with Vanta to leverage Vanta’s REST API Vendor endpoints:
- 
Have ZIP automatically create vendors in Vanta as part of new vendor requests in ZIP
- 
Have ZIP push documentation that is uploaded into the ZIP Request automatically into Vanta’s currently active Security Review
- 
Have ZIP continuously check for status changes on the Vendor Security Review and approve the Task in ZIP once the Security Review in Vanta is completed.

## Pre-requisites
- 
Vanta
- 
Access to the Developer Console to create a new API Manage Vanta Application
- 
Access to Vanta’s TPRM advanced Vendor module.
- 
ZIP
- 
Access to ZIP’s Company Settings, Data Fields, Document Types, Integrations and Workflows.
- 
Vanta Template is already available under the Custom Integrations Section
- 
“Vanta Rest New Vendor Review Flow”
If any of the above is not available to you, please contact your corresponding CSM at Vanta or ZIP. 
 

## Setup
Please take a look at the video at the end of this section for a detailed walkthrough on how to create the elements listed below.
 

## Custom Fields
This Integration requires two custom fields to be created in ZIP as follows:
- 
Vendor Object
- 
Field: ‘vanta_vendor_id’ of Type: Short Text
- 
This name has to match precisely for Vanta’s Task Template to work.
- 
Zip will display this field inside the Vendor Details.
- 
This field is entirely managed by the Vanta Task Template. No value needs to be entered in it for existing or new vendors, and it should not be updated at any time via the UI.
- 
Ensure the field is marked ACTIVE.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768593/2991323d0a506c1adb2b1eaa9cf3/30939980396820?expires=1794967200&signature=240d992e15f30d6b3a94f824afd389d5a15673e29a92685a9de5604b9883ee9a&req=dSUmEM54lYRWWvMW1HO4zUk57u1DEB90k3jQRWL7HyZlwTxh%2Ff5YwubbRHLc%0A5Hezw4WreaBZVhg5Qao%3D%0A>
- 
Request Object:
- 
Field: ‘vanta_security_review_id’
- 
This name has to match precisely for Vanta’s Task Template to work.
- 
Zip will display this field inside the Request Details.
- 
This field is entirely managed by the Vanta Task Template. No value needs to be entered in it for existing or new requests, nor should it be updated at any time via the UI.
- 
Ensure the field is marked ACTIVE.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768592/033d79abad1d4f0f1db65266e5f0/30939980399636?expires=1794967200&signature=4c8a5e85ce5038895f9880cd61a80d46cc9f628fb0bd9d37ffe65ee7738861ff&req=dSUmEM54lYRWW%2FMW1HO4zdJKD7tnDKjE3v670%2FCWjiu0VpHYaoZjMKJmnm6A%0AveElBi%2B9xoDH7pNsP5M%3D%0A>
 

## Document Types
Additionally, to successfully push documents from ZIP into Vanta, the ZIP Document Names, need to be either added to the Task Template based on your existing Zip settings, or the following names should be used for:
- 
‘SOC 2 Report’
- 
‘ISO 27001 Report’
- 
‘Penetration Test Report’

## Integration Connection
Steps to create a new ZIP Integration and store Vanta’s API credentials for ZIP to Authenticate against Vanta’s API
 

## Vanta
- 
Leverage Vanta’s documentation in our developer portal to create a new Application of type “Manage Vanta” from the Developer Console and generate the corresponding client id and secret.
- 
https://developer.vanta.com/docs/api-access-setup <https://developer.vanta.com/docs/api-access-setup>

## ZIP
- 
Create a new Custom Integration in ZIP.
- 
Inside the Custom Integration, create a new connection with the following parameters:
- 
Base URL:
- 
https://api.vanta.com <https://api.vanta.com>
- 
Token URL:
- 
https://api.vanta.com/oauth/token <https://api.vanta.com/oauth/token>
- 
Client Id:
- 
This is the Client Id generated inside Vanta -> Developer Console -> Manage Vanta Application. This value is generated automatically when you create a new Manage Application.
- 
Client Secret:
- 
The Client Secret is generated inside Vanta -> Developer Console -> Manage Vanta Application. You need to generate this value by clicking the Generate Secret Button under the Client ID.
- 
Grant Type:
- 
client_credentials
- 
Scope:
- 
vanta-api.all:read vanta-api.all:write
- 
Additional Parameters:
- 
The JSON body should be as follows, leveraging the same client ID and secret from above. In the sample below, replace the vanta_client_id and vanta_client_secret with your actual values. These would follow the format vci_ and vcs_ accordingly.{"client_id":"vanta_client_id","client_secret":"vanta_client_secret"}

- 
Test Get URL (Optional)
- 
/v1/controls?pageSize=10
- 
This value is only required to test the connection. You can ignore or remove it before saving the Connection.

## Images

- [image 01] ../../images/integrations/zip/vanta-zip-integration-third-party-risk-management--01.png
- [image 02] ../../images/integrations/zip/vanta-zip-integration-third-party-risk-management--02.png
