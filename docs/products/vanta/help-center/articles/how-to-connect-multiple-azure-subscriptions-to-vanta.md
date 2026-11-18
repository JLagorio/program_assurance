# How to Connect Multiple Azure Subscriptions to Vanta

Source: https://help.vanta.com/en/articles/11345621-how-to-connect-multiple-azure-subscriptions-to-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Below we'll walk through the steps needed to connect an additional Azure Subscription to Vanta. This guide assumes that you've already connected at least one Azure subscription, it is correctly integrated and syncing resources.
 
ℹ️ Note: 
- 
When connecting multiple subscriptions, each subscription can belong to the same Azure tenant or to different tenants. 
- 
When connecting multiple tenants, all subscriptions within the connected tenants will be pulled into Vanta.
⚠️ Note: Vanta does not support mixing subscription-level and tenant-level connections in the same workspace. If you have already connected Azure at the tenant level, do not also add individual subscription connections. To switch connection types, remove your existing connections first and reconnect using your preferred method.
 

## Prerequisites
- 
Azure Subscription connected to Vanta
- 
Azure Subscription not yet connected to Vanta

## Process
- 
Navigate to the Integrations page <https://app.vanta.com/integrations>, locate your existing Azure connection
- 
Select Manage, followed by Edit
- 
Click on Add Subscription to add additional Azure subscriptions 
Once in the Connect Azure screen, select Next to view the Register Application form
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762161/c93a9b022fda004f413a1755a8b8/15395385189012?expires=1794967200&signature=1872d55f4f4815f378d1ebbf95052b1892f05e590e029c95c8d161e88ea28f8f&req=dSUmEM54n4BZWPMW1HO4zYCjaUgl8unZWj7AOq84etNlWM4riSWN%2FWhen7cB%0AUVGz32xFrn9L3Falj6M%3D%0A>
- 
Click on App Registration to Navigate to the Azure Portal and begin creating your additional Vanta app.
​
- 
Select + New Registration in the top right
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762156/0ce0117e660b9646ce10b54381b4/15395623695124?expires=1794967200&signature=c0e5e424ad435ec97656a95ecb1bd9283610607363a16099f8d1c6c5d8c50651&req=dSUmEM54n4BaX%2FMW1HO4zdBGESd%2B2xbxsX18KNK0zeFscz3E94w1l7cs1hSp%0A7irM%0A>
- 
You may see your other subscription's Vanta app in this list since each Azure Subscription requires its own Vanta App to connect. So we won't be altering any other Apps config.
- 
Name your app whatever you like (Preferably something that can distinguish it from the others)
Use the default options already selected, and click Register
- 
You will be redirected to the Application overview page, Copy your Application ID and Directory ID, then navigate back to the Connection steps in Vanta
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762163/fd9bb43ca66bd0b1eee873ceeaea/15396090599828?expires=1794967200&signature=067267cd82b7054c67eca154a12428a2e4bba82141a7a19254c7221fc46c1f50&req=dSUmEM54n4BZWvMW1HO4zcVLI%2F3TgtxWXAlbVTmS99bIBlRiW2uJvhG%2F1uf6%0AXWbL%0A>
- 
Paste the IDs in their appropriate places, then select Next
- 
In the Certificates & secrets tab of the registered application, go to Federated credentials and click Add credential.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2644957242/9e72200e1f57b89f0bfc01d50d6a/1aa25685-453c-413a-a603-64b6b2f883f5?expires=1794967200&signature=2bf271b7dbd553589e6ed7089386768b8f084be2b73eb87b75789118e24b32f7&req=diYjEsB7moNbW%2FMW1HO4zd3VmfoKHTzzOJvTzz63pAPuY6ZJ1CYWRMhN7Rr1%0A0GeI%2F%2Fk0407J4ym%2BHQs%3D%0A>
- 
For the Federated credential scenario, choose Other issuer.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2644957887/16d6167705e93fd110a33ffd8f25/da860bc5-2279-49ca-ad87-7cfe9391a837?expires=1794967200&signature=52aad12b6e356bffbd32faa7f14104238cf8033f09f68da390e9bfb7aad4d76a&req=diYjEsB7molXXvMW1HO4zanbfyuUfqFFKHYH6qSGu3MXS2fpS9YrdHlaRXov%0Ao6NmOm9gP42bUziL8Hk%3D%0A>
- 
Set Issuer to the Vanta-provided URL, choose Explicit subject identifier, and set Value to the Vanta-provided subject identifier.
- 
Choose a Name for the federated credential.
- 
For Audience, click on Edit (optional) and input the Vanta-provided audience identifier.
- 
Click Add to confirm the credential creation.
- 
In Azure - Navigate to API Permissions and select Add permissions, Microsoft Graph
​
- 
Select Application Permissions and Search for Directory
- 
Select Directory.Read.All
- 
Add permissions 
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762173/72f6c35aedc7e5d4e11ba157a659/15399538553876?expires=1794967200&signature=7fb985ce65de3cf7082c6409d2ccd826dd9ecbd0b9fa6d50877ea5b4ba9aa2f5&req=dSUmEM54n4BYWvMW1HO4zTsPNhZzc%2BiH%2FAoTS8VqyVKaObJDn3qyI5ptXzGI%0AvZ%2BQ%0A>
- 
Make sure you Grant Admin Consent for these permissions before continuing
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762181/9b8ed976944b136e57023e79c53b/15399567733908?expires=1794967200&signature=57c4952d03ddec8125325ce74aca8443b584d55147a10953179040f2c3f05196&req=dSUmEM54n4BXWPMW1HO4zYELLlBT4T6Wp6Ffgzpqit5bS8cAERTHPnLLX7rh%0AUl%2Bh%0A>
- 
Once Admin Consent is granted, Navigate back to Vanta and go to the next step
​
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762193/8036f49386ff4bc7c6f5e854666c/15399571660052?expires=1794967200&signature=b466fd7af9774790365dace820dd19b62f37c4c0f1be56580ac59ec7ff44a15e&req=dSUmEM54n4BWWvMW1HO4zeWz0t%2F7lgrOgBG7DvbQnc7zlRnY8EAJYv21hXKf%0A43EZ%0A>
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762197/0a685c714d0c21e5536309cb9aa8/15399639157268?expires=1794967200&signature=e10248d14d86558ef54b7bfa378e1579af0b09af361c826d87bbe3e13899b30c&req=dSUmEM54n4BWXvMW1HO4zW%2FPcbLFTr0CThIcalQTk1fUFG1mLElv%2BOt5En7u%0AQjor%0A>
- 
In Azure - Search for Subscriptions
​
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762200/8fe1ad952a269d70775a3a430909/15399787947924?expires=1794967200&signature=f0eb02e000e955a9cc143ea56f431af156d07b75dab9bca662e5bf4e8132f3a1&req=dSUmEM54n4NfWfMW1HO4zbE0M4rb5XpCrwnrJ4kupCEufUgm9CEjFlHcFzs5%0AHf%2BI%0A>
- 
Locate your Second Subscription( the subscription is not connected yet ) and copy the ID
​
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762201/515eff4b3903e6f0ed93c4f6aaa3/15399887229204?expires=1794967200&signature=0f7a36370b7b40f5fc314863a047bee30755401ae72c9eb0de3af8758d4cb165&req=dSUmEM54n4NfWPMW1HO4zW%2Foxk6jo4dBBDtMAB3gfz5Ersc4MZRLutTVLbuT%0AdaQ2%0A>
- 
Paste your Subscription ID in the appropriate box and click Next
- 
In Azure - Click on your Subscription, then in the sidebar, Click Access Control IAM, 
followed by +Add, and then Add Role Assignment
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762211/f5055b73a86fe8d0ec332572e689/15400122441876?expires=1794967200&signature=888e0832aed76f9ffc60e06d4d8529b4cd7871d6dfd67c7916165cb9636cbe17&req=dSUmEM54n4NeWPMW1HO4zcrVDlxlOSFZgAlNWLNspUFk4HebDqbpAvtEzQuI%0AG2QHt7u4EeLmCDFemYQ%3D%0A>
- 
Search for Reader
Click Reader Role, and select next
​
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762218/2b221fb48ff98ea950b2cf881968/15400409785620?expires=1794967200&signature=844012e51891c96dd4ad866063384c74d064c1203ca45edc304c0f1f7e16ccdf&req=dSUmEM54n4NeUfMW1HO4zfnxhVZYYk1D%2BJ5huM0LukIDXXOgDeIziJB9sgRR%0ANe2ywSZN0Mn57xiDk1c%3D%0A>
Click Select Members and search for the App that you just created
- 
 
