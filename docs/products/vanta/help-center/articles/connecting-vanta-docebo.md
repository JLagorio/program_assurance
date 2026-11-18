# Connecting Vanta & Docebo

Source: https://help.vanta.com/en/articles/14081418-connecting-vanta-docebo
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Security Awareness Training
Fetched: 2026-11-17

## Article text

## Overview
This integration connects your Docebo learning management system to Vanta using OAuth. Once connected, we use this data to evaluate whether employees have completed required security awareness training (SAT) as part of your compliance program. You map specific Docebo courses to SAT categories in Vanta, and we track completion against those assignments for each person in scope. This integration is most useful for: 
- 
Compliance teams that use Docebo to deliver security awareness training and need to demonstrate completion in Vanta
- 
Teams managing training requirements across multiple compliance frameworks, such as SOC 2, HIPAA, PCI DSS, or GDPR
- 
Organizations running more than one Docebo instance that need consolidated training visibility in Vanta
Estimated setup time: 10-15 minutes 
 
 

## Use cases and capabilities
- 
Training Completion Tracking: Connect Docebo and Vanta automatically syncs each employee's enrollment and completion status across your training courses. Completion data updates approximately every hour, so Vanta always reflects current status without manual uploads or spreadsheet exports.
- 
Automated Compliance Tests: Once you map your Docebo courses to compliance categories in Vanta, we run up to 11 automated tests on your behalf — verifying that employees have completed required training. We also verify that Docebo accounts are linked to active employees and that access is revoked when someone leaves.
- 
Evidence Collection: Synced training records feed directly into Vanta's evidence library for supported compliance frameworks. Instead of collecting and uploading completion reports before each audit, we keep that evidence current automatically.
- 
Access Reviews: Docebo user accounts are surfaced in Vanta's Access Reviews. Reviewers can confirm whether access remains appropriate and generate audit-ready evidence from the same synced data.
- 
Course Assignment: After connecting, you can map individual Docebo courses to specific compliance categories directly in Vanta's integration settings. This controls which completions count toward which tests, so you have precise control over how training maps to your compliance requirements.

### Capabilities summary
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Learners (Users) | 
Yes | 
Access Reviews, automated account tests, personnel matching
 | 
Training Courses | 
Yes | 
Mapped to compliance categories; powers training completion tests
 | 
Training enrollment and completion | 
Yes | 
Powers SAT compliance tests and evidence collection
 | 
Phishing simulation results  | 
Yes | 
Powers SAT compliance tests and evidence collection
 | 
MFA Status | 
No | 
Not available from the Docebo API
 
 

## Permissions

### Read access
We request access to your Docebo instance using the OAuth api scope. Although this scope provides broad API access, Vanta only performs read operations — we do not create, modify, or delete any data. With this access, we read:
- 
Learner accounts — active users in your Docebo instance, including name, email, and account metadata. Used to match employees to Vanta personnel records and evaluate who has completed required training.
- 
Training courses — all courses in your Docebo instance. Used to populate the course mapping interface in Vanta so you can assign courses to SAT categories.
- 
Course enrollments and completions — enrollment and completion records for each learner. Used to evaluate training completion against assigned SAT categories and generate evidence in Vanta.

## Write access
We do not create, modify, or delete any data in Docebo.
 
 

## Prerequisites
⚠️ Access to the Docebo API requires a paid Docebo plan. Confirm your plan includes API access.
Before starting setup, confirm the following: 
- 
You have a Vanta admin account. 
- 
You have a Docebo admin account (or admin access) sufficient to create and manage OAuth applications.
⚠️ Important: The account you use to authorize must have access to user, course, and enrollment data in Docebo. If the account has restricted visibility, we will only be able to sync what it can see.
- 
You know your Docebo organization name (this is the subdomain of your Docebo URL). For example, if your instance is https://acme.docebosaas.com <https://acme.docebosaas.com> the organization name is acme. 
- 
You have an OAuth 2.0 application configured in your Docebo admin dashboard. This generates the Client ID and Client Secret you will need during setup. 
- 
Employees have email addresses in Docebo that match their Vanta personnel records exactly. Domain aliases will prevent a match. 
- 
Training courses are already created and assigned to users in Docebo before connecting. We sync enrollment and completion data for existing assignments only.
 
 

