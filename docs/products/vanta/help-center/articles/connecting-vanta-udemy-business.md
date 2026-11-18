# Connecting Vanta & Udemy Business

Source: https://help.vanta.com/en/articles/14422298-connecting-vanta-udemy-business
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Security Awareness Training
Fetched: 2026-11-17

## Article text

## Overview
This integration connects your Udemy Business learning management system to Vanta using API credentials. Once connected, Vanta evaluates whether employees have completed required security awareness training (SAT). You map Udemy Business courses to compliance categories in Vanta; Vanta then tracks completion for each person in scope.
 
This integration is most useful for:
- 
Compliance teams that use Udemy Business to deliver security awareness training and need to demonstrate completion in Vanta
- 
Teams managing training requirements across multiple compliance frameworks, such as SOC 2, HIPAA, PCI-DSS, or GDPR
- 
Organizations running more than one Udemy Business account that need consolidated training visibility in Vanta
 
Estimated setup time: 15-20 minutes
 
 

## Use cases and capabilities
- 
Training Completion Tracking: Upon connecting Udemy Business and Vanta, we automatically sync each employee's enrollment and completion status across your training courses. 
- 
Automated Compliance Tests: Once you map your Udemy Business courses to compliance categories in Vanta, we run automated tests on your behalf, verifying that employees have completed required training. We verify that Udemy Business accounts are linked to active employees and that accounts belonging to terminated employees have been deactivated.
- 
Evidence Collection: Synced training records feed directly into Vanta's evidence library for supported compliance frameworks. Instead of collecting and uploading completion reports before each audit, we keep that evidence current automatically.
- 
Access Reviews: Udemy Business user accounts are surfaced in Vanta's Access Reviews. Reviewers can confirm whether access remains appropriate and generate audit-ready evidence from the same synced data.
- 
Course Assignment: After connecting, you can map individual Udemy Business courses to specific compliance categories directly in Vanta's integration settings. This controls which completions count toward which tests, so you have precise control over how training maps to your compliance requirements.
 

### Capabilities summary
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
User accounts | 
Yes | 
Access Reviews, automated account tests, personnel matching
 | 
Training courses | 
Yes | 
Mapped to compliance categories; powers training completion tests
 | 
Training enrollment and completion | 
Yes | 
Powers SAT compliance tests and evidence collection
 | 
Phishing simulation results | 
No | 
Not supported by this integration
 | 
MFA status | 
No | 
Not available from the Udemy Business API
 
 

## Permissions

### Read access
We read user accounts, training courses, and training enrollment and completion records from Udemy Business. This data is used to run compliance tests, match employees to training records, and collect evidence in Vanta.
 

### Write access
We have read-only access to Udemy Business. We do not create, modify, assign, or delete any data in Udemy Business including training enrollments, course assignments, or user records.
 
 

## Prerequisites
⚠️ Note: At the time of publishing, access to the Udemy Business API is only available through the Udemy Enterprise Plan. Confirm with your Udemy account manager if you have questions about this access.
Before starting setup, confirm the following: 
- 
You have a Vanta admin account. 
- 
You have a Udemy Business admin account. Admin access is required to create LMS/LXP integrations and retrieve API credentials.
- 
You’ve located your Subdomain. This is the part of your Udemy Business URL before .udemy.com <http://udemy.com>. 
Configuration required in Udemy Business before connecting: 
- 
You must create an LMS/LXP integration in Udemy Business to generate the credentials Vanta needs. You will do this in Step 1 of the setup guide below. Until this is done, Client ID and Client Secret are not available.
- 
Training courses must already be created and assigned to users in Udemy Business before you connect. We do not create or assign training. Courses only appear in Vanta after at least one user is enrolled in them.
- 
Employee email addresses in Udemy Business must match the email addresses on their Vanta personnel records. Mismatches will prevent completion data from linking correctly.
 
 

## Setup guide 
During setup you'll obtain the following four values from your Udemy Business portal and then enter them in Vanta:
 | 
Field | 
Description
 | 
Account ID | 
The unique identifier for your Udemy Business account. 
 | 
Subdomain | 
The company-specific prefix in your Udemy Business URL (e.g., company.udemy.com).
 | 
Client ID | 
The public identifier for your Udemy Business REST API integration.
 | 
