# Lever Integration Guide

Source: https://help.drata.com/en/articles/9300698-lever-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Lever to Drata. This connection supports the following types: HRIS

## Article text

The **Lever integration** enables security and compliance teams to automatically sync hiring data from Lever. By connecting Lever to Drata, organizations can track hiring activity and maintain accurate personnel records to support compliance monitoring and audit readiness.

---

## Prerequisites & Data Access

### Lever Access Requirements

- You must have a **Lever account**.
- You must be able to **authorize the Lever integration during the connection process**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission | Why It’s Needed |
|---|---|
| View All Users | Allows Drata to retrieve user and hiring-related information from Lever |
| Offline Access | Allows Drata to maintain the integration connection without requiring repeated authentication |

---

## Step-by-Step Setup

### Step 1: Connect Lever in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Lever connection process**.

Expected outcome:
The Lever authentication process begins.

---

### Step 2: Authorize the Lever Integration

1. Sign in to your **Lever account** when prompted.
2. Review the permissions requested by the integration:
   - **View All Users**
   - **Offline Access**
3. Select **Accept** to authorize the integration.

Expected outcome:
Lever is successfully connected and hiring data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Lever integration uses **OAuth authorization** during the connection process.
- **Required permissions:** The integration requires **View All Users** and **Offline Access** to retrieve hiring data and maintain the connection.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established

## Related articles

- [Justworks Integration Guide](justworks-integration-guide.md)
- [Segment Integration Guide](segment-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
