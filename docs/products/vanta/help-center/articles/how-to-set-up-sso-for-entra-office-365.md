# How to set up SSO for Entra (Office 365)

Source: https://help.vanta.com/en/articles/11345656-how-to-set-up-sso-for-entra-office-365
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

The Vanta O365 enterprise application for Entra (Office 365) allows you to enable SSO features for users managed in your Entra (Office 365) environment, creating frictionless login experience.
This guide assumes you are using Entra (Office 365) as your Primary IdP, and the integration has been connected in your Vanta instance.
 

## Prerequisites
- 
A minimum  <https://www.datadoghq.com/pricing/?product=infrastructure#infrastructure>Microsoft 365 Business Standard <https://www.microsoft.com/en-us/microsoft-365/business/compare-all-microsoft-365-business-products> + Microsoft Entra ID P1 <https://www.microsoft.com/en-au/security/business/microsoft-entra-pricing#pricing> subscription is required (see Vanta Integrations that may Require a Premium Service <https://help.vanta.com/en/articles/11345765>)
- 
'Global Administrator' role in Microsoft Office365.
- 
If you have multiple IdPs connected, Office 365 must be set as your Primary IdP to use SSO login methods.

## Procedure
- 
Login to Azure and navigate to the Enterprise Applications page
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765920/a1b8e1f30b579b1241b6a37241d9/31223553205780?expires=1794967200&signature=cf108cc78441dea18f9885deb66b85607ae87c2825e5b8da65f33ecb7d9ce0d9&req=dSUmEM54mIhdWfMW1HO4zcbqSF9hWkMeEHYLUMQqRMXxOyj4zqUQZVuRKc4D%0A6RbflYid6y4d2Xq5d%2Fw%3D%0A>
- 
Search for Vanta O365, If you have multiple choose the one that is the most recent and click on it:
​
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765919/845fbe12aa80abc77eaa1df41599/31219195593492?expires=1794967200&signature=06b8632f79575243f0da9d6928fdd6394d7c741aa7bed323f7315acf7d13b6dc&req=dSUmEM54mIheUPMW1HO4zYJN%2Fvnggowoo7RZ6K41oUZjyU%2FxUtgje5%2BLoRtX%0AWfrW%0A>
- 
You will be taken to the App Overview page. click Users and Groups
​
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765918/794b4b0418b0029d9c7e42847eee/31223528870164?expires=1794967200&signature=6edc16fa1e9e2e49e12a9d9a761e084b6cdee35849fb892fb60602a980a66bbd&req=dSUmEM54mIheUfMW1HO4zaFkyCY7sLFt3NvDULxE0GUUBr4pW84sBwtzIKYW%0AK%2BJy%0A>
- 
Click Add user/group
​
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765917/dcb4b059da9bda2d9c624d1847a6/31223528870932?expires=1794967200&signature=415f74359873561159e14a264d94dc3a9fac50d255191221426a822630c81802&req=dSUmEM54mIheXvMW1HO4zRgns1P6%2FcB5HfPZIhA8DL4yXwYPkXsqhyxBwJHm%0AzDhA%0A>
- 
Select the users you want to assign the Vanta O365 app. 
If you want the application to be applied to all users, then it's recommended to search for and select the 'All Users' group as seen in the screenshot below, as this will ensure future users added to the group are automatically assigned the Vanta O365 app
​
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765948/5db9137166bc067d02e09bb23850/31223528871316?expires=1794967200&signature=be79147823cd3e7384221abc9fe027bf3856d84293a8f0e48dcf1a8baab38d37&req=dSUmEM54mIhbUfMW1HO4zQOeJoDbggtlpo8R99wINIGUW7aeJ2UFeDvwNr90%0Aj7NR%0A>
- 
Click Select, then Assign to finish assigning the app
​
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765944/71f0c294bfdfb77235dd12f8190d/19800524329236?expires=1794967200&signature=7a44901bd6ac3e1263fb23643534f036045bae67f6ef8e441bd4d0df2b44c6c6&req=dSUmEM54mIhbXfMW1HO4zaQANFYAr%2B2Dxk2B7UA1c%2BwpwzwNnRR%2FVa84Pt9d%0AB1ot%0A>
Users will now be able to login by selecting 'Continue with Microsoft' on the Login page <https://app.vanta.com/>
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765949/3a09df029fb38fc005c73e3a8308/28134076213780?expires=1794967200&signature=28d9cd6ebeab21b8f1c0df8198e4229a8a5e0782ca63d60fa189dc29e80db3f7&req=dSUmEM54mIhbUPMW1HO4zUaNFKXDpS7Czooja83jfeV9jmbyTlj0bMzM2IWH%0AL7VuI9Oz4%2F8IT93E%2FwY%3D%0A>

## Common Issues
- 
When attempting to login I'm redirected to a page saying "Account Not Found"
- 
The option to enable SSO is grayed out or not appearing in Vanta
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765957/9523581ed0f035a8f9f653f8be56/19800747217428?expires=1794967200&signature=ef97734687c4c67e020c449c90821c99cd50bc403be73077bab5afbf3e5aa214&req=dSUmEM54mIhaXvMW1HO4zZQa1UWnGQemnR4C6md9F9nfWuVuhqunQWW6YEh2%0AkLkrCthLnwHn6ZJr41A%3D%0A>
 

## Resolution
- 
The most common cause for this error is the "Vanta O365" has not been assigned to that user's profile in Entra ID, or they are not assigned to the group that automatically provisions the app.
 
- 
Check that the user:
- 
is assigned to the group where the Vanta O365 app was applied
- 
has the app assigned to their Entra ID user profile
- 
has Office365 as the primary source of their employment information (see here on how to check this <https://help.vanta.com/en/articles/11345921>)
- 
Is using the email address registered to their Vanta profile
- 
Once these checks are complete, have the user:
- 
clear the browser cache and cookies
- 
in an Incognito browser, go to this page: https://app.vanta.com/login <https://app.vanta.com/login>
- 
enter their Vanta associated address and click 'Continue with email'
 
- 
SSO option is grayed out or not appearing - If the option to enable SSO is grayed out or does not appear in Vanta, this is typically caused by the Office 365 integration not being configured to populate the People page.
To resolve this:
- 
Go to your Vanta integrations settings and open the Office 365 integration.
- 
Ensure the toggle for "Use Office 365 to populate the People Page" is turned on.
- 
Once this toggle is enabled, the SSO option will become available and the magic link will no longer be grayed out.
 
If issues persist, please reach out to [email protected] with details on what troubleshooting you have already attempted, and we will be happy to help!

## Images

- [image 01] ../../images/integrations/azure/controlling-scope-through-microsoft-entra--01.png
- [image 02] ../../images/integrations/azure/controlling-scope-through-microsoft-entra--02.png
- [image 03] ../../images/integrations/azure/controlling-scope-through-microsoft-entra--03.png
- [image 04] ../../images/integrations/azure/how-to-set-up-sso-for-entra-office-365--04.png
- [image 05] ../../images/integrations/azure/how-to-set-up-sso-for-entra-office-365--05.png
- [image 06] ../../images/integrations/azure/how-to-set-up-sso-for-entra-office-365--06.png
- [image 07] ../../images/ux/other/how-to-set-up-sso-for-entra-office-365--07.png
- [image 08] ../../images/ux/other/how-to-set-up-sso-for-entra-office-365--08.png
