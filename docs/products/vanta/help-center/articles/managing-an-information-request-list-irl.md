# Managing an Information Request List (IRL)

Source: https://help.vanta.com/en/articles/12293647-managing-an-information-request-list-irl
Collection: Audit Readiness ; Audit Readiness › Audits
Fetched: 2026-11-17

## Article text

✅ Feature availability: The Information Request List (IRL) feature is available as an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Vanta’s Information Request List (IRL) experience helps you manage and respond to auditor requests directly within Vanta. The IRL experience lets you or your auditor upload the request list into Vanta so you can manage evidence, track progress, and collaborate with your team all in one place. You decide who owns each request, what evidence to attach, and can tailor what your auditor can see.
 
⚙️ User permissions: Admins, Editors, and Audit Limited Editors can manage the request list, control mapping, and population data access, as well as manage evidence across all requests. Collaborators can be assigned as Information Request Owners to manage evidence on assigned requests. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Getting started
After you create an audit <https://help.vanta.com/en/articles/11345472-audits-page>, you’ll use different tabs to manage requests, controls, and population data. Which tabs you can access depends on your user role and assignments in the audit. Auditor access is outlined in the Auditor workflow section.
 | 
Tab | 
Description | 
User access
 | 
Requests | 
Contains a list of all the information requests in scope for the audit. | 
Admins, Editors, Audit Limited Editors, Information Request Owners (assigned requests only)
 | 
Controls | 
Shows an overview of all the controls mapped to the audit. | 
Admins, Editors, Audit Limited Editors, Control Owners (assigned controls only)
 | 
Data & populations | 
Lets you manage which population data sections your auditor will be able to see. | 
Admins, Editors, and Audit Limited Editors
 

### Video tutorial: Product overview
 
A video overview from a Vanta product manager highlighting Vanta's end-to-end audit experience, including how to upload and manage an auditor's information request list, map requests to controls, collect and share evidence, and collaborate with auditors, so teams can streamline audits and stay continuously audit-ready.
 
 

### Video tutorial: Setup guide
 
A video overview from a Vanta product manager showing how to upload and map an auditor's information request list (IRL)—including preparing required fields, handling different IRL formats, mapping framework codes to controls, resolving upload errors, and refining mappings post-import.
 
 
 

## Request list management
Once your audit is created, the Requests tab will be empty until a request list is uploaded. You can upload your auditor's request list yourself, or your auditor can upload it directly once they have access to the audit—either after the observation window starts or once an early access period begins.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2614617706/2adf317f536208257a2640a247ac/image.png?expires=1794967200&signature=27bc6fd66e415ca273bec14d6a1ed122443d733dd48167eb1dcb4bbf21e72eda&req=diYmEs9%2FmoZfX%2FMW1HO4zTWR%2FnXwbFE4WREZOAhCsNhquFMnhwroWbs5HUGP%0AGf434sZbk56ifb5afxA%3D%0A>
 

### Uploading a request list
 
You can upload a request list when the audit has no requests yet. After requests already exist in the audit, only your auditor can add more.
 
To upload a request list:
- 
Open your audit and go to the Requests tab.
- 
Click Download to get resources to help you prepare your spreadsheet outside of Vanta.
- 
Select Example IRL to download a sample CSV template showing the supported fields and example rows.
- 
Select Framework codes to download a CSV of the valid framework codes and descriptions for your audit's framework to use as a reference when preparing your spreadsheet.
- 
Return to the Requests tab.
- 
Click Upload IRL. 
- 
Upload your file by dragging and dropping it or browsing from your computer.
- 
Select the header row.
- 
Map your columns to the corresponding fields in Vanta.
- 
Review any warnings. You can proceed with warnings—only blocking errors must be resolved before importing.
- 
You can bulk import up to 2000 requests via XLS or CSV.
- 
Click Import. Once imported, your requests appear in the Requests tab with a status of Needs evidence.
​
💡 Tip: You can include framework codes as a column in your spreadsheet to automatically map requests to controls—we look up the controls associated with each code and add them to the audit at import. Framework codes are used only at import and don't appear elsewhere in the audit. Or you can map requests to controls after importing.
 

### Supported fields (request metadata)
 
Each request allows you to capture metadata using the following fields. Some fields can be added with your spreadsheet import, others you need to manage in Vanta after import.
 | 
Field | 
Description
 | 
Unique ID | 
Any value that uniquely identifies each request. Used to prevent duplicates.
 | 
Request name | 
The name of the request.
 | 
