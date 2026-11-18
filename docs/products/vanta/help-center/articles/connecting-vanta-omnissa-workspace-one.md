# Connecting Vanta & Omnissa Workspace One

Source: https://help.vanta.com/en/articles/11345780-connecting-vanta-omnissa-workspace-one
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

We are expanding our MDM integrations to now include Omnissa Workspace One product. Admins can configure Vanta to fetch data from customers’ Workspace One accounts.

## Prerequisites
Before connecting Workspace One, please create an OAuth client for your account by following this guide <https://docs.omnissa.com/bundle/WorkspaceONE-UEM-Console-BasicsV2406/page/UsingUEMFunctionalityWithRESTAPI.html>.
Connecting Omnissa Workspace One to Vanta
- 
In Vanta:
- 
In Vanta, go to the Integrations page, click Add integration, and search for Omnissa. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1698441294/6ee25abace4044d157253c4e573d/Screenshot+2025-08-28+at+5_49_33%E2%80%AFPM.png?expires=1794967200&signature=a13b51cde16c0887be22f110cbed1e3fb20b756d777e5708ffac0260d4ddce5a&req=dSYuHs16nINWXfMW1HO4zaiUI5LPGSheUjQgrMYIxGmFQ1fZH4owsJl57Y3V%0AcdTM8C8MCF7cctCHNjA%3D%0A>
- 
You will need to create an OAuth client ID and secret following the instructions in this guide <https://docs.omnissa.com/bundle/WorkspaceONE-UEM-Console-BasicsV2406/page/UsingUEMFunctionalityWithRESTAPI.html#create_an_oauth_client_to_use_for_api_commands_saas>. 
The role used for the OAuth client must have read access to the following:
- 
REST > Devices 
- 
REST > Profiles 
- 
REST > Users
- 
Device Details > Security Info > Device View Security Info
- 
Add the client ID and Secret in the connection module. You must also provide your Workspace One UEM domain. This will typically be in a similar format to "cnxxxx.awmdm.com".
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1698437990/94d175a72e193d170135fbf0e513/Screenshot+2025-08-28+at+5_47_06%E2%80%AFPM.png?expires=1794967200&signature=20ee837a36cffbc3290a3ea1413386404f44f6ae687a336b26e262933897b9f4&req=dSYuHs19mohWWfMW1HO4zeLgUfDiVoTRWOJcsZUNfHcI%2FBkcHinzfU3j%2B99f%0AbtHrTgrk9A9pAiPbjEc%3D%0A>
- 
In this connection flow, you will be prompted to configure the time to ensure security settings are set up for new devices. Vanta will not alert newly registered computers until the time entered has passed. This is set to 3 hours by default.
Note: If multiple MDM integrations are connected, any change made here to the computer setup time will be applied to all MDM integrations.
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1698438575/bdbf57acb54755d774635424a121/Screenshot+2025-08-28+at+5_47_47%E2%80%AFPM.png?expires=1794967200&signature=85eae3950ccd9656ea705cd404d1a12e6acabdf4392d404892dc6b718e4365d7&req=dSYuHs19lYRYXPMW1HO4zYw2ORjgoqhD2mRffyh73GheFmKUOgSvb2tHSVPS%0AZbIfqWOWllUTzRcPNwc%3D%0A>
 

## Connecting Screenlock Data to Vanta
- 
Omnissa Workspace One does not pass screen lock data through their API. To verify screen-lock data in Vanta, admins need to create a passcode profile in their Workspace One account and apply it to all their computers.
- 
Please see Omnissa Workspace One Documentation <https://docs.omnissa.com/bundle/WS1UEMMobileContentManagementV2306/page/SDKConfigurations.html?hWord=N4IghgNiBcIA5gM6IMYHsAmBTEBfIA> for further details
​
​

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-omnissa-workspace-one--01.png
- [image 02] ../../images/integrations/omnissa-workspace-one/connecting-vanta-omnissa-workspace-one--02.png
- [image 03] ../../images/integrations/omnissa-workspace-one/connecting-vanta-omnissa-workspace-one--03.png