## Setup guide

### Step 1: Create an OAuth2 application in Docebo
- 
Log in to your Docebo admin panel. 
- 
Go to Settings (the gear icon) on the upper right menu. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326047409/29fc87584872f12b432aba8f247a/b88342a4-efd6-41c3-8c8a-03f73f82b7ff?expires=1794967200&signature=aed239dc82f61f13cd9747362f1b6dc8f0e64ab2b31a7043cef816afa858c175&req=diMlEMl6moVfUPMW1HO4zYQwLH8IT6UNh6vlSMQld1DqeEYnjAuJd9A8ewhs%0AAgljMfpj8gssnjYtmw8%3D%0A>
- 
From there, click Manage under the API and SSO section. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326047859/e191d1e6fe153d82d41aa2b261a5/d88d9051-4a12-471d-ab5f-0d7af2fd9113?expires=1794967200&signature=ee24fcae0d24bf728960748782ce145ed3d19f0bb78947209085c4430a6d5c8f&req=diMlEMl6molaUPMW1HO4zREm4plYdslDmu3V4NXP2ddifQpBKuagZwyxdyWK%0AiMFEIn%2BJm%2Fko8mRvNoc%3D%0A>
- 
 Then select API credentials under the API and SSO menu. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326048521/88b6c2e56b887d24801c7f4e739a/1daffc66-19a0-4491-ac27-8f24f28ebde1?expires=1794967200&signature=e3e31ed91849a63ebfeeb0dfa2a283e7da71685fada0a9cd6bef4c82810a0800&req=diMlEMl6lYRdWPMW1HO4zS2oWzocWQeHUNv4A5aDRszVJl2lFgioWm8GnS1d%0A44IsbBWNQBxFfzRU%2Bqo%3D%0A>
- 
Click Add OAuth2 App. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326049388/320c91c680dac6031976f18a6c4f/34bc480b-e69d-4813-9940-d7e0c864726b?expires=1794967200&signature=61195ef85352586b1e808e85f63686f6e3d8ff634770ca1627b132a487d36a7b&req=diMlEMl6lIJXUfMW1HO4zW%2BV7KOTrRQvBMlt8p9CaOYmDUHGgGr1q9Tud9Am%0A2WJJJs9SRHjnQVhs%2Bt4%3D%0A>
- 
Fill in the following fields: 
- 
App name: vanta
- 
App description: Vanta integration for automated security awareness training monitoring and compliance verification.
- 
Client ID: vanta (recommended)
- 
Redirect URI: https://api.vanta.com/auth/o/callback/docebo <https://api.vanta.com/auth/o/callback/docebo>
- 
Click Show advanced settings and confirm that Authorization code + implicit grant is enabled under Grant types.
- 
Click Confirm. Copy the Client Secret before closing — you will need it in the next steps.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326052467/346e275e8e9b63e8ce31543305e1/37b02310-effe-4173-a042-a81f712e13f6?expires=1794967200&signature=26a42b23f9c70b35fba280406d97f9345d75889a91710c9f63bb5613b514c0a6&req=diMlEMl7n4VZXvMW1HO4zRwkyMvT8Ljcz6rXNt3niUE0%2Bj0M4MWMUJuxsMQI%0A3WTFNKAK6T0Y%2BZ5JWro%3D%0A>
- 
Activate the app by clicking the status toggle and confirming it turns green.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326053369/0ed472f007ae5b5633a7729ca9c2/d543b4df-392d-410e-ab1f-55ef0813a360?expires=1794967200&signature=7021832d17d72f49f54c4f568a0162218771702cf665b8013b1a96102e3af506&req=diMlEMl7noJZUPMW1HO4zbx6J0%2FSqfx5h0JVNjx3Mwb6bdFBPj%2FYUSyKyCNh%0Anqu2i%2BjHLtdyXwmwxSI%3D%0A>
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326053835/570d75161b8341268666df8dd28f/fe3fb297-ee86-45ab-ba34-7e67cd281f62?expires=1794967200&signature=d6bc85b913e297c930314201949f79a2c87b704cd92ac2e271acb5cbb75bc1e5&req=diMlEMl7nolcXPMW1HO4zX2weV125YGAr6wImZvCjSylx%2BkrlPzVfxlKg3%2FA%0AE8zpTzNF73OSzpb9%2BJ4%3D%0A>
⚠️ Note: The OAuth2 app must be active (green) before you attempt to connect in Vanta. An inactive app will cause the connection to fail.
 

