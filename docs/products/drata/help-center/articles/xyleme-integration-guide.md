# Xyleme Integration Guide

Source: https://help.drata.com/en/articles/12591193-xyleme-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-20
Fetched: 2026-11-22

## Article text

### Prerequisites & Data Access

- Admin privileges for your Xyleme account.

## Step-by-Step Setup

### Step 1: Gather  Xyleme Credentials

1. Log into your Xyleme tenant URL:
   ```
https://.bravais.com/adminportal
   ```
2. Copy your domain.
   - Your domain (tenant) is the subdomain used to access Xyleme. For example, if your URL is **`https://my-domain.bravais.com/adminportal`**, your domain is **`my-domain`**.

### Step 2: Create a System Account

1. From the top navigation bar, open the **Admin Portal** dropdown.
2. Go to **Users → Users**.
3. Click **Add user**.
4. In the **Add user** dialog, fill in the user’s **First name**, **Last name**, and **Email**.
5. Once all fields are completed, click **Save** to add the user to Xyleme.

---

### Step 3: Set Username and Password

1. Search for the user you created
2. Under Actions column, select **three-dot menu → View details**
3. On the user profile page, go to the **Identities** tab
4. Under **Local Identity**:
   - Copy the **Username**
   - Set a strong **Password**
5. Click **Save**

Record the username and password. These will authenticate the integration.

---

### Step 4: Link Your Xyleme Account to Drata

1. Go to **Connections** in Drata
2. Select **Xyleme**
3. Enter:
   - **Domain** (tenant)
   - **Username** (system account)
   - **Password** (system account)
4. Click **Connect**

## Related articles

- [Okta Integration Guide (Identity Management Provider)](okta-integration-guide-identity-management-provider.md)
- [CyberArk Integration Guide](cyberark-integration-guide.md)
- [Egnyte Integration Guide (UAR)](egnyte-integration-guide-uar.md)
- [Workday Learning Integration Guide](workday-learning-integration-guide.md)
- [PeopleFluent Integration Guide](peoplefluent-integration-guide.md)
