# Resolving the Vanta couldn't query a few accounts from Google Workspace due to insufficient permissions. To improve the accuracy of this list, ask an admin to reconnect Google Workspace.

Source: https://help.vanta.com/en/articles/11345651-resolving-the-vanta-couldn-t-query-a-few-accounts-from-google-workspace-due-to-insufficient-permissions-to-improve-the-accuracy-of-this-list-ask-an-admin-to-reconnect-google-workspace
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

If your Google Workspace integration has no errors on the Integrations Page <https://app.vanta.com/integrations?servicecategory=IDENTITY_PROVIDER>:
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1543753773/c28fb3dbfc981d2ad237b54b619b/Screenshot+2025-05-27+at+4_43_33%E2%80%AFPM.png?expires=1794967200&signature=217569d1fe382c455ab3fd7a3fc53e01bd7795088fc7a1dd2c58052e03597818&req=dSUjFc57noZYWvMW1HO4zf7zIFolUZ0n4tHnITcIIzU28XwJ7H9ZTGkgE6n4%0AhdKtfAToj1wCdq%2FiWVE%3D%0A>
 
But you are getting the 'Vanta couldn't query a few accounts from Google Workspace due to insufficient permissions. To improve the accuracy of this list, ask an admin to reconnect Google Workspace.' on the Vendor Discover page. prompting you to re-connect:
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758611/baee2708de401d5a1537aaa827bf/25894481476244?expires=1794967200&signature=9a8e6b84fc434d6b6946c38b7ede1bd888bffeb6a2996309e74224bb170376a3&req=dSUmEM57lYdeWPMW1HO4zT%2B69bUDH%2B%2FGxA56r1LHtjuVyEkuXZIDhFPQ9Fja%0APSx%2FyA5tFVNckaavS9I%3D%0A>
 
This is due to the integration missing the following scope https://developers.google.com/admin-sdk/directory/reference/rest/v1/tokens/list <https://developers.google.com/admin-sdk/directory/reference/rest/v1/tokens/list> and there is not an easy way to grant this to the Vanta application from Google workspace after connecting.
 

## Resolution
The solution would be to re-connect the Google Workspace integration. You can do this by:
- 
Going to the integration page <https://app.vanta.com/integrations?servicecategory=IDENTITY_PROVIDER>, and then clicking manage --> edit on Google Workspace:
​ 
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1543756568/ac6ec76d05d3adcd14fa9272e7fa/Screenshot+2025-05-27+at+4_44_33%E2%80%AFPM.png?expires=1794967200&signature=5d72dca65764b64bef62e9f6ab262a2a8e6b9f14e1381691ee239ccd25884446&req=dSUjFc57m4RZUfMW1HO4zalZsAHOOIUhDzDXVSdcqQ00gFujmwdLW86RFkQQ%0AbB4g%0A>
 
 
- 
From there click the purple add account button:
​
- 
On the Connected Google Workspace accounts menu that appears:
​ 
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1543759194/07ef2470ddce7f3901fd7d624b47/Screenshot+2025-05-27+at+4_46_17%E2%80%AFPM.png?expires=1794967200&signature=42d9e6d429d6326ef43a174b3cf2196f9b7bc656f33a0dceff480fa6109477e3&req=dSUjFc57lIBWXfMW1HO4zQKEOXzE7w3RVWoqrPUUWWFKGIi5AIW%2FuCAo%2FtgK%0ATIhMG6qPnYCm8DhSCmg%3D%0A>

From here follow all of the prompts and ensure you are allowing the following permissions, if you have a different permission set, write into Vanta support to let us know:
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758631/6e8c8b4f716b5f47b528ed23d16c/upload_15692255373890073830?expires=1794967200&signature=3763b73a4f6658ff72ba52501de06a7b0776a3f41f8a51eaab432bad86510569&req=dSUmEM57lYdcWPMW1HO4zYQn5ryIDHIpNfn27%2BVWU3SIfEQGjooLZwIlu9fc%0AoHJHDh%2Fez3p%2FdP2Jcqo%3D%0A>
 
 

## Common Issues
- 
If you encounter issues re-connecting ensure you are using an account that is a Super Admin in Google Workspace. And ensure you have trusted Vanta's Application in Google Workspace <https://help.vanta.com/en/articles/11345944-trusting-vanta-s-application-in-google-workspace>.
- 
If you are getting the Google Workspace Error: 400: admin_policy-enforcederror please follow the steps linked here. <https://help.vanta.com/en/articles/11346061>

## Images

- [image 01] ../../images/ux/integrations/resolving-the-vanta-couldn-t-query-a-few-accounts-from-google-workspace-due-to-insufficient-permissions-to-improve-the-accuracy-of-this-list-ask-an-admin-to-reconnect-google-workspace--01.png
- [image 02] ../../images/ux/vendors/resolving-the-vanta-couldn-t-query-a-few-accounts-from-google-workspace-due-to-insufficient-permissions-to-improve-the-accuracy-of-this-list-ask-an-admin-to-reconnect-google-workspace--02.png
- [image 03] ../../images/ux/integrations/resolving-the-vanta-couldn-t-query-a-few-accounts-from-google-workspace-due-to-insufficient-permissions-to-improve-the-accuracy-of-this-list-ask-an-admin-to-reconnect-google-workspace--03.png
- [image 04] ../../images/ux/integrations/resolving-the-vanta-couldn-t-query-a-few-accounts-from-google-workspace-due-to-insufficient-permissions-to-improve-the-accuracy-of-this-list-ask-an-admin-to-reconnect-google-workspace--04.png
- [image 05] ../../images/integrations/google/resolving-the-vanta-couldn-t-query-a-few-accounts-from-google-workspace-due-to-insufficient-permissions-to-improve-the-accuracy-of-this-list-ask-an-admin-to-reconnect-google-workspace--05.png