Client Secret | 
The private key for your client ID to authenticate API requests. 
All of these values can be copied at any time from the integration screen in Udemy Business.
 
 

### Step 1: Create the integration in Udemy Business and copy the credentials
- 
Sign in to Udemy Business as an admin.
- 
Go to Manage, select Settings, then click on APIs & integrations, and then select the  LMS/LXP integrations tab.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402610580/37750b1e6330d94451aaaa21a7ec/e240a713-afd5-488e-bea5-806423260bde?expires=1794967200&signature=396f15b29e8d4ddb6d90c30a7dcc9e59de78aa435ef993f069e61ed6b4e0f106&req=diQnFM9%2FnYRXWfMW1HO4zQc94rPX6KWDLXh1tUN6pZ29y8QSW1sAescaUB5F%0ABEVH3lvd%2BLx%2B83%2BhYtI%3D%0A>
- 
Click Select an integration.
- 
Choose Other from the list.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402611363/68694d699fc644219e2114919a8d/f02c0377-a3d9-421a-b599-7b16ed687b7f?expires=1794967200&signature=b20723079b480df5740a8168abbfd15b2b2b4c9c1b06249287c964337223afb2&req=diQnFM9%2FnIJZWvMW1HO4zRlezddjaAkkmhO%2F91CZCFi23YbZp7wV8cAzvUWW%0Ayt1AxTZfi97gVZaNfow%3D%0A>
- 
In LMS/LXP name, enter Vanta (or any name you prefer to identify the integration).
- 
Leave the following options disabled:
- 
Auto enrollment.
- 
Learner activity tracking (xAPI).
- 
Click Save.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402613820/cf23b3a8931c8455d5877e15bea5/306b1eef-4a77-4af6-b2ed-65ce7d7108ec?expires=1794967200&signature=38a3cec72d5951864398b42983c78ca94b6c6686a8c7e2c68d0c1eb20eb8e253&req=diQnFM9%2FnoldWfMW1HO4zYh4W2%2F%2BHGBoSJzwk7UdH%2BaoPyk3eyqYe13IjLMe%0AyMgHvKBWiS7SM17Ybrs%3D%0A>
- 
Once saved, Udemy will display the Account ID, Subdomain, Client ID, and Client Secret values on the same screen. Copy each one.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402614722/db27faec12363673fb144675d990/da9e3960-22f0-448c-aef2-5946dd38aea2?expires=1794967200&signature=570e9998427dc7f203ba4421acda102b3297e4b1ebe156808a9ab451eb69f49a&req=diQnFM9%2FmYZdW%2FMW1HO4zWOOAklghojHKxl63Az7RwLNRNSZsGZvu1zdsXQa%0AHSUR70whtsEsIsH70Io%3D%0A>
- 
Save them temporarily in a secure place while you complete the setup in Vanta. If you ever need to view them again, you can return to this same screen.
 

### Step 2: Connect Udemy Business in Vanta
- 
In Vanta, go to Integrations. Search for Udemy in the Available tab.Click 'View details.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402616975/47ab9198dfeacc598de22d2d00f4/e849ec56-3102-46ab-8d59-a18dd55f7e93?expires=1794967200&signature=61b21b75f4566a69f828754dd03696de2408c44f60c1b76f31845ba8eb171992&req=diQnFM9%2Fm4hYXPMW1HO4zXzX3i%2BYtE8rl4uKwdEJ5khKss8YapR1A%2Fufb4a%2F%0AIUaGsFXRXVQ4jFDfkss%3D%0A>
- 
Click Connect.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402618059/e85d754974f61f8a2c3106fceb4e/a51fa229-a266-4dee-97e3-f2df0a0a2f48?expires=1794967200&signature=2d3fb25612459bd2b3b3171cab819645bf1ee990c0e4270bd28dc37db0be9fa8&req=diQnFM9%2FlYFaUPMW1HO4zW7YgqbKF2J2%2FmXaSiHnScW5sDsOZmcQXqu6uNN6%0AnJBl5YH1MoEumidEI%2BQ%3D%0A>
- 
Click Add Account.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402618971/cb71b440c9f14806d71f8bed5a30/040d0035-565a-4f64-8dbb-af1b6ac7ba37?expires=1794967200&signature=a0e1d3da3808bc7343cc3ed038c26d150317dd6862005b3e3fcd5db4dbfa2527&req=diQnFM9%2FlYhYWPMW1HO4zfaQfbc4duLmFkAT1IHHY9Eji3d%2FxeKwUGP%2Fy9M1%0AOrJWvtIagVhoLqCrkzs%3D%0A>
- 
Complete the form fields:
- 
Account name: Enter a name to identify this connection in Vanta (for example, "Udemy Business - US Employees"). You create this name — it does not come from Udemy Business.
- 
Then paste the values from step 1: 
- 
Account ID
- 
Subdomain
- 
Client ID
- 
Client Secret
- 
Click Save. 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402621739/cc672c8678bc6979b1364ceb44e1/b5cfe217-cf7a-4147-b5c4-3118cef7874d?expires=1794967200&signature=b9c51cde4fe9460c713160e99dc52b31a473315be9307423c110b0a74f8f2e00&req=diQnFM98nIZcUPMW1HO4zd1Kr5PdMPHRi2%2FAygzbwy5V7fKJCisyA6bsq%2FgX%0Afu4kHPPEvdqb2Y2PWOo%3D%0A>
- 
Vanta will validate the credentials against the Udemy Business API. Once accepted, Vanta will open the Choose security assignments screen so you can continue the setup.
​

