# Connecting Vanta and DocuSign

Source: https://help.vanta.com/en/articles/11345749-connecting-vanta-and-docusign
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

DocuSign connects to Vanta using OAuth2. Vanta makes API calls to DocuSign using the credentials of the user who authorizes the connection.
 

## Prerequisites
- 
'DocuSign Administrator' Permissions <https://support.docusign.com/s/document-item?language=en_US&rsc_301&bundleId=rrf1583359212854&topicId=dpo1583359153647.html&_LANG=enus>
- 
These permissions must remain in place after setup. Vanta authenticates as the specific user who authorizes the connection, so removing that user's DocuSign Administrator permissions later will cause the integration to fail. 
⚠️ Note: The connecting user's DocuSign permissions must stay in place
- 
Vanta connects using an OAuth token tied to the user who authorizes the connection and to that user's permissions in DocuSign — not to their role in Vanta. Every DocuSign API call Vanta makes runs under that token.
- 
If that user's DocuSign Administrator permissions are downgraded or removed after setup, Vanta's calls to DocuSign will begin to fail. You may see: "Vanta failed to access some information in DocuSign due to insufficient permissions. Please reconnect the DocuSign integration to fix this." NDA envelopes sent from your Trust Center may also stop being delivered.
- 
The failure may not appear immediately. Removing DocuSign Administrator permissions does not invalidate the connection itself, so the integration can continue to appear connected until Vanta's next attempt to read organization or user data.
- 
Granting DocuSign Administrator permissions temporarily to complete the connection and then revoking them is not supported. Keep a user with DocuSign Administrator permissions connected on an ongoing basis.
- 
To fix a failing connection: reconnect the integration using a user who has DocuSign Administrator permissions. Reconnecting replaces the stored credentials, and both user syncing and NDA sending resume under the new user.
 
- 
Familiarity on your DocuSign account type;
- 
Organization: manages multiple DocuSign business accounts under DocuSign Admin (requires DocuSign Enterprise Pro with the Organization Management Add-On <https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=cvl1583359130386.html&_LANG=enus>)
- 
Individual: A single DocuSign eSignature account (DocuSign Standard & Business Pro plans)

## Procedure
- 
In Vanta, go to the Integrations page, click Add integration, and search for DocuSign. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect.
- 
Choose how you would like to connect DocuSign:
​
- 
Organization: Use this option if you collectively manage multiple business accounts using 'DocuSign Admin for Organization Management'. 
This will connect via OAuth, redirecting you to the DocuSign login page
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762909/a47a346dd607a7918d510c394d80/17990341271700?expires=1794967200&signature=d07ab55cd5f185a52a0d984f9881b49794b79bfa76c128ce5e699857c5c07795&req=dSUmEM54n4hfUPMW1HO4zSPCgoaNS5wmcjGtLHOQH8%2FlpMy4H8UsVmCrFjQb%0AI29qAypX8Zeh1Tg%2BXuY%3D%0A>
- 
 
- 
Individual Accounts: Use this option if you manage a single DocuSign eSignature account.
- 
This requires your DocuSign Account Base URL and DocuSign API Account ID. These can be obtained by navigating to your DocuSign eSignature pane, and clicking into the Settings tab. Then, click on Integrations - Apps and Keys
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762908/287518588ecae2712aa349024a2f/17990380349460?expires=1794967200&signature=3b52c724e43bb0cec7ceb1eb68f69bce55bf5382b7e43240756ecaf217007a39&req=dSUmEM54n4hfUfMW1HO4zexnfwlk1o8Bia7UTOiyp46v95Khh0Wx2hRTJYeT%0AHWM%2FahsP1zcpNqV9828%3D%0A>
- 
When redirected to the DocuSign login page, Enter your DocuSign Account Email and password
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1620564808/560ccb6cb7a28f911a8d0ea0f0ef/docusign+login+page.png?expires=1794967200&signature=578aa5375587616eae094fded9da90054b0ba4ac0b27bbcf7c27f1619c81af6f&req=dSYlFsx4mYlfUfMW1HO4zVHE6RrmQvjsoP93ZWWrxh2cze%2F6ok6TWpKryxV9%0Ay6r1%0A>
- 
DocuSign is linked
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1620571224/27a82730e2044f6a6eca9a99830e/connected+docusign+integrations+page.png?expires=1794967200&signature=596422f4e612c1d3485f5adb70f282e19a7800c15f618f89f6d177565e1f5eed&req=dSYlFsx5nINdXfMW1HO4zccfcMhN5t4PvS3g5Gz3mLqPkaZ132MgsJW1E7Te%0AFiMJG%2FxCows5uQTdlfw%3D%0A>
 

## Keep in Mind
- 
Connection Error: "We couldn't find any users on your account, this is probably caused by an error in your credentials. Please unlink and relink your DocuSign integration."
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762924/0558bb55ebbd05f8d55aa1331571/18258563779604?expires=1794967200&signature=e4a8c0da24517a6cc5349cab003bac15b4048569718b1e2c68a6ecba86aaaac3&req=dSUmEM54n4hdXfMW1HO4zV6PDj4dVBBzr6UYJLnVWs%2BxpzzVfahj7suPoTi6%0AL9h6TqDQHLK6%2BvqNVW4%3D%0A>
- 
This can occur if 'Organizations' is selected as the connection method and no organizations are set up in your DocuSign account.
- 
Please try reconnecting by selecting the 'Individual Accounts' connection method. If connection errors persist, please reach out to [email protected] for further assistance.
- 
If on a Enterprise Plan, select 'Individual Accounts' as it's more stable, its a known issue if 'Organization' is selected.
- 
Connection Error: "DocuSign admin permissions are required to connect this integration. Please reconnect the DocuSign integration with a DocuSign administrator account."
- 
This appears when the connecting user does not have DocuSign Administrator permissions. Reconnect using an account that does.

## Images

- [image 01] ../../images/integrations/docusign/connecting-vanta-and-docusign--01.png
- [image 02] ../../images/integrations/docusign/connecting-vanta-and-docusign--02.png
- [image 03] ../../images/integrations/docusign/connecting-vanta-and-docusign--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-and-docusign--04.png
- [image 05] ../../images/integrations/docusign/connecting-vanta-and-docusign--05.png
