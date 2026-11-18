# Connect Vanta & Keeper

Source: https://help.vanta.com/en/articles/11707770-connect-vanta-keeper
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

## About this article
This integration pulls users and groups using the SCIM protocol from Keeper to help you track and audit user access to Keeper.
 
Estimated setup time: Less than 10 minutes
 

## How it works
Keeper is a password and privileged access management tool. We use the SCIM protocol <https://docs.keeper.io/en/enterprise-guide/user-and-team-provisioning/automated-provisioning-with-scim> to pull users and groups every hour from Keeper. The integration only fetches data; it does not update any records in Keeper. 
 
Note: We don't currently pull user roles from Keeper. This functionality is not currently available in the Keeper API.
 

## Use Cases
Connecting Keeper will enable you to:
- 
Track and manage Keeper user access
- 
Ensure Keeper accounts are deprovisioned when personnel leaves
 

## Overview
To connect Keeper to Vanta, you will need to set up the SCIM user provisioning method in Keeper <https://docs.keeper.io/en/enterprise-guide/user-and-team-provisioning/azure-ad-provisioning-scim#configuration-steps> for the node you'd like to sync users from. If you only have the root node, you’ll need to create a sub-node, and move the users you’d like to sync with Vanta to it.
 
As Keeper only syncs to Vanta the users in the Keeper node where SCIM is set up, your users will need to be migrated to this node for them to show up in Vanta. Keep in mind that Keeper doesn’t allow creating user provisioning methods in the root node.
 

## Requirements
- 
Keeper administrator account
- 
Keeper Enterprise Password Manager or Privileged Access Manager for SCIM support
 

## Install the integration
Log in to Keeper with an administrator account.
- 
Go to the Admin section using the navigation bar on the left side of the page.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1626199743/cc6a8a12bc21032bc94e2747f230/AD_4nXd4rS9ahjBwlgnkvU31DyGDdptzUkavn8oTh9hVgy1I4gKxaJEkFVJ_E3MZAq9zK3K1hq68lX2TQMN2FaElZFjxupiyV06Ky9xVmtzfSDE4iFvY8ag1O0YI15zNbmHlHsTtDN9Z?expires=1794967200&signature=8906bb31d6ee7911a00df66c3d7b104c377cabf0f83a5afce2c5bf536445d293&req=dSYlEMh3lIZbWvMW1HO4zbN%2B6LmPpfCW0Mrfv2qPVNQQs5%2Fb3whJ9jsTY6AT%0AurBnk8p6h%2Bp1c%2F3r%2BQ8%3D%0A>
 
- 
Select from the Node dropdown the Node you'd like to sync with Vanta. If you only have the root node, click the three dots next to the dropdown to add a new node. You’ll need to move your users to the new node for them to show up at Vanta.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1626199742/81761fadff562b8c9a250f355d5e/AD_4nXc05ydgzoJpD3NQwlzRx-gm4g3l7_DaF9T4M2-XyR0FnLJJ33Jvn4w2urymVovTXsU7h3376JYY5oCQ4eTOhNMLox7aGiBjtcja13htMvHsiR8rcDVWn_SwpCA8jDRkBaOhbPhs?expires=1794967200&signature=a8b0c5361411cf97a2899cfc79f1eb3fff5c7c254d950c237463c0899f1a3615&req=dSYlEMh3lIZbW%2FMW1HO4zbrjoJn%2B0goAf4ppEKiNHKY%2Bj6i6n6x0oQ9ThA%2Bl%0AThX%2FEqkcLe6%2FEKruww4%3D%0A>
 
- 
Once the right node is selected, go to the Provisioning tab, and click the Add Method button on the right side of the page.
- 
From the list, select SCIM (System for Cross-Domain Identity Management) and click Next. and copy the Keeper SCIM URL.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1626199747/c80cfda2d51b628a27c8eafe5e0f/AD_4nXe90vazlIvcd3w4PGQM4MzmPFrXXbkl0qZWydUVA5nm-0XPIydGFsEhtLQWJoPWYErOY4UbRlwLDEsVOnL_fiZigmzMZ3HLJLsBkQnmBaR5rec8rhoKVVXY882RG6ABtcDLVY4LhQ?expires=1794967200&signature=c9ae9c57df925a710bf9b8735c48683f14b93e474948a7f20001ef1a1c91cfe3&req=dSYlEMh3lIZbXvMW1HO4zaHa7sERHZtteU1NSBwVluBy4II9%2BjopCGVIdiS0%0AdMWCj1iQyLYgMg3UYgQ%3D%0A>
 
- 
In Vanta, go to the Integrations page, click Add integration, and search for Keeper. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>. Click Connect, and paste the URL in the Keeper SCIM URL field.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1626199745/a4f6371815ae8520c8135bb6aee7/AD_4nXeGjMqENeDuaZl6wO-1rp0Ha96T57alDUfLt7PrGeF7U8teT-uaMBnVuGbLLsbm9Wt5aiBxZVGfp2sbmTOauT9Vpen9QNXsdW2bYqsUsPh67BTIzPTj8NhxfuSb4qUYiOnYykWE?expires=1794967200&signature=fa1e080e3eac045a7d01e93a7fcd0065cc15786ca07e5a1a8fc5bfafb89aefed&req=dSYlEMh3lIZbXPMW1HO4zawvnMua6hm99pl%2BzXpTDEPJpcvIfGZRtMTg%2BtRs%0AGlwq4TmfwH2kNcHlTGo%3D%0A>
 
- 
Go back to Keeper, and click on Generate and then click the clipboard to copy the token value. Finally click Next to save your credentials in Keeper. 
- 
Finally go back to the Vanta, and paste the token in the SCIM bearer token field and click Validate and store credentials.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1626199746/afe5540d950a0ef135f70c1bf1c8/AD_4nXfuM_sm6v68H5wYjJTo5z07aDHRUivcED1BpttzcpVIL5vPGinTLt2GxLXJewgEL3C1KeBsmqcVs99U6W4H7BXSae-AGeEKwQZWYtbqqWbJDMoCpZfNKuvSECYzGCNQtP9H_Lyb?expires=1794967200&signature=2fd68f9d357541e131fa95dbc3fd26e5c47fc5c6b15c8886a2e9e758de337006&req=dSYlEMh3lIZbX%2FMW1HO4zeytSIqeCrliwXcd8qN10ikLy06MMyURoEoc1CM7%0AQBw2QaZBbyWQ3mN0VxY%3D%0A>
 

## Permissions
Vanta accesses the following data from your Keeper password manager:
 
Vanta will be able to read:
- 
Data about your users
- 
Data about your user details
- 
Data about your user groups
Vanta will be able to write:
- 
Nothing

## Images

- [image 01] ../../images/integrations/keeper/connect-vanta-keeper--01.png
- [image 02] ../../images/integrations/keeper/connect-vanta-keeper--02.png
- [image 03] ../../images/integrations/keeper/connect-vanta-keeper--03.png
- [image 04] ../../images/ux/integrations/connect-vanta-keeper--04.png
- [image 05] ../../images/ux/integrations/connect-vanta-keeper--05.png
