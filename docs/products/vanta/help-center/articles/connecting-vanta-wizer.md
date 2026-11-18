# Connecting Vanta & Wizer

Source: https://help.vanta.com/en/articles/13853905-connecting-vanta-wizer
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Security Awareness Training
Fetched: 2026-11-17

## Article text

## Overview
The Wizer integration connects Vanta to the Wizer Security Awareness Training platform via API Key and Company ID. Once connected, we sync user accounts, training courses, and training completion records from Wizer. This integration is most useful for Security and IT teams using Wizer to deliver and track employee security training. 
 
Estimated setup time: 10-15 minutes
 
 

## Use cases and capabilities
- 
Training Completion Tracking: Connect Wizer and we automatically sync each employee's enrollment and completion status across your training courses. Completion data updates every hour, so Vanta always reflects current status without manual uploads or spreadsheet exports.
- 
Automated Compliance Tests: Once you map your Wizer training courses to compliance categories in Vanta, we run up to 11 automated tests on your behalf — verifying that employees have completed required training. We also verify that Wizer accounts are linked to active employees and that access is revoked when someone leaves.
- 
Evidence Collection: Synced training records feed directly into Vanta's evidence library for supported compliance frameworks. Instead of collecting and uploading completion reports before each audit, we keep that evidence current automatically.
- 
Access Reviews: Wizer user accounts are surfaced in Vanta's Access Reviews. Reviewers can confirm whether access remains appropriate and generate audit-ready evidence from the same synced data.
- 
Course Assignment: After connecting, you can map individual Wizer training courses to specific compliance categories directly in Vanta's integration settings. This controls which completions count toward which tests, so you have precise control over how training maps to your compliance requirements.

### Capabilities summary
 | 
Resource | 
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
Not currently synced
 | 
MFA status | 
No | 
Not available from the Wizer API
 
 

## Prerequisites
Before starting setup, confirm the following: 
 

### Account access
- 
You have a Vanta admin account. 
- 
You have a Wizer admin account with API access. This requires a paid or enterprise plan. Once confirmed, you must enable API access in your Wizer account.

### Data requirements
- 
Training courses must already be created and assigned to users in Wizer before you connect. Vanta doesn't create or assign training.
- 
Employee email addresses in Wizer must exactly match the email addresses on their Vanta personnel records. Mismatches will prevent completion data from linking correctly.
- 
The compliance frameworks relevant to your organization are enabled in Vanta. The training categories available during setup (HIPAA, PCI-DSS, GDPR, etc.) depend on which frameworks your organization has turned on in Vanta. If a category you expect is missing, go to Settings (gear icon), then select Frameworks in the Monitoring section to confirm. 

### Before you start
- 
Locate your Company ID and API Key in the Wizer admin dashboard under Account Settings > API & Integration. You'll need both during setup.

### Optional: 
- 
A Wizer Boost subscription is required if you want to sync Wizer4Defense (W4D) developer-focused training courses. Standard awareness training courses sync regardless of subscription tier.
 
 

## Permissions

### Read Access 
We use the API key and Company ID to read user accounts, training courses, and training completion records from Wizer. This data is used to run compliance tests and collect evidence in Vanta.
 

### Write Access 
We have read-only access to Wizer. We don’t create, modify, assign, or delete any data in Wizer.
 
ℹ️ Note: Wizer API keys are generated from a full admin account and grant both read and write access by default, as Wizer does not currently offer granular permission scopes. Regardless of the permissions the key carries, Vanta will only make read calls to Wizer — no write operations are performed.
 
 

## Setup guide

### Step 1: Retrieve your credentials from Wizer
- 
Log in to the Wizer admin dashboard <https://admin.wizer-training.com/>.
- 
Go to Account Settings.    
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325778684/e214298bdd2a11bddaf2d52f17c3/1fc26d9a-e7f3-4573-a10a-7a045b748720?expires=1794967200&signature=06bc305a109c62f7b5dc5817ec7913acd129ab6037265647724c497948603bc6&req=diMlE855lYdXXfMW1HO4zdUh2MVWfP1MLXANdEZ7dUmgG7HqeovAENVDPMdl%0Ag3S8K%2BX4n1%2FEGPl4xqw%3D%0A>
- 
Then select the API & Integration tab.
- 
Copy your Company ID and API Key (you will need both in the next steps).
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325779700/860d1127426f26e32a5c0e48d59c/2719d848-446b-43c2-8ecc-137d9b6ff11e?expires=1794967200&signature=2360986b296e8d0fff2f2afc9bdc6e831ec3fec36770819d9f130ea8fa290739&req=diMlE855lIZfWfMW1HO4zbZfbh3bQdGgJ3xtQntMagyyunPwvdtygxQ3VJ9o%0A7xMATRLzRsIy0rLFSC8%3D%0A>
 

