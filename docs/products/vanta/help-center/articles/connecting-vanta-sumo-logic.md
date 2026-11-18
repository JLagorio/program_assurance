# Connecting Vanta & Sumo Logic

Source: https://help.vanta.com/en/articles/11345726-connecting-vanta-sumo-logic
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Sumo Logic allows customers to connect tools like Vanta using API tokens. By connecting your Sumo Logic account with Vanta, Vanta is able to make API calls with the token, allowing you to display users in Sumo Logic within Vanta under the Access page.

## Integrating with Sumo Logic
- 
In Vanta, go to the Integrations page, click Add integration, and search for Sumo Logic. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect.
- 
A pop-up modal will appear asking for an Access ID and Access Key; keep this modal open.
- 
In a new tab, login to your Sumo Logic account.

## Obtaining your Sumo Logic API Key
- 
From the bottom left-hand corner, click on your username in order to open the sub-menu
- 
Select preferences
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760005/434d962ebed4b8bc3bb45dda02dd/35746733496340?expires=1794967200&signature=b3d9f5b8fc9f2dcbd13a450f705f4515e9e976e59f4196b6db18c5ecf6aeda71&req=dSUmEM54nYFfXPMW1HO4zdSrfMdkiSiGPMHXYHn8C6WGS2DsYOcY2LNCaLBq%0AxsL%2FhZnudRHP7gyODUo%3D%0A>
- 
On the preferences page, look for a section titled "Access Keys"
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760008/1251a6c43f6feb3a089a65316bb7/35746764025236?expires=1794967200&signature=75703222f0769627b5a5594afab91df644f808ee1254af52ea343e4d6639482c&req=dSUmEM54nYFfUfMW1HO4zTOf%2BdRrjhifVRZ5ZXaVspuuM6%2FsZBjl7zICd8mS%0AImVyi3pQwnsdTxpUe7E%3D%0A>
- 
Click on + Add Access Key at the bottom of the section table.
- 
Name your Access Key (We recommend Vanta)
- 
Generally, the CORS Domain section is not needed.
- 
Under the Scopes section, select either Default or Custom, but this should include at least the "Monitors - View" and "Users And Roles" scopes
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759998/41ba87e2f4409f3cb623289dbe1d/35746733499028?expires=1794967200&signature=23c2e02e613034de9de0717606c1c445e210fd0f772ca1a61102bcac1aea2127&req=dSUmEM57lIhWUfMW1HO4zZtnGz%2BTkXJL6IdEZOtsvNqgWL1GcuUhyO%2B5Firf%0Ag38afCSzS3G6kYWE0cg%3D%0A>
- 
Select Create Key
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760003/c3c707739c500eb30f35ed9d35ce/35746764029972?expires=1794967200&signature=060b72c54b1eba524a571db978c8a8677f1732dead1847afaf3ebdeff5dcabf3&req=dSUmEM54nYFfWvMW1HO4zVtHJy4%2BeTeEeEy9iQxOtwt0%2Bx4Uf4se%2B1WPDNlX%0AjIQIoipnb3QnRVhkUpo%3D%0A>
- 
Copy the Access ID and Access Key to the connection window on Vanta.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760022/9d5391def3235467ffe329915d3f/22754016584596?expires=1794967200&signature=ed824f86d7e997070ff8c714dfd946c67513c9c33ab02605bc7e9273b121037b&req=dSUmEM54nYFdW%2FMW1HO4zdDDVb3w18ifEesbTbgWK3i%2FmtPDhgX%2B5NES%2BAsJ%0Ak2sgeKLCsO8CGlWTcwM%3D%0A>
- 
Select Store Token once you have copied the appropriate information from Sumo Logic.
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760024/39855cb419d659fcd5c74fb833f2/22754016588052?expires=1794967200&signature=3c3eadd40c50a77265a105a7794b439fc4c4eada8a0b09ff4a61ee5aec4f26d6&req=dSUmEM54nYFdXfMW1HO4zfpGIwAA2J3vmOS8%2F2opxfpJ1Yg4IseCKt8PzX5A%0AeBp4rFlouOZy5gR8NcA%3D%0A>
- 
Upon success, you should see the store token window close and pop up a success message at the bottom of the screen.

## Configure the Scope
- 
Establish which Sumo Logic items should be marked in or out of scope for your audit
[image 07]
 <https://help.vanta.com/hc/article_attachments/22755066966292>
- 
You can configure scopes later by clicking Configure scope on the connected Sumo Logic card from the integrations page.

## Images

- [image 01] ../../images/integrations/sumo-logic/connecting-vanta-sumo-logic--01.png
- [image 02] ../../images/integrations/sumo-logic/connecting-vanta-sumo-logic--02.png
- [image 03] ../../images/integrations/sumo-logic/connecting-vanta-sumo-logic--03.png
- [image 04] ../../images/integrations/sumo-logic/connecting-vanta-sumo-logic--04.png
- [image 05] ../../images/integrations/sumo-logic/connecting-vanta-sumo-logic--05.png
- [image 06] ../../images/integrations/sumo-logic/connecting-vanta-sumo-logic--06.png
- [image 07] ../../images/ux/integrations/connecting-vanta-box--04.png
