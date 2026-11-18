# Connecting Vanta & Orca Security

Source: https://help.vanta.com/en/articles/11345793-connecting-vanta-orca-security
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Vulnerability Scanners
Fetched: 2026-11-17

## Article text

## Connecting Vanta & Orca Security
- 
In Vanta, go to the Integrations page, click Add integration, and search for Orca Security. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect. 
- 
Ensure Orca Vulnerability Scanner is toggled On.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757704/5cce4bd88e2f016707466d8c4b4c/28421654081428?expires=1794967200&signature=5ab5d1e69ca8daba5d7f2d39394cb2ddb2818f51e316da4c50e83c53afcb4f76&req=dSUmEM57moZfXfMW1HO4zXy1MIoY%2FV4RGQhg3sRqXfPvUzKG56%2BWJCBI5yzd%0AAlm4WM9KUN77lfLaQds%3D%0A>
- 
click Next, and you will be taken to the Setup API Token step.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2144272144/08b315e66f6d7c593ab14001aff4/image.png?expires=1794967200&signature=391961724b3776b218e255c3325e9a153d06c1f9cd1fb2e3581f26de3575cb6e&req=diEjEst5n4BbXfMW1HO4zSRRb7SjTmzVQkd%2B1D9zWyBpSKp2hT4Y8URd%2F%2FBk%0A7I0n0zUC8yy%2BJ0H8oMM%3D%0A>
- 
In this step, you will need to provide the region your account is in, as there is a different API token for every region
- 
Navigate to your Orca Security Platform and log in using your personal credentials.
- 
Go to the API tokens page.
- 
Click on the Add API Token button to open the Add API Token modal and configure a new API token.
- 
Set Vanta App Token as the name and Vanta's read-only access token as the description.
- 
Set the expiration date to two years from today.
​
- 
We want to set the expiration date as not setting any is a security concern.
- 
Check the Service Token checkbox.
- 
Set the Role as Internal Viewer.
​
- 
We need this role as we need to be able to list your users for the Access connection and the vulnerabilities and assets for the Orca Security Vulnerability Scanner integration.
- 
Leave the Scope access to specific resources checkbox unchecked.​
 
- 
Our integration needs the token to have access to the entire organization in order to provide access control support.
- 
Click on Add and then copy and paste the displayed API token into the box
- 
Select Done
What happens if the token expires or I delete it for some reason?
- 
You will need to get another one following the exact instructions. For this, you will have to find the Orca Security integration card again, but you can go to Manage and Edit in the pop-up menu that comes up.
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757708/710448b08ca92f720aa1b66e6723/28421654087188?expires=1794967200&signature=d4e709d5a3577aff6292e02eaaa7b426a09a244b129234f44494168e42894fa8&req=dSUmEM57moZfUfMW1HO4zc0tYgGKN18J75oX%2B4rEPOPC6iygeRKAwfA7edo7%0AJ7M%2F%0A>
- 
This will take you to a flow that is visibly the same as the connection from scratch, but this time, we’ll update the credential instead of creating another one. As the person reconnecting the integration might not be the same as the one who connected it in the first place, we provide all the instructions again like they were the first time.
​
​
​

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-orca-security--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-orca-security--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-orca-security--03.png
