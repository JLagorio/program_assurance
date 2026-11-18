# Connecting Trust Centers & Salesforce

Source: https://help.vanta.com/en/articles/11345449-connecting-trust-centers-salesforce
Collection: Trust Management ; Trust Management › Customer Trust ; Trust Management › Customer Trust › Trust Center Integrations
Fetched: 2026-11-17

## Article text

Feature availability: Some features described in this article may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Trust Center's Salesforce integration provides an easy way to leverage automation when granting access to your report. This integration allows you to control who should be automatically approved for access and who should be required to sign an NDA by leveraging the data you already have in your Salesforce records.
 

## Connecting with Salesforce
- 
From the left-hand navigation panel, select Integrations 
- 
Search for Salesforce and choose Connect
- 
To approve the OAuth app, Salesforce requires that the connected account have the Approve Uninstalled Connected Apps permission enabled
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1738557737/e1ea460b74b595b25577e70ab582/image.png?expires=1794967200&signature=98ceed80e85739696cd18a44c664f6139df661958bc2cd147e96b662327c06e5&req=dSckHsx7moZcXvMW1HO4zUvtIwbp7ZxLEA%2BjGpqiYgW0OL4yxY8EY6TOniR5%0A4vUEQ5KqnUcySbAFGoo%3D%0A>
- 
Once you've successfully connected your Salesforce account, navigate to Trust Center settings and configure your desired auto-approval and NDA bypass settings
- 
In your account header, click the Settings icon
- 
In the Settings page menu, scroll to the Features section, select Customer Trust, and go to the Trust Center tab
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771163/34169198378249f2ca582c54375d/30469013784596?expires=1794967200&signature=9e80bd24916d63b7661d72981344a7b6d5f88bff9bcd44d237227708f346d28d&req=dSUmEM55nIBZWvMW1HO4zTuPoyIEmw5ZTuBj6Bd7q2FMOhbzXyK3Lo8lk%2FeH%0AHoySBuBtFKyMw8rcaWE%3D%0A>
Note: There are two options for If request meets condition
- 
Salesforce Contact matches the email
- 
This will match the exact email addresses found in your Salesforce Contact records
- 
Salesforce Contact matches the email domain
- 
This will match against the email domain of any Contacts found in your Salesforce records. For example, “[email protected]” will match against “[email protected]”
- 
In addition to matching Contacts, you can optionally configure a boolean field that must be set to true on the linked Account to that Contact for the auto-approval to go through
- 
Once these rules are in place, viewers who have been matched will appear in the viewer's table with the Salesforce logo.
- 
Viewers who have been auto-approved, will show that their NDA was signed and bypassed by Salesforce.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1627852961/b91ae774a3b85ae30dff27c565d0/Screenshot+2025-07-18+at+2_28_47%E2%80%AFPM.png?expires=1794967200&signature=3b2e6142e1bddd693cf648e01968a0ef6755250d00b4b4f4cc99c6cad6752112&req=dSYlEcF7n4hZWPMW1HO4zT0gy3gMfXpL69pZZ29qOUlqpMw4q40GUKStEMR6%0Ac72LIIuFKuS3E4qkz9Y%3D%0A>
 
 

## Tag-based access control with Salesforce 
In addition to controlling whether a viewer is auto-approved, you can also control what they receive access to automatically, based on Salesforce field values.
 
Vanta lets you map Salesforce field values to document tags in your Trust Center.  This means customers who have purchased specific products, belong to certain industries, or meet any other criteria you track in Salesforce will automatically receive only the content relevant to them, with no manual review required.
 
To configure tag-based access control: 
- 
Go to Customer Trust, select Trust Center, then click on the Settings button (the gear icon). 
- 
Select the Tags tab. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2398427313/2719843cf7eaed0b13bb00fdc9f4/image.png?expires=1794967200&signature=d4eb61104861b9a3fc621c450b0b1116b4cfc4a080161603ee0b763ed041c870&req=diMuHs18moJeWvMW1HO4zfD%2B9duGvzWMYvZ7J1%2Bpy05gLrSKxEIfYYXXL1tw%0AcEdLYHRC6S9LZ5glPxs%3D%0A>
- 
To learn more about setting up the Tag usage section, read Using Tags: Trust Center <https://help.vanta.com/en/articles/11345455-using-tags-trust-center>. 
- 
Once you've configured those tag settings, scroll to the Account tag automation section. Here you can match the tag category to the Salesforce field by selecting the correct field from the dropdown menu. 
⚠️ Note: Vanta only supports string fields for tag-based automation. Tag values must be stored in Salesforce as a comma-separated string (e.g., "Product A, Product B") where each value matches the corresponding Vanta tag exactly, character for character, including capitalization and spacing.
 