## Step 2: Find the Docebo integration in Vanta. 
- 
In Vanta, go to Integrations. 
- 
Search for Docebo in the Available tab.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326057416/cacf0fbd5c18c64fa0c9c4a8d4f9/cc0ebabb-0d10-4399-ae05-15669dfafcc6?expires=1794967200&signature=a9b7a88abb28eb5d654cbe10c95e6a6beb526b42832d6701162b413fe4104a4e&req=diMlEMl7moVeX%2FMW1HO4zfttiNfukAVVD6Q2EIVbYOrVmLl6iDG8ahLhIc7s%0A1oRkvWCSexj0Et4xO5Y%3D%0A>
- 
Click View details and then click Connect. 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326058887/eea8fcc1926df2dbc40d651521a8/5353f8ae-54d8-4b82-a579-e069b5f61598?expires=1794967200&signature=ef10c2ed628211152a89ba36b15c06f9ff869f35c9b03785ef934363c2744601&req=diMlEMl7lYlXXvMW1HO4zXSQDT78WEe7BY15XiHuC6NhhZ%2FUuOnAkFg%2Fo%2BtL%0Aqc4p5%2BFrw3e5lrUNYsE%3D%0A>
 
 

## Step 3: Enter your Docebo credentials
- 
Click Add Account.
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326060662/91fc42f88bfa9b696cdccc97034a/b78a4227-e471-41b5-a34c-e13c0b5832aa?expires=1794967200&signature=7b98b751b690e89e77278748a2e36d5c0064053eabe2144105acd84af5405546&req=diMlEMl4nYdZW%2FMW1HO4zfevjXeizadAqmk2Dv0KVhhQKyfLvhQdAlZkguhW%0ADvootW%2FGdu%2FvgKcg05o%3D%0A>
- 
Fill in the following fields:
- 
Account Name: A display name of your choice to identify this connection in Vanta.
- 
Organization Name: Your Docebo subdomain only — for example, if your Docebo URL is https://acme.docebosaas.com <https://acme.docebosaas.com>, enter acme.
- 
Client ID: vanta
- 
Client Secret: The secret you copied when creating the OAuth2 app in Docebo.
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326063444/8a4f78e392fd7a1efe223cc08120/64b133c3-4f66-4fbe-a332-9d3a1c1744bb?expires=1794967200&signature=24ef51af8bfd2b87dd20f90984a33a2a974ce69865a648e9653be5c4f35e9524&req=diMlEMl4noVbXfMW1HO4zfgVKOTWoJAHs%2FcVynj5PBlccWaWj1HXs6nb5viF%0AGKQ0xBphBkw9m0aD7p4%3D%0A>
- 
Click Save and authorize. 
 

## Step 4: Authorize the connection in Docebo
- 
Vanta redirects you to your Docebo instance. 
- 
Click Authorize to grant Vanta access.
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326066221/a366c953664dd0784b2827efb354/500dc94d-c43a-4a31-8c77-b72d3af2277b?expires=1794967200&signature=544daba04e7139fa75e2bdc3dae5fd8757cb360696df31746eba90fc33f2bade&req=diMlEMl4m4NdWPMW1HO4zTs5Sj%2BwU%2FQRiDrpo2sZKwQvNFx1226ZQ0pW6cNF%0AqKS0ZUxKCMpHtQ3awoU%3D%0A>
- 
Docebo redirects you back to Vanta automatically. The Choose security assignments modal will open so you can continue the setup.   
 

