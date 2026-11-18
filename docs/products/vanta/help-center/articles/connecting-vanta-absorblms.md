# Connecting Vanta & AbsorbLMS

Source: https://help.vanta.com/en/articles/14081429-connecting-vanta-absorblms
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Security Awareness Training
Fetched: 2026-11-17

## Article text

## Overview
This integration connects your Absorb LMS learning management system to Vanta using OAuth. Once connected, we use this data to evaluate whether employees have completed required security awareness training (SAT) as part of your compliance program. You map specific Absorb LMS courses to SAT categories in Vanta, and we track completion against those assignments for each person in scope. This integration is most useful for:
- 
IT, Security, Compliance, and HR teams that use Absorb LMS to deliver security awareness training and need to demonstrate completion in Vanta
- 
Teams managing training requirements across multiple compliance frameworks, such as SOC 2, HIPAA, PCI DSS, or GDPR
- 
Organizations running more than one Absorb LMS portal, for example separate portals for different regions or business units
Estimated setup time: 10-15 minutes
 
 

## Use cases and capabilities
- 
Training Completion Tracking: Connect Absorb LMS and Vanta syncs each employee’s course enrollments and completions on a regular schedule. A completion counts when the enrollment status is Complete, it has a completion date, and it has not passed its expiration date in Absorb LMS. If a learner has more than one enrollment in the same course, such as after a recertification, we keep the latest unexpired completion.
- 
Automated Compliance Tests: Once you map your Absorb LMS courses to SAT categories and set training requirements for your groups, we run the SAT tests for each category on your behalf. We also verify that every Absorb LMS account is linked to a person in Vanta, and that no active Absorb LMS account belongs to someone who has left your company.
- 
Evidence Collection: Synced training records feed into Vanta as evidence for frameworks that require security training. Instead of exporting completion reports before each audit, we keep that evidence current automatically.
- 
Course Assignment: After connecting, you map individual Absorb LMS courses to SAT categories in Vanta. This controls which completions count toward which tests.
- 
Multiple Portals: You can connect more than one Absorb LMS portal. Each connection has its own Account Name and its own course mappings.

### Capabilities summary
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Learners (Users) | 
Yes | 
Personnel matching and the Absorb LMS account tests. Only active users sync.
 | 
Roles | 
Yes | 
Shown alongside learner accounts
 | 
Training Courses | 
Yes | 
Mapped to SAT categories; powers training completion tests
 | 
Training enrollment and completion | 
Yes | 
Powers SAT compliance tests and evidence collection
 | 
Phishing simulation results | 
No | 
Not supported by this integration
 | 
MFA Status | 
No | 
Not available from the Absorb LMS API
 
 

## Prerequisites
⚠️ Note: Access to the Absorb LMS Integration API requires the paid Integration API add-on. Confirm your portal has it enabled. If you don’t see the Integration API card under Client Settings or a REST API Private Key in Portal Settings, contact your Absorb account team.
Before starting setup, confirm the following:
- 
You have a Vanta admin account. 
- 
You have an Absorb LMS admin account with permission to access Portal Settings and Client Settings.
⚠️ Note: The Absorb LMS account you use to authorize must have access to user, role, course, and enrollment data. If the account has restricted visibility, we will only be able to sync what it can see.
- 
You know your Absorb LMS Portal URL. It must start with https:// and end in .myabsorb.com, .myabsorb.ca, .myabsorb.eu, or .myabsorb.com.au, for example https://your-org.myabsorb.com. Custom or vanity domains are not supported.
- 
You have your portal’s REST API Private Key, OAuth Client ID, and OAuth Client Secret (see Step 1).
- 
Employees have email addresses in Absorb LMS that match their Vanta personnel records. Matching is not case-sensitive. If a user has no email in Absorb LMS, we use their username, so usernames that are email addresses will match. Domain aliases will prevent a match.
- 
Courses already exist in Absorb LMS. We sync existing enrollments and completions, including those from before you connected.
 
 