Type | 
Point in time, Sample, or Population.
 | 
Description | 
Additional context about the request.
 | 
Due date | 
The date by which evidence should be ready.
 | 
Capture date | 
The earliest date evidence can be added to a request.
 | 
Cadence | 
Monthly, Quarterly, Biannually, or Annually.
 | 
Control ID | 
A specific control you want to map the request to.
 | 
Owner | 
The user or team assigned as information request owner.
 | 
Status | 
The workflow status for the request.
 

### Assigning request owners
 
Assign an owner to each request so your team knows who’s responsible for gathering and submitting evidence. You can assign either a user or a team as the owner. If you assign a team, members of that team can upload evidence for the request.
- 
To assign an owner to a request, click the Owner field in the request list or in the request header.
- 
To assign owners in bulk, select multiple requests in the request list and click Assign Owner from the toolbar.
 

### Editing request metadata
 
In the Evidence tab of a request, you can edit the following metadata from the request header:
- 
Due date
- 
Capture date
- 
Type
- 
Cadence
- 
Owner
- 
Status (can mark as Not ready, Internal review, or Audit ready)
From the Requests tab, you can select multiple requests to apply bulk changes to:
- 
Due date
- 
Capture date
- 
Type
- 
Cadence
- 
Owner
​
ℹ️ Note: Only the auditor can add new requests, edit the request name or description, or delete requests.
 

### Exporting a request list
 
From the Requests tab, click Export to download your request list as a ZIP file.
 
The ZIP file includes a folder for your framework, containing:
- 
A CSV of each request per row alongside available request metadata
- 
A folder per request, containing:
- 
Evidence attached to the request, where applicable—some evidence types, like underlying automated test data, are represented as a summary rather than the raw file
- 
A text file of external comments on the request
- 
A text file of the request's metadata
Your auditor doesn’t have permissions to export the request list.
 
 

## Control mapping
The Controls tab gives you a view of all controls added to your audit. Use it to confirm your requests are mapped to the right controls, track evidence progress per control, and view control assessments from your auditor.
 
Controls can be added directly to the audit, or by mapping requests to controls. The Controls tab may be empty if no framework codes or control IDs were included when uploading your request list.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2619270587/e2ddb9b42210b19b49dc09d52561/image.png?expires=1794967200&signature=b3a7999d6b80bbd6a7dbae99bd43e5612edb935dc50059d80d0d7677b4e23b50&req=diYmH8t5nYRXXvMW1HO4zd8%2BzgoyEXz1FH%2Fr3ZCYbvKwSJC4T%2FhoyYp7V%2BSR%0AP5o7E1HLjX3M0z7oOOM%3D%0A>
 

### Adding controls to the audit
 
You can add controls directly to the audit and map them to requests whenever you’re ready.
 
To add a control:
- 
Open your audit and go to the Controls tab.
- 
Click the ••• menu at the top of the page and select Add control.
- 
Select the controls to add.
- 
Under Linked requests, select the requests to map to the control, or do this later.
- 
Click Add.
​
💡 Tip: You can manage controls after they’ve been added to the audit in the same way—from the Controls tab, click Add control, and select the control you’d like to edit. From here, you can map requests or remove the control from the audit.
 

### Mapping requests to controls
 
You can map controls to requests when you import a request list by including framework codes and/or control IDs in your spreadsheet, or you can map them directly.
 
To map a control to a request:
- 
Open your audit and go to the Requests tab.
- 
Open a request.
- 
Go to the Controls tab.
- 
Click the + button.
- 
Search for and select the control you want to add or remove.
 

### Assigning control owners
 
Control owners pipe in automatically from the control owner assigned on the Controls page <https://help.vanta.com/en/articles/11345373-controls-page>—edit the owner there rather than from within the audit.
 

### Reviewing control assessments
 
Control assessments let an auditor evaluate a control as a whole, based on how well the linked evidence demonstrates that the control is met. Only auditors can edit the Auditor assessment status and Justification for each control.
 

### Syncing control names and descriptions
 
Controls within your audit can be manually synced to the Controls page <https://help.vanta.com/en/articles/11345373-controls-page>. If you edit control names or descriptions on the Controls page after adding controls to the audit, the audit won't automatically reflect that change.
 
To refresh control content in your audit:
- 
From the Controls tab, click Sync controls. This refreshes every control in the audit—table filters don't limit what gets synced.
- 
Wait for the sync to finish—this can take a few minutes for larger audits.
- 
Once complete, a banner prompts you to reload the page to see the updated content.
 

