# GitLab Issues (Self-Managed) Integration Guide

Source: https://help.drata.com/en/articles/10003324-gitlab-issues-self-managed-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-03-10
Fetched: 2026-11-22
Description: Making the initial connection to GitLab Issues self-managed

## Article text

The GitLab Issues (Self-Managed) integration enables security and compliance teams to track and verify security issues within their self-managed GitLab environment. It connects Drata to GitLab Issues so your team can demonstrate that vulnerabilities are logged, categorized, and prioritized according to your vulnerability management policies.

## Key Capabilities

- Security issue tracking: Monitor vulnerability-related issues within GitLab Issues
- Severity verification: Validate that issues are categorized by severity levels
- Automated evidence collection: Provide auditors with proof that vulnerabilities are tracked and managed

This integration is used to automate tests such as vulnerability tracking verification and issue remediation monitoring, helping prove compliance with vulnerability management policies.

## Prerequisites & Data Access

- **Admin access** to your GitLab self-managed instance
- Ability to generate a **Personal Access Token (PAT)** in GitLab
- Access to the **hostname** of your GitLab self-managed instance
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| read_api | Allows Drata to retrieve issue and project data from GitLab |
| read_user | Allows Drata to retrieve user information associated with issues |
| Personal Access Token (PAT) | Authenticates Drata with your GitLab self-managed instance |
| Hostname | Identifies the URL of your GitLab self-managed environment |

## Step-by-Step Setup

### Step 1: Generate a Personal Access Token in GitLab

1. Log in to your **GitLab self-managed instance**.
2. Navigate to your **User Settings**.
3. Select **Access Tokens**.
4. Create a **Personal Access Token (PAT)** with the following scopes:
   - `read_api`
   - `read_user`
5. Generate the token and copy the **Personal Access Token**.

Expected outcome: You have a Personal Access Token with the required permissions.

### Step 2: Identify Your GitLab Hostname

1. Locate the URL where your **GitLab self-managed instance** is hosted.
2. Copy the full hostname including the protocol.

Example:

```
https://gitlab.example.com
```

Expected outcome: You have the GitLab hostname required to configure the connection.

### Step 3: Connect GitLab Issues (Self-Managed) in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **GitLab Issues (Self-Managed)** connection process.
4. Enter the following values when prompted:

- **Account Alias** – A unique identifier for the connection
- **Hostname** – The URL where your GitLab instance is hosted
- **Personal Access Token** – The PAT generated in GitLab
- **Security Label** – The label used to categorize security issues
   - **Critical Severity Label**
   - **High Severity Label**
   - **Medium Severity Label**
   - **Low Severity Label**

(Optional) Enable **Write Access** if you want Drata to create tickets in GitLab Issues.

Expected outcome:
 GitLab Issues (Self-Managed) is successfully connected and issue tracking data begins syncing to Drata.

## Important Notes

- The **Security Label** must match the label used in GitLab Issues to identify security-related tickets.
- Severity labels must match the labels used in your GitLab instance for issue severity.
- Enabling **Write Access** allows Drata to create tickets in GitLab Issues. If disabled, the integration will only read existing issues.

## Related articles

- [GitHub Issues Integration Guide](github-issues-integration-guide.md)
- [GitLab Integration Guide](gitlab-integration-guide.md)
- [GitLab Issues Integration Guide](gitlab-issues-integration-guide.md)
- [GitLab self-managed Integration Guide](gitlab-self-managed-integration-guide.md)
- [GitHub Issues Enterprise Integration Guide](github-issues-enterprise-integration-guide.md)