### Step 3: Map training courses to compliance categories
- 
In the Choose security assignments modal, click Add an Assignment.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402623648/4f708dc9988aa6f647eceb47bb95/6b49bd13-f491-4019-9af0-334d610b6110?expires=1794967200&signature=64eaf5fc97371514004e52d9e31599e94303532ec845eeb5cce55c717695c13a&req=diQnFM98nodbUfMW1HO4zcff7Yg%2BYToVuKDYxuNn1NffROdvAnOOA9KzwXph%0APinx7c8EL%2BQL1BXd3q0%3D%0A>
- 
Click Choose an assignment and select the course. 
- 
Select the training categories you want to assign to the course.
- 
Assign each relevant course to one or more categories: General SAT, HIPAA, PCI, GDPR, CCPA, Insider Threat, Social Engineering, AI Risk, or Secure Code.
- 
Repeat these steps to map additional assignments, or click Delete on a new row to remove one. 
- 
Click Save.
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402624619/eb7d5b3b34326a0e7b1647aa0931/b1f0e18e-9e18-49b0-ad44-1ebf6dffb8aa?expires=1794967200&signature=00aa5c2d114c5317b8a285c73a18580029349ad2423771195ad8534f343dd1ce&req=diQnFM98mYdeUPMW1HO4zbbWq9fAwpBLvGGJRu4zHhnsM0PthK1OoLVoVHU7%0A7iEiYWykrtns%2BZ2%2B9xw%3D%0A>
 
ℹ️ Note: If you have multiple connections, use the Udemy Business Connection dropdown at the top of the modal to select which account you are configuring. Mappings are saved per connection, so repeat this process for each connected account.
⚠️ Note: Courses only appear in this modal after at least one user is enrolled in them in Udemy Business. If you expect to see a course but it is not listed, confirm that it has active enrollments in your Udemy Business admin portal before returning here.
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402627509/a225880a5fd7a07731b4cb6d8506/f19ec3e5-46e0-4f51-8034-e295dbcf5abe?expires=1794967200&signature=27e88d3ad0b6373fbe6acfffdfcdd67635cbc024bb3b4852ca68c74c60cd7534&req=diQnFM98moRfUPMW1HO4zZFCbwIGD8UY0wNnX5WLxA%2BwVn%2BfpgrU%2BGV8oSMJ%0AJU4zH%2B9vk0trcP8yTaY%3D%0A>
 
 

