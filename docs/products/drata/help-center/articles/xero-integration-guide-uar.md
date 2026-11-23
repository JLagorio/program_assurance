# Xero Integration Guide (UAR)

Source: https://help.drata.com/en/articles/9092027-xero-integration-guide-uar
Collection: Connection Support › Other Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Connecting Xero to Drata allows you to perform access reviews.

## Article text

Connecting Xero to Drata allows you to perform access reviews. You can review which users have access to Xero, their roles, and their permission-levels.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Administrator access to your Xero organization
- Ability to create and manage a **Xero Custom Connection app**
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Client ID & Client Secret | Authenticate the connection via Xero OAuth | User identity and access metadata |

## Step-by-Step Setup

### Step 1: Create a Xero Custom Connection app

Copy your Client ID and Client Secret from a Xero Custom Connection app:

1. Log in to Xero as an **Administrator**.
2. Go to:
   [https://developer.xero.com/app/manage/](https://developer.xero.com/app/manage/)
3. Select your **Custom Connection** app.
4. Open the app and select **Configuration**.
5. Under the **Connection** section, copy the **Client ID** and **Client Secret**.

To create a custom app:

1. Log in to Xero and go to **My Apps**:
   [https://developer.xero.com/app/manage/](https://developer.xero.com/app/manage/)
2. Select **New App**.
3. Enter an app name (for example, *Drata User Access Review*).
4. Choose **Custom Connection** as the integration type.
5. Select the required **read-only scopes** for user access data.
6. Choose an **authorize user** and complete the authorization flow.
   - You’ll receive a confirmation email once authorization is complete.
7. After authorization, open the app’s **Configuration** page.
8. Copy the **Client ID** and generate the **Client Secret**.

## Step 2: Connect Xero inside Drata

1. In Drata, go to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **Xero** or filter by **User Access Review**.
4. Select **Connect**.
5. Enter the **Client ID** and **Client Secret** from Xero.
6. Save the connection.

**Expected outcome:**
Drata successfully authenticates with Xero and begins syncing user access data.

## Related articles

- [Snowflake Integration Guide](snowflake-integration-guide.md)
- [Miro Integration](miro-integration.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [PingOne Integration Guide](pingone-integration-guide.md)
