# OpenAI Integration Guide

Source: https://help.drata.com/en/articles/10302063-openai-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-27
Fetched: 2026-11-22
Description: Follow these steps to connect OpenAI to Drata.

## Article text

The **OpenAI integration** enables Compliance, Security, and IT teams to automate **user access reviews** by syncing user data directly from OpenAI into Drata. This reduces manual effort and ensures continuous compliance with access control policies.

## Key Capabilities

- **User data synchronization:** Automatically imports user access data from OpenAI.
- **Access review automation:** Streamlines evidence collection for user access reviews.
- **Error reduction:** Minimizes manual data entry errors during compliance audits.

## Prerequisites & Data Access

- Must have **Owner privileges** within your OpenAI organization.
- Must have access to your organization’s **Admin Keys** and **Project ID**.
- If your organization uses a **Web Application Firewall (WAF)**, ensure [Drata’s IP addresses are **allowlist**](how-to-allowlist-drata-email-domains-and-ip-addresses.md)**.**

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| Admin Key | Authenticates Drata’s access to the OpenAI organization | User access and organization metadata |
| Project ID | Identifies which OpenAI project to connect to Drata | Project-level user and access data |

## Step-by-Step Setup

### Step 1: Copy the Admin Key

1. Log in to your **[OpenAI Account](https://platform.openai.com/login)**.
2. From the **organization dropdown**, select **Organization overview**.
3. Navigate to the  **[Admin Keys](https://platform.openai.com/organization/admin-keys)** page.
4. Click **+ Create new Admin key** in the top-right corner.
5. Enter a **Key Name** and select **Create admin key**.
6. Copy the **Admin Key** and store it securely. It will be needed for the Drata connection.

### Step 2: Copy the Project ID

1. Navigate to the **Projects** page in OpenAI.
2. Locate the project you wish to connect.
3. Copy the **Project ID**.

## Complete the Connection

In Drata’s **Connections** page, enter the following information:

| **Drata Field** | **OpenAI Value** |
|---|---|
| Admin Key | The Admin Key generated in OpenAI |
| Project ID | The Project ID from the OpenAI Projects page |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Important Notes

- The integration connects **one OpenAI project per Drata connection**.
- Ensure your **Admin Key** is stored securely and rotated periodically.
- If your organization uses a **WAF**, **allowlist Drata’s IP addresses** to prevent connection errors.
- The integration is **read-only** and follows the **principle of least privilege**, ensuring no data modification occurs within your OpenAI environment.

## Related articles

- [Bitwarden Integration Guide](bitwarden-integration-guide.md)
- [Elastic Integration Guide](elastic-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [Twilio Integration Guide](twilio-integration-guide.md)
