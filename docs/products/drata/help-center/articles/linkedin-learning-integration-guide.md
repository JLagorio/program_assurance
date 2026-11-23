# LinkedIn Learning Integration Guide

Source: https://help.drata.com/en/articles/12590650-linkedin-learning-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-19
Fetched: 2026-11-22

## Article text

## Prerequisites & Data Access

- **Account / Role Needed: **Admin privileges for your LinkedIn Learning account.
- Client ID and Client Secret from LinkedIn

## Step-by-Step Setup

### Step 1: Create Application

1. Log in to your **LinkedIn Learning Admin** account.
2. Select your User Profile > Integrate
3. Select the **`Access content and reports via API`** tab on the left hand menu.
4. Expand **Generate LinkedIn Learning REST API Application**
5. Click **Add application**
6. Complete application form:
   - Describe usage: e.g. *“Drata integration to sync compliance training.”*
   - For **Choose Keys**, select: **Content and Reporting**
7. Click Next. Once you have saved the application you will be able to copy and paste the **`Client ID`** and **`Client secret`**.

### Step 2: Connect your LinkedIn Learning Account to Drata

In Drata:

1. Go to **Connections**
2. Select **LinkedIn Learning**
3. Enter your **Client ID** and **Client Secret**
4. Click **Connect**

## Related articles

- [Azure Integration Guide](azure-integration-guide.md)
- [Autodesk Integration Guide](autodesk-integration-guide.md)
- [Egnyte Integration Guide (UAR)](egnyte-integration-guide-uar.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Docebo Integration Guide](docebo-integration-guide.md)
