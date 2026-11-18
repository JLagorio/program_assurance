# Connecting Vanta & HiBob

Source: https://help.vanta.com/en/articles/11345676-connecting-vanta-hibob
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

Vanta integrates with HiBob to sync employee data and support automated onboarding and offboarding workflows. By pulling real-time employment information, Vanta helps ensure that only current employees retain access to company systems, simplifying access reviews and supporting compliance requirements.
 
Estimated setup time: Less than 5 minutes
 
This integration pulls user data from HiBob using an API token.
 

## How It Works
Vanta integrates with HiBob to sync employee data, helping you monitor access and support automated onboarding and offboarding workflows. By pulling real-time identity information, Vanta helps ensure that only current employees retain access to company systems.
 

## Use Cases
Connecting HiBob to Vanta will enable you to:
- 
Sync employees from HiBob into Vanta
- 
Monitor and manage personnel access in real time
- 
Ensure only active employees retain access to company systems
- 
Simplify access reviews and support compliance requirements

## Requirements
- 
Vanta administrator account
- 
HiBob administrator account
- 
SCIM token
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709126456/fc6d012c5651c0975914b7ed8f49/e5089a66-5dca-4f1e-8bf5-3ca4f072ad1f?expires=1794967200&signature=c6e1108aa522578edd524f85d01e3c6e2b12f5a4c89d0c645b2a57de47bc734d&req=dScnH8h8m4VaX%2FMW1HO4zYQWpxprWe6Vqv9IZ%2BtQGjur2YpoBQcJ2ROmsTDF%0A1y2NEYJ2Gbu%2BL7eCA%2BU%3D%0A>
 

