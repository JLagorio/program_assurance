# Microsoft Teams Integration Guide

Source: https://help.drata.com/en/articles/6556025-microsoft-teams-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata Microsoft Teams App Support.

## Article text

The Microsoft Teams integration enables security and compliance teams to receive notifications directly in Microsoft Teams. It connects Drata to Microsoft Teams so your team can be alerted about Not Ready controls and personnel with pending compliance actions.

## Key Capabilities

- Compliance notifications: Notify Teams channels about Not Ready controls
- Personnel action alerts: Notify users about pending compliance actions
- Communication automation: Send compliance-related alerts directly to Teams channels

This integration helps automate compliance communication workflows so teams can quickly address controls that require action.

## Prerequisites & Data Access

- Access to **Microsoft Teams**
- Ability to **install the Drata App in Microsoft Teams**
- Access to the **Microsoft Teams channel URL**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

Important requirement:

- Microsoft Teams **does not allow sending connector messages to private channels**.

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Microsoft Teams app installation | Allows Drata to send notifications to Teams |
| Team URL | Identifies the specific Microsoft Teams channel for notifications |

## Step-by-Step Setup

### Step 1: Install the Drata App in Microsoft Teams

1. Open **Microsoft Teams**.
2. Navigate to **Apps**.
3. Search for **Drata**.
4. Install the **Drata App** if it has not already been added.

If you do not have permission to install apps, work with your **IT team** to complete the installation.

Expected outcome: The Drata app is installed in Microsoft Teams.

### Step 2: Retrieve the Microsoft Teams URL

1. Open **Microsoft Teams**.
2. Navigate to the **Team** where you want notifications sent.
3. Select the **three-dot (ellipsis) menu** next to the team name.
4. Select **Get link to team**.
5. Copy the generated **Team URL**.

Expected outcome: You have the Microsoft Teams URL required for the connection.

### Step 3: Connect Microsoft Teams in Drata

1. Log in to **Drata**.
2. Navigate to the **Connections** page.
3. Select the **Available Connections** tab.
4. Search for and start the **Microsoft Teams** connection process.
5. Paste the **Microsoft Teams URL** when prompted.
6. Select **Connect your Microsoft Teams workspace**.

Expected outcome:
Microsoft Teams is successfully connected and Drata can send notifications to the selected channel.

## Important Notes

- Microsoft Teams **does not support sending connector messages to private channels**.
- Notifications can be configured or modified under **Settings → Notification rules** in Drata.
- If the Drata app is not installed in Microsoft Teams, the integration will not be able to send notifications.

## Related articles

- [Hexnode UEM (Windows) Integration Guide](hexnode-uem-windows-integration-guide.md)
- [Slack Integration Guide (Communication and UAR)](slack-integration-guide-communication-and-uar.md)
- [Microsoft Defender Vulnerability Management Integration Guide](microsoft-defender-vulnerability-management-integration-guide.md)
- [Organization settings: Notifications rules](organization-settings-notifications-rules.md)
- [Microsoft Intune Integration guide](microsoft-intune-integration-guide.md)
