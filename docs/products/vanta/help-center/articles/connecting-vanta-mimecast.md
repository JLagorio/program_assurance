# Connecting Vanta & Mimecast

Source: https://help.vanta.com/en/articles/15117134-connecting-vanta-mimecast
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Security Awareness Training
Fetched: 2026-11-17

## Article text

## Overview
This integration connects your Mimecast Engage (Awareness Training) account to Vanta using the OAuth 2.0 Client Credentials grant via a Custom API 2.0 application. You'll provide a Client ID and Client Secret; there is no browser-based authorization redirect. Once connected, we sync user accounts, training campaigns, and per-user training completion records from Mimecast. We use this data to evaluate whether employees have completed required security awareness training as part of your compliance program. You map specific Mimecast campaigns to SAT categories in Vanta, and we track completion against those assignments for each person in scope.
 
⚠️ Note: We sync only global training campaigns those distributed to the entire organization. Targeted campaigns assigned to specific individuals or groups are not exposed by the Mimecast API and will not appear in Vanta. This is a Mimecast platform limitation. If your organization relies on targeted campaigns to meet a compliance requirement, you will need to either convert those campaigns to global campaigns in Mimecast, or supplement the relevant compliance category with Vanta's built-in training or a custom training source. See the Troubleshooting section for details.
 
This integration is most useful for:
- 
Security and IT teams using Mimecast Engage to deliver and track employee security awareness training who need to demonstrate completion in Vanta
- 
Teams managing training requirements across multiple compliance frameworks, such as SOC 2, HIPAA, PCI-DSS, or GDPR
Estimated setup time: 15-20 minutes
 
 

## Use cases and capabilities
- 
Training Completion Tracking: Connect Mimecast and we automatically sync each employee's enrollment and completion status across your global training campaigns. Completion data updates consistently, so Vanta always reflects current status without manual uploads or spreadsheet exports.
- 
Automated Compliance Tests: Once you map your Mimecast campaigns to compliance categories in Vanta, we run automated tests on your behalf, verifying that employees have completed required training. We also verify that Mimecast accounts are linked to active employees and that access is revoked when someone leaves.
- 
Evidence Collection: Synced training records feed directly into Vanta's evidence library for supported compliance frameworks. Instead of collecting and uploading completion reports before each audit, we keep that evidence current automatically.
- 
Access Reviews: Mimecast user accounts are surfaced in Vanta's Access Reviews. Reviewers can confirm whether access remains appropriate and generate audit-ready evidence from the same synced data.
- 
Campaign Assignment: After connecting, you can map individual Mimecast training campaigns to specific compliance categories directly in Vanta's integration settings. This controls which completions count toward which tests, so you have precise control over how training maps to your compliance requirements.

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
Training campaigns (global) | 
Yes | 
Mapped to compliance categories; powers training completion tests
 | 
Training enrollment and completion | 
Yes | 
Powers SAT compliance tests and evidence collection
 | 
Targeted campaigns | 
No | 
Not exposed by the Mimecast API (platform limitation)
 | 
Phishing simulation results | 
No | 
Not currently synced
 | 
MFA status | 
No | 
Not available from the Mimecast API
 | 
Last login time | 
No | 
Not available from the Mimecast API
 
 

## Permissions

### Read access
We use the Client ID and Client Secret from your Mimecast Custom API 2.0 application to read data from your Mimecast account. Although the application requires product-level access to two Mimecast feature areas, Vanta performs read-only operations only. With this access, we read:
- 
Internal user accounts: active users in your Mimecast instance, including name and email address. Used to match employees to Vanta personnel records, power Access Reviews, and evaluate account-level compliance tests.
- 
Awareness Training campaign metadata: global training campaigns in your Mimecast instance. Used to populate the campaign mapping interface in Vanta so you can assign campaigns to SAT categories.
- 
Training enrollment and completion records: per-user enrollment and completion status for each campaign. Used to evaluate training completion against assigned SAT categories and generate evidence in Vanta.

