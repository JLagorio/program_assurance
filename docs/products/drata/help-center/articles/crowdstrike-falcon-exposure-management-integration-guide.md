# CrowdStrike Falcon Exposure Management Integration Guide

Source: https://help.drata.com/en/articles/9750517-crowdstrike-falcon-exposure-management-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: This article walks through the details of configuring CrowdStrike Falcon Exposure Management to connect to Drata.

## Article text

The CrowdStrike Falcon Exposure Management integration enables security and compliance teams to continuously monitor vulnerabilities and remediation timelines. It connects Drata to CrowdStrike Falcon Exposure Management so your team can track vulnerability SLA due dates and collect evidence required for compliance monitoring.

## Key Capabilities

- Vulnerability monitoring: Sync vulnerability findings from CrowdStrike Falcon Exposure Management
- SLA tracking: Monitor remediation timelines for vulnerabilities
- Automated evidence collection: Maintain vulnerability data in Drata for compliance reports

This integration automates evidence collection for the **Vulnerability Scanning test**, which is mapped to **DCF-18 by default**.

## Prerequisites & Data Access

- Access to your **CrowdStrike Falcon console**
- Ability to create an **API Client ID and Client Secret**
- Access to the **CrowdStrike API Base URL** for your region
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only read the connection page; they can't make changes)

### Permissions & Data Table

The API client used for the integration must include the following permissions:

| Permission/Scope | Why It’s Needed |
|---|---|
| Vulnerabilities: Read | Allows Drata to retrieve vulnerability findings |
| Hosts: Read | Allows Drata to retrieve host device information associated with vulnerabilities |
| Host Groups: Read | Allows Drata to identify host group associations |
| User Management: Read | Allows Drata to retrieve relevant user information related to vulnerability data |
| Prevention Policies: Read | Allows Drata to retrieve prevention policy information |
| Device Control Policies: Read | Allows Drata to retrieve device control policy information |
| Response Policies: Read | Allows Drata to retrieve response policy configurations |
| Sensor Update Policies: Read | Allows Drata to retrieve sensor update policy data |

### Network Requirements

If your organization restricts inbound traffic by IP address, allowlist the following **Drata IP addresses** to enable the integration:

- 52.11.20.122
- 44.237.125.128

Allowlisting these IP addresses ensures Drata can securely retrieve vulnerability data from your CrowdStrike environment.

> **Note:** Only apply IP restrictions to this vulnerability integration. If you are also setting up the [CrowdStrike EDR connection](crowdstrike-integration-guide.md), do not apply them there.

## Step-by-Step Setup

### Step 1: Create a CrowdStrike API Client

1. Log in to the **CrowdStrike Falcon console**.
2. Navigate to **API Clients and Keys**.
3. Select **Create API client**.
4. Enter the required details for the API client.
5. Enable the following API scopes:
   - Vulnerabilities: Read
   - Hosts: Read
   - Host Groups: Read
   - User Management: Read
   - Prevention Policies: Read
   - Device Control Policies: Read
   - Response Policies: Read
   - Sensor Update Policies: Read
6. Create the API client.
7. Copy and securely store the following credentials:
   - **Client ID**
   - **Client Secret**

Expected outcome: You have the Client ID and Client Secret required to authenticate the integration.

### Step 2: Identify the CrowdStrike API Base URL

Determine the correct **API Base URL** based on your CrowdStrike deployment region.

| Region | Base URL |
|---|---|
| US-1 | [https://api.crowdstrike.com](https://api.crowdstrike.com) |
| US-2 | [https://api.us-2.crowdstrike.com](https://api.us-2.crowdstrike.com) |
| EU-1 | [https://api.eu-1.crowdstrike.com](https://api.eu-1.crowdstrike.com) |
| US-GOV-1 | [https://api.laggar.gcw.crowdstrike.com](https://api.laggar.gcw.crowdstrike.com) |

Expected outcome: You know the correct API endpoint for your CrowdStrike environment.

### Step 3: Connect CrowdStrike Falcon Exposure Management in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **CrowdStrike Falcon Exposure Management** connection process.
4. Configure the vulnerability syncing settings:
   - **Severity**
      - Select the vulnerability severity levels you want Drata to sync.
      - **Critical and High are selected by default.**
   - **First seen on**
      - Select the date when vulnerabilities were first detected.
      - Drata will sync vulnerabilities detected **on or after this date**.
5. Select **Connect**.
6. Enter the following credentials when prompted:

- **Client ID**
- **Client Secret**
- **Base URL**

Expected outcome:
CrowdStrike Falcon Exposure Management is successfully connected and vulnerability findings begin syncing into Drata.

## Important Notes

- Drata retrieves **up to 1,000 new or updated vulnerabilities per connection daily**, ordered from **Critical to Low severity**.
- The selected **severity levels and date range** are included in the **test result report** for visibility.
- After connecting, you can review vulnerabilities by selecting **View Findings** on the connection card or by navigating to the **Vulnerabilities** page in Drata.
- Drata shows *findings*, which are instances of *vulnerabilities* (an individual but higher-level CVE) against specific resources. This may reflect as higher finding counts in Drata vs. your Crowdstrike dashboard.
- If the API credentials change, the connection may need to be updated in Drata.

## Related articles

- [AWS Inspector (Amazon Inspector) Integration Guide](aws-inspector-amazon-inspector-integration-guide.md)
- [CrowdStrike Integration Guide](crowdstrike-integration-guide.md)
- [Tenable Vulnerability Management Integration Guide](tenable-vulnerability-management-integration-guide.md)
- [Semgrep Integration Guide](semgrep-integration-guide.md)
- [Rapid7 InsightVM Integration Guide](rapid7-insightvm-integration-guide.md)