## Step 5: Map courses to SAT categories
After returning to Vanta, you will be prompted to map your Docebo courses to SAT categories.
- 
Click Add an assignment. 
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326069877/e9cace490de795530b1008ed00f2/d85fe24a-b3b9-47de-b0b0-d3e57be0036a?expires=1794967200&signature=aa77695a1a6e1e62586042806f16a5bf31d8fe38024e4a257e42d21eb2b4d02d&req=diMlEMl4lIlYXvMW1HO4zd4lN4lg7LjOkf2Mux%2F1goWY6lJWwMXe4HETIMrk%0AihPHUBpekIzgyiHmngw%3D%0A>
- 
Click Choose an assignment and select the course.
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326070908/d3d8badacca07a6175fdac4af94f/6a3622ea-2bb9-4ced-bc2c-206da723f4dc?expires=1794967200&signature=95e6710e316fed18ce743e09aef4747963dcede6a9cef147473a6125f9fa744b&req=diMlEMl5nYhfUfMW1HO4zcdjhyexGIBFNPdRcZ%2Fu4RpTT6Lu157%2BjZfv5tCY%0Abk3lw%2Bd2rJFjZzjxpH4%3D%0A>
- 
Select the training categories you want to assign to the course.
- 
Assign each relevant course to one or more categories: General SAT, HIPAA, PCI, GDPR, CCPA, Insider Threat, Social Engineering, AI Risk, or Secure Code. 
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326072365/3379a807515fdd91c9034121f61f/a2ddceab-e5b8-4089-b813-68e543960141?expires=1794967200&signature=c91a082f4f1fd178328c782cd4de9c3351a4eb49e0676447dec7ee8bb602f6fc&req=diMlEMl5n4JZXPMW1HO4zaIupmaYlzHmVy7a3QaP8zFwL03AvRIm4%2BhXo221%0AkeDpgGBvspOC3DRNQsE%3D%0A>
 
 

