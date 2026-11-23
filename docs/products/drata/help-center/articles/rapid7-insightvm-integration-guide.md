# Rapid7 InsightVM Integration Guide

Source: https://help.drata.com/en/articles/9750520-rapid7-insightvm-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-07-27
Fetched: 2026-11-22
Description: This article walks through the details of configuring Rapid7 InsightVM to connect to Drata.

## Article text

The Rapid7 InsightVM integration enables security and compliance teams to continuously monitor vulnerabilities and remediation timelines. It connects Drata to Rapid7 InsightVM so your team can track vulnerability SLA due dates and collect evidence required for compliance monitoring.

## Key Capabilities

- Vulnerability monitoring: Sync vulnerabilities from Rapid7 InsightVM into Drata
- SLA tracking: Monitor vulnerability remediation timelines
- Automated evidence collection: Maintain vulnerability data for compliance reports

This integration automates evidence collection for the **Vulnerability Scanning test**, which is mapped to **DCF-18 by default**.

After connecting, you can review synced vulnerabilities by selecting **View Findings** on the connection card or by navigating directly to the **Vulnerabilities** page in Drata.

## Prerequisites & Data Access

- Access to your **Rapid7 InsightVM account**
- Ability to generate a **Rapid7 API Key**
- Access to your **Rapid7 Base URL**
- **Platform Administrator privileges** in Rapid7 may be required to generate the API key
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Rapid7 API Key | Allows Drata to authenticate and retrieve vulnerability data |
| Rapid7 Base URL | Identifies the correct Rapid7 instance for the connection |
| Platform Administrator privileges | Required to generate the API key in Rapid7 |

## Step-by-Step Setup

### Step 1: Enable Platform Administrator Privileges (If Needed)

1. Log in to **Rapid7**.
2. Navigate to **Settings → User Management → Users**.
3. Open your **User Details**.
4. Enable **Make this user a Platform Administrator**.
5. Save your changes.
6. Sign out and sign back in to ensure the new permissions are applied.

Expected outcome: Your account has the permissions required to generate a Rapid7 API key.

### Step 2: Generate a Rapid7 API Key

1. Log in to **Rapid7**.
2. Navigate to the **API Key** generation area in your account settings.
3. Create a new **API key**.
4. Copy and securely store the API key.

Expected outcome: You have the Rapid7 API key required to authenticate the integration.

### Step 3: Copy the Rapid7 Base URL

1. Log in to your **Rapid7 InsightVM** account.
2. Navigate to the **InsightVM** page.
3. Copy the base URL from your browser address bar.

Example:

If your URL is:

```
https://us3.exposure-analytics.api.insight.rapid7.com
```

Your **Base URL** is:

```
https://us3.api.insight.rapid7.com
```

Expected outcome: You have the Rapid7 base URL needed for the connection.

### Step 4: Connect Rapid7 InsightVM in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for **Rapid7 InsightVM** or locate it under the **Vulnerability Scanning** connection type.
4. Configure the vulnerability syncing options:
   **Severity of vulnerabilities**
   - Select the severity levels to sync into Drata.
   - **Critical** and **High** are selected by default.
   - Drata syncs up to **1,000 new or updated vulnerabilities**, ordered by severity.
   **First seen on**
   - Select the date when vulnerabilities should start syncing.
   - Vulnerabilities detected **on or after this date** will be imported.
5. Enter the following credentials when prompted:
   - **API Key**
   - **Base URL**

Expected outcome:
 Rapid7 InsightVM is successfully connected and vulnerability findings begin syncing into Drata.

## Important Notes

- After connecting, you can review vulnerabilities by:
   - Selecting **View Findings** on the connection card, or
   - Navigating to the **Vulnerabilities** page in Drata.
- Drata syncs **up to 1,000 vulnerabilities per connection per day**, ordered from **Critical to Low severity**.
- Drata shows *findings*, which are instances of *vulnerabilities* (an individual but higher-level CVE) against specific resources. This may reflect as higher finding counts in Drata vs. your Rapid7 InsightVM dashboard.
- The selected **severity levels and date range** will also appear in the **test result report** for visibility.
- If the API key or base URL changes, the connection may need to be updated in Drata.

## Related articles

- [Rapid7 InsightVM (On-Prem, Reports-Only) Integration Guide](rapid7-insightvm-on-prem-reports-only-integration-guide.md)
- [Tenable Vulnerability Management Integration Guide](tenable-vulnerability-management-integration-guide.md)
- [Semgrep Integration Guide](semgrep-integration-guide.md)
- [CrowdStrike Falcon Exposure Management Integration Guide](crowdstrike-falcon-exposure-management-integration-guide.md)
- [SentinelOne Singularity Vulnerability Management (VMS) Integration Guide](sentinelone-singularity-vulnerability-management-vms-integration-guide.md)