### Write access
We do not create, modify, or delete any data in Mimecast.
 
ℹ️ Note: Mimecast's Custom API 2.0 permission model is scoped by feature area. Vanta requires read access to two areas only: Account Management (for user data) and Awareness Training (for training data). We recommend creating a dedicated administrator role in Mimecast with only these two permissions to limit the scope of access granted to Vanta.
 
 

## Prerequisites
⚠️ Note: The Mimecast Awareness Training endpoints require the Engage / Awareness Training package. Confirm your Mimecast subscription includes this package before starting. Without it, the API returns a Forbidden error on training endpoints and the integration will fail to validate.
 
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have a Mimecast admin account with access to the Mimecast Admin Console.
- 
Create a dedicated Read-Only Administrator role in Mimecast following Mimecast's guide <https://mimecastsupport.zendesk.com/hc/en-us/articles/34000769966099-Roles-Managing-Administrator-Roles>. The role must be granted: Directories, Read and Awareness Training, Dashboard, and Read permissions.
- 
Confirm your Mimecast subscription includes the Engage / Awareness Training package. Without it, training endpoints return a Forbidden error and the integration will not validate.
- 
Know which Mimecast API region applies to your account: Global (api.services.mimecast.com), US (us-api.services.mimecast.com), or UK (uk-api.services.mimecast.com). Choose Global unless you have a specific data-residency requirement. According to Mimecast, Global routes to the nearest available region.
- 
Training campaigns are already created and distributed as global campaigns in Mimecast before connecting. We sync enrollment and completion data for global campaigns only. Targeted campaigns are not visible to the API.
- 
Employees' email addresses in Mimecast must exactly match their Vanta personnel records. Any difference (including domain aliases, capitalization, plus-addressing, or alternate email formats) will prevent a match.
- 
The compliance frameworks relevant to your organization are enabled in Vanta. The SAT categories available during setup depend on which frameworks your organization has turned on. To confirm, go to Settings (gear icon) > Frameworks in the Monitoring section.
 
 

## Setup guide

### Step 1: Create a read-only Administrator role
- 
Log in to the Mimecast Admin Console <https://login-usb.mimecast.com/>.
- 
Navigate to Account > Admin Roles. Then click on New Role.
- 
Give the role a name and description of your preference – You'll need it later when setting up the Custom API 2.0 application
- 
In the Security Permissions section, select Cannot Manage Roles
- 
In the Application Roles section, unselect everything, keeping only
- 
Directories - Read in all subsections
- 
Awareness Training - Awareness Training Dashboard - Read
- 
Click Save and Exit
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993029/9b6977a086b6f2c9931c51df1927/afbf3826-7747-481d-a7dd-066c13c999f2?expires=1794967200&signature=24e1afa3d889683b79982673348580aca209d05ff61b5c3ec3c2af6113c0e1f0&req=diQvFcB3noFdUPMW1HO4zXmljh5HOfTGSURjAZjcDXxwVB0viborb9NI9vvY%0AJGkXuoZ7wDcnl2HFt8w%3D%0A>
 
 

### Step 2: Create a Custom API 2.0 application in Mimecast
- 
Log in to the Mimecast Admin Console.
- 
Navigate to Integrations > API and Platform Integrations, then click Mimecast API 2.0.
- 
Create a new Custom API 2.0 application. Follow Mimecast's setup guide <https://mimecastsupport.zendesk.com/hc/en-us/articles/34000360548755-API-Integrations-Managing-API-2-0-for-Cloud-Gateway> for full detail.
- 
Assign the application both of the following products:
- 
Account Management
- 
Awareness Training
- 
Save the application, then generate a new credential. Copy the Client ID and Client Secret, you will need them in Step 3.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993027/e41d70a208e16bacc339830a135e/6adcc8f1-953a-4f3e-b419-72df75dbf09a?expires=1794967200&signature=b899ae159e9746736639eddade9599efb4e82d51e322899ee244fdba8c208f9b&req=diQvFcB3noFdXvMW1HO4zWZ394SxfCJ2SFWhOeTxX46dsHh7nPFVcwtDBMCu%0Al8rXX59MREdy4Iu6INs%3D%0A>
 