To ensure a match, either:
- 
Update your Vanta tags to match the values already in your Salesforce field, or
- 
Create a formula field in Salesforce that outputs the correctly formatted comma-separated string and map that field in Vanta instead.
When a viewer is granted access, Vanta reads the relevant Salesforce field values in real time and applies the matching tags to determine which documents they can see. 
ℹ️ Note: Tag values are captured at the moment access is granted. After that, tags sync from Salesforce every 24 hours — so any changes made in Salesforce will be reflected in Vanta within that window. For this feature to work, the mapped fields need to be populated on the relevant Contact or Account records in Salesforce. If an account has no tags set, viewers associated with that account will not be granted access to any resources.
 
 
 
 

## Customer Trust Accounts automation
Once Salesforce is connected, Vanta can automatically create and link Customer Trust Accounts <https://help.vanta.com/en/articles/13163124-customer-trust-accounts> based on Salesforce data, and use Salesforce fields to control account-level auto-approval.
 

### Account linking
- 
When you manually create a Customer Trust account, Vanta automatically finds and links the matching Salesforce account based on the domain you enter.
- 
When a viewer is granted access via Salesforce-based auto-approval, Vanta automatically creates a Customer Trust account for that viewer's email domain (if one doesn't exist) and links it to the corresponding Salesforce account. If a matching account already exists but isn't linked, it is linked at that time.
- 
When a viewer's access is granted manually (with Salesforce connected), Vanta looks up the user in Salesforce and automatically creates and links an account if a matching Salesforce account exists.

### Adding account-level conditions to auto-approval
Once you've set up Salesforce-based auto-approval (see Connecting with Salesforce), you can optionally add an account-level condition. In the auto-approval settings, click + Add account condition and select a Salesforce field. The field must be a boolean type (true enables auto-approvals for that account, false disables them).
 
Auto-approval can still be manually disabled for individual accounts from the account details view, which overrides the Salesforce sync for that account. 
 
 

## Trust Center Salesforce Integration: Required Permissions
The Trust Center Salesforce integration requests the api and refresh_token OAuth scopes. From Salesforce’s documentation <https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_tokens_scopes.htm&type=5> about the api scope:
​
“Allows access to the current, logged-in user’s account using APIs, such as REST API and Bulk API 2.0.”
In other words, the Trust Center Salesforce integration’s access is determined by which account initiates the OAuth linking flow in Vanta. To limit the integration’s access, we recommend creating a separate service user with limited permissions in Salesforce and linking with that user.
 
When setting up the service user, grant it read access to the User object (Name and Email fields) in addition to Accounts and Contacts. Vanta looks up Account owner details through the User object, and missing this permission causes contact and account matching to fail silently. See Salesforce Integration Permissions: Trust Center <https://help.vanta.com/en/articles/16862970-salesforce-integration-permissions-trust-center> for the full permissions list.
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771165/32cf7696919bc045da8fcf7c0bc4/30469013789076?expires=1794967200&signature=7291dd33674db21b37d4648ae1eef071b91dcb42e1f58556169ae4b4535ff17d&req=dSUmEM55nIBZXPMW1HO4zZTnw%2F1pa2luLD2Fij3DVj4WRMFZuDT5YRSBM8aN%0A8Z54hv6D6e5ktClLFwk%3D%0A>
(Note: If you’re already currently logged into your own Salesforce account, you may need to log out first before clicking “Connect Salesforce” in order to link with the service user)
 

## Required Permissions by Feature
The following permissions are necessary for the following capabilities:
- 
Augmenting viewer data in Activity and Access Requests for contacts found in Salesforce
- 
Automated access approvals
- 
NDA Bypass
- 
Customer Trust Accounts automation (account linking and CRM account sync)
- 
Tag-based access control
While we recommend granting access to all non-sensitive default fields on these objects to avoid functionality breaking if we request more information in the future, the minimal required permissions are the following:
- 
Accounts
- 
Object Permissions
- 
Read
- 
Field Permissions
- 
Read Access
- 
Name
- 
Type
- 
OwnerId
- 
Contacts
- 
Object Permissions
- 
Read
- 
Field Permissions
- 
Read Access
- 
Email
- 
AccountId
- 
Name
- 
Users 
- 
Object Permissions
- 
Read
- 
Field Permissions
- 
Read Access
- 
Name
- 
Email
Read access on the User object is required because Vanta looks up the Account owner's name and email when matching viewers to your Salesforce records. If the connected user can't read the User object, contact and account matching can fail even when Account and Contact permissions are configured correctly. This is the most commonly missed permission.
 

## Revenue Tracking
If you'd like to take advantage of the Revenue Tracking reporting features, we will need the above permissions and read access to opportunity objects in Salesforce.
 
While we recommend granting access to all non-sensitive default fields on opportunities to avoid functionality breaking if we decide to request more information in the future, the minimal required permissions are the following:
 
Opportunity
- 
Name
- 
AccountId
- 
CloseDate
- 
IsWon
- 
Amount (or equivalent custom field specifying revenue*)
- 
Stage (or equivalent custom field specifying opportunity stage*)
- 
CurrencyIsoCode (if multi-currency is enabled)
 
*For opportunity stage and revenue, you can specify custom fields to use over the defaults from within the Trust Center settings page.
 

