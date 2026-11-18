# Connecting Vanta & Rockset

Source: https://help.vanta.com/en/articles/11345709-connecting-vanta-rockset
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Import your organization's users from the Rockset API. By connecting your Rockset account with Vanta, Vanta can make API calls as the connecting user, allowing you to display users in Rockset within Vanta under the Access page.

## Role creation
- 
Navigate to https://console.rockset.com/users?tab=roles <https://console.rockset.com/users?tab=roles>
- 
Click on Create Role
- 
Name this Vanta and put any description you like
- 
Ensure Clone privileges from.. is unchecked
- 
Click on Create
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759035/175764723d9b34b43b6eae7738e9/23708911604372?expires=1794967200&signature=5930823197d181de7f8ef5f1a84fcd164b53b60b1feb8070c95e3e9f355ee37a&req=dSUmEM57lIFcXPMW1HO4zWxjDlqt2R2bHY4FW7%2BUZU6%2Frpu1b4eXJM3hwzEf%0AR9dSbpdxtQSenNydcGI%3D%0A>
- 
This will take you to the Summary page for the new role
- 
Scroll down to Administration Privileges and click on Manage Administrative Privileges
- 
Ensure the below permissions are checked and select Apply:
​General Access: Get Organization, Get Current User
​User and Access Management: List Users, List Roles
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759033/bf8310f111602e585615726eb414/23708911609364?expires=1794967200&signature=dc84abb1e4d8ccd2b9de61749c2d96cad3f5c981e0880153f0f9001a0a352ed1&req=dSUmEM57lIFcWvMW1HO4zc6j1nVIZftd7kt%2FCVVV8EmhbS52wEJp6gPIDaaN%0APKWs%0A>

## API Key creation
- 
Navigate to https://console.rockset.com/apikeys <https://console.rockset.com/apikeys>
- 
Select Create API Key
- 
Select the Role you just created
- 
Name the API Key (We suggest Rockset-Vanta-token)
- 
Click on the Submit button
- 
Copy the API Key to enter in Vanta

## Connect Rockset Account
- 
In Vanta, go to the Integrations page, click Add integration, and search for Rockset. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click the Connect button
- 
Paste the API Key you generated in Rockset
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759030/c70511f75a215646da3055825d51/23708941806612?expires=1794967200&signature=808de1911c8a3eecdf329b6ceb1547ec8b60158385254b62591d844182588509&req=dSUmEM57lIFcWfMW1HO4zctOqtCm2BD73PayuPIWES%2BBiMXipZ5SqaiWRmEx%0AUTV4TsVKPM72iMtpsUk%3D%0A>
- 
Ensure the Region matches the region visible at the top of your Rockset Overview page at https://console.rockset.com/overview <https://console.rockset.com/overview>
- 
Click the Validate and store credentials button

## Images

- [image 01] ../../images/integrations/rockset/connecting-vanta-rockset--01.png
- [image 02] ../../images/integrations/rockset/connecting-vanta-rockset--02.png
- [image 03] ../../images/integrations/rockset/connecting-vanta-rockset--03.png