⚠️Note: Store the Client Secret securely. Mimecast will not display it again after the credential is generated. If you lose it, generate a new credential on the same application.
 

### Step 3: Find the Mimecast integration in Vanta
- 
In Vanta, go to Integrations. Click Add integration. 
- 
Search for Mimecast. Click the integration card. 
- 
Click Connect. 
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993025/70fa5fdca471a1bbcd0e33f8db1f/f6cde042-022c-49e0-acff-2afa1d27cc05?expires=1794967200&signature=421295ae6b8e47bbd9212d88bc0d6b36bf43ce7ed1f352483074c157a7751439&req=diQvFcB3noFdXPMW1HO4zQVro%2BLd8ItXpx7Vcu0THm2MusuJOw7gVYIC%2BvIp%0Al65Wv2XwF2qJmpmmaLQ%3D%0A>
 
- 
Click Add connection. 
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993028/2d62abd4bc9ef397b9747a805e01/2664b6fe-f6e8-45d1-95ad-74ae6c399ce6?expires=1794967200&signature=d0d34845fd43a25ec043a4998fc9c821a549d2a2dfb451441492d82527d9be7e&req=diQvFcB3noFdUfMW1HO4zaODj9GGny0%2BB2R%2BejiYr4IedS86rYpDxMD3%2FgKT%0Aaz52CyVcpbysQd76SXM%3D%0A>
 

### Step 4: Enter your Mimecast credentials
- 
Fill in the following fields:
- 
Account Name (optional): A display name to identify this connection in Vanta. Useful if you connect more than one Mimecast account. If left blank, Vanta defaults this to the first 12 characters of the Client ID.
- 
Client ID: Paste the Client ID from the Custom API 2.0 application you created in Step 1.
- 
Client Secret: Paste the corresponding Client Secret.
- 
Region: Select Global, US, or UK based on the region of your Mimecast account.
- 
Click Validate and store.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993037/44349ee1a84d9723711f2f28924d/c7e9b7b6-1613-4402-9c21-7a4fa0963238?expires=1794967200&signature=4dde0bb9f8720f47f038220e82f1a8c1eb815dd2b833ee1cb3ddc68cb83fb5a8&req=diQvFcB3noFcXvMW1HO4za2jCr5wIioUpzh0LywJT6cXkccv3dHyNozQmNs4%0Ae2ruOfZm06mmMmg0OXw%3D%0A>
 
- 
If the credentials validation is successful, Vanta will open the Choose security assignments screen so you can continue setup.
​
⚠️Note: If the credentials are incorrect, the wrong region is selected, or your Mimecast subscription does not include the Engage / Awareness Training package, an error will appear. See the Troubleshooting section below.
 
There may be a short delay before Mimecast training campaigns appear in Vanta. If campaigns have not yet loaded, you can close the modal and return later to complete Step 4.
 
💡 Tip: Vanta supports connecting more than one Mimecast account. Each connection is identified by its Account Name. To add a second connection, return to the Mimecast integration page and click Add Connection.
 

### Step 5: Map training campaigns to compliance categories
After the connection is created:
- 
In Vanta, go to Integrations and search for Mimecast under the Connected tab.
- 
Click Manage, then click Update Settings.
- 
In the Choose security assignments modal, click Add an Assignment.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993032/5428d31c7d9ebf183865f819589f/99416a1a-cc08-41f6-bbe7-d67f304b5aa8?expires=1794967200&signature=6013058439a8f971e3d12f7bff8adf884c1a452ae017f71764202b2b019f1cd9&req=diQvFcB3noFcW%2FMW1HO4zdy%2FIVKgzMt8dCTCi2G%2BSnL51Im04V%2BiWFZJp5a%2B%0AYaegy40DXl%2BIhcl55uo%3D%0A>
 