## Step 6: Configure training requirements for employees 
Connecting the integration does not automatically assign training to employees in Vanta. After mapping your courses in Step 5, you need to tell Vanta which training categories each group of employees is required to complete.
- 
In Vanta, go to Personnel and then go to People. Select the Groups tab. Then click the group you want to configure (for example, Engineering).
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326074073/a89ab3bee1717594a14e14938b07/908f6e66-0495-46df-ade2-515ca903aa56?expires=1794967200&signature=031c57e08100470c95971eafa8ecebe4ad5d68885ab48a60e8f51e1d042b7a18&req=diMlEMl5mYFYWvMW1HO4zfFExpO59WJUW%2FlH5G%2Fd3TXe%2BegX0XKcGvciBOS8%0Amd4VJTjLRg5bRzeIKSg%3D%0A>
- 
On the group’s page, find the row labeled Trainings and open it. A modal opens where you can configure training for this group. 
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326075001/a0b1b2d4e5bf08c732fb899007e4/83658e85-462a-4df1-a7a3-75309a568e8d?expires=1794967200&signature=efaa6193337593e11d700f2aa49f391e97dad083b304bd875cd22752937b5ccd&req=diMlEMl5mIFfWPMW1HO4zSNS%2BoWwCgtpfqzvItHec8IuLIZZfQ80xa3ipJpM%0Ax7WMwMH57Zebv4%2BqIiY%3D%0A>
- 
Each available training category appears as a toggle (General is always first). Turn on the toggle for every category employees in this group must complete. 
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326075795/56edd4b5f33e9158f8ebeea20a99/73c72b0d-dd51-4eea-850e-4d481837722a?expires=1794967200&signature=26b783f98a23ad0596348ced9250e40db647371483e056e116bf3b5b93391a47&req=diMlEMl5mIZWXPMW1HO4zdF7IUdkSz26HrD6UmOWljIJEUmD7jq2IEGdZBJS%0AcS9F7%2BUg0iC%2F41GWvsU%3D%0A>
- 
When you turn a category on, three source options appear: 
- 
Vanta training: use Vanta’s built-in video training. 
- 
Integration training: use the Docebo assignments you mapped in Step 4. The card shows a summary of which assignments are linked. 
- 
Custom training: provide your own URL and instructions. 
- 
To use Docebo, select Integration training. To change which Docebo assignments are used for a category, click the three dot menu on the card and choose Edit. 
- 
Click Save inside the Manage trainings modal. The modal closes and you return to the group’s page. Your changes are not applied yet.
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326076937/a3030c99f01f3a818e0cb92a8bd8/68b0f988-36f9-4d3f-b26e-a6f9e00b9e5f?expires=1794967200&signature=651bb20548fec1730fbbaba63bb4cfe563384c2b97bf3e9097c521cf4a40bf8b&req=diMlEMl5m4hcXvMW1HO4zVzV%2F88ctfTOHRjX7dJaOT8kR4%2BUqtsht%2Bk3AVS9%0AmMyOSyLA%2BT%2B6sAl42oY%3D%0A>
- 
On the group’s page, click Save to review your changes. The Review changes and save modal opens, summarizing what is about to change. 
[image 20]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326078195/4e0b559447bb28597ae160eb9a4c/ff8dd1b0-57ef-4f09-bb49-f33361b0748f?expires=1794967200&signature=fa7c3af4f5de231bb30e62d51bd90a030cbd68948e7e112922af8fff16b20b45&req=diMlEMl5lYBWXPMW1HO4zRvXh0cZUoaZ%2FKxpsW3zCY0gdm7Z8X0boVTOMXbe%0AMJ7tIo2VZzJL7gFqfzY%3D%0A>
- 
Click Save in the Review changes and save modal to confirm. Employees in this group will now see the assigned Docebo training in their tasks. 
[image 21]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326078995/e15f7725200520a7dcb018060ae5/c03bd56e-e6ac-48bd-ad58-423234ff5ae9?expires=1794967200&signature=f71dfc663ec64e4daeb10f206f08365661aa906208365825c878f3b3f37da8a3&req=diMlEMl5lYhWXPMW1HO4zZdFpywHBXcaUQRovUX1mE7l8Xxf0LAOH9OrPIYZ%0AIiVf%2BNPe3hiZHNjflrY%3D%0A>
- 
A confirmation dialog appears: You updated tasks for [group name]. From here you can: 
- 
Click Dismiss to close the dialog. Your changes are already applied. 
- 
Click Enable recurring reminders to go to Settings > Company Notifications where you can configure automatic periodic email reminders for employees with outstanding tasks.
[image 22]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2326080626/e6bd332acac724ea7911bb159837/71bd8723-871e-47da-b2dc-7d3f8a1b698d?expires=1794967200&signature=dc95015f6bb40e8f108863623cfebb950320828cb839d280b7dbfa4820c1035f&req=diMlEMl2nYddX%2FMW1HO4zdBls7r53FBLCoPZ6cshGj2HnZkVfOdoxwpqOgjk%0ALloKk0NHIzlewW%2B6PqA%3D%0A>
 
Repeat these steps for each group that requires training. 
ℹ️ Note: Vanta supports connecting multiple Docebo accounts. Each connection is identified by its Account Name, which is a display name of your choice to help you distinguish between them.
 
 

## Troubleshooting and FAQs

### Credential validation fails and the connection does not proceed
- 
Likely cause: The organization name, Client ID, or Client Secret is incorrect, or the OAuth application in Docebo is inactive or misconfigured.
- 
How to confirm: Verify the organization name is your Docebo subdomain only — for example, acme, not acme.docebosaas.com. Check that the OAuth application is active in your Docebo admin settings and that the Client ID and Secret match what Docebo shows.
- 
Fix: Correct any mismatched values and try again. If the Client Secret has expired or been rotated in Docebo, regenerate it and re-enter the new value in Vanta.

