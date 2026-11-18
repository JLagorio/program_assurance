# Setting up Single Sign-On (SSO) with OneLogin

Source: https://help.vanta.com/en/articles/11345657-setting-up-single-sign-on-sso-with-onelogin
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

When connecting the OneLogin integration to Vanta, you will have the option to add a OneLogin Vanta app name.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765978/ebba6e478b537e1252f327dcc2c0/20995450001428?expires=1794967200&signature=a17eb96321b7f5caaa6ccf22ccbb38667c90e4ac2ddcb1ebaa0707b914d1ca06&req=dSUmEM54mIhYUfMW1HO4zYnPYe3fn5HuvxUrmEH7jQTJcvk6LzkA0gJrs183%0AeBPjWTaRNF8v4EPnrgM%3D%0A>
 
This will allow users to login to Vanta using OneLogin. In order to set this up, a Vanta application must first be created within OneLogin.
 

## Prerequisites
- 
Administration permissions for OneLogin.

## Procedure
- 
Navigate to the OneLogin admin dashboard, hover over Applications in the navigation bar, then click on Applications in the dropdown
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765987/1b2132786f1bd6b1ef07082e3b5a/20995528457364?expires=1794967200&signature=2c522c17f4eef00518f05389af911bc62f3976a5ac67f1ef09debaf6014b38ab&req=dSUmEM54mIhXXvMW1HO4zY501jxKf8CK%2F88QH0mPQEgxRfxgmt6YbznfrOZa%0AJTQOu9F%2By9pseNpt9hs%3D%0A>
- 
On Applications page, click on Add App
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765977/dfadbeae91291e95a7c702bccba1/20995528457876?expires=1794967200&signature=623993bbc39b42905143dfaf213f8ea7a47430b3f9a1d7c11bcb340ee697a74c&req=dSUmEM54mIhYXvMW1HO4zZMy23WGyi7X2dqcBosymf2gGLZuEQh3gMFQe9%2Fp%0AH2xUZril%2BicBBG9bXwU%3D%0A>
- 
On Find Applications page, enter SAML Custom Connector (Advanced) into search bar and select
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765976/9e7c5aeb550573e21cb8ff55ff24/20995528458772?expires=1794967200&signature=f88913448b69c5e7903cfb863da1a1195218c4c2dec6483e8c8f6ff4453d0db3&req=dSUmEM54mIhYX%2FMW1HO4zVCi4DZhLyBtma653xyvWD3ByDYN7F87lJCf10ws%0AW5r7seUG9J%2FZj%2FMLUL0%3D%0A>
- 
Update display name to easily identify as the Vanta connector.
- 
Set the Audience (entityId) tohttps://www.vanta.com/sso/saml
- 
Navigate back to Vanta Integrations page, and connect OneLogin. Add your OneLogin API credentials by following this <https://developers.onelogin.com/api-docs/1/getting-started/working-with-api-credentials> article.
- 
The API Credentials must have ReadAll permissions. (We will not write any data, but require the scope for checking user MFA, see this documentation. <https://developers.onelogin.com/api-docs/2/multi-factor-authentication/enrolled-factors>)
- 
Copy in the display name of the app you created in OneLogin.
- 
Copy the ACS (Consumer) URL from the Vanta connection page into your OneLogin Vanta Application.
- 
Set the ACS (Consumer) URL Validator tohttps://vanta.com/auth/login/onelogin/callback?domainId=number
- 
Save the OneLogin credentials within Vanta!
- 
Don’t forget to add users to the Vanta Application within OneLogin. Once this is done, OneLogin users will be able to use OneLogin to sign in to Vanta.

## Images

- [image 01] ../../images/ux/integrations/setting-up-single-sign-on-sso-with-onelogin--01.png
- [image 02] ../../images/integrations/onelogin/setting-up-single-sign-on-sso-with-onelogin--02.png
- [image 03] ../../images/integrations/onelogin/setting-up-single-sign-on-sso-with-onelogin--03.png
- [image 04] ../../images/integrations/onelogin/setting-up-single-sign-on-sso-with-onelogin--04.png