### Step 4: Configure training requirements for employees 
Connecting the integration does not automatically assign training to employees in Vanta. After mapping your courses in Step 3, you need to tell Vanta which training categories each group of employees is required to complete.
- 
In Vanta, go to Personnel and then go to People. Select the Groups tab. Then click the group you want to configure (for example, Engineering).
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402629057/fc4c084db7ee995928ba9ee3b3a9/4e9721c5-2ae2-4158-9dfe-8dcdf6588c49?expires=1794967200&signature=72d26ff8973f63ddc557f845dde284587297be367f560bebf5c58fb51e28c001&req=diQnFM98lIFaXvMW1HO4zfn8MZ2NYJPgpl76r8xoFWJi9%2B%2B2y3XOL6irwz7O%0AXzJH%2FZue29lxo8%2FkZbc%3D%0A>
- 
On the group’s page, find the row labeled Trainings and open it. A modal opens where you can configure training for this group. 
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402630101/dad2494db2f7d4d61606cd6c9fd8/931117b4-57d9-4078-ae0d-c33da0fec10f?expires=1794967200&signature=597e16dbe07622088e3b81e43c21382fc25dde499541eff9ded8c9fb4b96bcfe&req=diQnFM99nYBfWPMW1HO4zc5eEMUHAIoaSoZxKrtNs0fHYTmtLWcedQAZQZPG%0Aj6lQjxveQv5iP44RFtM%3D%0A>
- 
Each available training category appears as a toggle (General is always first). Turn on the toggle for every category employees in this group must complete. 
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402630981/fbd1492f546740edfcd492051298/288ba674-76c1-4f94-b49e-c319d388884c?expires=1794967200&signature=fa1e6fc1eae2f3cf2f90062e98bd88934cad268f7b8a869021929b7b015d83c9&req=diQnFM99nYhXWPMW1HO4zXAsE1%2B%2Bcjs%2FzWlPYS203iqi7RYv04n7zaEwzLrE%0A98Mc0ZpVoisKB5zvOlA%3D%0A>
- 
When you turn a category on, three source options appear: 
- 
Vanta training: use Vanta’s built-in video training. 
- 
Integration training: use the Udemy Business assignments you mapped in Step 3. The card shows a summary of which assignments are linked (for example, 2 from Udemy Business: Annual Security Awareness 2026, Q4 Compliance Refresher). 
- 
Custom training: provide your own URL and instructions. 
- 
To use Udemy Business, select Integration training. To change which Udemy Business assignments are used for a category, click the three dot menu on the card and choose Edit. 
- 
Click Save inside the Manage trainings modal. The modal closes and you return to the group’s page. Your changes are not applied yet.
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402632278/b309c2e988ce595a5c4c24cc37a3/5764158c-1b80-44cd-a04f-bcc960a7945f?expires=1794967200&signature=89b3bfb67627f344211ce555cad7bbb2b226175fbb79a5c80822dcebe5aa6ac7&req=diQnFM99n4NYUfMW1HO4zQRwRGKAWAWL4lTIJ4mDAZsJn7RtYzJv5Yj9lXdY%0ABjEw5d5a5wDLU19rfak%3D%0A>
- 
On the group’s page, click Save to review your changes. The Review changes and save modal opens, summarizing what is about to change. 
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402633069/f71a28532fdc7d607bc2df4ccb9f/39b39175-438c-48d4-acf9-2b3642fa9fb7?expires=1794967200&signature=874dc5c2aa6fd33472cf845067d799c7f35fc64c60c63388b0a9f7469b3e7853&req=diQnFM99noFZUPMW1HO4zfI5BrObjqYXK%2FIWACD5IcjgvjG1zB7UO5%2B8Typq%0AchHcHFzY73zi8cmoGps%3D%0A>
- 
Click Save in the Review changes and save modal to confirm. Employees in this group will now see the assigned Udemy Business training in their tasks. 
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402634139/288f9d8a6a541badc5a1aad8be63/3d55b858-b0df-4f8a-be27-2505598ef411?expires=1794967200&signature=456d0624dac1c9c67d8659be0cf2add899306163ef3841377107df939aef0b57&req=diQnFM99mYBcUPMW1HO4zcDzcoPKLUPZ%2BEQE2UqM4FFex4kCXW%2F6WiukPnIK%0ALZNBaRO1ZCzA%2F%2BAIVZY%3D%0A>
- 
A confirmation dialog appears: You updated tasks for [group name]. From here you can: 
- 
Click Dismiss to close the dialog. Your changes are already applied. 
- 
Click Enable recurring reminders to go to Settings > Company Notifications where you can configure automatic periodic email reminders for employees with outstanding tasks.
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2402636680/2dfeae755ea7bdd2202fd7d9fa63/dc961121-efa7-4424-9b50-932096517b97?expires=1794967200&signature=5e99fc4bb4f407315ca1b416806320621c539a2bae5853711b6dffc2a782a093&req=diQnFM99m4dXWfMW1HO4zRK9DvBHzfx6QyMNX2BbIckT4ERhOgYXOLbt%2FX8j%0AB6OlWumm6IeMS4GXPjY%3D%0A>
💡 Tip: Repeat these steps for each group that requires training.
 
 

