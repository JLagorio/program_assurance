# Shortcut Integration Guide

Source: https://help.drata.com/en/articles/4663379-shortcut-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to Shortcut

## Article text

The Shortcut integration enables **Engineering and Security teams** to automate vulnerability tracking and evidence collection. It connects Drata to **Shortcut (formerly Clubhouse)** so your team can automatically prove adherence to **vulnerability management policies and remediation timelines**.

## Key Capabilities

- **Vulnerability tracking:** Automatically checks for open and resolved vulnerability tickets.
- **Evidence collection:** Gathers proof that vulnerabilities were resolved within required timeframes.
- **Flexible configuration:** Aligns with your company’s existing Shortcut labels and workflows.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, or **DevOps Engineer** roles in Drata.
- Must have **admin access** to your company’s **Shortcut** account.
- Must have **permission to create new API tokens** in Shortcut.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| API Token (Shortcut) | Authorizes Drata to retrieve vulnerability ticket data | Ticket metadata, labels, and status |

## Step-by-Step Setup

### Step 1: Create an API Token in Shortcut

1. Sign in to your Shortcut account at [https://app.shortcut.com](https://app.shortcut.com) using an account with either a **Member** or **Admin** role.
2. Click your **avatar** in the bottom-left corner to open the profile menu and select **Settings**.
3. Under **YOUR ACCOUNT**, click **API Tokens**.
4. In the **Token Name** field, enter **Drata**.
5. Click **Generate Token**.
6. Copy and save the API Token securely.
7. Review security levels in the Shortcut form fields and update as needed.

## Complete the Connection

In Drata’s Connections page, enter the following information:

| **Drata Field** | **Shortcut Value** |
|---|---|
| API Token | The Shortcut API token you created |
| Security Label | Enter the label you use in Shortcut to categorize tickets as security issues. |
| Critical, High, Medium, Low Severity Levels | Fill in any remaining fields according to your Shortcut labels or tags used for vulnerability management |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Important Notes

- Shortcut was previously known as **Clubhouse**.
- Ensure your Shortcut API token is kept **secure**; avoid sharing or embedding it in documentation.
- Drata’s integration is **read-only** and follows the **principle of least privilege**.
- Drata’s autopilot scans Shortcut daily for vulnerability tickets and collects evidence that they were resolved **within the timeframe** defined by your **Vulnerability Management Policy**.
- Shortcut integration is designed to work with **existing tags and labels**. Drata adapts to your workflow and does not require creating new ones.

## Related articles

- [Asana Integration Guide](asana-integration-guide.md)
- [Target Process Integration Guide](target-process-integration-guide.md)
- [Zoho Bug Tracker Integration Guide](zoho-bug-tracker-integration-guide.md)
- [Fibery Integration Guide](fibery-integration-guide.md)
- [GitLab Issues (Self-Managed) Integration Guide](gitlab-issues-self-managed-integration-guide.md)
