# Rapid7 InsightVM (On-Prem, Reports-Only) Integration Guide

Source: https://help.drata.com/en/articles/8180134-rapid7-insightvm-on-prem-reports-only-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: This article walks through the details of configuring Rapid7 InsightVM to connect to Drata.

## Article text

The Rapid7 InsightVM (On-Prem, Reports-Only) integration enables security and compliance teams to sync vulnerability scanning reports into Drata for evidence collection. It connects Drata to your on-premises InsightVM console so your team can attach vulnerability scan reports to controls required for compliance.

## Key Capabilities

- Vulnerability report synchronization: Sync reports generated in Rapid7 InsightVM
- Compliance evidence collection: Attach vulnerability reports directly to controls in Drata
- Report visibility: Review synchronized reports from the InsightVM console

This integration supports evidence collection for the **Record of Vulnerability Scans** monitoring test.

When a Rapid7 report is attached to the **Quarterly Vulnerability Scan control (DCF-18)**, the monitoring test will pass.

## Prerequisites & Data Access

- Access to your **Rapid7 InsightVM console server**
- **Username and password** for an account that has access to InsightVM reports
- The **hostname of the server hosting the InsightVM console**
- The console server must be **publicly accessible**
- Network access must allow **Drata IP addresses** to connect
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| InsightVM console hostname | Identifies the server where InsightVM reports are hosted |
| InsightVM user credentials | Allows Drata to authenticate and retrieve reports |
| Network access to console | Allows Drata to connect to the InsightVM console and retrieve reports |

## Step-by-Step Setup

### Step 1: Prepare the InsightVM Console Server

1. Confirm the **Rapid7 InsightVM console server** is hosted on a **public network**.
2. Allow inbound access from **Drata IP addresses** so Drata can retrieve reports.
3. Identify the **hostname of the server hosting the InsightVM console**.

Expected outcome: The InsightVM console server is accessible to Drata and the hostname is available.

### Step 2: Prepare InsightVM Credentials

1. Identify a **Rapid7 InsightVM user account** with permission to access reports.
2. Confirm you have the **username and password** for this account.

Expected outcome: You have valid credentials that allow access to InsightVM reports.

### Step 3: Connect Rapid7 InsightVM in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Rapid7 InsightVM (On-Prem, Reports-Only)** connection process.
4. Enter the following values:
   - **Hostname of the InsightVM console server**
   - **Username**
   - **Password**

Expected outcome: The InsightVM connection becomes active and appears in the **Vulnerability Scanning** section of your Active Connections.

### Step 4: Verify Report Synchronization

1. On the Rapid7 InsightVM connection card, select **View Reports**.
2. Review the list of **reports synchronized from the InsightVM console**.

If reports do not appear immediately:

- Select **Resync**.
- Wait for the synchronization to complete.

Drata will send an **email notification** when the synchronization finishes.

Expected outcome: InsightVM reports are visible in Drata.

## Important Notes

- InsightVM reports are **not automatically mapped to controls**.
- After syncing, you must **manually attach the correct report to the relevant control**.
- The **Record of Vulnerability Scans** monitoring test relies on a report being attached to the **Quarterly Vulnerability Scan (DCF-18)** control.
- If reports are missing, run a **Resync** and wait for the synchronization email notification.

## Related articles

- [AWS Inspector (Amazon Inspector) Integration Guide](aws-inspector-amazon-inspector-integration-guide.md)
- [Snyk Integration Guide](snyk-integration-guide.md)
- [Semgrep Integration Guide](semgrep-integration-guide.md)
- [CrowdStrike Falcon Exposure Management Integration Guide](crowdstrike-falcon-exposure-management-integration-guide.md)
- [Rapid7 InsightVM Integration Guide](rapid7-insightvm-integration-guide.md)
