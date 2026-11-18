# Connecting Vanta & Cloudflare

Source: https://help.vanta.com/en/articles/11345752-connecting-vanta-cloudflare
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

The read-only Cloudflare integration fetches your cloud and security resources directly to Vanta, allowing you to quickly demonstrate that your company's networks are secure and monitored.
 
To find the Cloudflare integration in Vanta:
- 
To connect, go to the Integrations page and search for Cloudflare. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Choose Cloudflare if your organization uses a standard, commercial Cloudflare account, as opposed to Cloudflare for Government <https://help.vanta.com/en/articles/13346310-connecting-vanta-cloudflare-for-government>.
- 
Click Connect. 
 

## Prerequisites
- 
Permissions to create API tokens in Cloudflare
- 
Admin permissions in Vanta
- 
Vanta currently supports user‑owned API tokens only
​

## Procedure
- 
From your Cloudflare dashboard, navigate to "My Profile" by clicking on the user icon on the top right of the page.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763191/4a8ceb34c5c87665b07998745ce2/15349878953236?expires=1794967200&signature=17dd12d345d194442b20829b276dde725bcd7e321d3a53952fe3b48abbeba617&req=dSUmEM54noBWWPMW1HO4zapkUeKiwKa7DgB46zpHvwAyHOpJzk2wiG0F91R7%0A5bCLPbjbqT5F0u79DFw%3D%0A>
- 
Click on API tokens <https://dash.cloudflare.com/profile/api-tokens> from the left hand menu, then click on Create Token.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763192/4261c88a322a240e2a19e65ecbca/15349881276820?expires=1794967200&signature=b8f3d4613f8df3885507a2616c9341f9b0600d52ab866254246bc2911ae1c0d0&req=dSUmEM54noBWW%2FMW1HO4zaE6n404c9w4EGg3i0WkIKyMhSqqUxfk3Fh%2B96wh%0AjRkdiakRNBTnRwthTKk%3D%0A>
- 
Click on 'Use template' next to the Read all resource's option.
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763194/13bd69467ebd2743ebfdcaf83bc7/15349883482004?expires=1794967200&signature=89e72fe1a044cd3c611e548a2b40002b245d8bbf2906e5ac16d0d4ddd413c16f&req=dSUmEM54noBWXfMW1HO4zR7xJXDrPMsHPLM9w0WypeV%2Fh9i6890XW6YcivFH%0AMuAA%0A>
 
- 
Edit the Token Name field to something easy to identify, for example, 'VantaToken'.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763189/35ff0d81636c2faab5e0e6ce0d47/15349918081428?expires=1794967200&signature=38dae3bf1d0cc62d729b7824edafb54feffa0bba2e0a5994a4e384be2fdf507c&req=dSUmEM54noBXUPMW1HO4zdV6lX6G0DCY3yMMzjI7HPoXCK3JB5FNDMdn8DSQ%0AV0RebuTf%2FCRpB1rHjHs%3D%0A>
- 
Scroll down to the Permissions list and leave all the default permissions as they are. Changing any of these permissions may result in the connection failing.
 
- 
Scroll down to the Account Resources and Zone Resources sections, below the permissions list.
- 
If your Cloudflare login only has access to a single account, you can leave these on their default settings.
- 
If your Cloudflare login has access to multiple accounts, do not leave these set to All accounts because this can cause the connection to fail with 403 errors on specific endpoints, even when the token's permissions are otherwise correct.
- 
Under Account Resources, select Include > [your specific Cloudflare account]. To connect more than one account, add an additional Account Resources row for each account.
- 
Under Zone Resources, select Include > All zones from an account > [the same account], repeating for each account added above.
- 
If you're connecting multiple accounts this way, you'll choose which of them to sync from Vanta's account/zone selection during setup.
​​​
- 
Click on Continue to summary. You should be shown the API token name, and a summary of all the permission.
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763204/0cbb4711e32a61691a1e3f9ec558/15349919099796?expires=1794967200&signature=98d618d2aef5c6296aacf8402b86b4fc3fdc52c0aa0e5f2ab77da1ff131bca17&req=dSUmEM54noNfXfMW1HO4zR4XtOGLEqjVFNBxWcUBbYyKnWVfENkBG%2BlomL9j%0A7BGm%0A>
 
- 
Click on Create Token. Once the token is generated, please ensure to copy the token before navigating away from the page, as there will be no way to retrieve this once you exit the page.​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763208/cf77b51d9b7ae4502fb3b1dcf775/15349970867988?expires=1794967200&signature=c982d52c3164a5fe9fe1325cedbc7c8a66a5660f2b90a81ebfbbe4f75b964e97&req=dSUmEM54noNfUfMW1HO4zbtFC%2F9Xgi0Lec0PF5n4vSH6SQDtdhbub3TbhsuQ%0ACHU3ITkaIdVYcZWN5eQ%3D%0A>
- 
Navigate back to Vanta, and on the Cloudflare connection page, click 'Save API Token details'. Enter the API Token Name and paste the copied API Token.
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763217/7ce5d59abebb7255885a01aba17e/14452086426132?expires=1794967200&signature=faf94bb4e84a358e696f7d6dd44c2a9f3ab5f84930ff834b182790abda3e0479&req=dSUmEM54noNeXvMW1HO4zY%2Fim5aA0BFkNrpaFJ8B5UOA2MML8Ga3kHfxxI6e%0A4Y2u%0A>
​
- 
Click Done. Cloudflare should now be connected!
 

## Troubleshooting
If you receive a 403 Unauthorized error on specific resources (for example, SSL/TLS settings) even though your token uses the "Read all resources" template and its permissions look correct, check whether your Cloudflare login has access to multiple accounts. If so, the token's Account Resources and Zone Resources need to be explicitly scoped to the specific account you're connecting — see the steps above.
 
Vanta supports both commercial Cloudflare and Cloudflare for Government.
- 
Choose Cloudflare if your organization uses a standard, commercial Cloudflare account. 
- 
Choose Cloudflare for Government if your organization uses Cloudflare for government. Please follow this article <https://help.vanta.com/en/articles/13346310-connecting-vanta-cloudflare-for-government> for help connecting the commercial Cloudflare integration.
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