## Setup guide

### Step 1: Get your credentials in Absorb LMS
Complete these steps for each Absorb LMS portal you want to connect. You can find your credentials in either of two places. For more detail, see Absorb’s article Absorb Integration API with OAuth 2.0 <https://support.absorblms.com/hc/en-us/articles/54606307651347-Absorb-Integration-API-with-OAuth-2-0>.

### Option 1: Use the credentials in Portal Settings 
- 
Log in to your Absorb LMS admin portal.
- 
Open the menu in the top right and click Admin.
- 
In the Admin hub, open your account menu (profile icon, top right) and click Portal Settings.
- 
Scroll down to find Rest API Private Key, Integration API OAuth Client ID, and Integration API OAuth Client Secret. Keep this page open, or copy the three values.

### Option 2: Create a dedicated API key 
- 
Log in to your Absorb LMS admin portal.
- 
Open your account menu (profile icon, top right) and click Client Settings.
- 
Select the Integration API card.
- 
Click Add API key.
- 
Enter a Name (for example, “Vanta”), add an optional description, and click Save.
- 
On the Integration API page, copy the new key from the Key column. Also copy the OAuth Client ID and OAuth Client Secret shown at the top of the page.
ℹ️ Note: In Vanta, enter the key as the REST API Private Key, the OAuth Client ID as Client ID, and the OAuth Client Secret as Client Secret.
 

### Step 2: Find the Absorb LMS integration in Vanta
- 
In Vanta, go to Integrations and click Add integration.
- 
Search for Absorb LMS. 
- 
Click Connect.

### Step 3: Enter your Absorb LMS credentials
- 
In the Absorb LMS Accounts window, click Add Account Name.
- 
In the Connect Absorb LMS window, fill in these fields:
- 
Account Name: A display name of your choice. It appears in the integration settings and helps you tell multiple Absorb LMS accounts apart.
- 
Portal URL: Your Absorb LMS portal URL, for example https://your-org.myabsorb.com.
- 
REST API Private Key: The key from Step 1.
- 
Client ID: The OAuth Client ID from Step 1.
- 
Client Secret: The OAuth Client Secret from Step 1.
- 
Click Save and authorize.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774537741/33470bed5979de2abc7f1eb4d354/image.png?expires=1794967200&signature=87a793c30d235610f7dc3edb51e69b9aebab23f193e9b0d2294aaa347457bd47&req=dicgEsx9moZbWPMW1HO4zbgL3fuKvJIsyVJrUja6vJgD3fbNvXAxgVb2jAEi%0AAeT646RJJkpAKvsmTv8%3D%0A>
ℹ️ Note: If the Portal URL is not in the supported format, Vanta shows “Invalid Absorb LMS portal URL.”

### Step 4: Authorize the connection in Absorb LMS
- 
Vanta redirects you to the Absorb LMS sign-in page. Sign in with your credentials, then authorize the connection.
- 
Absorb LMS redirects you back to Vanta, and the Choose security assignments window opens.

### Step 5: Map courses to SAT categories
- 
Click Add an assignment. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545772/b20c295800a2d15504871fc5ecc7/62ca0163-f7ab-494a-ad3d-b0c89682a409?expires=1794967200&signature=52308fdb02e0cacb480e81c354b967c8dd02d11116140f514782757156e9927f&req=dicgEsx6mIZYW%2FMW1HO4zbxaGHAFyJcBTvqL3aUAakTVKE9w89S8zVl2bFiv%0AJ1EgbpH3Y%2B7rTcnkx0A%3D%0A>
- 
Click Choose an assignment and select the course.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545773/7663ee02961b819c730b8623536c/8bf6633c-c384-41f3-b5f0-5f718c09ca81?expires=1794967200&signature=70b6d252c49d72e40ee2800e780a851c2d1a9b78273705779ff1608b471bac2b&req=dicgEsx6mIZYWvMW1HO4zfG28mhdc1dR4hXV%2By%2F5f92ebH3lx8I9q9ZAlYHJ%0AF%2Ft6Pwc3U9oH%2FH3f0g0%3D%0A>
- 
Select the training categories you want to assign to the course.
- 
Assign each relevant course to one or more categories: General SAT, HIPAA, PCI, GDPR, CCPA, Insider Threat, Social Engineering, AI Risk, or Secure Code.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545835/ea6ddba519e798adbebe8dd4118a/79d86db2-3015-4b33-9968-e2a81ddb1f84?expires=1794967200&signature=b1f05611f2de17d41e8178e17391f506420cba0ec6bc93335322a1c7d8758735&req=dicgEsx6mIlcXPMW1HO4zRvGEWfAWkdxxE9CYU%2BKfFs8FARsdX0bzx800N4u%0A7HD%2FW4j8E0YY9bleUU4%3D%0A>
- 
Click Save.
 

