# Jit Integration Guide

Source: https://help.drata.com/en/articles/10924492-jit-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-25
Fetched: 2026-11-22
Description: Learn how to connect Jit to Drata to automatically send SOC 2 security evidence and technical control reports.

## Article text

> This is a partner connection that is externally managed. You can use connections from external partners to enable workflows, but it does not access Drata’s built-in control tests. [Learn more about partner connections](partner-connections-expanding-compliance-with-external-tools.md)

The **Jit integration** enables security and compliance teams to automatically send **security evidence and technical control reports** to Drata. This integration helps automate evidence collection for SOC 2 technical controls and streamline audit readiness.

**Important:**
The Jit integration is configured **from the Jit platform**, not from the Drata Connections page.

This guide explains how to **create the required Drata API key** and prepare the credentials needed for Jit to send evidence to Drata. After completing these steps, the **Jit team will enable the integration on their side**.

## Prerequisites & Data Access

- The **Jit integration is configured within the Jit platform**, not in the Drata Connections page.
- To enable the integration, you must first **create a Drata API key**. Jit will use this key to securely send evidence to Drata.
- After the required credentials are created, the **Jit team will enable the evidence synchronization for your environment**.

### Jit Access Requirements

- Access to **Jit Settings and Secrets management**
- Permission to **generate API tokens in Jit**
- Permission to **store secrets in the Jit platform**

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

## Step-by-Step Setup

### Step 1: Create a Drata API Key

1. Log in to **Drata**.
2. Navigate to **Settings → API Keys**.
3. Select **Create API Key**.
4. Configure the API key with the following permissions:
   - **Personnel**
      - Get Personnel – Read
   - **Controls**
      - List Controls – Read
   - **Workspaces**
      - List Workspaces – Read
   - **Evidence Library**
      - List Evidence – Read
      - Create Evidence – Write
      - Update Evidence – Write
      - Delete Evidence – Write
5. Choose an **expiration date with a long duration** to avoid interruptions.

Copy the **Drata API key** and store it securely.

**Expected outcome:**
You have generated the **Drata API key** required for the integration.

---

### Step 2: Store the Drata API Key in Jit

1. Log in to **Jit**.
2. Navigate to **Settings → Secrets**.
3. Select **Create new secret**.
4. Create a secret with the following details:

Secret name:

```
DRATA_API_KEY
```

Value: Your **Drata API key**

**Expected outcome:**

The Drata API key is securely stored in Jit.

---

### Step 3: Generate a Jit API Token

1. In Jit, navigate to **Settings → Users & Permissions**.
2. Select **API Token → Generate Token**.
3. Create a new token:
   - Add a meaningful **description**
   - Assign the **Developer role**

Jit will generate:

- **Client ID**
- **Secret Key**

Copy both values and store them securely.

**Expected outcome:**
You have generated the **Jit Client ID and Secret Key**.

---

### Step 4: Store the Jit Credentials

1. Return to **Settings → Secrets** in Jit.
2. Create the following secrets:
   - `DRATA_API_KEY`: Paste your Drata API key.
   - `JIT_CLIENT_ID`: Paste your Jit Client ID.
   - `JIT_CLIENT_SECRET`: Paste your Jit Secret Key.

Important:
 The secret names must match exactly for the integration to function correctly.

**Expected outcome:**
 All required credentials are stored in Jit.

---

### Step 5: Request Integration Activation

After completing the previous steps, contact **Jit Support** and provide the following information:

- Your **Drata workspace name**
- The **email address of the Drata user who created the API key**
- Confirmation that the **Drata API key and Jit secrets have been created**

**Expected outcome:**
 The **Jit team enables the Drata evidence sync** for your environment.

---

### Step 6: Configure the integration in Jit

1. In Jit, go to **Integrations** and locate the **Drata** tile.
2. Select **Integrate as-code** to open the `jit-integration.yml` file in your central Jit repository.
3. For the Drata integration structure, replace the placeholder values with your specific information:
   - `'Enter the desired Drata Workspace'`:
      - If workspaces are enabled:
         - Go to Drata, then select **Settings **> **Workspaces**
         - Copy the name of the workspace you want to send evidence to.
      - If workspaces are not enabled:
         - Go to Drata, then select **Settings **> **Organization Details**
         - Copy the Project Name.
   - `'Enter the email address of the Drata user who created the API key'`:
      - Enter the email address of the Drata user who created the API key.
4. Add the following Drata integration structure to the end of the file.

**Drata integration structure**

```
drata:
  workspace: 'Enter the desired Drata Workspace'
  user_email: 'Enter the email address of the Drata user who created the API key'
```

Jit report will be periodically sent to the Drata workspace you selected.

## Partner Offers & Discounts

Drata has direct partnerships and discounted pricing for first time customers of Jit. Get 25% off your first year of Jit by visiting [https://www.jit.io/book-a-demo](https://www.jit.io/book-a-demo).

- Offer only eligible for new customers
- Check out [more partner offers and discounts](https://drata.com/partner/find/tech-directory?collections=partner-discountoffers,partner-offers-discounts-pod).

## Related articles

- [Bitwarden Integration Guide](bitwarden-integration-guide.md)
- [Vetty Integration Guide](vetty-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