- 
Click Choose an assignment and select the Mimecast campaign you want to map.
- 
Select every training category the campaign covers. Assign each relevant campaign to one or more categories: General security awareness, HIPAA, PCI DSS, GDPR, CCPA, Insider threat, Social engineering, AI Risk, or Secure code.
- 
Repeat to map additional campaigns, or click Delete on a row to remove a mapping.
- 
Click Save.
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993034/25cd09754e318e41c8ef78bf55da/dde04b3b-62e6-4d04-8603-a00a7e190fd8?expires=1794967200&signature=8f52e24bc6d4966e2a61dc293d3f1328a285d3b191c95eb21b629a8910683100&req=diQvFcB3noFcXfMW1HO4zeKDZQn9ePCSoON%2FtzlysJWCbGmDeIZlyG4LbPHN%0AX%2F%2Fr5fl%2F%2BAuWleKUm%2BM%3D%0A>
 
 
Note: If you have multiple Mimecast connections, use the Mimecast Connection dropdown at the top of the modal to select which account you are configuring. Mappings are saved per connection, so repeat this process for each connected account.
 
Note: Only global Mimecast campaigns appear in the assignment dropdown. Targeted campaigns are not visible to the API and cannot be mapped.
 

### Step 6: Configure training requirements for employees
Connecting the integration does not automatically assign training to employees in Vanta. After mapping your campaigns in Step 4, you need to tell Vanta which training categories each group of employees is required to complete.
 
💡 Tip: Completing this step requires three save actions: one inside the training modal, one on the group page, and one in a final review dialog. Each has a distinct purpose.
 
- 
In Vanta, go to Personnel > People. Select the Groups tab, then click the group you want to configure (for example, Engineering).
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993031/a8094a1660a5249562a073f00068/8b09260b-8156-4c7e-ae84-4830e4f40c0a?expires=1794967200&signature=7f167d313112d1af061e074a11e878513bc3f161f16bf4a7d7881240ad0a44eb&req=diQvFcB3noFcWPMW1HO4zYqX1JY1ckS1aYioYwzSUwXgxNgbo57m0EYv7RTY%0AmKqGPuhYkeRZgNyDd1Q%3D%0A>
 
- 
On the group's page, find the row labeled Trainings and open it. A modal opens where you can configure training for this group.
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993038/bc39fd64df377db189ca3ca0907a/dd068608-fe84-448e-a4da-093e2f262e22?expires=1794967200&signature=2d7ec4038004fd142216962ef4b0166b5486b8c48c6a2217289c2d5a46bc8131&req=diQvFcB3noFcUfMW1HO4zbVEPPyqCo4lOoQsrWuTWsNwUpZHVLQpj91Oz9La%0A652jAkiZhMVmYZDSwjM%3D%0A>
 
- 
Each available training category appears as a toggle (General is always first). Turn on the toggle for every category employees in this group must complete.
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993030/43ac52317a3ad66d62464fd3e159/4b5311f5-f4f5-468e-a27c-2303e7426d6a?expires=1794967200&signature=97df102bcae6d3a8c2b961da5c53037a76805c840d32ca53f429901e42d6a06b&req=diQvFcB3noFcWfMW1HO4zY50PNnqCu1DMuDbpRyOEKgZUCtGtCrcOIghB3ig%0ALj1vCB3dpEXFnhaVxe4%3D%0A>
 
- 
When you turn a category on, three source options appear:
- 
Vanta training: use Vanta's built-in video training.
- 
Integration training: use the Mimecast campaigns you mapped in Step 4. The card shows a summary of which campaigns are linked.
- 
Custom training: provide your own URL and instructions.
- 
To use Mimecast, select Integration training. To change which Mimecast campaigns are used for a category, click the three-dot menu on the card and choose Edit.
- 
Click Save inside the Manage trainings modal. The modal closes and you return to the group's page. Your changes are not applied yet.
 
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993035/978e7723587d1765384dc939aa25/eb417593-1d67-4153-a52c-c29ec53c6066?expires=1794967200&signature=b8fcaba276092a461f3a35334fe29dc7f60e138d9f4ed9b2c7a280c2c7f37fe6&req=diQvFcB3noFcXPMW1HO4zUTtvm9d%2FjRVAsc5Ole5PvZrmYo9nKZMBY17VNBn%0AVe5R7hQvmgCMw7ywvS0%3D%0A>
 
