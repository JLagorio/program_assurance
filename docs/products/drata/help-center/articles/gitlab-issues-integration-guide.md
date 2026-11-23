# GitLab Issues Integration Guide

Source: https://help.drata.com/en/articles/5193741-gitlab-issues-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to GitLab Issues

## Article text

The GitLab Issues integration enables security and compliance teams to track and verify security issues within GitLab. It connects Drata to GitLab Issues so your team can demonstrate that vulnerabilities are logged, categorized, and prioritized according to your vulnerability management policies.

## Key Capabilities

- Security issue tracking: Monitor vulnerability-related issues within GitLab
- Severity verification: Validate that issues are categorized by severity levels
- Automated evidence collection: Provide auditors with proof that security issues are tracked and managed

This integration is used to automate tests such as vulnerability tracking verification and issue remediation monitoring, helping prove compliance with vulnerability management policies.

## Prerequisites & Data Access

- **Admin access** to your organization’s GitLab account
- Access to your organization’s **GitLab Issues labels and severity classifications**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| GitLab admin access | Allows Drata to connect and retrieve issue tracking data |
| Security label | Identifies which issues represent security-related tickets |
| Severity labels | Maps GitLab issue severity levels to Drata’s severity categories |

## Step-by-Step Setup

### Step 1: Identify Your Security Label

1. Log in to **GitLab**.
2. Navigate to the repository or workspace where security issues are tracked.
3. Identify the label used to categorize **security-related issues** (for example, `Security`).

Expected outcome: You know the label used to identify security issues in GitLab.

### Step 2: Identify Severity Labels

1. In GitLab, review the labels used to categorize issue severity.
2. Identify the labels used for the following severity levels:
   - **Critical**
   - **High**
   - **Medium**
   - **Low**

Expected outcome: You know the labels used for each severity level in GitLab.

### Step 3: Connect GitLab Issues in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **GitLab Issues** connection process.
4. Enter the required values when prompted:
   - **Account Alias** – a unique identifier for the integration
   - **Security Label** – the label used for security issues
   - **Critical Severity Label**
   - **High Severity Label**
   - **Medium Severity Label**
   - **Low Severity Label**

Expected outcome:
GitLab Issues is successfully connected and issue tracking data begins syncing to Drata.

## Important Notes

- This integration is used to verify that **security vulnerabilities are tracked and prioritized** according to your organization’s vulnerability management policies.
- The **Security Label** must match the label used in GitLab to categorize security issues.
- Severity labels entered during setup must match the labels used in GitLab for issue severity.
- If labels are renamed or removed in GitLab, the integration may not correctly categorize issues.

## Related articles

- [GitHub Issues Integration Guide](github-issues-integration-guide.md)
- [Asana Integration Guide](asana-integration-guide.md)
- [Target Process Integration Guide](target-process-integration-guide.md)
- [Zoho Bug Tracker Integration Guide](zoho-bug-tracker-integration-guide.md)
- [GitLab Issues (Self-Managed) Integration Guide](gitlab-issues-self-managed-integration-guide.md)
