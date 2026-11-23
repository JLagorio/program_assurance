# Infosec IQ Integration Guide

Source: https://help.drata.com/en/articles/12694474-infosec-iq-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-29
Fetched: 2026-11-22

## Article text

The **Infosec IQ** integration enables **security and compliance teams** to automate user training and awareness evidence collection by connecting Drata to your Infosec IQ account.

It connects using an **API Key and Server URL**, allowing Drata to securely retrieve training completion data to support compliance requirements.

## Key Capabilities

- **Automated Evidence Collection:** Syncs Infosec IQ user training data into Drata.
- **Regional Server Selection:** Supports both **North American** and **EU** Infosec IQ servers.
- **API-Based Authentication:** Uses a secure API Key for read-only access to compliance-relevant data.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Administrator access** within your **Infosec IQ account** to generate an API Key.
- Must identify and use the correct **Server URL** (North American or EU region).

## Step-by-Step Setup

### Step 1: Generate an API Key in Infosec IQ

1. Log in to your **Infosec IQ Admin Console**.
2. Navigate to **Account Settings → API Keys**.
3. Click **Create API Key**, provide a **descriptive name**, and click **Save**.
4. Copy your newly generated **API Key**. You’ll need it in the next step.

**Expected outcome:** You now have a valid Infosec IQ API Key for integration with Drata.

### Step 2: Identify Your Server URL

1. Determine your account’s server region and note the corresponding URL:
   - **North American Server:** `https://securityiq.infosecinstitute.com`
   - **EU Server:** `https://securityiq-eu.infosecinstitute.com`
2. Ensure you use the correct URL for your region when entering credentials in Drata.

**Expected outcome:** You have identified the correct **Server URL** for your Infosec IQ account.

## Complete the Connection

In Drata’s **Connections** page, ensure the following information is entered correctly:

| **Drata Field** | **Infosec IQ Value** |
|---|---|
| API Key | Your generated Infosec IQ API Key |
| Server URL | Selected server region (North America or EU) |

For more details on managing connections, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Related articles

- [Certn Integration Guide (Background Check)](certn-integration-guide-background-check.md)
- [New Relic Integration Guide](new-relic-integration-guide.md)
- [Vetty Integration Guide](vetty-integration-guide.md)
- [SAP SuccessFactors Integration Guide](sap-successfactors-integration-guide.md)
- [Microsoft Copilot MCP Integration Guide](microsoft-copilot-mcp-integration-guide.md)