- 
On the group's page, click Save to review your changes. The Review changes and save modal opens, summarizing what is about to change.
 
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993040/25b373b1a70cec964156571dfec3/06124c12-e5ad-425f-845c-74b8bfdf8dd9?expires=1794967200&signature=6d8a3f98a08d80d4fa810b17663ef30a81d69cbf3a2ebbb06bceb463f0875126&req=diQvFcB3noFbWfMW1HO4za6OZHpIk84vM%2FsFeok72TKhgfTXLKB0O1iD31az%0AS9WUTB2VsounNg0U95M%3D%0A>
 
- 
Click Save in the Review changes and save modal to confirm. Employees in this group will now see the assigned Mimecast training in their tasks.
 
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993033/53575060b5f71d882e7531cade68/f9856d83-503b-4411-a8b0-a166b1a1c308?expires=1794967200&signature=2906fb37d35845b8be40f2d00c5d9985dc6f7c957caf87d2eeecde4de695c68b&req=diQvFcB3noFcWvMW1HO4zWR%2FTtHUDQhSnNktEYvG%2FcjiqZ0Q7Ik3fczomtVb%0ATDo5p5NY7UQecxatJPE%3D%0A>
 
- 
A confirmation dialog appears. From here you can click Dismiss to close the dialog (changes are already applied), or click Enable recurring reminders to configure automatic email reminders for employees with outstanding tasks.
 
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2483993039/9c16b0ce1a2355ac3d4b616b464b/0e042b3c-03d1-49c5-9643-2932163469e4?expires=1794967200&signature=f8d37b701326274a79eef65ab3c6d5939b9a624538924f0e1bb0ad27d314b933&req=diQvFcB3noFcUPMW1HO4zcEHc3gVLLhonWMvOHaqwe%2B3a9W1kU%2BN8xkMEEz1%0AnXZbc5b05wrnHj81SN0%3D%0A>
 
Repeat these steps for each group that requires training.
 
 

## Troubleshooting and FAQs

### Credential validation fails and the connection does not proceed
- 
Likely cause: The Client ID or Client Secret is incorrect, the credential has been revoked or rotated in Mimecast, the wrong region was selected, or your Mimecast subscription does not include the Engage / Awareness Training package. The API returns a Forbidden error on training endpoints even if credentials are otherwise valid when the Engage package is not active.
- 
How to confirm: Log in to the Mimecast Admin Console and verify that your Custom API 2.0 application still exists and its credentials (Client ID and Client Secret) have not been revoked. Check that the application has been granted access to both Account Management and Awareness Training. Confirm the administrator role associated with the application includes the Directories | Read and Awareness Training | Dashboard | Read permissions. In Vanta, verify the region you selected (Global, US, or UK) matches the region of your Mimecast tenant. Finally, contact your Mimecast account team to confirm your subscription includes the Engage package because the Awareness Training API requires it.
- 
Fix: Re-enter correct credentials and select the correct region. If the credential was revoked, generate a new one in Mimecast and re-enter it in Vanta. If the Engage package is not included in your subscription, contact Mimecast to add it before connecting.

### Targeted training campaigns are not appearing in Vanta
- 
Likely cause: Mimecast's API exposes only global campaigns distributed to the entire organization. Campaigns assigned to specific individuals or groups are not returned by the API. This is a Mimecast platform limitation. 
- 
How to confirm: Check in the Mimecast Admin Console whether the missing campaigns are configured as targeted rather than global.
- 
Fix: To bring a targeted campaign into Vanta, redistribute it in Mimecast as a global campaign. Alternatively, supplement the relevant compliance category using Vanta's built-in training or a custom training source on the affected groups.

