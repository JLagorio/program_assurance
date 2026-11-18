# Tracking External Security Tasks in Vanta

Source: https://help.vanta.com/en/articles/11345742-tracking-external-security-tasks-in-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

When you connect a task tracker, Vanta will automatically fetch any tasks that have the tag or label “security” or “Security.” When we fetch these tasks, you will see them show up in security tasks Vanta Tests under “Items to Remediate” or “Remediation History”:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761584/86b1a2c6683d1d7f96cce145c5ac/16115497721108?expires=1794967200&signature=9ac72e114ebd856111e3e9e3a6cdbbddb139f74eaace03ba1b17399a97e206d0&req=dSUmEM54nIRXXfMW1HO4zf8pXOCcImz8GtkJulY9q7zZxMQuVkbNxVp%2B6g6U%0A3%2FASxmpMJldkqmKriCY%3D%0A>
Vanta collects the following information from task tracker tickets to satisfy the related Vanta tests:
- 
Title
- 
Assignee
- 
Status
- 
Priority
- 
Tags/labels

## Priority Mapping
Vanta will look to tasks assigned Priority and any applied Tags/Labels to satisfy the related 'P0/1/2/3' Vanta tests. In a situation where a priority tag/label has not been applied to a Task, the Priority level, as defined by the task tracker, is used as the source of truth.

## Tracking Task Completion
Vanta will track the completion of tasks. How we determine if a ticket has been closed may vary depending on the task tracker:
- 
Asana - We check whether the “Completed At” field has been set
- 
Azure DevOps - We check whether “Microsoft.VSTS.Common.ClosedDate” has been set for the work item
- 
ClickUp - We check whether the task’s status type is “done” or “closed”
- 
Github - We check whether “Closed At” has been set for the issue
- 
Gitlab - We check whether “Closed At” has been set for the issue
- 
JIRA - We look at the field “Resolution Date” or the field “status” and if the “status category” is marked “Done.”
- 
Linear - We check whether any of “Completed At”, “Canceled At”, or “Archived At” has been set
- 
Monday - We check whether the Status column for a value of “Done”
- 
Pivotal Tracker - We check whether the “Current State” is “accepted”
- 
Shortcut - We check whether “Completed At” or “Archived” has been set
- 
Trello - We check whether task has been marked “closed” or “dueComplete” or is contained in a list that has been closed or named “Done”
- 
Merge Integrations - We check whether Merge has interpreted the ticket as closed
- 
Freshdesk - Determined via “Status” field reported by /v2/tickets in their API
- 
Front - Determined via “Status” field reported by /inboxes/{project_id}/conversations in their API
- 
Help Scout - Determined via “Status” field reported by /conversations in their API
- 
Kustomer - Determined via “Status” attribute reported by /conversations in their API
- 
Re:amaze - Determined via “Status” field reported by /v1/conversations in their API
- 
Teamwork - Determined via “Status” field reported by /tasks in their API
- 
Zoho Bug Tracker - Determined via “Status.type” field reported by /restapi/portal/${portal_id}/projects/${project_id}/bugs
- 
Zoho Desk - Determined via “statusType” field reported by /tickets in their API

## Customizing Security Tags
If you are using the “security” tag for other uses or use other tags to track security tasks, you can customize the label in Vanta:
- 
Navigate to your connected task tracker on the Integrations page and click on Manage
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761577/993a1ea01d0dbae4e095296c4f63/16115501444500?expires=1794967200&signature=96b744169c9e93cc55e6a416ca392fb364be33e96787940ef61be10edf46b981&req=dSUmEM54nIRYXvMW1HO4zTnRZIZkl%2FLsujKaA8m9j1cmfjEQT7%2B8Jrcbv6%2FP%0Ac6WLtFHC8S%2F%2F1ckBmZw%3D%0A>
- 
In the sub-menu, select Task tracking labels
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761578/478cddfc6b0f66801fdc16a40e5d/16115491338260?expires=1794967200&signature=4c3adb33c593bed9261a85c96d8c68ccef36c749b801955ec760e1a72b8aa6f1&req=dSUmEM54nIRYUfMW1HO4zWeMkSVBeUivSOZDxmZxZtoVGhdCq7RPOxP4aq3A%0AFoqeML294Cfedp%2BOgv4%3D%0A>
- 
In the modal that pops up, enter all the labels that you would like Vanta to use to track audit-related security issues
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761576/3776004d66aa6b2e2a13a6f687d0/16115518087060?expires=1794967200&signature=3bc32fec24b68b3f4dd552df927c2cd768d5e7d35343258c56f5d23dab2154f7&req=dSUmEM54nIRYX%2FMW1HO4zbERgtWXlON3ejMHceXi3E%2FzdlOM1ce%2F%2Fgf6uxlB%0Axb4SlzVF4fX62YVO3qk%3D%0A>
- 
After entering the labels you would like Vanta to track, hit Save
- 
Once complete, Vanta will pull in tasks with the configured security label.
We currently do not support required fields beyond the default. You can find more information here: https://help.vanta.com/en/articles/11346060-jira-integration-error-message-unsupported-required-fields <https://help.vanta.com/en/articles/11346060-jira-integration-error-message-unsupported-required-fields>

## Images

- [image 01] ../../images/ux/tests/tracking-external-security-tasks-in-vanta--01.png
- [image 02] ../../images/ux/integrations/tracking-external-security-tasks-in-vanta--02.png
- [image 03] ../../images/ux/integrations/tracking-external-security-tasks-in-vanta--03.png
- [image 04] ../../images/ux/integrations/tracking-external-security-tasks-in-vanta--04.png
