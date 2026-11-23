# Create Workflow for Personnel

Source: https://help.drata.com/en/articles/12876875-create-workflow-for-personnel
Collection: Enhancing your workflow › Custom Workflows
Updated: 2026-09-22
Fetched: 2026-11-22
Description: Create automated personnel workflows in Drata to track compliance status changes, send notifications, and more!

## Article text

> **API Developer Resource 💡**
> For API documentation and resources to extend workflow automation, visit the **[Drata Developer page](https://developers.drata.com/)**.

## Overview of Personnel Workflows

If you selected Personnel as the object type, you can create a workflow that runs when specific Personnel events occur.

If you would like to learn more about workflows, refer to our [Workflows article](automate-actions-with-drata-s-workflows.md).

## Prerequisites

Before creating a workflow, ensure that:

- You have the **Admin** or **Workspace Manager** role.
- You can access **Settings > Workflows**.

You may also need to:

- Identify the Slack channel or Teams group you want to notify.
- Prepare any webhook URLs needed to send data from Drata to external applications.

Each personnel workflow is made up of a trigger and the actions you want Drata to take when that trigger occurs. After choosing the personnel you want to monitor, you’ll define what event should activate the workflow and what should happen next. Use the instructions below to configure your workflow.

### Step 1: Select the Personnel

Start by choosing which personnel to monitor.

- All personnel: This will include all personnel in your account
- Status of personnel: This will include all personnel in the chosen employment status type(s)

### Step 2: Choose a Trigger

Choose the event that will trigger this workflow. You can trigger the workflow when one of the following changes occurs:

- Out of compliance
   - Choose the Compliance categories that the workflow should trigger for
   - Set how many days after the person is out of compliance the workflow should trigger
- Status changed
   - Choose the updated employment status that the workflow should trigger for

> ***NOTE: The "Out of compliance" workflow only picks up personnel who are in a state of compliant and then move to non-compliant. Personnel, especially new hires, who start as non-compliant will not trigger this workflow.***

### Step 3: Add Steps

Each step defines what should happen when the workflow is triggered. You can add multiple steps. Each step runs at the same time when the workflow is triggered. All steps in a workflow run in parallel. If one step fails to run, the others still run. Drata automatically retries failed steps up to three times.

### Step Type: Send notification

Send real-time alerts to stakeholders through:

1. Email (always available)
2. Slack message (shown if Slack is connected)
3. Microsoft Teams message (shown if Microsoft Teams is connected)

You can:

1. Select user type, recipients or channel names (such as Personnel, Admin, security-alerts, [compliance-team@examplecompany.com](mailto:compliance-team@examplecompany.com)).
2. Compose a subject line and message, embedding variables such as:
   - `{{person_name}}`
   - `{{person_email}}`
   - `{{person_status}}`
   - You can select Insert Variable for more options.
3. Note: Each email/message will contain a link to route to the Personnel page (for users with access) or to My Drata (for users with employee access).

### Step Type: Send webhook

Use the Send Webhook step to transmit structured data from Drata to external systems through a specified endpoint. This enables real-time integration with tools like Zapier, Torq, or ServiceNow.

### How it works

When triggered, Drata sends a POST request to the specified endpoint. You can include:

- Authentication (as custom headers)
- Custom headers with additional context
- Personnel and trigger properties in the request body

## Webhook Implementation Notes

**Property Structure**

Each webhook payload contains:

- [Base properties (common to all triggers)](#h_23bdffb4b6)
- [Selected Personnel-specific properties](#h_66db3fd64e) (based on scope type: control, risk, evidence, or personnel)
- [Selected Trigger-specific properties](#h_c78ab69d72) (unique to the specific trigger that fired)

**Data Formats**

- Object arrays (like owners, categories, etc.) are sent as structured JSON
- Dates are sent as strings in ISO format
- Boolean values are sent as true/false

**Custom Fields**

Custom fields vary by organization and are configured through Drata's admin interface. They follow the format:

```
[{"key": "field_name","value": "field_value"}]
```

## Available webhook properties

### Base Properties (Included in ALL Webhook Events)

- event_type: The specific trigger event name
- timestamp: When the event occurred
- organization_id: ID of the organization
- workspace: Workspace context object

### Base Personnel Properties

- personnel_name
- personnel_email
- personnel_title
- personnel_status
- personnel_hire_date
- personnel_compliance_status
- personnel_custom_fields

### Trigger-Specific Properties

OUT_OF_COMPLIANCE

- personnel_categories_out_of_compliance
- personnel_unacknowledged_policies

---

STATUS_CHANGED

- personnel_old_status
- personnel_new_status

## Additional Resources

- [Automate Actions with Drata's Workflows](automate-actions-with-drata-s-workflows.md)
- [View and Manage Workflows](view-and-manage-workflows.md)
- [Create Workflow for Control](create-workflow-for-control.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Create Workflow for Risk](create-workflow-for-risk.md)
- [Drata Developer page](https://developers.drata.com/)

## Related articles

- [Confirm your personnel](confirm-your-personnel.md)
- [Create Workflow for Control](create-workflow-for-control.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Create Workflow for Risk](create-workflow-for-risk.md)
