# 1Password Integration Guide

Source: https://help.drata.com/en/articles/9868870-1password-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

The **1Password** integration enables **security and compliance teams** to **automate user access reviews** by syncing user data directly from 1Password. It connects Drata to your 1Password account through the SCIM Bridge, allowing your team to maintain accurate, up-to-date records of user access and provisioning.

## Key Capabilities

- **User Data Sync:** Automatically imports user information from 1Password to Drata.
- **Access Review Automation:** Reduces manual review time and errors by keeping identity data aligned across systems.
- **SCIM Bridge Integration:** Uses 1Password’s SCIM Bridge to securely manage user provisioning via API.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Administrator privileges** in your 1Password account.
- An Identity Provider (IDP) is **not required**, but setup steps may vary depending on the IDP you use.

**Deployment Requirements**

1Password does not support IAM API endpoints for SCIM Bridges connected to Google Workspace for user provisioning.

- If your SCIM Bridge is tied to Google Workspace, deploy a **second SCIM Bridge**.
- The second SCIM Bridge must use the same `scimsession` file.
- Do **not** connect this second SCIM Bridge to Google Workspace.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| user:read | Sync user data from 1Password to Drata | User names, emails, status |
| group:read | Map group membership for access review | Group assignments and roles |
| provisioning:read | Verify provisioning configuration via SCIM Bridge | Provisioning status and metadata |

## Step-by-Step Setup

### Step 1: Enable 1Password User Provisioning

1. Log in to your **[1Password account](https://my.1password.com/signin)** with your Administrator credentials.
2. Go to **Integrations**, and select your Identity Provider. If you do not wish to connect an IDP, select Okta as the default.
3. Based on how your SCIM Bridge will be deployed, select the option provided and continue.
4. Download and securely store the following:
   - **`scimsession` file**: Created and used by the SCIM Bridge to authenticate against 1Password (required for deploying the SCIM Bridge, not entered in Drata).
   - **Bearer Token**: Generated during user provisioning setup, required for Drata.

(Optional) Enable **Health Monitoring** in 1Password by providing your SCIM Bridge URL.

1. 1Password offers an optional alert system to notify you about connection issues with your SCIM Bridge.
2. To set up, enable “Turn on health monitoring” and enter the publicly-addressable URL for your SCIM Bridge deployment.

(Optional) Connect an IDP to your SCIM Bridge

1. If you wish to connect an IDP to your SCIM Bridge, select the tile for your IDP to view configuration instructions.
2. Select the “**View details**” button to open the new User provisioning configuration profile.
3. On this page in 1Password, you can adjust multiple User Provisioning settings, generate new credentials, or delete the setup.

### Step 2: Deploy the 1Password SCIM Bridge

Refer to 1Password’s official **[SCIM Bridge deployment examples repo](https://github.com/1Password/scim-examples)** for specific setup instructions across different deployment options.

1. This will require the **scimsession** file generated from enabling User Provision in your 1Password account.
2. **Note**: The publicly-addressable URL of this deployment (example: **`https://op-scim.mydomain.org`**) must be entered within the ** SCIM Bridge URL **field when connecting 1Password to Drata.

## Complete the Connection

In Drata’s **Connections** page, enter the following information:

| **Drata Field** | **1Password Value** |
|---|---|
| SCIM Bridge URL | `https://op-scim.mydomain.org` |
| Bearer Token | Token generated when enabling user provisioning in 1Password |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Related articles

- [Canva Integration Guide](canva-integration-guide.md)
- [Leapsome Integration Guide](leapsome-integration-guide.md)
- [CyberArk Integration Guide](cyberark-integration-guide.md)
- [Udemy Integration Guide](udemy-integration-guide.md)
- [Enterprise SCIM Integration Guide](enterprise-scim-integration-guide.md)
