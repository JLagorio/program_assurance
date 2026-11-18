# Connecting Vanta & Asana

Source: https://help.vanta.com/en/articles/14668851-connecting-vanta-asana
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Workflow and Ticketing Tools
Fetched: 2026-11-17

## Article text

## Overview
The Asana integration connects your Asana workspaces to Vanta over OAuth, enabling task management, evidence collection, and user account syncing directly within your compliance workflows. It is best suited for teams that already use Asana as their primary work management tool.
 
Estimated setup time: 5-10 minutes
 
 

## Use cases and capabilities
- 
Task Management: Create or link Asana tasks directly from Vanta tests and controls. Once linked, we sync the task's status, assignee, and due date automatically and reflect task completion back in Vanta without any manual updates.
⚠️Note: When creating or linking tasks, you can filter by Asana tags to narrow results. Tag filtering is case-sensitive — enter tags exactly as they appear in Asana, including capitalization.
- 
Evidence Collection via Attachments: Link an Asana task to a Vanta control or document and we automatically surface files attached to that task as potential evidence — ready to be promoted without manual uploads.
⚠️Note: Vanta imports attachments from linked Asana tasks in one of two ways, depending on where the file is stored:
- 
Files uploaded directly to Asana are imported as uploaded documents and stored in Vanta's document library.
- 
Files stored in Google Drive, Dropbox, OneDrive, or Box are imported as link evidence. Vanta creates a link record pointing to the file in its source system. Clicking the evidence in Vanta opens it in Drive, Dropbox, OneDrive, or Box directly.
Both types appear as recommended evidence after the task is linked and synced. Attachments from other external sources are not currently imported. Files without a recognized file type or extension may not display correctly in the evidence workflow.
- 
User Account Tracking: Connect an Asana workspace and we automatically sync user accounts (including account status and workspace membership) to support personnel tracking and access review workflows.
- 
Automated Comment Updates: When key events occur in Vanta like evidence being uploaded to a linked document, we post an automated comment to the associated Asana task to keep context current for teams working in Asana.
​

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
User Accounts | 
Yes | 
Personnel tracking, access reviews
 | 
Tasks | 
Yes | 
Test remediation, linked task tracking, status sync
 | 
Task Status | 
Yes | 
Reflected on linked Vanta tests and controls
 | 
Task Assignee | 
Yes | 
Displayed on linked tasks in Vanta
 | 
Due Dates | 
Yes | 
Displayed on linked tasks in Vanta
 | 
Tags | 
Yes (case-sensitive) | 
Used to filter tasks during task creation and linking
 | 
File Attachments | 
Partial | 
Evidence collection — native Asana files imported as uploaded documents; Google Drive, Dropbox, OneDrive, and Box attachments imported as link evidence; other external sources not supported
 | 
Task Creation from Vanta | 
Yes | 
Create tasks in Asana directly from Vanta tests or controls
 | 
Link Existing Tasks | 
Yes | 
Link by pasting a valid Asana task URL
 | 
Comment Posting | 
Yes | 
Vanta posts automated updates to linked Asana tasks
 | 
Access Ticketing (Offboarding) | 
No | 
Not supported – Use Vanta's built-in offboarding workflows for access ticketing
 | 
Incident Ticketing | 
No | 
Not supported – Manage incidents directly in Vanta
 | 
Task Query / Browse from Vanta | 
No | 
Not supported – Link tasks by pasting a direct Asana task link
 | 
Multiple Asana Connections | 
Yes | 
A single Vanta org can connect multiple Asana accounts
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have an Asana account with access to the workspaces you want to sync.
- 
If your organization enforces app authorization policies in Asana, your IT or Asana admin may need to approve the connection before setup.
💡 Tip: During setup, we will display all Asana workspaces associated with your account and ask you to select which ones to include. Know in advance which workspaces contain the projects relevant to your compliance work. You can only sync data from workspaces your Asana account has access to.
 
 

## Setup guide

### Step 1: Find the Asana integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Asana. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect. 
 

### Step 2: Authorize the connection 
- 
In the Link Asana modal, click Connect Asana.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2288724248/48fa98d13f7077a58491456d0bc0/1b133ab0-18c6-4bfc-b011-6d1a57b84b6c?expires=1794967200&signature=0b1d0e4980fe3f0083b3f7fe55b001b1b0e86f8ff797f10e07da9eda15306980&req=diIvHs58mYNbUfMW1HO4zVWmdfyZqe4Ym1Eua6lyeDqwK2Ahp4ZSdVMHEGb5%0AM1Z5wuN8qSF2rLdNj3k%3D%0A>
- 
Vanta redirects you to Asana's login page.
- 
Log in with the Asana account you want to use for this connection.
- 
Review the permissions Vanta is requesting and click Allow.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2288726532/bece5b8d5e5fd1d24b3f072b01c3/bd9811c6-bb86-458f-a40c-4635abb4a9c9?expires=1794967200&signature=a2f08aeb0d383bf76f61d8f6d061c0e0bdd63e1b30542c319a28bcd1abd3544a&req=diIvHs58m4RcW%2FMW1HO4zQIFYG57M5ycYaf4HyMCo4rjUTKGo5VhryZtITat%0AObAFj2ppzsQX%2Blj1Yfw%3D%0A>
- 
Asana redirects you back to Vanta automatically.
 

