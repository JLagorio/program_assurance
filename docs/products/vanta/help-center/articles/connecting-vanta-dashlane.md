# Connecting Vanta & Dashlane

Source: https://help.vanta.com/en/articles/11345708-connecting-vanta-dashlane
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Dashlane allows customers to connect tools like Vanta using SCIM API. By connecting your Dashlane account with Vanta, Vanta is able to make read-only API calls to the Dashlane SCIM API allowing you to display users in Dashlane within Vanta under the Access page.
A Dashlane's Business Account with admin privileges is required for this integration.

## Integrating with Dashlane
- 
In Vanta, go to the Integrations page, click Add integration, and search for Dashlane. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect
- 
The pop-up modal will ask for a SCIM bearer token and SCIM endpoint. Keep this modal open.
- 
In a new tab, login to your Dashlane account

## Obtaining your Dashlane SCIM API Token and SCIM Endpoint
- 
To enable SCIM provisioning, you need to set up an encryption service on AWS or Azure <https://support.dashlane.com/hc/en-us/articles/360015973719>
- 
Once you have your encryption service set up:
- 
As an account admin, log in to the Dashlane account console. <https://app.vanta.com/integrations?state=available&integration-dialog=dashlane&flow=add#:~:text=Dashlane%20account%20console.>
- 
In the sidebar, click Settings, then Provisioning.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758956/4cd64dcbc6dc24b36ca05e479eb1/24077423217940?expires=1794967200&signature=3a8732324415c875af89939f6aae4943e006c507aa12b4d112018ad86b9dc475&req=dSUmEM57lYhaX%2FMW1HO4zZWuu4mSWYJmVR4AriuD18bmuAMipUYOKVND5h3A%0AuuEwzwiOvWH4O9pJwKI%3D%0A>
- 
Click Edit in the SCIM Provisioning settings card.
- 
Click Generate Token.
- 
Toggle Allow the encryption service to sync directory on
- 
Copy your SCIM API Token and SCIM Endpoint and save the changes
- 
Paste your SCIM API Token and SCIM Endpoint back into the pop-up modal in Vanta
- 
Select Validate and store credentials

## Configure the Scope
- 
Establish which Dashlane items should be marked in or out of scope for your audit
[image 02]
 <https://help.vanta.com/hc/article_attachments/24077452559508>
- 
You can configure scopes later by clicking on Configure scope on the connected Dashlane card from the integrations page

## Images

- [image 01] ../../images/integrations/dashlane/connecting-vanta-dashlane--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-box--04.png
