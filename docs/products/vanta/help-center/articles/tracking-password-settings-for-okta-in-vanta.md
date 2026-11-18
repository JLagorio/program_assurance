# Tracking Password Settings for Okta in Vanta

Source: https://help.vanta.com/en/articles/11345642-tracking-password-settings-for-okta-in-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Vanta can track password settings for applications using Okta for authentication or for select integrations, including AWS. This allows you to select which Okta password setting configuration applies to your application and provide this evidence during an audit of your vendors. Password configuration data is commonly used as evidence for frameworks including SOC 2 and ISO 27001.
 
 

## Connecting Your Tools
- 
You can connect Okta to Vanta following these instructions <https://help.vanta.com/en/articles/11345654>. No notable changes are needed to capture password settings.
- 
Once connected, Vanta will fetch any password settings configurations enabled in Okta. While most instances will have one configuration, it is possible to have several.
- 
To gather password settings for other platforms including AWS, simply follow the integration instructions for each platform.
 

## Viewing Password Configurations
You can view password configurations on the Inventory page. Within the Inventory page, you will find a section called Password Policies. This view will include all password policies that Vanta has discovered, as well as crucial details about the policy
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757464/98e248c608276442aff329ef972a/31330900516756?expires=1794967200&signature=c0ad35f74b35f9f143334f5c5cfe6ac9a64ed558d385820d4bb87b19785a9372&req=dSUmEM57moVZXfMW1HO4zV115nJWsBLAigy%2F9IDeHsyJpQrq%2BOUQh8bOpLGn%0AwTMHxubXZc%2BdsBssHzA%3D%0A>
 
 

## Setting Password Policies
- 
You can also set password policies for various applications that use Okta for authentication. To do so, navigate to the Vendors page and select any application that uses Okta for authentication.
- 
Next, update the Auth method field to “Okta” and save or ensure it is selected.
- 
Once Okta is selected, you will see a new section for Password configurations below.
- 
Within Password Configurations, you will either see your default Okta password settings reflected or be able to select the appropriate configuration should you have multiple.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757460/bbd25e04130bf23fb683023b44fc/31330877543828?expires=1794967200&signature=10e1c1e4f4060e31b8b70a91d299931da1ada18f85d9d2c4c2ec5ff9dc44e0de&req=dSUmEM57moVZWfMW1HO4zXDZZJ5pa0D2Acz1atLR5zk2wDP3z1Ye%2FT2blOYr%0AIT3Ej4gdT1T6vz8F5fE%3D%0A>
- 
If you have Auditor visibility set to Visible, your auditor will be able to view password settings data for this vendor automatically, reducing the need for manual screenshots.

## Images

- [image 01] ../../images/ux/inventory/tracking-password-settings-for-okta-in-vanta--01.png
- [image 02] ../../images/ux/vendors/tracking-password-settings-for-okta-in-vanta--02.png