## Connect the Integration
- 
In Vanta, go to the Integrations page, click Add integration, and search for Bob. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709126827/1fbd54b205be368c5677fb7f17f1/126f06ee-1bd0-479d-a826-67798f598e2c?expires=1794967200&signature=47180cfae65d875223790cd588b6edce60c0793fe3e48e2787ac2814b8cbc430&req=dScnH8h8m4ldXvMW1HO4zR42tQPkddRr%2BYjJpn4fFRkQRsDUmhffNt%2BTHEst%0Azp0FF%2FfjIAfwiH5PXl0%3D%0A>
Please note: The connection module will open with redirect links to the Bob dashboard, allowing you to log in.
- 
In the Bob dashboard, go to Settings from the left-hand menu, followed by Integrations
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709128946/4ccc2ffdc634290416e4570d1ebd/30ce4898-884e-4235-90d4-5cfc296809e7?expires=1794967200&signature=693515ab4b20975d1b801c38acceae5dc8406847fe693187a2f09a289184e529&req=dScnH8h8lYhbX%2FMW1HO4zbfSpZeKYlMdZ7t932jGhKr1cV%2Bh0cnzUsmmV1X%2B%0AQ%2BvUNcSt2vdadpfrR9s%3D%0A>
- 
From the System Settings page, select Integrations, then search for Service Users
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709129455/d2a2b2e7a8cd1eb1d7e978acc752/8d93fa8d-afe9-4ed6-8c40-f8f30376fd78?expires=1794967200&signature=811c066286fdce2cc9203ab8dac2dda88d98e1a4228f727f8be1e40a4c40b009&req=dScnH8h8lIVaXPMW1HO4zU4hWRdLFr2R1Fi8VVk5UaJwTAdv4w4lmkW8YbvP%0A7OShOkpikJHQ6kOzrmI%3D%0A>
- 
Select Manage, then select Create Service User
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709129780/718308fd52f5ceaaf28ecc7b3e3e/4f84c6ae-6718-4a2d-aacf-ade2755443cd?expires=1794967200&signature=a77f4d71636890986b8e313be59e780dad625f2170152e03f01ec0703e9c8238&req=dScnH8h8lIZXWfMW1HO4zXHAaLWoraSRVNVoJAj%2BsIS%2FFEKs%2BbLrQshJe56p%0A2CaejiW5I8ovgPtHMqo%3D%0A>
- 
In the popup, enter Vanta for both the Service user name and Display name, then select Next
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709130352/269fe337da0343aa93c29b764496/2b2344d6-0154-44a9-82b1-013f442c95e4?expires=1794967200&signature=ba9f499f7e01dedae87f364947937ab9797b42e2c7ce3983b3d3f246a3951ec8&req=dScnH8h9nYJaW%2FMW1HO4zePXO7TvAydxKHmAvJDscnajqyPveFbbyf7QsSvP%0AzVDtaImhDNRzHzLBu5A%3D%0A>
- 
Copy the generated ID and Token. Do not enter them in Vanta yet—this is the only time you can access the Token. Store it temporarily in a secure location
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709131474/1ce43cd537a01de6539f9d7c3a54/4b08c8fc-6756-4977-a110-393ec36f8a0c?expires=1794967200&signature=3f0619f7af62fec3487a7d3cdb62d8b6f64182b8763257320a1e1ad4168bb2a8&req=dScnH8h9nIVYXfMW1HO4zRKRnvPqM6AmMTJP7kdrZkZIJOUGRN0FHAMbeN34%0ASCMZST5r2rE0By2lQ4o%3D%0A>
- 
Select Done, then select Go to permissions groups
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709131782/57aff3c0f4790273f2286ba4c3c1/1b642a90-2dca-4e18-8a14-cb55091a877b?expires=1794967200&signature=712bf762870150c4356eb6bace6abf3abefe4194f65b895a7aeb71af139476fe&req=dScnH8h9nIZXW%2FMW1HO4zbg9%2FFsFZ7zDw7GzCmuP8y81uPPyR52X7SskeU74%0ALPPIxPjCgl3BIwGZhWU%3D%0A>
- 
Select Create Permission Group, and choose Service User
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709132902/ea8282f76b469e4ff64ee5fa9930/3f35eeba-1769-4ebc-80c7-036c5fb9ec55?expires=1794967200&signature=27e1136f1fb7d7044ea3ddd88ec9b10901fd5275c0980fdd80d6d33ecbbd0367&req=dScnH8h9n4hfW%2FMW1HO4zSiGJfaiALxITQE4lRIBpJdE2EvpXLGr4hyL8heD%0ACRpFOuNrI54%2B7P9t1uA%3D%0A>
- 
Enter the group name as Vanta Permission Group
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709133419/d100a10e36973595ad8f8d98ad01/3704e700-ba82-48df-ba08-0ce64dc771e8?expires=1794967200&signature=bcf234c9667950d384856aaf1d9d87dd303ef92c9cd4195342d802aae43f690c&req=dScnH8h9noVeUPMW1HO4zWsVkI%2B%2B%2B29DBL1Tc67IzaYy6Fv2HAumwSHmG2vv%0A7hnlhtJZr8%2FD4lSD%2Fks%3D%0A>
- 
Select Select service users
- 
In the dropdown, choose the Vanta user you created earlier, then select Apply
- 
Select Apply again, then select Create to confirm
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709134844/289d31fa2bea68cc66f47c23e799/b0526b09-17f4-47a3-b292-7904215bc4ac?expires=1794967200&signature=edd8239261b37a94808f3d1bd832daa14675b58e325815862900c8e73b1b8c17&req=dScnH8h9mYlbXfMW1HO4zTpL872lcnpF06JQp08HeyasSdD%2FlANGIAPP42wl%0Ap4cp4DJF9jLTletnFfc%3D%0A>
You’ll be redirected to the new group’s settings.
- 
Go to the People’s Data tab, and under Access Data For, select People
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709137239/d933ee5f48487a61907ca193ede5/73417769-3cd2-4622-9f2f-b7821c6a61f1?expires=1794967200&signature=16ded489abd240c51978fd42fab6eba545db509c081f718455847d0bce1d90b0&req=dScnH8h9moNcUPMW1HO4zSibb0Bm87dko4IyV57iBA4fbkEBZMXvmrK%2B7oEv%0AGB67T%2B1JdRLcsLahUmM%3D%0A>
- 
Grant access to the following fields: Termination Date, Lifecycle Status, Employee ID, First Name, Last Name, Email, Display Name, Start Date, Department, Site, and Job Title
- 
Ensure the following permissions are enabled:
- 
View selected employees’ About sections
- 
View selected employees’ Basic info sections
- 
View selected employees’ Lifecycle sections
- 
View selected employees’ Personal contact details
- 
View selected employees’ Work sections
- 
View selected employees’ Work contact details sections
- 
To obtain employee time-off data, also enable:
- 
See who’s out today
- 
See who’s out because of a private policy or policies with a custom name
 
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709139844/5aff6ac9db5e3f3a8a816dd90c1c/8c5f2063-4331-433c-9a39-a46a1668d78e?expires=1794967200&signature=9dd44ffa14ed6b97886dc87df3a9a45d1aeb5ad75136b47dca5e3e2bf9f9289e&req=dScnH8h9lIlbXfMW1HO4zYdhc9fXxCCyWQhhzUW7%2BPu56QGsGnMUQgpybEEa%0AyXw5%0A>
- 
Select Save and review the summary of changes
- 
Select Apply
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709140475/257ab13e68a904b2cd0102b5bad0/c1a78848-d8ae-47e2-81cb-c6287e44e5de?expires=1794967200&signature=ec9a49bf327d7dbc0712598655be2dd9d4cb56f197603c304953f344832d9adc&req=dScnH8h6nYVYXPMW1HO4zR%2Bwlj2%2BWC%2FGvD7y%2F12ANeGpi%2BqpXjkKH0B6lr%2FH%0A5vIFUfCygrg2bbR97GE%3D%0A>
- 
Return to Vanta and enter the Service ID and Token you copied earlier, then select Store token. 
 
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709696053/20cf592ff4bcaf825420abbe5023/be228bd0-6109-4094-b055-56991016c39f?expires=1794967200&signature=8f5e5ea4af91ba9e0145e531851cb5700c392eb6cdbb87b1b391c9a65281d0d6&req=dScnH893m4FaWvMW1HO4zW1XoAkbZDlV%2FuXnGP%2BVr2CGh%2BH6WMO2%2BMOoNVZX%0AHffHY4gShpi1UmxvTVI%3D%0A>
 