### The integration disconnects after a successful setup
- 
Likely cause: The OAuth token expired or access was revoked in Docebo. When we are unable to authenticate during a sync, we disconnect the integration to prevent stale or incomplete data from persisting in Vanta.
- 
How to confirm: Check whether the OAuth application in Docebo is still active and whether the account that authorized the connection is still enabled.
- 
Fix: Reconnect the integration from the Integrations page in Vanta. In most cases, reconnecting re-enables the existing connection and triggers a new sync. If the OAuth application in Docebo is still valid, you will not need to re-enter your credentials. In rare cases, you may need to remove the connection and set it up again.
 

### Employees are missing from training data in Vanta
- 
Likely cause: The affected users are inactive in Docebo. We only sync users with an active status — suspended or deactivated accounts are excluded.
- 
How to confirm: Check the user's status in your Docebo instance. Users with an inactive or suspended status will not appear in Vanta.
- 
Fix: If the user should be in scope for training, reactivate their account in Docebo and allow the next sync to run. If the user is intentionally deactivated, no action is needed.
 

### Training completion is not matching the correct employee in Vanta
- 
Likely cause: The email address on the Docebo learner account does not match the email on the corresponding Vanta personnel record.
- 
How to confirm: Compare the email on the learner's Docebo profile with the email on their Vanta personnel record. 
- 
Fix: Ensure email addresses match exactly across both systems. If an employee has been rehired or has multiple personnel records in Vanta, confirm that the current active record uses the correct email.
 

### Courses appear in Vanta but are not satisfying any compliance tests
- 
Likely cause: The courses have not been mapped to a SAT category in Vanta. Synced courses that are not assigned to a category will not count toward any compliance requirement.
- 
How to confirm: In Vanta, open the Docebo integration settings and check whether the relevant courses have been assigned to one or more SAT categories.
- 
Fix: Open the integration settings, assign the courses to the appropriate categories (for example, General SAT or HIPAA), and save. The updated mappings will apply on the next sync.

## Images

- [image 01] ../../images/integrations/docebo/connecting-vanta-docebo--01.png
- [image 02] ../../images/integrations/docebo/connecting-vanta-docebo--02.png
- [image 03] ../../images/integrations/docebo/connecting-vanta-docebo--03.png
- [image 04] ../../images/integrations/docebo/connecting-vanta-docebo--04.png
- [image 05] ../../images/integrations/docebo/connecting-vanta-docebo--05.png
- [image 06] ../../images/integrations/docebo/connecting-vanta-docebo--06.png
- [image 07] ../../images/integrations/docebo/connecting-vanta-docebo--07.png
- [image 08] ../../images/ux/integrations/connecting-vanta-docebo--08.png
- [image 09] ../../images/ux/integrations/connecting-vanta-docebo--09.png
- [image 10] ../../images/ux/integrations/connecting-vanta-docebo--10.png
- [image 11] ../../images/ux/integrations/connecting-vanta-docebo--11.png
- [image 12] ../../images/integrations/docebo/connecting-vanta-docebo--12.png
- [image 13] ../../images/integrations/absorblms/connecting-vanta-absorblms--02.png
- [image 14] ../../images/integrations/absorblms/connecting-vanta-absorblms--03.png
- [image 15] ../../images/integrations/absorblms/connecting-vanta-absorblms--04.png
- [image 16] ../../images/ux/personnel/connecting-vanta-absorblms--05.png
- [image 17] ../../images/ux/personnel/connecting-vanta-absorblms--06.png
- [image 18] ../../images/ux/personnel/connecting-vanta-absorblms--07.png
- [image 19] ../../images/ux/personnel/connecting-vanta-absorblms--08.png
- [image 20] ../../images/ux/personnel/connecting-vanta-absorblms--09.png
- [image 21] ../../images/ux/personnel/connecting-vanta-absorblms--10.png
- [image 22] ../../images/ux/personnel/connecting-vanta-absorblms--11.png
