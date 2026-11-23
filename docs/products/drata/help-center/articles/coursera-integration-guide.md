# Coursera Integration Guide

Source: https://help.drata.com/en/articles/12591186-coursera-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-20
Fetched: 2026-11-22

## Article text

## Prerequisites & Data Access

- Ensure you have Admin privileges for your Coursera account.
- API App, Organization ID, Client ID, and Client Secret created in Coursera

## Step-by-Step Setup

### Step 1: Sign in to the Coursera Developer Portal

1. Navigate to the **[Coursera Developer Portal](https://dev.coursera.com/)**
2. Click **Sign In** (top-right)
3. Log in to your account at **[www.coursera.org](http://www.coursera.org/)** and click **Login With SAML**
4. Accept **Terms & Conditions** if shown

⚠️ If the portal still says "Sign In" after SAML login, click it again to refresh your session.

### Step 2: Register an App

1. Click your **email address** (top-right) → select **Apps**
2. Click **+ New App**
3. Enter:
   - **App Name** (e.g. “Drata Integration”)
   - **Description** (e.g. “Sync training data to Drata”)
4. Under **APIs**, enable relevant APIs (e.g. Reporting API, Content API)
5. Click **Save**
6. In the **Credentials** section:
   - Click **Show Secret**
   - Copy **Client ID (App Key)** and **Client Secret**

Use your **organization’s admin account** to register. Personal accounts may not have access to training APIs.

### Step 3: Get Your Coursera Organization ID

1. Click your **email** (top-right) → select **Admin**
2. In the right sidebar, click **Settings**
3. Copy the **Organization ID** from this page

### Step 4: Link Your Coursera Account to Drata

1. Go to **Connections** in Drata
2. Select **Coursera **
3. Enter:
   - **Client ID** (App Key)
   - **Client Secret** (App Secret)
   - **Organization ID**
4. Click **Connect**

## Related articles

- [TriNet Integration Guide](trinet-integration-guide.md)
- [CyberArk Integration Guide](cyberark-integration-guide.md)
- [Databricks Integration Guide (UAR)](databricks-integration-guide-uar.md)
- [Docebo Integration Guide](docebo-integration-guide.md)
- [Udemy Integration Guide](udemy-integration-guide.md)