### Step 3: Select workspaces
- 
Vanta displays a list of all Asana workspaces associated with your account. 
- 
Toggle on the workspaces you want Vanta to sync. 
- 
Toggle off any workspaces you want to exclude (we will not pull data from excluded workspaces). 
- 
Save your selection.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2288729589/9f2373a4496f5ff39cdcdcfac807/dab00522-cc30-417a-b716-09495f264b08?expires=1794967200&signature=dcd1b0b2ec7fa8b92826af77dfb6878edf3b2ab94d0636771012e8b5e88d1f42&req=diIvHs58lIRXUPMW1HO4zfbptfhC0X%2Fgr2JZ8Ee3Ab2YBNbV0udO7bYRW0HL%0AvoXWgmMbBJUcKX%2BTm4A%3D%0A>
 

### Step 4: Confirm the connection
- 
After saving, the Asana integration should appear as Connected in your Vanta integrations list.
- 
We begin an initial sync immediately after setup completes. The initial sync may take ~30 minutes, depending on the size of your workspaces.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2288732358/534903cf7325a925227a32890b94/d22f74a4-de0f-4a2a-8fbe-9e8386b1f10c?expires=1794967200&signature=befbea8084248696cad6ae6e3cfd6fdaf5335a8277613e2d4e39dce72039556c&req=diIvHs59n4JaUfMW1HO4zZ%2Fkw9oSrygUHaCfQpp0yCH8af912k67feribsFn%0AqyEUWL47Z%2FNoCN%2FE5a0%3D%0A>
 
ℹ️Note: If you need to connect additional Asana accounts (for example, if your organization uses multiple Asana workspaces under separate accounts), you can add multiple Asana connections from the same integrations page.
 
 

## Permissions

### Read access
We use the authorization you grant during setup to read workspace membership and user account data, pull tasks, tags, and project associations from your included workspaces, and download file attachments from linked tasks to surface as evidence in Vanta.
 

### Write access
We have write access to your Asana account and use it in two specific situations:
- 
Creating tasks: When you create an Asana task from a Vanta test or control, we post the task to your Asana workspace on your behalf.
- 
Posting comments: When certain events occur in Vanta (like evidence being attached to a linked item), we post a comment to the associated Asana task.
We do not modify or delete existing Asana tasks, projects, or user data.
 
 

## Troubleshooting and FAQs

### The integration shows as disconnected or needs reconnection
- 
Likely cause: The Asana authorization was revoked, expired, or the Asana account credentials changed.
- 
How to confirm: Go to Integrations in Vanta and check the status of the Asana connection.
- 
Fix: Click Reconnect on the Asana integration and complete the OAuth flow again. You will be asked to re-authorize Vanta in Asana.
 

### User accounts are missing or incomplete after sync
- 
Likely cause: The workspaces those users belong to were excluded during setup, or the account used to authorize the connection does not have access to those workspaces.
- 
How to confirm: Check which workspaces are now included in your Asana integration settings. Confirm the Asana account used for the connection is a member of the workspaces where the missing users exist.
- 
Fix: Update workspace selection in the integration settings to include the relevant workspaces, or reconnect using an Asana account with broader workspace access.
 

### Task attachments are not appearing as evidence in Vanta
- 
Likely cause: The sync hasn't completed yet, or the attachment is from an external source that isn't currently supported.
- 
How to confirm: Open the Asana task and check whether the attached files are native uploads or links to external services. Note that attachments can take up to 30 minutes to appear in Vanta after a task is linked or updated.
- 
What is supported:
- 
Files uploaded directly to Asana are imported as uploaded documents in Vanta.
- 
Google Drive, Dropbox, OneDrive, or Box attachments are imported as link evidence in Vanta (a link record is created pointing to the file in its source system).
- 
Attachments from other external sources are not currently imported.
- 
Fix: If the attachment is a supported type and more than 30 minutes have passed, try disconnecting and reconnecting the task, or contact Vanta support. If the file is stored in an unsupported external service, download it and re-upload it directly to the Asana task as a native attachment.
 

### A linked Asana task URL is not accepted by Vanta
- 
Likely cause: The URL does not point directly to an Asana task. Vanta only accepts task-level URLs. URLs pointing to projects, search results, inbox views, or Asana admin pages are not valid.
- 
How to confirm: Open the task in Asana and copy the URL directly from the browser while viewing the task. Valid task URLs follow one of these formats:
- 
https://app.asana.com/0/{project_id}/{task_id <https://app.asana.com/0/%7Bproject_id%7D/%7Btask_id>}
- 
https://app.asana.com/0/{project_id}/{task_id}/f <https://app.asana.com/0/%7Bproject_id%7D/%7Btask_id%7D/f>
- 
https://app.asana.com/0/0/{task_id <https://app.asana.com/0/0/%7Btask_id>}
- 
https://app.asana.com/{n}/{workspace_id}/project/{project_id}/task/{task_id <https://app.asana.com/%7Bn%7D/%7Bworkspace_id%7D/project/%7Bproject_id%7D/task/%7Btask_id>} 
- 
Fix: Navigate directly to the task in Asana and copy the URL from your browser's address bar. Both the classic Asana URL format and the newer workspace/project/task format are supported. Avoid using links generated from project views, search results, or inbox.

## Images

- [image 01] ../../images/integrations/asana/connecting-vanta-asana--01.png
- [image 02] ../../images/integrations/asana/connecting-vanta-asana--02.png
- [image 03] ../../images/integrations/asana/connecting-vanta-asana--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-asana--04.png
