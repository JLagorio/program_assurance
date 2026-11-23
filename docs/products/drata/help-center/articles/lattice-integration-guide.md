# Lattice Integration Guide

Source: https://help.drata.com/en/articles/9868995-lattice-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-07-23
Fetched: 2026-11-22

## Article text

The **Lattice integration** enables security and compliance teams to automate **User Access Reviews (UAR)**. It connects Drata to Lattice so your team can sync user and role data to review access permissions and validate that only authorized users have access to systems.

To learn more about Lattice HRIS, go [here](lattice-hris-integration-guide.md).

## Key Capabilities

- **User Access Review Data Sync:** Import Lattice users and role information into Drata
- **Access Governance:** Support periodic access reviews to validate appropriate system access
- **Compliance Monitoring:** Maintain visibility into user access for compliance evidence

This integration is used to support **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

## Prerequisites & Data Access

Before connecting Lattice to Drata, ensure the following requirements are met:

- You must have **Administrator access** in your organization’s **Lattice account**
- Ability to generate **API keys** in Lattice
- **Required Drata Role with Write access:**
   - Admin
   - Workspace Managers
   - DevOps Engineer
- **Access Reviewers:** Access Reviewers can view the connection page but cannot modify connection settings

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| API Key Access | Allows Drata to retrieve user and role information from Lattice for access reviews |

## Step-by-Step Setup

### Step 1: Generate a Lattice API Key

1. Sign in to your **Lattice dashboard**.
2. Switch to **Admin mode**.
3. Navigate to **Settings → Platform → API Keys**.
4. Select **Generate API Key**.
5. Copy the newly created **API key** and store it securely.

Expected outcome:
You have generated a valid **Lattice API key** that can be used to authenticate the integration.

---

### Step 2: Connect Lattice in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your available connections.
3. Search for and start the **Lattice **connection process for the **UAR connection type**.
4. Enter the **API key** generated in Step 1.
5. Complete the connection process.

Expected outcome:
Lattice user and role data begin syncing to support **User Access Reviews** in Drata.

## Important Notes

- The **UAR connection uses API key authentication**.
- Ensure your Lattice account has **Administrator or Super Admin permissions** when generating the API key.
- The API key should be stored securely and rotated according to your organization’s security policies.

## Related articles

- [Klaviyo Integration Guide](klaviyo-integration-guide.md)
- [Envoy Integration Guide](envoy-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Lattice HRIS Integration Guide](lattice-hris-integration-guide.md)
