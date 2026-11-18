# Automated Ticket Creation for Documents

Source: https://help.vanta.com/en/articles/14855960-automated-ticket-creation-for-documents
Collection: Evidence Collection ; Evidence Collection › Documents
Fetched: 2026-11-17

## Article text

✅ Feature availability: This feature is currently in preview. You can request access to this feature through your Customer Success Manager. 

## Overview
You can set up a workflow in Vanta that automatically creates a Jira issue whenever a document is approaching its renewal date or needs remediation. Once enabled, this workflow applies to all documents. There's no need to configure it document by document.
 
Each issue is assigned to the document owner, linked back to the document in Vanta, and due-dated based on the document's renewal date. This helps ensure the right people are notified in the tool where they already work, without anyone having to manually create tickets in Jira.
 
Current limitations:
- 
Jira is the only supported task tracker at this time.
- 
The workflow applies to all documents globally. You cannot scope it to specific documents.
- 
This workflow does not auto-close Jira issues when a document is renewed.
 
 

## Prerequisites
Before you can enable this workflow, confirm the following:
- 
Jira is connected with write access. This workflow requires write permissions to create issues on your behalf. If your Jira integration is connected in read-only mode, you'll see a prompt to enable write access when you attempt to turn on the workflow. Go to Integrations, select the Connected tab, find Jira. Then, click Manage and click Edit to update your access level. For full Jira setup instructions, see the Jira Quickstart <https://help.vanta.com/en/articles/14323221-jira-quickstart> or the Jira Integration Guide <https://help.vanta.com/en/articles/14441707-jira-integration-guide>.
- 
You have Admin or Editor permissions in Vanta. Only Admins and Editors can create, enable, or disable this workflow. Document owners can see that a workflow is active for their documents but cannot change it.
 
 

## How to enable automated ticket creation
- 
In Vanta, go to Global Settings (the gear icon) > Compliance. Scroll to the Workflows section. 
- 
Find the Task creation at renewal section.
- 
Toggle the workflow on.
- 
Configure the required fields (see below).
- 
The workflow saves automatically as you fill in fields – no save button required. Once the toggle is on and all required fields are complete, the workflow is active.
 
If Jira is not yet connected, you'll see a prompt to connect it. If Jira is connected in read-only mode, you'll see a prompt to enable write access.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2342029686/536a7a967360e71060ce30a7a564/c39855b3-9140-4677-9646-20ed3fdbb11c?expires=1794967200&signature=f266727cae3cc9ed4eeb3755faedfe94a38e26c3b5777d869b315b9c651a1d75&req=diMjFMl8lIdXX%2FMW1HO4zULvQ7LTI1griG%2BzAXa3oJQzLPX1i1f6eziZwCzL%0A20or9fM8w11uEgyYUFs%3D%0A>
 
 
 

## Configuration fields
When you enable the workflow, you'll configure the following fields:
 | 
Field | 
Required? | 
Description
 | 
Connection | 
Required | 
Select which Jira account to use (if you have multiple Jira credentials connected).
 | 
Space/Project | 
Required | 
The Jira project where all auto-created issues will be routed. This is a global setting — every ticket created by this workflow goes to the same project, regardless of which document triggered it. If you need to route tickets to different projects based on document type or owner, set up routing rules directly in Jira. (In most Jira instances, this field is labeled "Project.")
 | 
Work type | 
Required | 
The Jira issue type (e.g., Task, Bug, Story). Options depend on the selected Space or Project.
 | 
Summary | 
Auto-generated | 
The issue title. Format: [Vanta] Document renewal — {Document Name}. This cannot be edited.
 | 
Assignee | 
Optional | 
Who the Jira issue is assigned to. Defaults to Document owner. If the document owner is a team, the issue is assigned to that team's admin. You can also select a specific Jira user from the dropdown.
 | 
Fallback assignee | 
Optional | 
If the Assignee is set to "Document owner" and the owner cannot be matched to a Jira account, this person is assigned instead.
 | 
Due date | 
Optional | 
Options: On document renewal date (default), Do not set due date, or a specific number of days before the renewal date.
Any additional required fields specific to your Jira project (custom fields) will also appear and must be filled in before the workflow can save.
 

