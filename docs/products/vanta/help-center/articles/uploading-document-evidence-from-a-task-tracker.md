# Uploading Document Evidence from a Task Tracker

Source: https://help.vanta.com/en/articles/13352842-uploading-document-evidence-from-a-task-tracker
Collection: Evidence Collection ; Evidence Collection › Documents
Fetched: 2026-11-17

## Article text

Vanta lets you collect document evidence directly from your task tracker, so work gets done where your team already operates. After you link a document in Vanta to a task, contributors can upload document evidence as attachments to the linked issue or task.
 
All uploads made on a linked issue will automatically flow to Vanta as long as the task is linked (either by creating the task from Vanta or linking an existing task). From within Vanta, the document owner can then select from the synced attachments to upload and submit.
 
 

## Supported task trackers
This feature is currently supported for the following integrations:
- 
Jira Cloud
- 
Linear
- 
ClickUp
- 
Asana
We're working toward supporting additional task trackers in the future. 
 
 

## Linking tasks 
Before you can automatically collect evidence from your task tracker, you need to link a task to a Vanta document.
 
To link a task to a Vanta document:
- 
Open the document you need evidence for.
- 
Go to the Tasks tab.
- 
Click the Create task button.
- 
Choose whether you're going to link to an existing issue/task or create a new one.
You can link multiple issues or tasks within a single document. However, an individual issue or task can only be linked to one Vanta document at a time.
 
 

## Uploading evidence

## Adding attachments in Jira
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1946276220/fca7fdfd20f8243b26daa0ba3b9c/Screenshot+2026-01-15+at+4_08_27%E2%80%AFPM.png?expires=1794967200&signature=9b21596dbdbf7348ce7069368760bbc9f6ec416ae3f76247511f82850667e891&req=dSkjEMt5m4NdWfMW1HO4zQr9jp91wXCg9AoDzIYNj8YeUqOxxoT%2F8ji03yXm%0ApUBdOJndtpgSGV4mi8E%3D%0A>
 
After a Jira issue is linked to a Vanta document:
- 
The Jira assignee uploads one or more file attachments directly to the Jira issue.
- 
All attachments on the issue will sync to Vanta automatically—you can’t choose which attachments sync.
- 
An auto-generated comment will confirm if the attachments were successfully uploaded or if there was a failure. Syncing runs about every 30 minutes, at the top and half past the hour, so the comment may not appear immediately
- 
When the Jira assignee is finished providing evidence, they should move the Jira issue to a closed or done status to indicate to the Object owner that they are finished uploading. The Jira issue status is visible from Vanta.

## Reviewing evidence in Vanta
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1925386203/a890630b79b14c7077d5dc0e3d47/bf404a27-6872-4b99-a782-e58fa28356e8?expires=1794967200&signature=3e52ca8beff68ee0f68e6ea462c007b7ae93a0ba15fe67d7ad2edbc4fb878f96&req=dSklE8p2m4NfWvMW1HO4zdT8wFMueJ1jqzl2IJetTOdSCOejL0gznei1ooWL%0AXqUGYahR2sfRboD%2B00c%3D%0A>
 
Once attachments are synced to Vanta and the Jira issue is moved to a closed or done status:
- 
The document owner can see the number of attachments uploaded to the task from Vanta, along with other information about the issue such as status.
- 
Upon Jira issue status changing to closed, indicating that evidence upload is complete, the document owner is notified that new attachments are available.
- 
Attachments appear on the document in the Evidence tab under Recommended files, clearly marked as coming from Jira.
- 
Attachments uploaded from Jira are not automatically submitted as evidence. The document owner must manually select the files from Recommended files to upload and submit in Vanta. 

## Comments in Your Task Tracker
When an attachment is uploaded to a linked issue—whether successfully or with an error (such as an unsupported file type)—Vanta posts a comment directly on the corresponding task.
 
Comments are posted by the connected Vanta integration and provide confirmation of upload status or error details.
 

## Jira 
When setting up your Jira integration, we recommend using a service account rather than an individual person’s account. This ensures automated comments are clearly understood as system-generated and don’t create confusion for your team. 
 