## Step 6: Configure training requirements for employees 
Connecting the integration does not automatically assign training to employees in Vanta. After mapping your courses in Step 5, you need to tell Vanta which training categories each group of employees is required to complete.
- 
In Vanta, go to Personnel and then go to People. Select the Groups tab. Then click the group you want to configure (for example, Engineering). 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545774/8407943122d7fbaaf7adfea97db8/71358eb7-9899-4268-a701-c7f5910567db?expires=1794967200&signature=9109caf7d63cb01c30c420942635f06460ac45ddbd0d6a61310f7d756f60e36a&req=dicgEsx6mIZYXfMW1HO4zbH8HuCpB%2F0Hsm9B8BBMxHc1t%2F%2B61jgHwZFx7CJ2%0A%2F1nV7%2FAiBCqluJt0Kdg%3D%0A>
- 
On the group’s page, find the row labeled Trainings and open it. A modal opens where you can configure training for this group. 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545777/c7b71dddfc69d0e0867603e7b20a/281ee1b0-7fda-4711-99fb-df2c1b182af4?expires=1794967200&signature=a82f3486a5e9397133212b86f70a1de4b09859906ae462aab93f98b5da00d351&req=dicgEsx6mIZYXvMW1HO4zQkxDft0rYDfcr7FSIOCsNikAhT%2BBw%2Fcp2Mr2%2Fqw%0AliWTSNZAa5PRq0AeSww%3D%0A>
- 
Each available training category appears as a toggle (General is always first). Turn on the toggle for every category employees in this group must complete. 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545780/333d5ac3814094c61cea98bbd9c5/95cf1fd6-7a67-4d3b-a59e-dfc38ac5e13b?expires=1794967200&signature=f9f1960f6543f49548ee1c8cda70b494d3c2992ff3cacdd9b7f6187eee979c54&req=dicgEsx6mIZXWfMW1HO4zXhCtEHkd3esCmNZsnjCQsTkRqWDb66GU5TzoZtj%0AsCGYO6jhQFUdn5lKToQ%3D%0A>
 