### Exporting controls and control activity

### Exporting controls
From the Controls tab of the audit, click Export to download the controls table as a CSV.
- 
The export includes all controls and columns in the table—filters and hidden columns don't apply.
- 
The export includes the auditor assessments and justifications, but excludes auditor comments.
​

### Exporting control activity
From the Controls tab of the audit, click the ••• menu and select Export control activity to download an activity log as a CSV.
 
Each row in the export represents one of the following activity events, along with the control name and ID, the activity date, and the user who authored the change:
- 
A comment added to the control, including the comment text and whether it was later edited
- 
An assessment status change, including the previous and new status
- 
A justification added or edited, including the previous and new text
 
 

## Population data access
IRL audits use the Controlled auditor view, which means all sections in the Data & populations tab are hidden from your auditor by default—you decide which sections your auditor can see.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2549051658/26634d0550fc8a0906d8874affeb/image.png?expires=1794967200&signature=e4ea0dc0f230f7366503bc98950bb5eeaf2b04833e67815ec193400d54ab1bf7&req=diUjH8l7nIdaUfMW1HO4zZYoHrkDNhzypBWsFZOy5B7PQo2dZs5pLIWuBWiZ%0AVZRMcTP9X6%2BIbXOyqK8%3D%0A>
- 
When you enable a section, it becomes available to your auditor once the observation window starts or once an active early access period begins. When you disable a section, access is removed immediately. 
- 
While you can manage which sections are shared before the audit starts, the pages themselves are only viewable once the audit period starts, at which time you can click View next to any section to preview what your auditor will see.
​
📖 Learn more: Managing Auditor Views <https://help.vanta.com/en/articles/11565398-managing-auditor-views>
 
 

## Request owner workflow
Requests represent evidence-level evaluation, where an auditor reviews the specific evidence attached to a request. If you’re assigned as an Information Request Owner, your job is to gather evidence and get it ready for your auditor. Each request moves through the following statuses as you work through it.
 | 
Request status | 
Description
 | 
Not ready | 
No evidence has been attached yet, or the request needs more work before it can move to internal review or be shared with your auditor.
 | 
Internal review | 
Evidence is attached and ready for your team to review before sharing with your auditor. Your auditor can't see evidence at this stage.
 | 
Audit ready | 
Evidence was marked ready for audit and is visible to your auditor for evaluation.
 | 
Flagged | 
Your auditor reviewed the request and needs an update, clarification, or additional evidence. Address the feedback and mark it audit ready again.
 | 
Accepted | 
Your auditor reviewed and accepted the request.
ℹ️ Note: Your team moves requests through Not ready, Internal review, and Audit ready. Only the auditor can move a request to Flagged or Accepted.
 

### Uploading evidence
 
You can attach multiple types of evidence to a single request. 
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2549078429/53ec3f7b6710ee2060f878e3ab7f/image.png?expires=1794967200&signature=f44d9fe1c95be620d76448115e27665d1f393a80aaf2974e715d28f8cb533718&req=diUjH8l5lYVdUPMW1HO4zWIIRYGDFdwlmckODQ925C1OYv%2FKdbqiEDqosJPF%0AhkIKqR57VvghUuw48tE%3D%0A>
 
To upload evidence to a request:
- 
Open your audit and go to the Requests tab. 
- 
Click a request from the table and go to the Evidence tab. 
- 
Click the + Evidence button and select the upload method you want to use:
- 
Vanta evidence: Evidence from automated tests, policies, and documents already stored in Vanta. Use the Related toggle to filter to evidence Vanta recommends for the request. Turn it off to browse a broader list of available Vanta evidence in scope for the audit.
- 
Upload document: Upload a file from your computer. Supported file types (up to 50 MB each): .ai, .csv, .docx, .jpg, .json, .pdf, .png, .txt, .webp, .xlsx, .zip.
- 
Add URL: Add a link to an external resource. Requires a URL and title.
- 
Observation notes: Add plain text in a text box.
If you add evidence to a request that's already been marked as Audit ready, it's visible to them immediately—except for automated test evidence, which moves the request back to Internal review. 
 
Evidence can't be added to requests that have already been marked as Accepted by your auditor. If you need to add evidence after it’s been accepted, ask your auditor to move the request back to Flagged.
 

