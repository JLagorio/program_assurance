# Creating a Custom SAML Connection

Source: https://help.vanta.com/en/articles/11345649-creating-a-custom-saml-connection
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Vanta customers using stand-alone products such as Third-Party Risk Management (TPRM), Access Reviews, and Trust Center can now set up an SSO configuration independent of an IdP API integration.
 
By leveraging the SAML connection, users will be able to login to Vanta through SSO without having to integrate Vanta fully with an identity provider.
 

## Enabling a SAML Connection
- 
In your account header, click the Settings icon.
- 
In the Settings page menu, select Login and security.
- 
Choose Manually configure SAML.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758533/fd1ed9e305de6d184c6f182ade15/27503097937684?expires=1794967200&signature=d9aa8b7551be7d7ed8532f86521ff02ec85e401e57ebee686188eacaf44ec9da&req=dSUmEM57lYRcWvMW1HO4zRgROIynxHANMe1QynlkFdabl79voPQh26kPdWFf%0AJAeVD6wT4rtSW0zXh1U%3D%0A>
- 
This connection requires metadata configuration to enable as an SSO method. Refer to your IdP's documentation for further instructions:
- 
Google <https://support.google.com/a/answer/6087519?hl=en>
- 
Okta
- 
From the Okta admin portal, select Applications and then select Browse App Catalog
- 
Locate the Vanta SAML App, select it, and Add Integration
- 
Return to Vanta and copy the Domain ID field. This will be needed in the next step
- 
Back in Okta, under Applications, select the Vanta application
- 
Select the Sign On tab and then Edit
- 
Find Advanced Sign-on Settings and paste in the Domain ID you copied from Vanta
- 
Select Save
- 
From the Sign On tab, click Copy next to the Metadata URL field. You will need this for the next step
- 
Return to the new SAML connection page in Vanta and select Edit Configuration
- 
Paste in the Metadata URL that you copied from Okta
- 
OneLogin <https://auth0.com/docs/authenticate/protocols/saml/saml-sso-integrations/configure-auth0-saml-service-provider/configure-onelogin-as-saml-identity-provider#:~:text=Log%20in%20to%20the%20OneLogin,Click%20SAVE.>
- 
Jumpcloud
- 
Log into the JumpCloud admin console: https://console.jumpcloud.com/login/admin <https://console.jumpcloud.com/login/admin>
- 
Click on SSO Applications on the left navigation panel
- 
Click on + Add New Application
- 
Search for Vanta and select it
- 
Click Next
- 
Optionally enter a description and then click Save Application
- 
Back on the applications page, click on the newly created Vanta application
- 
Click on the SSO tab
- 
Change the ACS URLs (0) to the ACS (Consumer) Url provided by Vanta's setup. It should look something like this: https://app.vanta.com/auth/sso/saml/:id/acs <https://app.vanta.com/auth/sso/saml/:id/acs>
- 
Change the SP Entity ID field to the SP Entity ID provided by Vanta. It should look like: https://app.vanta.com/saml/:id <https://app.vanta.com/saml/:id>
- 
Click the Copy Metadata URL button in Jumpcloud
- 
In Vanta, select Edit Configuration in the Identity Provider configuration section. Paste in the URL copied from Jumpcloud
- 
As you configure the connection, your IdP may ask for Service provider details, and these can be found on the Manual SSO SAML configuration page in Vanta
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758525/ab9a5ad11e8f7dfb29f879d8ace2/26418972334868?expires=1794967200&signature=38c33760e5c5a7254cafbb004f15753e4ba3eddb7003f1b1591abdc6fbe0c419&req=dSUmEM57lYRdXPMW1HO4zceDCbtGttv66m0KR9ZXvIDFaCqq1dE%2Bz6CUsA%2BE%0Ai9h9sDh2ZBSRkGXfP1s%3D%0A>
 
- 
After following the instructions from your IdP, you will be provided with a Metadata URL
- 
Select Edit configuration from the Manual SSO SAML configuration page in Vanta
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758521/d5cc08ad497e03818e377a75fac0/26386089059220?expires=1794967200&signature=758acc2f4cb187e15b64786451d1e93cfc4eb4a6d64f0889501f9cb84847a4e3&req=dSUmEM57lYRdWPMW1HO4zZVUJoVOXa6On12QKk5mf2Ei321aGwShGx%2B2kfeA%0AV4T1f%2BWvdP%2FEx1TEBsw%3D%0A>
- 
Add the Metadata URL provided by your IdP
- 
Select Verify configuration
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758523/0580b6ebb3b67ec5db27e8da20a7/26422838105620?expires=1794967200&signature=4b216c35f27292d695b9faa8a95b1a8704a53fc65444470bcbb136a6feb9bc06&req=dSUmEM57lYRdWvMW1HO4zXEyhOEmS5XWKBcJzaykYBEtXDvZnhlOnTAzFbMX%0AdNabNtfcfTV4knMnFJc%3D%0A>

## Images

- [image 01] ../../images/ux/settings/creating-a-custom-saml-connection--01.png
- [image 02] ../../images/ux/settings/creating-a-custom-saml-connection--02.png
- [image 03] ../../images/ux/settings/creating-a-custom-saml-connection--03.png
- [image 04] ../../images/ux/settings/creating-a-custom-saml-connection--04.png
