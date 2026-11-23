# ClickUp Integration Guide

Source: https://help.drata.com/en/articles/10105116-clickup-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-03-09
Fetched: 2026-11-22
Description: Learn how to connect ClickUp to Drata to create and manage security tasks directly from Drata.

## Article text

The ClickUp integration enables security and compliance teams to coordinate remediation and compliance work across their organization. It connects Drata to ClickUp so your team can create tasks for controls, tests, and risks and assign them to team members for resolution.

## Key Capabilities

- Task creation: Create ClickUp tasks or subtasks directly from Drata
- Compliance workflow coordination: Assign tasks related to controls, tests, or risks
- Task visibility: Track ticket status and assignments directly from Drata

This integration is used to automate workflows related to remediation tasks and compliance activities, helping teams manage work required to maintain security and compliance.

## Prerequisites & Data Access

- A ClickUp account with access to the workspace you want to connect
- Admin access in Drata to configure the ClickUp connection
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

Additional role permissions in Drata:

- **Admin** – Can configure or modify the ClickUp connection
- **Information Security Leads** – Can create and view ClickUp tasks in Drata but cannot configure the connection

ClickUp configuration requirements:

- ClickUp workspace should support the following ClickApps:
   - **Priority**
   - **Tags**

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| ClickUp workspace access | Allows Drata to create and manage tasks within the selected workspace |
| Priority ClickApp | Enables task prioritization for security issues |
| Tags ClickApp | Allows tasks to be categorized as security-related |

## Step-by-Step Setup

### Step 1: Verify ClickUp Workspace Configuration

1. Log in to ClickUp.
2. Navigate to the workspace you plan to connect.
3. Select your **user account → Apps → ClickApps**.
4. Confirm that the following ClickApps are enabled:
   - **Priority**
   - **Tags**

Expected outcome: The ClickUp workspace supports task prioritization and tagging required for security tasks.

### Step 2: Prepare Security Task Tag

1. Determine the tag used in ClickUp to categorize security-related tasks.
2. If your organization does not use **Security** as the tag, note the tag you use instead.

Expected outcome: You know the correct security label used in your ClickUp workspace.

### Step 3: Connect ClickUp in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **ClickUp** connection process.
4. Enter or confirm the **Security Label** used to categorize security tasks.
5. Enable **Write Access** if you want Drata to create tasks in ClickUp.
6. Select **Connect your ClickUp account**.
7. When redirected to ClickUp:
   - Select the **workspace(s)** you want Drata to access
   - Approve the connection
8. Return to Drata to complete the setup.

Expected outcome:
ClickUp is successfully connected and Drata can create tasks in the selected workspace.

## Important Notes

- Drata pulls ClickUp configuration fields such as **spaces, folders, lists, and task types** based on your ClickUp setup.
- Only **Admins in Drata** can configure or modify the ClickUp connection.
- **Information Security Leads** can create and view tasks but cannot edit the integration.
- Write Access must be enabled for Drata to create tasks in ClickUp.

Edge cases:

- Only tasks created from **Drata controls, tests, or risks** appear in Drata’s ticket view.
- Tasks created directly in ClickUp are **not imported into Drata**.
- If multiple ticketing systems are connected, you must select **ClickUp** as the destination when creating a task.

## Related articles

- [Trello Integration Guide](trello-integration-guide.md)
- [Segment Integration Guide](segment-integration-guide.md)
- [Canva Integration Guide](canva-integration-guide.md)
- [Workable Integration Guide](workable-integration-guide.md)
- [Jit Integration Guide](jit-integration-guide.md)