## Troubleshooting and FAQs 

### The LMS/LXP integrations option is not visible in my Udemy Business account
- 
Likely cause: Your Udemy Business account is not on the Enterprise Plan, or your user does not have administrator permissions.
- 
How to confirm: Log in to Udemy Business and navigate to Manage > Settings > APIs & integrations. If the LMS/LXP integrations option is missing, your account plan or role may be restricting access.
- 
Fix: Confirm your account is on the Enterprise Plan by contacting your Udemy Business account manager. Confirm that your Udemy Business user has full administrator permissions.
 

### Connection fails when I try to save my credentials in Vanta
- 
Likely cause: One or more of the credential values entered — Subdomain, Account ID, Client ID, or Client Secret — is incorrect or was copied with extra spaces.
- 
How to confirm: Return to your Udemy Business LMS/LXP integration screen (Manage > Settings > APIs & integrations > LMS/LXP integrations) and compare each value against what was entered in Vanta.
- 
Fix: Re-enter the correct values in Vanta. Use the Copy to clipboard button in Udemy Business to avoid transcription errors.
 

### Training shows as incomplete for employees who have completed it in Udemy Business
- 
Likely cause: One or more of the following:
- 
The employee's email in Udemy Business does not exactly match their Vanta personnel record.
- 
The training course has not been mapped to a compliance category in Vanta.
- 
Training has not been enabled for the employee's group in Vanta.
- 
The sync has not yet run since the completion was recorded.
- 
How to confirm: Check the employee's email in both Udemy Business and Vanta for exact matches. Confirm the course is mapped under Integrations > Udemy Business > Update Settings. Confirm training is enabled for the group under Personnel > People > Groups > [select group] > Trainings.
- 
Fix: Correct any email mismatches. Complete course mapping under Update Settings. If training is not yet enabled for the group, open the relevant group, find the Trainings row, turn on the required training categories, and select Integration training as the source. Allow up to one hour for the next sync to run.
 

### The manual evidence document for security awareness training is still showing after connecting
- 
Likely cause: Manual evidence documents are not automatically deactivated when an integration is connected.
- 
Fix: Once you have confirmed the integration is syncing correctly, manually deactivate the document by navigating to it, clicking the three-dot menu, and selecting Deactivate.
- 
How to confirm: Navigate to the integration in Vanta and verify that training records are actively syncing. Check that at least one employee’s completion is reflected in Vanta before deactivating the manual evidence document.

## Images

- [image 01] ../../images/integrations/udemy-business/connecting-vanta-udemy-business--01.png
- [image 02] ../../images/integrations/udemy-business/connecting-vanta-udemy-business--02.png
- [image 03] ../../images/integrations/udemy-business/connecting-vanta-udemy-business--03.png
- [image 04] ../../images/integrations/udemy-business/connecting-vanta-udemy-business--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-udemy-business--05.png
- [image 06] ../../images/ux/integrations/connecting-vanta-udemy-business--06.png
- [image 07] ../../images/ux/integrations/connecting-vanta-udemy-business--07.png
- [image 08] ../../images/ux/integrations/connecting-vanta-udemy-business--08.png
- [image 09] ../../images/integrations/absorblms/connecting-vanta-absorblms--02.png
- [image 10] ../../images/integrations/absorblms/connecting-vanta-absorblms--03.png
- [image 11] ../../images/integrations/udemy-business/connecting-vanta-udemy-business--11.png
- [image 12] ../../images/ux/personnel/connecting-vanta-absorblms--05.png
- [image 13] ../../images/ux/personnel/connecting-vanta-absorblms--06.png
- [image 14] ../../images/ux/personnel/connecting-vanta-absorblms--07.png
- [image 15] ../../images/ux/personnel/connecting-vanta-absorblms--08.png
- [image 16] ../../images/ux/personnel/connecting-vanta-absorblms--09.png
- [image 17] ../../images/ux/personnel/connecting-vanta-absorblms--10.png
- [image 18] ../../images/ux/personnel/connecting-vanta-absorblms--11.png
