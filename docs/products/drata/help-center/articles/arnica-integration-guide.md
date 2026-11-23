# Arnica Integration Guide

Source: https://help.drata.com/en/articles/10258613-arnica-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-07-27
Fetched: 2026-11-22
Description: Connect Arnica to Drata to sync vulnerabilities with an API token and automate evidence for vulnerability scanning.

## Article text

The **Arnica** integration enables **security and compliance teams** to automatically sync vulnerability data from Arnica into Drata.

This integration helps automate evidence collection for the **[Vulnerability Scanning](test-21-vulnerability-scanning.md)** test, mapped to **DCF-18** by default.

## Key Capabilities

- **Automated Vulnerability Sync:** Imports up to **1,000 new or updated vulnerabilities per day** per connection.
- **Severity-Based Filtering:** Allows selection of vulnerability levels such as **Critical**, **High**, or **Medium**.
- **Date Filtering:** Syncs vulnerabilities detected on or after a specified “first seen” date for precise reporting.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have an **active Arnica account**.
- Must create and copy the **Arnica API token** with the required scope:
   - `risks:read`
- Ensure you have permission to generate and manage API tokens in Arnica.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed** |
|---|---|---|
| **risks:read** | Allows Drata to access and sync vulnerability data from Arnica. | Vulnerability and risk data (Read) |

## Step-by-Step Setup

### Step 1: Generate the Arnica API Token

1. Log in to your **Arnica account**.
2. Navigate to your **API settings** or **Developer section** (depending on your account setup).
3. Create a new **API token**.
4. Enable the following scope:
   - `risks:read`
5. Copy and securely store your **Access Token**. You’ll need it to connect Arnica to Drata.

**Expected outcome:** You now have a valid Arnica API token with the `risks:read` scope.

### Step 2: Complete the Connection in Drata

1. In Drata, navigate to **Connections → Available Connections**.
2. Search for **Arnica** and select **Connect**.
3. Enter the following fields:

| **Drata Field** | **Arnica Value** |
|---|---|
| **Severity** | Select vulnerability levels to include (e.g., Critical, High, Medium). |
| **First Seen On** | Select the date from which Drata should begin syncing vulnerabilities. |
| **Access Token** | Paste your Arnica API token with the `risks:read` scope. |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

Once connected:

- Drata imports up to **1,000 new or updated vulnerabilities per day** per connection.
- Drata shows *findings*, which are instances of *vulnerabilities* (an individual but higher-level CVE) against specific resources. This may reflect as higher finding counts in Drata vs. your Arnica dashboard.
- Imported vulnerabilities are prioritized from **Critical → Low** severity.
- Your **severity** and **first seen on** filter selections are included in the test result report for visibility.

## Step 3: Verify and View Results

1. Select **View Findings** after connecting Arnica, or
2. Navigate to the **Vulnerabilities** page via Drata’s left-side navigation menu.

## Related articles

- [Qualys Integration Guide](qualys-integration-guide.md)
- [Tenable Vulnerability Management Integration Guide](tenable-vulnerability-management-integration-guide.md)
- [Semgrep Integration Guide](semgrep-integration-guide.md)
- [SentinelOne Singularity Vulnerability Management (VMS) Integration Guide](sentinelone-singularity-vulnerability-management-vms-integration-guide.md)
- [Orca Security Integration Guide](orca-security-integration-guide.md)
