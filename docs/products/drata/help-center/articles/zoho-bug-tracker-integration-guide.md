# Zoho Bug Tracker Integration Guide

Source: https://help.drata.com/en/articles/5455033-zoho-bug-tracker-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection Zoho BugTracker

## Article text

The Zoho Bug Tracker integration enables security and compliance teams to track and verify security issues within Zoho Bug Tracker. It connects Drata to Zoho so your team can demonstrate that vulnerabilities are logged, categorized, and prioritized according to your vulnerability management policies.

## Key Capabilities

- Security issue tracking: Monitor vulnerability-related tickets within Zoho Bug Tracker
- Severity verification: Validate that issues are categorized and tracked for remediation
- Automated evidence collection: Provide auditors with proof that vulnerabilities are documented and managed

This integration is used to automate tests such as vulnerability tracking verification and issue remediation monitoring, helping prove compliance with vulnerability management policies.

## Prerequisites & Data Access

- **Portal Owner (Admin) access** to your Zoho Bug Tracker account
- **API access enabled** in Zoho Bug Tracker
- Access to your organization’s **security issue tag** (if used for classification)
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Zoho Portal Owner access | Allows authorization of the Zoho Bug Tracker connection |
| API access enabled | Allows Drata to retrieve issue tracking data |
| Security tag | Identifies which tickets represent security-related issues |

## Step-by-Step Setup

### Step 1: Enable Zoho API Access

1. Log in to your **Zoho Bug Tracker** account.
2. Ensure you have **Portal Owner (Admin)** permissions.
3. Enable **API access** for your Zoho portal.

To access the API settings page, navigate to:

```
https://bugtracker.zoho.com/portal/{domain}#setup/apiaccess
```

Replace `{domain}` with your organization’s Zoho domain.

Expected outcome: API access is enabled for your Zoho Bug Tracker portal.

### Step 2: Connect Zoho Bug Tracker in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Zoho Bug Tracker** connection process.

Expected outcome: The Zoho Bug Tracker connection setup begins.

### Step 3: Configure Security Issue Identification

During the connection setup, you will be prompted to define how Drata identifies **security-related issues**.

**Option 1 — Use a Security Tag**

- Enter the **tag used to label security issues** in Zoho.
- The tag is **case-sensitive**.
- Drata will treat all tickets with this tag as **security issues**.

Expected outcome: Drata identifies vulnerabilities using the specified tag.

**Option 2 — Use Zoho Classification Field**

- Leave the **Security Tag field blank**.
- Drata will instead use Zoho’s **Classification field** to determine which issues are considered security-related.

Expected outcome: Drata identifies vulnerabilities using Zoho’s classification settings.

## Important Notes

- The **Security Tag field is case-sensitive** and must match the tag used in Zoho exactly.
- If the Security Tag field is left blank, Drata will use the **Zoho Classification field** to determine security issues.
- Ensure **API access is enabled** before attempting to connect Zoho Bug Tracker to Drata.

## Related articles

- [Shortcut Integration Guide](shortcut-integration-guide.md)
- [GitHub Issues Integration Guide](github-issues-integration-guide.md)
- [Asana Integration Guide](asana-integration-guide.md)
- [GitLab Issues Integration Guide](gitlab-issues-integration-guide.md)
- [Target Process Integration Guide](target-process-integration-guide.md)