### AI evidence evaluation
- 
For evidence uploaded from outside of Vanta: Vanta AI evaluates it against the auditor's specific request, flags gaps, and provides remediation guidance before you submit it to your auditor.
- 
For evidence already in Vanta: Tests, policies, and documents go through their own compliance workflows. When you attach existing Vanta evidence, you're linking evidence that you’re already assessing elsewhere, so Vanta AI does not need to re-evaluate it.
 

### Evidence capture dates
- 
Some requests may have a capture date, meaning evidence can't be added until that date arrives.
- 
The evidence upload controls are hidden until the capture date is current—you'll see a note on the request indicating when the evidence window opens.
- 
When the capture date arrives, you'll receive a notification and can begin uploading evidence.
 

### Sharing evidence (marking as audit ready)
 
Once evidence is uploaded, you can move the request status to Internal review or Audit ready.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2549077446/58e9eb5179db60d4851881504cc4/image.png?expires=1794967200&signature=417cee1c58b8e2d4555d9a34d718e17f0b58816031bfe0c932dba387bc400826&req=diUjH8l5moVbX%2FMW1HO4zZWW1ZPJHTpEo5yWeINZOvOaqeoq%2BIemFAEFEP5Q%0A%2FfzHUcAapPfcFJDwYSY%3D%0A>
 
To share evidence:
- 
Open your audit and go to the Requests tab. 
- 
Click a request from the table and go to the Evidence tab. 
- 
Click the Share evidence button and select one of the following options:
- 
Share with internal team: Moves the request to Internal review. Your auditor can’t see evidence at this stage.
- 
Share with auditor: Moves the request to Audit ready. Your auditor can see the evidence shared on the request.
- 
Evidence not ready: Returns the request to Not ready.
​
ℹ️ Note: The audit's owner permissions <https://help.vanta.com/en/articles/11345472-audits-page> setting determines if Information Request Owners can share evidence directly with the auditor or if they can only move the request to internal review.
 
 

## Auditor workflow
Once you assign an auditor <https://help.vanta.com/en/articles/11345429-adding-and-managing-auditors>, they can only access the audit once the observation window starts or an early access period begins. Once they have access, here's what they can do on each tab:
- 
Requests: Review evidence marked ready for audit, accept or flag requests, manage the request list, and view or respond to auditor comments.
- 
Controls: View the controls mapped to the audit, conduct control assessments, export controls and control activity, and view or respond to auditor comments.
- 
Data & populations: View only the sections enabled for the audit.
 

### Uploading a request list
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2549068530/32f1d91888a3155bcb297fb2005f/image.png?expires=1794967200&signature=3ddbed8d937b3e9140c8abf3e1ba5833d79e1fa645cbd836684f2bcfc9e63e7e&req=diUjH8l4lYRcWfMW1HO4zSisjd9pXsm4B9TLZ6pYOiuCM7QO1RMRmbg6qh4h%0ASMuWGI1rsVUDI10vF9w%3D%0A>
- 
An auditor can upload the initial request list once they have access to the audit, if you haven't already done so.
- 
An auditor can add more requests by uploading another spreadsheet. This adds new requests—it doesn't update existing ones. Each request in the upload needs a unique ID that hasn't already been used in that audit.
- 
See request list management for more information on preparing a spreadsheet.
 

### Adding or deleting individual requests
- 
An auditor can add individual requests to the audit or delete requests from the audit.
- 
Only auditors can add or delete individual requests in the audit.
 

### Editing request metadata
 
In the Evidence tab of a request, an auditor can edit the following metadata from the request header:
- 
Request name
- 
Description
- 
Due date
- 
Capture date
- 
Type
- 
Cadence
- 
Status (can mark as Accepted or Flagged)
​
ℹ️ Note: Auditors can’t edit the Owner field or use other Status fields.
 

### Accepting or flagging requests
 
While an auditor can view and edit requests during the audit window, they can only review the request’s evidence once it’s been marked Audit ready. That’s when the evidence becomes visible to them, and they can then accept or flag the request.
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2549072008/e89f5ae359533127df2313d53fd0/image.png?expires=1794967200&signature=13f257b996e287662372f7b0915f7dc006c85e91025f4d8d8bd948c8dae5bd1d&req=diUjH8l5n4FfUfMW1HO4zbRVQFQ0dzi%2FrYrgI98up8j6V8vzudYdccf05RON%0AoQZ42gl9bo5DlXU0Jk4%3D%0A>
- 
Accepted: Your auditor reviewed and accepted the evidence.
- 
Flagged: Your auditor needs an update, clarification, or additional evidence.
 

### Conducting control assessments
 