## Linear
When document evidence is uploaded from a Linear issue, Vanta adds a comment directly on the issue indicating whether the attachment was successfully uploaded or if there was an error (for example, an unsupported file type).
 
Comments are posted by the connected Vanta app.

### Updating Permissions for Existing Connections
If your Linear integration was connected before Vanta added support for posting comments, it may not have sufficient permissions to post comments. 
 
To update the integration permissions: 
- 
Navigate to Integrations in Vanta
- 
Select the Connected tab
- 
Search for Linear
- 
Click Manage 
- 
Select Edit
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2119701394/e6995eb202f86698074f99da9348/20263cbc-9810-4d5e-9243-e2c1696f7596?expires=1794967200&signature=486317dbf7bbb17824f3b90aedd348bbd84ee7a5f4f8fc2c7a97779eda8dfc84&req=diEmH85%2BnIJWXfMW1HO4zcQcPqk1HZHVWH1zPxFR6xRpmZRYpEOeRYuxRFTT%0ATDYM%0A>
 
- 
Choose Read and write access
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2119702231/5000ebbdf962fac893f55b5ab3ea/8f1c1daa-dab2-4d0a-8196-87da8949b603?expires=1794967200&signature=a8673e70ff70fcc032496d97ff5dd3a5a17965c7894c1f871c7ed3eca81864d0&req=diEmH85%2Bn4NcWPMW1HO4zd75svjfqXEdbxosJGTkW7Dc50BQH2CvLT6TN6ip%0ADITX%0A>
 
- 
Click Connect Linear
During the OAuth authorization flow in Linear, you will see that Vanta is requesting permission to “Create issue comments for your workspace.” After authorizing the updated permissions, you will be redirected back to Vanta and comment functionality will be enabled.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2119705700/edd11343dadf5ea1e4cb71a06789/3a0ffe9c-0ea7-46a3-bebe-003d08b3a1ac?expires=1794967200&signature=8bff987ea09cbc739b643135828a2f915b1502376fcc4dcfa2ad99cd60b09db2&req=diEmH85%2BmIZfWfMW1HO4zY2nTr9SxsI6CAFv9ukf9SPlwX9FjqdX7hdSPefZ%0A1YBOru%2F%2FLv6IXcsGa%2Bs%3D%0A>
 

## ClickUp
When document evidence is uploaded from a ClickUp task, Vanta adds a comment directly on the task indicating whether the attachment was successfully uploaded or if there was an error (for example, an unsupported file type).
 
Comments are posted by the user whose account was used to connect Vanta to ClickUp. ClickUp does not support fine-grained permission control—the integration inherits all permissions from the connecting user. No additional API scopes or re-authorization is required.
 

## Asana attachments: native files vs third-party links 
When you import attachments from a linked Asana task, Vanta handles them in one of two ways depending on where the file is stored:
- 
Files uploaded directly to Asana are imported as uploaded documents in Vanta and stored in your document library.
- 
Files stored in Google Drive, Dropbox, OneDrive, or Box are imported as link evidence. Vanta creates a link record pointing to the file in its source system. Clicking the evidence in Vanta opens it directly in Drive, Dropbox, OneDrive, or Box.
Both types appear in the recommended evidence section after the task is linked and synced, and can be accepted as evidence in your compliance workflow.
 

### Supported third-party attachment sources
The following external providers are supported for link evidence import from Asana:
- 
Google Drive
- 
Dropbox
- 
Microsoft OneDrive
- 
Box
Attachments from other external sources are not currently imported.
ℹ️ Note: After linking a task or adding new attachments in Asana, it may take up to 30 minutes for the attachments to appear in Vanta. This applies to both native file attachments and third-party link attachments.

## Images

- [image 01] ../../images/integrations/linear/uploading-document-evidence-from-a-task-tracker--01.png
- [image 02] ../../images/ux/documents/uploading-document-evidence-from-a-task-tracker--02.png
- [image 03] ../../images/ux/integrations/uploading-document-evidence-from-a-task-tracker--03.png
- [image 04] ../../images/ux/integrations/uploading-document-evidence-from-a-task-tracker--04.png
- [image 05] ../../images/integrations/linear/uploading-document-evidence-from-a-task-tracker--05.png