- 
You’ll see a pop-up confirming the connection with an option to configure scope.
 
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709150911/a3e111b32285e399fa5fe8fafaaf/bb9ac37b-0f1e-47a8-8f4f-5cbcd5458b67?expires=1794967200&signature=5a52d4be1437195334bc570bd6e566e8c8afad2c3ed20360208cb6d131ddf2ad&req=dScnH8h7nYheWPMW1HO4zfrIm6q3KfgKcWEsfm1lvFaFz4Y3YEPO7kBQ%2BEfO%0Afjt9mFE6%2FshJ%2F4VnY7E%3D%0A>
 

## Permissions
Vanta accesses the following data from your HiBob HRIS:
- 
Vanta will be able to view:
- 
Data about your users
- 
Data about your employees
- 
Vanta will be able to do:
- 
Nothing (Vanta does not have write permissions)
Please note: Permissions in HiBob can be checked by navigating to your profile and selecting the Permissions tag next to the action dropdown.
 

## Troubleshooting
I’m unable to connect with HiBob and I’ve set up a custom Employee Fields category
If you’ve moved required fields (such as Termination Date, Lifecycle Status, Employee ID, First Name, Last Name, Email, Display Name, Start Date, Department, Site, Job Title) to a section outside of About, Basic Info, Lifecycle, Work, or Work contact details, you’ll need to grant the Vanta permission group access to View selected employees’ [CUSTOM CATEGORY] sections.
 
Why do my Vanta users associated with HiBob accounts appear inactive instead of terminated after their end date?
Delete the lifecycle status filter in Access rights for the Vanta permission group. This filter may be set to “Lifecycle Status equals Employed,” which prevents data for terminated employees from syncing.
 
How to support leave tracking
Users without the configured scope will not see errors when retrieving time-off data. Scopes can be added at any time without reconnecting the Vanta integration.
 
Required permission: Time Off → See who’s out today
 
Cutoff date affects user data during resource synchronization
Setting a cutoff date in HiBob determines how terminated users are included in active queries. Users terminated before the cutoff date are excluded, but their data remains in the system.
 
Adjusting or removing the cutoff date changes which users are included in the next synchronization. This ensures that data stays aligned with the most current administrative settings.

## Images

- [image 01] ../../images/integrations/hibob/connecting-vanta-hibob--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-hibob--02.png
- [image 03] ../../images/integrations/hibob/connecting-vanta-hibob--03.png
- [image 04] ../../images/integrations/hibob/connecting-vanta-hibob--04.png
- [image 05] ../../images/integrations/hibob/connecting-vanta-hibob--05.png
- [image 06] ../../images/integrations/hibob/connecting-vanta-hibob--06.png
- [image 07] ../../images/integrations/hibob/connecting-vanta-hibob--07.png
- [image 08] ../../images/integrations/hibob/connecting-vanta-hibob--08.png
- [image 09] ../../images/integrations/hibob/connecting-vanta-hibob--09.png
- [image 10] ../../images/integrations/hibob/connecting-vanta-hibob--10.png
- [image 11] ../../images/integrations/hibob/connecting-vanta-hibob--11.png
- [image 12] ../../images/integrations/hibob/connecting-vanta-hibob--12.png
- [image 13] ../../images/integrations/hibob/connecting-vanta-hibob--13.png
- [image 14] ../../images/integrations/hibob/connecting-vanta-hibob--14.png
- [image 15] ../../images/ux/integrations/connecting-vanta-hibob--15.png
- [image 16] ../../images/ux/integrations/connecting-vanta-hibob--16.png