An auditor can change the status for each control and can add a justification to explain why.
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2549060795/0a87c5009fa3f1e27ff4fb9cf30a/image.png?expires=1794967200&signature=d0347d1507bcb53cc5b5886ec4e9ea6f92178cb1e04076e72d93479a64706a10&req=diUjH8l4nYZWXPMW1HO4zWrJCVNrgKCxWHXYUh3qUFUUT%2FyQYdS1DefZnAWM%0AMUIdvZky25GkSa%2FR9XU%3D%0A>
 
To conduct a control assessment:
- 
Open the audit and go to the Controls tab.
- 
Edit the Auditor assessment status:
- 
Select a status directly from the table.
- 
Open the control details to select a status.
- 
Add a Justification in the confirmation modal.
To edit a justification without changing the status, open the control and edit the Justification field directly.
 
Assessment status options depend on the framework <https://www.vanta.com/products/additional-frameworks> in scope for the audit. Frameworks not listed below use the default status options.
 | 
Framework | 
Status options
 | 
ISO frameworks | 
Not assessed, Major non-conformity, Minor non-conformity, Conforming
 | 
FedRAMP or NIST 800-53 | 
Not assessed, Not satisfied, Other than satisfied, Satisfied
 | 
FedRAMP 20x | 
Not assessed, False, Partial, True
 | 
Custom frameworks | 
Not assessed, Not satisfied, Other than satisfied, Satisfied
 | 
All other frameworks (default) | 
Not assessed, Not in place, Partial, In place
 
 

## Audit commenting
Use audit commenting to collaborate internally on requests or communicate with your auditor on requests or controls. Auditors can view and respond to auditor-facing comments when they have access to the audit engagement. Internal users can comment at any time, whether the audit is active or complete.
 | 
Comment type | 
How to comment
 | 
Request-level commenting | 
Open your audit and go to the Requests tab. Click a request from the table and go to the Auditor comments or Internal comments tab.
 | 
Control-level commenting | 
Open your audit and go to the Controls tab. Click a control from the table and go to the Auditor comments tab.
ℹ️ Note: Information Request Owners can post internal comments and view auditor comments on requests only, as well as post auditor-facing comments if the audit’s owner permissions <https://help.vanta.com/en/articles/11345472-audits-page> setting is enabled. Control Owners can post auditor-facing comments on controls only if the audit’s owner permissions <https://help.vanta.com/en/articles/11345472-audits-page> setting is enabled.
 

### Request-level commenting
- 
Each request has two comment threads: one for internal-only comments and one for auditor-facing comments.
- 
Auditor comments are visible to both you and your auditor.
- 
Internal comments are only visible to your team. To loop in a specific teammate, you can use an @ mention.
 

### Control-level commenting
- 
Each control has one shared comment thread for auditor-facing comments.
- 
Control comments are visible to both you and your auditor. There is no internal-only control comment thread, but you can loop in a specific teammate with an @ mention.
 

### Comment notifications
- 
Comment notifications follow your notification preferences <https://help.vanta.com/en/articles/11345394-notifications-and-notification-settings> and can be sent via email, supported integrations, and your in-app notifications menu.
- 
While comments are visible as soon as they're posted, comment notifications are batched over a 30-minute window. If multiple comments are posted during that time, they'll be grouped into a single notification.
 
 

## Audit notifications
You’ll receive notifications when key events occur on your information requests during the audit. Each user manages the notifications they receive from their account notification settings.
 
To manage audit notifications:
- 
Go to Settings.
- 
In the page menu, scroll to My account and select Notifications.
- 
Scroll to the IRL / Audit Requests section.
​
ℹ️ Note: Auditors are not notified when a request is marked ready for audit or when evidence is shared. To alert your auditor that requests are ready for their review, leave an auditor comment.

## Images

- [image 01] ../../images/ux/audits/managing-an-information-request-list-irl--01.png
- [image 02] ../../images/ux/audits/managing-an-information-request-list-irl--02.png
- [image 03] ../../images/ux/audits/managing-an-information-request-list-irl--03.png
- [image 04] ../../images/ux/audits/managing-an-information-request-list-irl--04.png
- [image 05] ../../images/ux/audits/managing-an-information-request-list-irl--05.png
- [image 06] ../../images/ux/audits/managing-an-information-request-list-irl--06.png
- [image 07] ../../images/ux/audits/managing-an-information-request-list-irl--07.png
- [image 08] ../../images/ux/audits/managing-an-information-request-list-irl--08.png
