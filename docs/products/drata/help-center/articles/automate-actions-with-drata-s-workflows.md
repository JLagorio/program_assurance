# Automate Actions with Drata’s Workflows

Source: https://help.drata.com/en/articles/11751113-automate-actions-with-drata-s-workflows
Collection: Enhancing your workflow › Custom Workflows
Updated: 2026-09-22
Fetched: 2026-11-22
Description: Automate tasks, notifications, and webhooks in Drata with workflows triggered by control, evidence, risk or personnel events.

## Article text

> **API Developer Resource 💡 **
> For API documentation and resources to extend workflow automation, visit the **[Drata Developer page](https://developers.drata.com/)**.

## Overview of Workflows

Workflows in Drata allow Admins and Workspace Managers to automate routine compliance operations triggered by specific events. Instead of relying on manual follow-ups, you can define the steps, such as creating tasks, sending notifications, or triggering webhooks, that run automatically when a condition is met.

### Workflows Lifecycle Overview

Workflows help automate compliance processes from trigger to resolution. Each workflow has three core components:

| Component | Purpose | What You Do |
|---|---|---|
| Start | Define the workflow scope | Choose which controls, risks, evidence or personnel it applies to |
| Trigger | Define when it should run | Select the event that initiates the workflow |
| Steps | Define what should happen | Add and configure task, notification, or webhook |

Note: Steps in a workflow run in parallel. If one step fails, the others still run. Drata automatically retries failed steps up to three times.

## Prerequisite

Before creating a workflow, ensure that:

- You have the **Admin** or **Workspace Manager** role
- You can access **Settings > Workflows**

### Before you configure your workflow:

- Know which controls, risks, evidence, or personnel the workflow should apply to
- Know which event(s) you want to monitor (for example, evidence linked, treatment option changed, personnel status changed, or artifact uploaded)

You may also need to:

- Identify the Slack channel or Teams group you want to notify.
- Prepare any webhook URLs needed to send data from Drata to external applications.

## Create a New Workflow

Workflows in Drata let you automate actions such as creating tasks, sending notifications, or triggering webhooks when specific events occur. You can build workflows based on events related to controls, risks, evidence or personnel.

You can create, name, and choose the type of object that will trigger your workflow.

1. Go to Settings > Workflows.
2. Select **Create Workflow**.
3. In the setup modal:
   - Enter a **name** for the workflow
   - Choose a** target object type**: Control, Risk, Evidence or Personnel
   - If you select** Control** or **Evidence**, also choose the** workspace** this workflow will run in

After completing this step, you’ll be redirected to a page where you can complete the rest of your workflow. The following sections showcase what the trigger and action options are for each object.

## Trigger events and actions

The table provides high-level descriptions of available triggers and actions. Each workflow allows one start and trigger, but you can add multiple actions. To learn more about each workflow type, refer to the help articles linked in the table.

| **Objects** | **Description of Triggers** |
|---|---|
| Control<br>Learn how to [set up control workflows](create-workflow-for-control.md). | - Control details update<br>- Control readiness changes:<br>   - Readiness changes to Not ready<br>   - Readiness changes to Ready<br>- Linked item changes:<br>   - Evidence linked or unlinked<br>   - Policy linked or unlinked<br>- Mapped item changes<br>   - Test mapped or unmapped<br>   - Mapped test passes or fails<br>   - Requirement mapped or unmapped<br>- Control owner updated<br>- Control marked in-scope or out-of-scope |
| Risk<br>Learn how to [set up risk workflows](create-workflow-for-risk.md). | - Inherent or residual score changed<br>   - You configure the score condition that should trigger the workflow.<br>- Treatment option changed<br>   - You choose which treatment option change activates the workflow. |
| Evidence<br>Learn how to [set up evidence workflows](create-workflow-for-evidence.md). | - Upcoming renewal<br>   - You configure how many days before the renewal date the workflow should trigger.<br>- Renewal past due<br>   - You configure how many days past the renewal date will trigger the workflow.<br>- New artifact uploaded<br>- Evidence linked or unlinked from a control |
| Personnel<br>Learn how to [set up personnel workflows](create-workflow-for-personnel.md). | - Out of compliance<br>   - You choose the new compliance categories and the number of days out of compliance that will activate the workflow.<br>   - ***NOTE: The "Out of compliance" workflow only picks up personnel who are in a state of compliant and then move to non-compliant. Personnel, especially new hires, who start as non-compliant will not trigger this workflow.***<br>- Status changed<br>   - You select the new status change that should trigger the workflow.** |

### Available Actions

- Create task
   - Only available for Controls and Risks
- Send email
- Send Slack message
- Send Microsoft Teams message
   - Note: Microsoft Teams direct messages are not supported.
- Send webhook.
   - Note: Drata uses [Svix](https://www.svix.com/) to send our webhooks.

## Review and Publish

You can publish your workflow to activate it, or save it as a draft to complete later. To create a similar workflow in the future, you can duplicate an existing workflow and reuse its configuration.

## Additional Resources

- [View and Manage Workflows](view-and-manage-workflows.md)
- [Create Workflow for Control](create-workflow-for-control.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Create Workflow for Personnel](create-workflow-for-personnel.md)
- [Create Workflow for Risk](create-workflow-for-risk.md)
- [Drata Developer page](https://developers.drata.com/)

## Related articles

- [Create Workflow for Control](create-workflow-for-control.md)
- [Create Workflow for Personnel](create-workflow-for-personnel.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Create Workflow for Risk](create-workflow-for-risk.md)
- [Manage tasks in Drata](manage-tasks-in-drata.md)