- 
Click Review and Assign and confirm your subscription is the correct one
​
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762225/7e3ef0904a96806a700eafa2fb8d/15400652797972?expires=1794967200&signature=ca35046752e89229903f4c43c8a28ee218992be21f9d15bcb5810dea4f4122b7&req=dSUmEM54n4NdXPMW1HO4zVy%2F7c%2Bil1948ilPiB87uqc6rWKkhT9tRsROrH7A%0Aygjt%0A>
- 
If everything looks good, Click Review & Assign once more to Assign the role
​
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762224/7acada5d24ea58b421f8f341582a/15400750938388?expires=1794967200&signature=0ab5db9584e86697d07f672efb1e7f72ebae9fc43725d5db714c51bee6809cbe&req=dSUmEM54n4NdXfMW1HO4zUDU2xhjMjATo9qtRcKANemR5VdiUzutQjclBgOK%0AblHA%0A>
- 
 
- 
Back in Vanta, Click Next
​
​
If Authenticated correctly, Vanta will begin to fetch your Subscription resources
​
[image 16]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762246/9dd2f8a6bf91d47b92433e4f92f3/15400920313620?expires=1794967200&signature=3df57faf456d45913aef72f182f30e7ac3e7fd9468328e59990b92fd47267e00&req=dSUmEM54n4NbX%2FMW1HO4zd5p61tO5v3ghmWh%2BZe8OO3floXH4UCTFv8l8QGw%0AkyFDKl9WzBU0z04pAOY%3D%0A>

## Images

- [image 01] ../../images/ux/integrations/how-to-connect-multiple-azure-subscriptions-to-vanta--01.png
- [image 02] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--02.png
- [image 03] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--03.png
- [image 04] ../../images/integrations/azure/azure-integration-guide--08.png
- [image 05] ../../images/integrations/azure/azure-integration-guide--09.png
- [image 06] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--06.png
- [image 07] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--07.png
- [image 08] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--08.png
- [image 09] ../../images/ux/integrations/how-to-connect-multiple-azure-subscriptions-to-vanta--09.png
- [image 10] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--10.png
- [image 11] ../../images/ux/integrations/how-to-connect-multiple-azure-subscriptions-to-vanta--11.png
- [image 12] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--12.png
- [image 13] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--13.png
- [image 14] ../../images/integrations/azure/how-to-connect-multiple-azure-subscriptions-to-vanta--14.png
- [image 15] ../../images/ux/integrations/how-to-connect-multiple-azure-subscriptions-to-vanta--15.png
- [image 16] ../../images/ux/integrations/how-to-connect-multiple-azure-subscriptions-to-vanta--16.png
