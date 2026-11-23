# Terraform Integration Guide

Source: https://help.drata.com/en/articles/9769688-terraform-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-27
Fetched: 2026-11-22

## Article text

Integrating Terraform with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Terraform.

## Key Capabilities

- **Automated user access reviews:** Continuously pulls user and role data from Terraform to verify access controls.
- **Evidence collection:** Simplifies audit readiness by automatically gathering Terraform user access evidence.
- **Reduced manual effort:** Keeps user records synchronized with Drata for seamless compliance reporting.

## Prerequisites & Data Access

- Must have **Admin privileges** within your Terraform organization.
- Must have your **Terraform Organization Name**.
- Must create a **Terraform API Key** with no expiration.
- If your organization uses a **Web Application Firewall (WAF)**, ensure Drata’s IP addresses are allowlisted.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| Organization Name | Identifies the Terraform organization to sync | Organization metadata and workspace details |
| API Key | Authenticates Drata’s access to Terraform | User and role data within Terraform workspaces |

## Step-by-Step Setup

### Step 1: Copy Your Terraform Organization Name

1. Log in to your **Terraform** instance.
2. Navigate to the **Workspaces** page.
3. Copy your **Organization Name** from the URL ([https://app.terraform.io/app/{Organization_Name}/workspaces](https://app.terraform.io/app/{Organization_Name}/workspaces)) or from the **Workspace page header**.

### Step 2: Create a Terraform API Key

1. Click your **profile icon** in the left-side navigation.
2. Select **Account Settings**.
3. In the left menu, choose **Tokens** (under Account Settings).
4. Click **Create API Token**.
5. Enter a description, set the **Expiration** to **No expiration**, and generate the token.
6. Copy your Terraform API key. You will need this to connect to Drata.

## Complete the Connection

In Drata’s **Connections** page, enter the following information:

| **Drata Field** | **Terraform Value** |
|---|---|
| Organization Name | The Terraform organization name from the Workspaces page |
| API Key | The Terraform API key generated under Account Settings → Tokens |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Related articles

- [Workable Integration Guide](workable-integration-guide.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Aircall Integration Guide](aircall-integration-guide.md)
- [Jit Integration Guide](jit-integration-guide.md)