When you turn a category on, three source options appear: 
- 
Vanta training: use Vanta’s built-in video training. 
- 
Integration training: use the AbsorbLMS assignments you mapped in Step 4. The card shows a summary of which assignments are linked. 
- 
Custom training: provide your own URL and instructions. 
- 
To use AbsorbLMS, select Integration training. To change which AbsorbLMS assignments are used for a category, click the three dot menu on the card and choose Edit. 
- 
Click Save inside the Manage trainings modal. The modal closes and you return to the group’s page. Your changes are not applied yet. 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545776/15b8c5ee84f4111f619aecb55058/4978cbc0-a06b-4472-8888-36b4b0c469c3?expires=1794967200&signature=9863db609e5b3f066317e4bc150b2896a2ff8465f826ede28377048804f2ff57&req=dicgEsx6mIZYX%2FMW1HO4zXEe04sJ80wMstZDcNXv7JeE7FogAvnJ6RVqBS5k%0AbMzIGjcP6zgJhr8cHjI%3D%0A>
- 
On the group’s page, click Save to review your changes. The Review changes and save modal opens, summarizing what is about to change. 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545775/4f2df1bfded0eba8fc8707aa77e9/6f1e6bbb-8811-4fe2-a963-46acba71b986?expires=1794967200&signature=233493a9bfb39369c8d42f346e4f31c373ce6aca1b0ee67134eade704cbf9735&req=dicgEsx6mIZYXPMW1HO4zdbskSRGC6aChaCO7oY8FESc9UgF2jYc9zxfFa%2F4%0ARxuARaxF9PgUi%2Ft5Khc%3D%0A>
- 
Click Save in the Review changes and save modal to confirm. Employees in this group will now see the assigned AbsorbLMS training in their tasks. 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545778/104e2ed09e9d4c7faac9a3c345ca/57b736e2-5c4b-4a51-a4a8-264aaff92c0c?expires=1794967200&signature=6c5e0e8503c926c385783da2f83cc4cb427139c03223661c64edb52d3678bb95&req=dicgEsx6mIZYUfMW1HO4zU5rUlvHPx9BbN%2F5yt4JxWeV599ikec%2B1c8I%2B5pj%0A4MK7%2FjyV34T5TEPwsSk%3D%0A>
- 
A confirmation dialog appears: You updated tasks for [group name]. From here you can: 
- 
Click Dismiss to close the dialog. Your changes are already applied. 
- 
Click Enable recurring reminders to go to Settings > Company Notifications where you can configure automatic periodic email reminders for employees with outstanding tasks. 
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774545786/769ab888fcf9d2d1ec230db6ed60/7e917e63-d3f3-4c0a-85b7-b2505139185b?expires=1794967200&signature=8c779623fb6646d4eeb18eb7adfdf4a9e7c39643965ccb808538c2a9558f6580&req=dicgEsx6mIZXX%2FMW1HO4zXgl568FPMSA%2FIdMqfbgpV3hsxF6STVGCoxzDBRA%0AvlHZlGuiEKRn3RVBrlw%3D%0A>
- 
Repeat these steps for each group that requires training. 
ℹ️ Note: Employees see one training per category. If someone belongs to several groups with different training sources, we prioritize custom training, then training from your integrations, then Vanta training.
ℹ️ Note: Vanta supports connecting multiple Absorb LMS portals. Each is identified by its Account Name, and course mappings are set separately for each portal.
 
 

## Permissions

### Read access
We request access to your Absorb LMS portal using the OAuth admin.v1 scope. Absorb LMS offers no narrower or read-only scope, so this scope provides broad API access. Vanta only performs read operations. With this access, we read:
- 
Learner accounts: active users in your portal, including email address, username, and assigned roles. Used to match employees to Vanta personnel records.
- 
Roles: role names, shown alongside learner accounts in Vanta.
- 
Training courses: course names and IDs. Used to populate the course mapping screen so you can assign courses to SAT categories.
- 
Course enrollments and completions: enrollment status, completion date, and expiration date for each learner. Used to evaluate training completion and generate evidence.
We also need your portal’s REST API Private Key, which Absorb LMS requires on every request.
 

### Write access
We do not create, modify, or delete any data in Absorb LMS.
ℹ️ Note: Absorb LMS determines what the token can access based on the authorizing admin’s role and the departments they manage. We recommend authorizing with a dedicated Absorb LMS account used only for this integration, with only the access needed to view users, roles, courses, and enrollments. Make sure the account manages every department whose users you want Vanta to monitor. Users outside the admin’s managed departments won’t be imported.. 
 
 

## Troubleshooting and FAQs

### Credential validation fails and the connection does not proceed
- 
Likely cause: The REST API Private Key, Client ID, or Client Secret does not belong to the portal you entered, or the authorizing admin does not have access to the Integration API.
- 
How to confirm: Look for the message “Absorb LMS rejected these credentials.” Check that all three credentials come from the same portal as the Portal URL, and that the admin you sign in with has Integration API access.
- 
Fix: Correct any mismatched values and try again. If you don’t see a REST API Private Key or the Integration API card in Absorb LMS, your portal may not have the Integration API add-on. Contact your Absorb account team.