### The integration disconnects after a successful setup
- 
Likely cause: The Client ID or Client Secret was rotated or revoked in Mimecast after the integration was connected. When we are unable to authenticate during a sync, we disconnect the integration to prevent stale or incomplete data from persisting in Vanta.
- 
How to confirm: Log in to the Mimecast Admin Console and check whether the credential on the Custom API 2.0 application is still active.
- 
Fix: Generate a new credential in Mimecast, then in Vanta go to Integrations > Mimecast > Manage in Vanta and update the Client ID and Client Secret with the new values.

### Training shows as incomplete for employees who have completed it in Mimecast
- 
Likely cause: One or more of the following: the employee's email in Mimecast does not exactly match their Vanta personnel record; the training campaign has not been mapped to a compliance category in Vanta; training has not been enabled in the employee's group in Vanta; the campaign is a targeted campaign (not visible to the API); or the sync has not yet run since the completion was recorded.
- 
How to confirm: Check the employee's email in both Mimecast and Vanta for an exact match. Confirm the campaign is mapped under Integrations > Mimecast > Manage > Update Settings. Confirm training is enabled for the group under Personnel > People > Groups > [group name] > Trainings.
- 
Fix: Correct any email mismatches. Complete campaign mapping in the Assignment Selector. If training is not yet enabled for the group, open the relevant group, find the Trainings row, turn on the required categories, and select Integration training as the source. Allow up to one sync cycle for the completion to appear.

### Only some employees' training completions are appearing
- 
Likely cause: Email address mismatches between Mimecast and Vanta personnel records are the most common cause. We match completion records to employees by exact email address. Any mismatch causes that employee's data to be excluded.
- 
How to confirm: Compare the email on the affected employees' Mimecast profiles with the email on their Vanta personnel records.
- 
Fix: Correct any discrepancies in email addresses across both systems, including differences in capitalization, formatting, or aliases. Allow the next sync to run after making corrections.

### The manual evidence document for security awareness training is still showing after connecting
- 
Likely cause: Manual evidence documents are not automatically deactivated when an integration is connected.
- 
How to confirm: Navigate to the evidence document and confirm it is still set to active.
- 
Fix: Once you have confirmed the integration is syncing correctly, navigate to the document, click the three-dot menu, and select Deactivate.

### Does Vanta include training completions from before the integration was connected?
- 
Yes. The Mimecast Awareness Training endpoint returns historical completion records, so completions recorded before the integration was connected will appear in Vanta on the first successful sync (subject to the global-campaign and email-match requirements above).

### Can I connect more than one Mimecast account?
- 
Yes. Each connection is identified by the Account Name you set during setup. Add additional connections from the Mimecast integration page using Add Connection. Training-to-category mappings are saved per connection. Use the Mimecast Connection dropdown in the Assignment Selector to configure each account separately.

## Images

- [image 01] ../../images/integrations/mimecast/connecting-vanta-mimecast--01.png
- [image 02] ../../images/integrations/mimecast/connecting-vanta-mimecast--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-mimecast--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-mimecast--04.png
- [image 05] ../../images/integrations/mimecast/connecting-vanta-mimecast--05.png
- [image 06] ../../images/integrations/absorblms/connecting-vanta-absorblms--02.png
- [image 07] ../../images/integrations/absorblms/connecting-vanta-absorblms--03.png
- [image 08] ../../images/ux/personnel/connecting-vanta-absorblms--05.png
- [image 09] ../../images/ux/personnel/connecting-vanta-absorblms--06.png
- [image 10] ../../images/ux/personnel/connecting-vanta-absorblms--07.png
- [image 11] ../../images/ux/personnel/connecting-vanta-absorblms--08.png
- [image 12] ../../images/ux/personnel/connecting-vanta-absorblms--09.png
- [image 13] ../../images/ux/personnel/connecting-vanta-absorblms--10.png
- [image 14] ../../images/ux/personnel/connecting-vanta-absorblms--11.png
