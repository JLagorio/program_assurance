# Integrating Multiple Identity Providers

Source: https://help.vanta.com/en/articles/11345659-integrating-multiple-identity-providers
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Vanta's integrations are at the core of its functionality. Vanta integrates with multiple identity providers (IdPs) to make managing security for users from various IdPs, including employee onboarding, offboarding & ongoing tasks, a seamless process with Vanta.
- 
From the left-hand navigation panel, select Integrations
- 
Choose Available
- 
Select Identity Provider from the service type list
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766083/dc282a694d17850ee675ed822d58/27502792637204?expires=1794967200&signature=2ceac3da711f6b617a0a261ea641ec65ca2e2a8c6aca98f4cf9855f78d802dfa&req=dSUmEM54m4FXWvMW1HO4zTljOLxYPfOWmoKGWWrJYpO%2BC7Q%2BwQb9cA0unnpS%0AZ3H1PXjYhdZ5Yy5%2BiCw%3D%0A>
 
- 
Select Connect and follow the prompts to establish the integration for any IdPs you would like to leverage within Vanta
- 
Once multiple IdPs has been connected, you will need to set the precedence
- 
Open your connected integrations, find the IdP, and select Manage > Set Precedence
- 
Setting the precedence will determine which identity provider will take precedence for a users' scope, IdP groups, employment status and SSO login methods.
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766084/818ca259805631de24689a666255/13895364393748?expires=1794967200&signature=cdcaef9d61b0677da7a230596246eae8215f67342c5726fc53f2e0750ce67a46&req=dSUmEM54m4FXXfMW1HO4zbDtZuuCHSyjf2GknyXjSCMffuJLGZz4LmqHW3gy%0A7m8HyhjMQ1gC%2Bxtm7uY%3D%0A>
 
- 
Select your primary, secondary (etc.) identity provider from the pop-up modal
- 
Select Save
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766086/a0dc0f217d74fc48a9d594a2a69b/13895463392660?expires=1794967200&signature=6d70fd41395243a7482382cbaa3057acf0644b5c7ecb9b670eee0ed87b8108a4&req=dSUmEM54m4FXX%2FMW1HO4zXFxHVvaU8D2FJj6LALpTiPOJwvVqNlETXy2NnKq%0AedhtVUgg75c7R4RJE9I%3D%0A>
 
Multiple users across identity provider instances with the same email: We will only pull in one of the two IdP users when users with the same email are present across two different connected IdP accounts. The other user will be marked with a fetch error indicating to the admin that they can not be fetched into Vanta.
To verify that your IdP integration is complete, navigate to the "People" page in Vanta. If users are visible on this page, it indicates that user data has been successfully fetched from the IdP.
 

## Existing Customers with Google Workspace for Vendor Discovery
- 
To start pulling in data for Multiple IdPs, you'll need to reconnect your Google Workspace Integration <https://help.vanta.com/en/articles/11345761>
- 
Locate your Google Workspace Integration
- 
Select Manage, and then Edit and reconnect your integration.

## Images

- [image 01] ../../images/ux/integrations/integrating-multiple-identity-providers--01.png
- [image 02] ../../images/ux/integrations/integrating-multiple-identity-providers--02.png
- [image 03] ../../images/integrations/multiple-identity-providers/integrating-multiple-identity-providers--03.png
