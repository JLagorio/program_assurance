# Connecting Vanta & ZoomInfo

Source: https://help.vanta.com/en/articles/11899295-connecting-vanta-zoominfo
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## About this article
- 
This integration makes read-only API requests to the ZoomInfo SCIM API.
- 
Admins
- 
Estimated setup time: Less than 10 minutes
 

## How it works
ZoomInfo is a B2B contact and company intelligence tool. We use the  SCIM protocol <https://docs.keeper.io/en/enterprise-guide/user-and-team-provisioning/automated-provisioning-with-scim> to pull users from ZoomInfo, never pushing information to the service. We don't currently pull user roles from ZoomInfo.
 

## Use Cases
Connecting ZoomInfo will allow Vanta to perform the following tests:
- 
Ensure ZoomInfo accounts are linked in Vanta
- 
Ensure ZoomInfo accounts are deprovisioned when personnel leaves
 

## Overview
To connect ZoomInfo to Vanta, you will need to set up the ZoomInfo SCIM API that is available for customers with admin privileges and SSO already set-up <https://tech-docs.zoominfo.com/zoominfo-sso-idp-config-examples.pdf>.
 

## Requirements
- 
You must have admin privileges in ZoomInfo.
- 
SSO must be already set up for your ZoomInfo account.
 

## Install the integration
Log in to ZoomInfo with an administrator account and follow steps here: SCIM user provisioning method in ZoomInfo <https://tech-docs-library.zoominfo.com/scim-provisioning-zoominfo-okta-integration-guide.pdf>.
To get the API Token to make the SCIM calls:
- 
Go to Company Settings > Auto Provisioning.
- 
Click Generate API Token.
- 
Copy the API Token and Base URL and paste them in Vanta's linking flow. 
 
In Vanta, go to the Integrations page, click Add integration, and search for ZoomInfo. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
 
Click Connect, and paste the URL in the ZoomInfo SCIM URL field
 
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1648013344/4ff076499d8cc620f55f0b72ab16/AD_4nXesW11KPl08LmHP5JkqKuw0I1Ux_2biiAmY101dgkngogBhFeNnV266vrd2eb9tnkC_P5p4q2fuq0WSMWeJGyH5A4WEj3ajdzlAzDalTKfclcf5XfylNBq2IOfdHNGPaIhVXMGn?expires=1794967200&signature=1412d826e24022e289bde3a0a486c21a6f9a6c9a105beb9a297b6a0d5055ccd9&req=dSYjHsl%2FnoJbXfMW1HO4zU23n0dkFsXmfXnQUN4kFzWhmGNMnBYVcyH7YbRC%0AFIG0ghDNq4dmnUyVtw8%3D%0A>
 
Return to the Vanta tab and paste the token into the SCIM Bearer Token field.
 
Finally, click Validate and Store Credentials.
 

## Permissions
Vanta accesses the following data from your ZoomInfo account:
 
Vanta will be able to view:
- 
Data about your users
- 
Data about your user details
- 
Data about your user groups
Vanta will be able to do:
- 
Nothing

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-zoominfo--01.png
