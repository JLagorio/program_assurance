# Create Workflow for Risk

Source: https://help.drata.com/en/articles/12876894-create-workflow-for-risk
Collection: Enhancing your workflow › Custom Workflows
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Learn how to build automated risk workflows in Drata to monitor inherent and residual score changes, trigger alerts, and more!

## Article text

> **API Developer Resource 💡**
> For API documentation and resources to extend workflow automation, visit the **[Drata Developer page](https://developers.drata.com/)**.

## Overview of Risk Workflows

If you selected Risk as the object type, you can create a workflow that runs when specific changes occur in a risk’s score or treatment option.

If you would like to learn more about workflows, refer to our [Workflows article](automate-actions-with-drata-s-workflows.md).

## Prerequisites

Before creating a workflow, ensure that:

- You have the **Admin** or **Workspace Manager** role.
- Risk workflows are available to customers on the Risk Management Pro plan.
- You can access **Settings > Workflows**.

You may also need to:

- Identify the Slack channel or Teams group you want to notify.
- Prepare any webhook URLs needed to send data from Drata to external applications.

Each risk workflow is made up of a trigger and the actions you want Drata to take when that trigger occurs. After choosing the risks you want to monitor, you’ll define what event should activate the workflow and what should happen next. Use the instructions below to configure your workflow.

### Step 1: Select Risks

Define the scope of the workflow by choosing which risks it applies to:

- All risks (Includes current and future risks)
- Internal risks
- External risks
- Selected risks (Pick specific risks)

### Step 2: Choose a Trigger

Choose the event that will trigger this workflow. You can trigger the workflow when one of the following changes occurs:

| Trigger type | Conditions | Threshold or value |
|---|---|---|
| Inherent score changed | New inherent score is:<br>- Equal to<br>- Greater than<br>- Less than<br>- Greater than or equal to<br>- Less than or equal to | Example values: Medium, High, Critical, Super Critical<br>Note: Customizable in[Risk register settings](https://app.qa.drata.com/risk-management/risk-settings) |
| Residual score changed | New residual score is:<br>- Equal to<br>- Greater than<br>- Less than<br>- Greater than or equal to<br>- Less than or equal to | Example values: Medium, High, Critical, Super Critical<br>Note: Customizable in[Risk register settings](https://app.qa.drata.com/risk-management/risk-settings) |
| Treatment option changed | Options changes to:<br>Untreated, Accept, Transfer, Avoid, Mitigate | Not Applicable |

Note: Threshold labels are customizable in Risk Management >[Risk register settings](https://app.qa.drata.com/risk-management/risk-settings). Your organization may use different labels than shown in this guide (such as Medium, Critical vs. Level 1, Level 2).

### Step 3: Add Steps

Each step defines what should happen when the workflow is triggered. You can add multiple steps. Each step runs at the same time when the workflow is triggered. All steps in a workflow run in parallel. If one step fails to run, the others still run. Drata automatically retries failed steps up to three times.

Workflows support the following step types. Depending on your integrations, you may have different options:

- Create task: Assign a follow-up task to a user, role, or owner.
- Send email: Available to all users.
- Send Slack message: Visible only if Slack is connected.
- Send MS Teams message: Visible only if Microsoft Teams is connected.
- Send webhook: Transmit structured data from Drata to external systems.

### Step Type: Create task

Assign a follow-up task to help manage risk remediation or review. You can:

1. Enter a title and description.
   - Optional: Use variables like `{{risk_id}}` for dynamic information.
   - You can select Insert Variable for more options.
2. Assign the task to:
   - Individual
   - Role (such as Admin, Workspace managers, Risk Manager)
   - A responsibility (Risk Owner or Risk Reviewers)
3. Set the due-in period (such as 10 days from task creation).

### Step Type: Send notification

Send a message to your team using:

1. Email (always available)
2. Slack message (shown if Slack is connected)
3. Microsoft Teams message (shown if Microsoft Teams is connected)

You can:

1. Choose how you would like to send the notification (Email, Slack, or Teams).
2. Enter the email or channel name (such as risk-alerts, [risk-team@company.com](mailto:risk-team@company.com))
3. Write the subject line and description.
   - (Optional) Use the **Insert Variable** button to add dynamic fields like `{{risk_name}}` or `{{risk_owner}}`
4. Note: Each email/message will contain a link to route to the Risk.

Example risk notification: When a risk’s inherent score changes to High, automatically create a task assigned to the Risk Owner to review and assess the risk with the risk ID.

### Step Type: Send webhook

Use the Send Webhook step to transmit structured data from Drata risk workflows to an external system through a specified URL endpoint. This enables real-time integration with tools like Zapier, Torq, or ServiceNow.

**How it works**

When this step is triggered by a change to a risk (such as an updated risk score or treatment option), Drata sends a POST request to the URL you specify. The payload can include risk properties and optional headers for authentication.

You can:

- In the URL field, enter the endpoint that will receive the webhook.
- *(Optional)* Add authentication by entering a token or key as a custom header.
- *(Optional)* Add additional custom headers to include extra context.
- In the Request body section, select the properties you want to include in the payload. These may include:
   - **Risk properties**: Title, ID, Category, Owner(s), and any custom risk fields.
   - **Trigger properties**: Inherent Score Threshold, Scored by, New Inherent Score Value, or Old Inherent Score Value

**Example Use Case**

Scenario: You want to update an external risk dashboard whenever a risk’s inherent score changes.

In Zapier:

1. Create a new Zap.
2. Set the trigger to Webhooks by Zapier – Catch Hook.
3. Copy the generated webhook URL.

In Drata:

1. Create a risk workflow with the trigger Inherent score changed.
2. Add a Send Webhook step.
3. Paste the Zapier URL into the URL field.
   (Optional) Add authentication or custom headers.
4. Select properties such as:
   - Title
   - Score(s)
   - Owner(s)
   - Inherent Score Threshold

Result:

When the inherent score changes in Drata, the webhook sends updated risk data to Zapier, which updates your external dashboard automatically.

## Webhook Implementation Notes

**Property Structure**

Each webhook payload contains:

- [Base properties (common to all triggers)](#h_a94d882fb0)
- [Selected Risk-specific properties](#h_e6885e732b) (based on scope type: control, risk, evidence, or personnel)
- [Selected Trigger-specific properties](#h_b617bc3e9b) (unique to the specific trigger that fired)

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

### Base Risk Properties

- risk_name
- risk_id
- risk_description
- risk_scores
- risk_treatment_option
- risk_treatment_plan
- risk_owners
- risk_categories
- risk_custom_fields

### Trigger-Specific Properties

INHERENT_SCORE_UPDATED

- new_inherent_score_value
- old_inherent_score_value
- inherent_score_threshold
- inherent_scored_by

---

RESIDUAL_SCORE_UPDATED

- new_residual_score_value
- old_residual_score_value
- residual_score_threshold
- residual_scored_by

---

TREATMENT_OPTION_UPDATED

- new_treatment_option
- old_treatment_option
- treatment_option_updated_by

## Additional Resources

- [Automate Actions with Drata's Workflows](automate-actions-with-drata-s-workflows.md)
- [View and Manage Workflows](view-and-manage-workflows.md)
- [Create Workflow for Control](create-workflow-for-control.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Create Workflow for Personnel](create-workflow-for-personnel.md)
- [Drata Developer page](https://developers.drata.com/)

## Related articles

- [Create Workflow for Control](create-workflow-for-control.md)
- [Create Workflow for Personnel](create-workflow-for-personnel.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Risk management in Drata: An overview](risk-management-in-drata-an-overview.md)
