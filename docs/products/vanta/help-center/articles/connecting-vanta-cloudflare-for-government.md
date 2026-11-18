# Connecting Vanta & Cloudflare for Government

Source: https://help.vanta.com/en/articles/13346310-connecting-vanta-cloudflare-for-government
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

The read-only Cloudflare integration fetches your cloud and security resources directly to Vanta, allowing you to quickly demonstrate that your company's networks are secure and monitored.
 
To find the Cloudflare for Government integration in Vanta:
- 
In Vanta, go to the Integrations page, click Add integration, and search for Cloudflare. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Choose Cloudflare for Government if your organization uses Cloudflare for government, as opposed to the standard Cloudflare integration. 
 

## Prerequisites
- 
Permissions to create API tokens in Cloudflare for Government
- 
Admin permissions in Vanta
- 
Vanta currently supports user‑owned API tokens only
​
 

## Procedure
- 
From your Cloudflare for Government dashboard, navigate to "My Profile" by clicking on the user icon on the top right of the page.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1922457740/4dd5fe575fdfeae1430c385d127a/15349878953236?expires=1794967200&signature=f735349dd81cbe2b39b09fc89e40f4c0e5bcc8fa176d51e4be9e883f378a2e09&req=dSklFM17moZbWfMW1HO4zcXl5%2BFKvxlFWh%2Fz59oDuPS6v1Hz607%2Bq9eFbiOo%0A5xRRmab6A58GsCGwkAw%3D%0A>
- 
Click on API tokens <https://dash.cloudflare.com/profile/api-tokens> from the left hand menu, then click on Create Token.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1922457741/ecd173c5aae5c7c33f92872a8ab2/15349881276820?expires=1794967200&signature=cea5d876a092fccba1e0b9170d441726880db57819f6b0941e46a2484edac214&req=dSklFM17moZbWPMW1HO4zT5srOub6vCi8zXwi6iGTmTs%2B2%2BF%2BmmzLXt2h2tn%0AFTnaAHtQ42cHPZuYZ1M%3D%0A>
- 
Click on 'Use template' next to the Read all resource's option​.
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763194/13bd69467ebd2743ebfdcaf83bc7/15349883482004?expires=1794967200&signature=89e72fe1a044cd3c611e548a2b40002b245d8bbf2906e5ac16d0d4ddd413c16f&req=dSUmEM54noBWXfMW1HO4zR7xJXDrPMsHPLM9w0WypeV%2Fh9i6890XW6YcivFH%0AMuAA%0A>
 
- 
Edit the Token Name field to something easy to identify, for example, 'VantaToken'.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1922457743/dd8f17b042e12069e672ac279427/15349918081428?expires=1794967200&signature=a395a12ef8e9deacf8a7e833fc5c56ed3c10e5940de73b577cfbce17b6621506&req=dSklFM17moZbWvMW1HO4zY2KclOdwcPI60oePkiZwamN1%2B%2BoiObZiiY2lNLp%0A58rJHpq90qYZg2izaPQ%3D%0A>
- 
Scroll to the bottom of the page, leaving all the default permissions as they are. Changing any of these permissions may result in the connection failing. 
​
- 
Click on Continue to summary. You should be shown the API token name, and a summary of all the permission.
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763204/0cbb4711e32a61691a1e3f9ec558/15349919099796?expires=1794967200&signature=98d618d2aef5c6296aacf8402b86b4fc3fdc52c0aa0e5f2ab77da1ff131bca17&req=dSUmEM54noNfXfMW1HO4zR4XtOGLEqjVFNBxWcUBbYyKnWVfENkBG%2BlomL9j%0A7BGm%0A>
 
- 
Click on Create Token. Once the token is generated, please ensure to copy the token before navigating away from the page, as there will be no way to retrieve this once you exit the page.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1922457744/f266bc75b4ad471489d416d77833/15349970867988?expires=1794967200&signature=e9e73e2af682a2ed03f67f793ed805cd2ba8d4799b276e0a91a18780622bb922&req=dSklFM17moZbXfMW1HO4zW8v3w2gBPPNLyL3hxKqR9tZzw%2FXayiJFKDI0nl6%0AJopWkFaznn%2FLhwrQM0k%3D%0A>
- 
Navigate back to Vanta, and on the Cloudflare for Government connection page, click 'Save API Token details'. Enter the API Token Name and paste the copied API Token.
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763217/7ce5d59abebb7255885a01aba17e/14452086426132?expires=1794967200&signature=faf94bb4e84a358e696f7d6dd44c2a9f3ab5f84930ff834b182790abda3e0479&req=dSUmEM54noNeXvMW1HO4zY%2Fim5aA0BFkNrpaFJ8B5UOA2MML8Ga3kHfxxI6e%0A4Y2u%0A>
​
- 
Click Done. Cloudflare for Government should now be connected!
 

## Troubleshooting
If you receive an "Token Returned Unauthorized" error Ensure that you're using an user‑owned API token, as Account‑owned tokens are not supported at this time.
 
Vanta supports both commercial Cloudflare and Cloudflare for Government.
- 
Choose Cloudflare if your organization uses a standard, commercial Cloudflare account. Please follow this article <https://help.vanta.com/en/articles/11345752-connecting-vanta-cloudflare> for help connecting the commercial Cloudflare integration.
- 
Choose Cloudflare for Government if your organization uses Cloudflare for government. Continue following this guide to connect to Cloudflare for Government in Vanta.
- 
Vanta behaves the same for both, but they connect to different tenancies. Your API token, log destination, and admin/onboarding live in the same tenancy, so using the wrong tile will cause the connection or log collection to fail. 
​​

## Images

- [image 01] ../../images/integrations/cloudflare-for-government/connecting-vanta-cloudflare-for-government--01.png
- [image 02] ../../images/integrations/cloudflare-for-government/connecting-vanta-cloudflare-for-government--02.png
- [image 03] ../../images/integrations/cloudflare-for-government/connecting-vanta-cloudflare-for-government--03.png
- [image 04] ../../images/integrations/cloudflare-for-government/connecting-vanta-cloudflare-for-government--04.png
- [image 05] ../../images/integrations/cloudflare-for-government/connecting-vanta-cloudflare-for-government--05.png
- [image 06] ../../images/integrations/cloudflare-for-government/connecting-vanta-cloudflare-for-government--06.png
- [image 07] ../../images/ux/integrations/connecting-vanta-cloudflare-for-government--07.png
