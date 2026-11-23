# Autodesk Integration Guide

Source: https://help.drata.com/en/articles/9437789-autodesk-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-11-01
Fetched: 2026-11-22
Description: Follow these steps to connect Autodesk

## Article text

The **Autodesk** integration enables your security or compliance teams to monitor user access and permissions within **Autodesk BIM 360** for audit evidence. It connects Drata to Autodesk so your team can automatically verify user roles and access consistency.

## Key Capabilities

- **Automated Evidence Collection:** Supports compliance tests related to access control.
- **Continuous Access Review:** Ensures individual access is compliant with your organization’s policies.

## Prerequisites & Data Access

- You must have [Primary or Secondary admin access within Autodesk](https://www.autodesk.com/support/account/admin/users/roles).
- You must have an **active **[BIM 360 account](https://aps.autodesk.com/en/docs/bim360/v1/tutorials/getting-started/get-access-to-account/#step-1-provisioning-a-bim-360-account).
- The **Account ID** is found in your URL when logged in to the BIM 360 Admin console: `https://admin.b360.autodesk.com/admin/{{Account ID}}/projects`
- You need to [register the app](https://aps.autodesk.com/en/docs/oauth/v2/tutorials/create-app/) in Autodesk Platform Services (formerly Forge).
- Must have **Admin, Information Security Lead, DevOps Engineer, or Workspace Manager** roles in Drata.

## Step-by-Step Setup

### Step 1: Register a Custom App in Autodesk Platform Services

1. Go to the [Autodesk Developer Portal](https://aps.autodesk.com?utm_source=chatgpt.com).
2. Sign in with your Autodesk credentials.
3. Navigate to **My Apps → Create App**.
4. Select **Traditional Web App** for the application type.
5. Enter an app name and description (optional).
6. Leave the **Callback URL** and **API Access** fields blank. They are not required for the Drata connection.
7. After registering, copy your **Client ID** and **Client Secret**. You will need these values to complete the Drata connection.

Learn more at Autodesk's [Create and register the app](https://aps.autodesk.com/en/docs/oauth/v2/tutorials/create-app/) article.

### Step 2: Connect the App to Your BIM 360 Account

1. Sign in to **BIM 360 Account Admin**.
2. Navigate to **Settings → Apps & Integrations → Add Custom Integration**.
3. Select the following access levels:
   - **BIM 360 Account Administration**
   - **Document Management**
4. Choose **I’m the developer**.
5. In the **Add Custom Integration** modal:
   - Enable “I have saved the Account ID information securely.”
   - Enter your **Client ID** from Step 1.
   - Enter your **App Name**.
   - Confirm your **Account ID** is correct.
6. Select **Save** when complete.

### Step 3: Connect Autodesk in Drata

1. In Drata, go to the **Connections** page.
2. Select the **Available Connections** tab, search for **Autodesk**, and choose **Connect**.
3. When prompted, enter your **Client ID**, **Client Secret**, and **Account ID**.
4. Click **Connect**.
5. A success message and checkmark confirm the connection is established.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [Twilio Integration Guide](twilio-integration-guide.md)
- [OpenAI Integration Guide](openai-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)