## Lead Creation
Vanta Trust Centers now has the ability to create leads in SFDC for viewers that are not found in Salesforce. If you’d like to take advantage of this capability, we will need the following permissions:
- 
Object Settings
- 
Lead
- 
Object Permissions
- 
Create
- 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771179/6673591ef0b0db9e33b7330be12e/36045513633172?expires=1794967200&signature=c34be1d48f12708682a76f9c4dce6ab0e21ec29b0b5ac6925d2ec9cab478c19d&req=dSUmEM55nIBYUPMW1HO4zbqIME%2BHNqu48oOqfqrfpSdOh0wWo8axQz3uOuDS%0Ah5rk%0A>
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771183/434a978bd66927f2986c414fbd3f/36045486670740?expires=1794967200&signature=39195c911685a81e7bda1d8fe18a87e9a7cb94d8a3e68eec60fdc5f46dcd2bdd&req=dSUmEM55nIBXWvMW1HO4zRXUEkvR1YrwnBohOjkT3k%2FYl7qr0ZhVxIFTNx6W%0AiCWG%0A>
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771184/3e7e1ef30d6778d928631ea53d15/36045513633556?expires=1794967200&signature=f5b6acbcc0e71b75d54c61e914b1c18f5a5226ed44f4a2aaf56d8ddfd4736c5d&req=dSUmEM55nIBXXfMW1HO4zYi0LDsxNwGEWaBL8rYij%2BPqEs%2Bqs9aIt1QbLkki%0AzDty%0A>
- 
Field Permissions
- 
Edit Access
- 
Email
- 
Name
- 
Company
- 
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771187/f92802026b7ffd5d73619fd3b0a2/36045486671508?expires=1794967200&signature=d67c90a5a10ba323a841b1e6addad7bf6960e27d79698cd84b6946e8a96ae047&req=dSUmEM55nIBXXvMW1HO4zZGp53jcS%2BVy4mfEIictmUzQgVJxxgBta4RP8K87%0AfXJG%0A>

## Create Salesforce Task
Vanta Trust Centers can now push Trust Center activity to Salesforce. If you’d like to take advantage of this capability, we will need the following permissions:
- 
System Permissions
- 
Access Activities
- 
Edit Tasks
- 
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771194/4d2de6c9f08c674331ff78bc2d7c/36045486671892?expires=1794967200&signature=9fb6585add6aff8e94103e580a701695ace01fd4eadf36c95b812ff1fbddaab5&req=dSUmEM55nIBWXfMW1HO4zXADW%2B0O9SogL46Uh9blXyRxVU7HIr99qrPQZmPI%0AmXe4%0A>
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771200/905b6b61a549a6d33519a8952ec8/36045513634196?expires=1794967200&signature=31cd239b1c60a76448c45c9cb3c5458868822e6ad77d35313e18ff61467f2049&req=dSUmEM55nINfWfMW1HO4zaJ9Q0YZH6FZljtBWUaeknohtZw0yM9CixM0vuhp%0Au11m%0A>
- 
Profile > Field-Level Security > Task
- 
Edit Access
- 
Comments
- 
Related To
- 
Name
- 
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771210/3c1ec5dde6214e9f43c74f73f66f/36045486678932?expires=1794967200&signature=8d8724a4abc3c113d8a909b6a7ed5c90ddee85c0ac42149df2d832c138484c05&req=dSUmEM55nINeWfMW1HO4zTGG2jmAeluUC7fe1D14Lv5USMcD0qpepb7pbAEV%0A2aD0%0A>
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771208/5216a758f129d1b7904e33df7760/36045486679316?expires=1794967200&signature=95ca033f5ecb881444131f8eb9ef73b2eb3aa71f992cdb5bdaeb9beac5a9e012&req=dSUmEM55nINfUfMW1HO4zYjF5tKB973JMsG%2BZSGoGlENZ6q2OxmSDtzFiDtE%0AG6nd%0A>
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771216/131b7d149c88d484dcf7086c5539/36045513636756?expires=1794967200&signature=9babb43b296f4242e7fe95f10c4dc67fa398c9607c9c6d6cc6b7ae555e876f9d&req=dSUmEM55nINeX%2FMW1HO4zUT1mkjvDRtC224HeXQSykeGjh5nnxtL9vnxaI61%0AnemOvLx0AYcdsFSmxqI%3D%0A>

## Images

- [image 01] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--01.png
- [image 02] ../../images/ux/trust-center/connecting-trust-centers-salesforce--02.png
- [image 03] ../../images/ux/trust-center/connecting-trust-centers-salesforce--03.png
- [image 04] ../../images/ux/settings/connecting-trust-centers-salesforce--04.png
- [image 05] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--05.png
- [image 06] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--06.png
- [image 07] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--07.png
- [image 08] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--08.png
- [image 09] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--09.png
- [image 10] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--10.png
- [image 11] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--11.png
- [image 12] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--12.png
- [image 13] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--13.png
- [image 14] ../../images/integrations/salesforce/connecting-trust-centers-salesforce--14.png
