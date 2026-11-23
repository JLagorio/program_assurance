# Sophos Integration Guide

Source: https://help.drata.com/en/articles/9972145-sophos-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-09
Fetched: 2026-11-22
Description: Learn how to connect Sophos to Drata to automate User Access Reviews by syncing user data from Sophos.

## Article text

The **Sophos integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user account data directly from Sophos. This helps organizations review which users have access to Sophos and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve Sophos user accounts for access review workflows
- **Access Visibility:** Monitor which users have access to your Sophos environment
- **Compliance Monitoring:** Maintain auditable records of system access for compliance and security governance

This integration supports **User Access Review workflows**, helping organizations demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Sophos Access Requirements

You must have **Administrator privileges** in your **Sophos account**.

You will need the following values:

- **Tenant ID**
- **API Host**
- **Client ID**
- **Client Secret**

### Drata Role Requirements

To create or modify connections, you must have one of the following **Drata roles with write access**:

- Admin
- Workspace Manager
- DevOps Engineer

Access Reviewers can view the connection page but cannot modify connection settings.

---

## Step-by-Step Setup

### Step 1: Retrieve Your Sophos Tenant ID

1. Log in to your **Sophos account**.
2. Select your **profile icon** in the top-right corner.
3. Navigate to **Support Settings**.
4. Locate the **Tenant ID** near the bottom of the page.
5. Copy the **Tenant ID**.

**Expected outcome:**
You have copied the **Sophos Tenant ID** required for the integration.

---

### Step 2: Identify Your Sophos API Host

1. On the same **Support Settings** page, locate your **region**.
2. The page will display:
   *“This account is located in the <Region> region.”*
3. Use the region to identify the correct **API Host** from the Sophos API documentation:
   [https://developer.sophos.com/intro#global-vs-regional-apis](https://developer.sophos.com/intro#global-vs-regional-apis)
4. Copy the **API Host** that corresponds to your region.

**Expected outcome:**
You have identified and copied the correct **API Host** for your Sophos environment.

---

### Step 3: Create Sophos API Credentials

1. Navigate to the **Sophos API Credentials Management** page.
2. Select **Add Credential**.
3. Enter the credential details.
4. Set the role to:

**Service Principal ReadOnly**

1. Select **Show Client Secret**.
2. Copy the following values:
   - **Client ID**
   - **Client Secret**

Store these credentials securely.

**Expected outcome:**
You have generated the **Client ID and Client Secret** required for the integration.

---

### Step 4: Connect Sophos in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Sophos connection process**.
4. Enter the following information when prompted:

- **Tenant ID**
- **API Host**
- **Client ID**
- **Client Secret**

**Expected outcome:**
Sophos is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Sophos integration uses **API credentials**.
- **Credential security:** Store the **Client ID and Client Secret** securely according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Bitwarden Integration Guide](bitwarden-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)