### How assignee matching works
When the Assignee is set to "Document owner," Vanta attempts to match the owner's Vanta account to a Jira account. If no match is found, the issue is assigned to the Fallback assignee instead. If neither can be resolved, the issue is still created but will have no assignee in Jira.
 
 

## When tickets are created
The workflow creates a Jira issue when all of the following are true:
- 
Jira Integration is set up and the Document task workflow is toggled on.
- 
The Document's status is Due soon 
- 
The Document has an owner assigned.
If a Document has no owner, a ticket will not be created. 
⚠️ Note: 'No owner' means the document has no assigned owner in Vanta. If a document has a Vanta owner but that owner cannot be matched to a Jira account, a ticket is still created — it will be assigned to the fallback assignee, or left unassigned if no fallback is configured.
 

### What "due soon" and "needs remediation" mean
Vanta determines document status based on the document's renewal date and reminder window:
 | 
Status | 
What it means
 | 
OK | 
The document is not yet within its reminder window. No action needed.
 | 
Due soon | 
Today's date falls within the reminder window set for that document. The reminder window is configured per document in the document's renewal settings ("Remind me this number of days before"). This is not a fixed window — it depends on each document's individual reminder setting.
 | 
Needs remediation | 
The document is past its due date, or has no due date and requires evidence to be uploaded.
A ticket is created when a document transitions into either Due soon or Needs remediation, as long as the workflow is active and the document has an owner.
 
 

## Managing the workflow

### Editing the workflow
You can update any field in the workflow at any time (e.g., change the Jira project, assignee, or due date setting). Changes apply to all future tickets only. Existing tickets that were already created are not modified.
 

### Disabling the workflow
Toggle the workflow off to stop creating new tickets. Previously created tickets are not affected — they remain open in Jira. You can re-enable the workflow at any time.
 

### Error notifications
If the workflow attempts to create a ticket but fails (for example, because the Jira integration was disconnected, the assignee is invalid, or the target project no longer exists), Vanta notifies all domain Admins.
 
 

## How this differs from test-level automation
Vanta also supports automatic Jira issue creation for tests, but it works differently:
 | 
  | 
Tests | 
Documents
 | 
Scope | 
Configured per individual test | 
One workflow applies to all documents
 | 
Where to configure | 
On each test's Tasks tab | 
Global Settings (the gear icon) > Compliance
 | 
Trigger | 
Test enters a Failing state | 
Document is due soon 
 | 
Deduplication | 
Won't create a duplicate if an open issue already exists for that test | 
No deduplication with manually created tickets at this time
For details on test-level automation, see the Automatic issue creation <https://help.vanta.com/en/articles/14441707-jira-integration-guide#h_ad60685ff5> section of the Jira Integration Guide.
 
 

## Troubleshooting
I see a prompt to connect Jira instead of the configuration form. You need to connect Jira before enabling this workflow. Go to Integrations → Jira and follow the setup steps in the Jira Quickstart <https://help.vanta.com/en/articles/14323221-jira-quickstart>.
 
I see a prompt to enable write access. Your Jira integration is currently connected in read-only mode. Go to Integrations → Jira → Manage → Edit and reconnect with read and write access enabled.
 
A ticket wasn't created for a document I expected. 
Check the following:
- 
Is the workflow toggled on?
- 
Does the document have an owner assigned? (Documents without owners do not trigger ticket creation.)
- 
Is the document's status "Due soon" or "Needs remediation"? Documents in "OK" status do not trigger tickets.
A duplicate ticket was created. At this time, the automated workflow does not check for manually created tickets. If you manually created a Jira issue for a document and the automated workflow also fires, both tickets will exist. This is a known limitation.
 
The wrong person was assigned. Check your Assignee and Fallback assignee settings in the workflow configuration. If "Document owner" is selected, verify that the document owner's Vanta account is matched to a Jira account. If it can't be matched, the fallback assignee is used. If the Fallback assignee is also not set, the issue is still created but will have no assignee in Jira.
 
 

## Additional resources
- 
Jira Quickstart <https://help.vanta.com/en/articles/14323221-jira-quickstart> — Connect Jira to Vanta in minutes
- 
Jira Integration Guide <https://help.vanta.com/en/articles/14441707-jira-integration-guide> — Full setup, configuration, and usage guidance

## Images

- [image 01] ../../images/ux/documents/automated-ticket-creation-for-documents--01.png