## Step 2: Add the Wizer integration in Vanta
- 
In Vanta, go to Integrations. 
- 
Search for Wizer in the Available tab. Click View details.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325781433/8c2cd3925986f4fe41c1f859148e/2413efc0-d7df-4cae-8069-9216b6a6a320?expires=1794967200&signature=9d4b8f65b3465ac3039bb7993350ba491046b660f42f29ce205e85819986e4ca&req=diMlE852nIVcWvMW1HO4zXY1CiuBddfHespPZfEOplj7z238VZjR64VuwHqo%0Azj1GxXZ7%2FkP68drQ1nU%3D%0A>
- 
Then click Connect. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325782704/cdc3f7edbec4e5ac423accfa0511/8e6801e5-bd48-4fa1-a30a-5f436a4dc904?expires=1794967200&signature=4b7429aecd8c070aca7a04192f81ce4a02573ad606605aaaf2f8f3c90172a0a0&req=diMlE852n4ZfXfMW1HO4zRLvJ2Jd56hwmffv7GmCaBqaP8sbdHCQAXN5TkY4%0AqQ7hMdBJyTMXIja0%2BB0%3D%0A>
- 
Click Add Connection. 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325783655/e3318953a1cae93ddb6a4413102b/761a87bb-28f3-4931-98f9-fad72a320d41?expires=1794967200&signature=4dcb5739e108c327a8a7eaf1a7639b54984201c6b0be952ce95b730b69b9763a&req=diMlE852nodaXPMW1HO4zV69thnq8zXWjAACj0fxItiilrwwF8WKmD%2BbAXFc%0ANGVYWe7GNyZ5eBHKMyA%3D%0A>
 

## Step 3: Enter your credentials
- 
In the connection modal, fill in the following fields from the Wizer API & Integration tab:
- 
Account Name (optional): A display label to identify this connection. It’s useful if you connect more than one Wizer account. 
- 
Company ID 
- 
API Key 
- 
Click Store token.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325785283/ad863f16e7b269894e13155ac447/57f9c8c1-071a-4cd4-9485-36a2b4482ceb?expires=1794967200&signature=3af19f853484952531eb88461542295df7c3a1a3ee309535b1d0fcbeac897803&req=diMlE852mINXWvMW1HO4zTFUiO7WzLsHxc4NN6sw%2BjeiaxAqy8pCmhgn2Opa%0AJ2n9AcNgPIjMhR8j0eo%3D%0A>
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325786716/9d85b6ca89cc73db4397e8aff87f/d8a2413f-2d71-409b-ba4b-2178162903b9?expires=1794967200&signature=a42d549dc1011294637d4241a3af3a9b4ba6469ed3137f7f11d5221ea66b5b1a&req=diMlE852m4ZeX%2FMW1HO4zeGrjvT8I40dOKxETgTtTzRWbsz2s4nIIB6OVOZz%0AyB1z3Te5kryyjltSAcU%3D%0A>
ℹ️ Note: We support connecting more than one Wizer account. Each connection is identified by its Account Name (set during setup) and Company ID. To add a second connection, click Edit on the Wizer integration page and then Add Connection.
Vanta will validate the credentials against the Wizer API. Once validated, the Choose security assignments modal will open so you can continue the setup. 
 

## Step 4: Map training courses to compliance categories
After the connection is created: 
- 
In the Choose security assignments modal, click Add an Assignment.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325789248/3e70b1770b62748eacdfcb1cb6cf/dab68fef-0b21-43da-aba6-59b71e66ff3c?expires=1794967200&signature=d980b0a82fec94481994cb4317ca6b4bc44317eddfab25a857db196abf0f7209&req=diMlE852lINbUfMW1HO4zbQG2hIVnFW8%2FHLFDVn1cW73Jhp1rQ1N3njHQmo1%0A%2BGtSPdFDzzawf93Ym2A%3D%0A>
- 
Click Choose an assignment and select the course. 
- 
Select every training category the assignment covers. For example:
- 
A general course like "Cybersecurity Basics" → check General Security Awareness.
- 
A combined privacy course → check GDPR, CCPA, and HIPAA.
- 
A developer-focused course → check Secure Code.
- 
Supported categories include:
- 
General Security Awareness
- 
HIPAA
- 
PCI-DSS
- 
GDPR
- 
CCPA
- 
Insider Threat
- 
Social Engineering
- 
AI Risk
- 
Secure Code
- 
Repeat these steps to map additional assignments, or click Delete on a new row to remove one. 
- 
Click Save.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325791186/cdb9a68b813c517117a3287eab3d/824f99c7-d306-41c4-bc8f-8c3bf63d9cd2?expires=1794967200&signature=2bc21761d279e110bd5296ae39b65070c7cf89adfc19160330d10be33654fb6a&req=diMlE853nIBXX%2FMW1HO4zW3NX1RL8PJ%2FhhjY8Rvq0ng0M0m5JhS3Xq0Rn5a6%0Ak63AqMpESTsX9UQ4kYs%3D%0A>
💡 Tip: If you have multiple Wizer connections, use the Wizer Connection dropdown at the top of the modal to select which account you are configuring. Mappings are saved per connection, so repeat this process for each connected account.
 

