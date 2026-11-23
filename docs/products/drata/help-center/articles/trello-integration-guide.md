# Trello Integration Guide

Source: https://help.drata.com/en/articles/5176303-trello-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: In this article, you learn how to connect Trello to Drata for vulnerability management monitoring.

## Article text

The **Trello integration** allows organizations to connect their Trello workspace to Drata so security-related tickets can be referenced as part of vulnerability management monitoring. When connected, Drata reviews Trello tickets used to track security issues and helps provide supporting evidence that your organization tracks and prioritizes vulnerabilities through your organization’s ticketing workflow.

---

## Key Capabilities

- **Security Ticket Visibility:** Reference Trello tickets used to track security issues
- **Severity Tracking:** Identify tickets based on severity labels configured during setup
- **Compliance Evidence Support:** Use Trello ticket data as supporting evidence for vulnerability management monitoring

---

## Prerequisites & Data Access

### Trello Access Requirements

- You must have **Admin access** to your organization’s **Trello account**.
- You must have access to the Trello boards where **security issues are tracked**.

### Drata Role Requirements

To create or modify connections, you must have one of the following **Drata roles with write access**:

- Admin
- Workspace Manager
- DevOps Engineer

Access Reviewers can view the connection page but cannot modify connection settings.

---

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Board access | Allows Drata to retrieve Trello tickets used to track security issues |
| Label access | Allows Drata to identify tickets categorized as security issues |
| Card metadata access | Allows Drata to review ticket labels and status information |

---

## Step-by-Step Setup

### Step 1: Connect Trello in Drata

1. Log in to **Drata → go to the Connections page**.
2. Navigate to **Available Connections**.
3. Search for and start the **Trello connection process**.
4. You will be redirected to **Trello** to authorize the integration. After authorization, you will return to Drata where the connection will be automatically confirmed.

**Expected outcome:**
Trello is successfully connected to Drata.

---

### Step 2: Configure Security Ticket Labels

During the connection setup, you will configure the labels used to identify **security-related tickets** in Trello.

- Security Label: Enter the label your team uses in Trello to categorize **security issues**.

Example:

```
Security
```

Drata uses this label to identify which Trello tickets represent security issues.

---

### Severity Labels

You can also configure the labels used to represent **severity levels** for security tickets.

| Severity Level | Example Label |
|---|---|
| Critical | Critical |
| High | High |
| Medium | Medium |
| Low | Low |

Drata references these labels to understand how security tickets are categorized by severity.

---

## Important Notes

- **Label configuration:** Ensure the labels entered during setup match the labels used in your Trello workflow.
- **Security ticket identification:** Trello tickets must include the configured **security label** to be recognized as security issues.
- **Severity labels:** These labels are used to categorize tickets by severity level.

## Related articles

- [GitHub Issues Integration Guide](github-issues-integration-guide.md)
- [Asana Integration Guide](asana-integration-guide.md)
- [GitLab Issues Integration Guide](gitlab-issues-integration-guide.md)
- [Target Process Integration Guide](target-process-integration-guide.md)
- [GitLab Issues (Self-Managed) Integration Guide](gitlab-issues-self-managed-integration-guide.md)
