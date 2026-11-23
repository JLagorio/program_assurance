# Target Process Integration Guide

Source: https://help.drata.com/en/articles/5350736-target-process-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to Target Process

## Article text

The Target Process integration enables security and compliance teams to track and verify security issues within Target Process. It connects Drata to Target Process so your team can demonstrate that vulnerabilities are logged, categorized, and prioritized according to your vulnerability management policies.

## Key Capabilities

- Security issue tracking: Monitor vulnerability-related tickets within Target Process
- Severity verification: Validate that issues are categorized by severity levels
- Automated evidence collection: Provide auditors with proof that security issues are tracked and managed

This integration is used to automate tests such as vulnerability tracking verification and issue remediation monitoring, helping prove compliance with vulnerability management policies.

## Prerequisites & Data Access

- **Admin access** to your Target Process account
- Access to your organization’s **ticket labels and severity classifications** in Target Process
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Target Process admin access | Allows Drata to connect and retrieve issue tracking data |
| Security label | Identifies which tickets represent security-related issues |
| Severity labels | Maps Target Process severity levels to Drata’s severity categories |

## Step-by-Step Setup

### Step 1: Identify Your Security Label

1. Log in to **Target Process**.
2. Navigate to the project or workspace where security issues are tracked.
3. Identify the label used to categorize **security-related tickets** (for example, `Security`).

Expected outcome: You know the label used to identify security-related tickets in Target Process.

### Step 2: Identify Severity Labels

1. In Target Process, review the labels used to categorize ticket severity.
2. Identify the labels used for the following severity levels:
   - **Critical**
   - **High**
   - **Medium**
   - **Low**

Expected outcome: You know the labels used for each severity level.

### Step 3: Connect Target Process in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Target Process** connection process.
4. Enter the required values when prompted:
   - **Security Label** – the label used for security issues
      - **Critical Severity Label**
      - **High Severity Label**
      - **Medium Severity Label**
      - **Low Severity Label**

Expected outcome:
Target Process is successfully connected and issue tracking data begins syncing to Drata.

## Important Notes

- This integration verifies that **security vulnerabilities are tracked and prioritized** according to your organization’s vulnerability management policies.
- If your organization does not use **Security** as the label for security issues in Target Process, update the **Security Label** during setup.
- Severity labels must match the labels configured in Target Process to ensure issues are correctly categorized.
- If labels are renamed or removed in Target Process, the integration may not correctly categorize issues for Drata tests.

## Related articles

- [GitHub Issues Integration Guide](github-issues-integration-guide.md)
- [Asana Integration Guide](asana-integration-guide.md)
- [GitLab Issues Integration Guide](gitlab-issues-integration-guide.md)
- [Zoho Bug Tracker Integration Guide](zoho-bug-tracker-integration-guide.md)
- [GitLab Issues (Self-Managed) Integration Guide](gitlab-issues-self-managed-integration-guide.md)