## Step 5: Configure training requirements for employees 
Connecting the integration does not automatically assign training to employees in Vanta. After mapping your courses in Step 4, you need to tell Vanta which training categories each group of employees is required to complete.
- 
In Vanta, go to Personnel and then go to People. Select the Groups tab. Then click the group you want to configure (for example, Engineering).
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325794067/a387e560b603d5a95c228f8fc986/fccfd4e9-99db-4743-ae71-9a7371572b29?expires=1794967200&signature=95f474a2826aa17d5e1647c50874be2d083cf6419b9a89d8348a2a7caeae5686&req=diMlE853mYFZXvMW1HO4zdLjyNSAMyz5SuhDIQYxEx4ivPUlwt0m7hbBJGTR%0ABmnE9nYUhYOtayfAies%3D%0A>
- 
On the group’s page, find the row labeled Trainings and open it. A modal opens where you can configure training for this group. 
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325794788/64d3634b8ead314274e70e9e8156/c39edab7-ddc0-4ce5-a454-57f1893a641e?expires=1794967200&signature=4aad11c207b87338eef5a5211bff07e498f3a2821fa65bfbb0767dad89b56c24&req=diMlE853mYZXUfMW1HO4zfGYpuurRgH3ex5l2zLILq9DkDcDDxUMhw0UyBuJ%0AKInvxU5cIYF8AxwGGVo%3D%0A>
- 
Each available training category appears as a toggle (General is always first). Turn on the toggle for every category employees in this group must complete. 
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325795552/d58c388239ad9b8999aa68084998/1f1fc289-c468-4481-a49d-7b67401c6b9f?expires=1794967200&signature=43fe3592abeecadb879fcb0fd5cc7570a1dc843286361c8ddc1120142355d3eb&req=diMlE853mIRaW%2FMW1HO4ze038A88TWzcvIzAQtputuppf0qmsYib5bGT4KV7%0A8E5qUZ3ud4heYnMOtck%3D%0A>
- 
When you turn a category on, three source options appear: 
- 
Vanta training: use Vanta’s built-in video training. 
- 
Integration training: use the Wizer assignments you mapped in Step 4. The card shows a summary of which assignments are linked (for example, 2 from Wizer: Annual Security Awareness 2026, Q4 Compliance Refresher). 
- 
Custom training: provide your own URL and instructions. 
- 
To use Wizer, select Integration training. To change which Wizer assignments are used for a category, click the three dot menu on the card and choose Edit. 
- 
Click Save inside the Manage trainings modal. The modal closes and you return to the group’s page. Your changes are not applied yet.
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325796749/644eed6d291f025ebd25ef9dd1c3/716d3451-03e1-4880-85fa-bf82b3cb230c?expires=1794967200&signature=68ffb1b801b8667eb8cffe4a58f75355343e67652cf3c20924ad5f39ef649ae4&req=diMlE853m4ZbUPMW1HO4zTk4zuuUHbymDCUjCRwbRF3%2F8v7BoBlVwbL1bCVv%0AbdYsSsWu4iRq2L8Uf0w%3D%0A>
- 
On the group’s page, click Save to review your changes. The Review changes and save modal opens, summarizing what is about to change. 
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325797556/da98c6c112a302a622906ff1124b/825305dc-4bba-4839-8b95-eec6fabc2f4c?expires=1794967200&signature=e5007114ddc4af109c5115665f91cf7619c550db5d8402acef2342f92efa7584&req=diMlE853moRaX%2FMW1HO4zW78Iye09kh1NomfiqgfpawpORW%2FUuQphtWE8qFj%0Az1x5LWSMvL5KnFjRmY8%3D%0A>
- 
Click Save in the Review changes and save modal to confirm. Employees in this group will now see the assigned Wizer training in their tasks. 
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325798278/e842cdd5ab56433dc874ef3452ad/1c2cbe67-408c-4461-a9b7-455974c8c7d7?expires=1794967200&signature=41e22b5956e291777e9b460a2e14c842321e92e09c4fcc56e3484274db2d2c1d&req=diMlE853lYNYUfMW1HO4zQU93bUWZW9SzAvGXqLR9J0MdWSBU1qW5RPsgJx3%0ANIoum6wYW2I6dBE4IQ4%3D%0A>
- 
A confirmation dialog appears: You updated tasks for [group name]. From here you can: 
- 
Click Dismiss to close the dialog. Your changes are already applied. 
- 
Click Enable recurring reminders to go to Settings > Company Notifications where you can configure automatic periodic email reminders for employees with outstanding tasks.
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2325799085/3fd97f8434a9029a0b59dbf6747d/70d8bc80-fb76-4a07-9978-fa5f18509542?expires=1794967200&signature=eef1c1babe5d98c93ec786705d7f9db78ec2ac287a899fa6e32101cfad2cd656&req=diMlE853lIFXXPMW1HO4zUueR7L3rv9ubhNIhj%2B86e2V3kx0Cs71GftHVNbK%0ARonBdYM%2F0auKwv2ZUMc%3D%0A>
 