### The integration disconnects after a successful setup
- 
Likely cause: Absorb LMS rejected our authentication, for example because access was revoked or the account that authorized the connection was deactivated or lost access.
- 
How to confirm: Look for a message such as “Vanta failed to authenticate with Absorb LMS. Please reconnect the Absorb LMS integration to fix this.” Check that the authorizing account is still enabled. 
- 
Fix: Reconnect the integration from the Integrations page. If the authorizing account is gone, reconnect with an active account that has the required access.

### Employees are missing from training data in Vanta
- 
Likely cause: The users are inactive in Absorb LMS, or they belong to a department the authorizing admin doesn’t manage. We only sync active users the admin can see. 
- 
How to confirm: Check the user’s status in Absorb LMS. Then check whether the authorizing admin manages the user’s department.
- 
Fix: Reactivate the account if the person should be in scope. If the department isn’t managed, add it to the authorizing admin’s managed departments in Absorb LMS, then allow time for the next sync. If users still don’t appear, reconnect the integration. If someone is deactivated after completing training, their past completions remain in Vanta.

### Training completion is not matching the correct employee in Vanta
- 
Likely cause: The email on the Absorb LMS account does not match the Vanta personnel record, or the account has no email and the username does not match.
- 
How to confirm: Compare the email (or username, if there is no email) in Absorb LMS with the email on the personnel record.
- 
Fix: Update the value in Absorb LMS or Vanta so they match. Domain aliases will not match.

### Courses appear in Vanta but are not satisfying any compliance tests
- 
Likely cause: The courses are not mapped to a SAT category, or the group’s training source is not set to Integration training.
- 
How to confirm: Open the integration settings and check whether the courses have categories. Then open the group’s Trainings task and confirm the category uses Integration training.
- 
Fix: Assign the missing categories and save. Updates apply on the next sync. 

### Training shows as incomplete even though the employee completed it in Absorb LMS
- 
Likely cause: The completion does not meet our criteria. A completion counts only when the enrollment status is Complete, it has a completion date, and it has not passed its expiration date. A newer in-progress enrollment does not hide an earlier valid completion, but an expired completion no longer counts.
- 
How to confirm: Check the enrollment’s status, completion date, and expiration date in Absorb LMS.
- 
Fix: Ask the employee to retake the course, or correct the record in Absorb LMS. Also confirm the course is mapped and the group requirement is set.

### Does Vanta include completions from before I connected?
Yes. We sync all existing enrollments and completions, with no cutoff date. They must still meet the completion criteria above and belong to an active user and a mapped course.
 

### I retired a course in Absorb LMS. Do its completions still count?
Yes. Inactive courses still sync and can be mapped. A completed, unexpired enrollment still counts toward your tests, even if the course is no longer active.

## Images

- [image 01] ../../images/integrations/absorblms/connecting-vanta-absorblms--01.png
- [image 02] ../../images/integrations/absorblms/connecting-vanta-absorblms--02.png
- [image 03] ../../images/integrations/absorblms/connecting-vanta-absorblms--03.png
- [image 04] ../../images/integrations/absorblms/connecting-vanta-absorblms--04.png
- [image 05] ../../images/ux/personnel/connecting-vanta-absorblms--05.png
- [image 06] ../../images/ux/personnel/connecting-vanta-absorblms--06.png
- [image 07] ../../images/ux/personnel/connecting-vanta-absorblms--07.png
- [image 08] ../../images/ux/personnel/connecting-vanta-absorblms--08.png
- [image 09] ../../images/ux/personnel/connecting-vanta-absorblms--09.png
- [image 10] ../../images/ux/personnel/connecting-vanta-absorblms--10.png
- [image 11] ../../images/ux/personnel/connecting-vanta-absorblms--11.png