Repeat these steps for each group that requires training. 
 
 

## Troubleshooting and FAQs

### "Failed to validate Wizer credentials" error during setup
- 
Likely cause: The Company ID or API Key entered is incorrect, or the API Key has been revoked.
- 
How to confirm: Log in to Wizer and navigate to Account Settings > API & Integration. Confirm the Company ID and API Key match what was entered in Vanta.
- 
Fix: Re-enter the correct Company ID and API Key and try again. If the key was revoked, generate a new one in Wizer first.
 

### Training shows as incomplete for employees who have completed it in Wizer
- 
Likely cause: One or more of the following:
- 
The employee's email in Wizer does not exactly match their Vanta personnel record
- 
The training course has not been mapped to a compliance category in Vanta
- 
Training has not been enabled in the employee's task set in Vanta
- 
The sync has not yet run since the completion was recorded
- 
How to confirm: Check the employee's email in both Wizer and Vanta for exact matches. Confirm the course is mapped under Integrations > Wizer > Update Settings. Confirm training is enabled for the group under People > Groups > [select group] > Trainings.
- 
Fix: Correct any email mismatches. Complete course mapping under Update Settings. If training is not yet enabled for the group, go to People > Groups, open the relevant group, find the Trainings row, and turn on the required training categories. Select Integration training as the source and save. Allow up to one hour for the next sync.
 

### “Security training not configured” showing for employees
- 
Likely cause: Training has not been enabled for the employee's group in Vanta. Connecting the integration does not automatically assign training.
- 
Fix: Go to People > Groups and open the relevant group. Find the Trainings row and turn on the required training categories. Select Integration training as the source, then save through both the Manage trainings modal and the group page. Allow up to one hour for the next sync to reflect the change.
 

### Only some employees’ training completions are appearing
- 
Likely cause: Email address mismatches between Wizer and Vanta personnel records are the most common cause. Vanta matches completion records to employees by email — any mismatch will cause that employee's data to be excluded.
- 
Fix: Review employee email addresses in both Wizer and Vanta and correct any discrepancies, including differences in capitalization, formatting, or aliases.
 

### The manual evidence document for security awareness training is still showing after connecting
- 
Likely cause: Manual evidence documents are not automatically deactivated when an integration is connected.
- 
Fix: Once you have confirmed the integration is syncing correctly, manually deactivate the document by navigating to it, clicking the three-dot menu, and selecting Deactivate.
 

### W4D courses are not appearing in Vanta
- 
Likely cause: Your Wizer account does not include a Boost subscription, which is required to access W4D course data.
- 
Fix: No action is required. Standard awareness training courses will continue to sync normally. If you need W4D course data, contact Wizer to add the Boost subscription to your account.

## Images

- [image 01] ../../images/integrations/wizer/connecting-vanta-wizer--01.png
- [image 02] ../../images/integrations/wizer/connecting-vanta-wizer--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-wizer--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-wizer--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-wizer--05.png
- [image 06] ../../images/integrations/wizer/connecting-vanta-wizer--06.png
- [image 07] ../../images/integrations/wizer/connecting-vanta-wizer--07.png
- [image 08] ../../images/integrations/absorblms/connecting-vanta-absorblms--02.png
- [image 09] ../../images/integrations/absorblms/connecting-vanta-absorblms--03.png
- [image 10] ../../images/ux/personnel/connecting-vanta-absorblms--05.png
- [image 11] ../../images/ux/personnel/connecting-vanta-absorblms--06.png
- [image 12] ../../images/ux/personnel/connecting-vanta-absorblms--07.png
- [image 13] ../../images/ux/personnel/connecting-vanta-absorblms--08.png
- [image 14] ../../images/ux/personnel/connecting-vanta-absorblms--09.png
- [image 15] ../../images/ux/personnel/connecting-vanta-absorblms--10.png
- [image 16] ../../images/ux/personnel/connecting-vanta-absorblms--11.png
