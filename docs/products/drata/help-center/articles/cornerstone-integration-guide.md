# Cornerstone Integration Guide

Source: https://help.drata.com/en/articles/12590630-cornerstone-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-02-12
Fetched: 2026-11-22

## Article text

## Prerequisites & Data Access

- Cornerstone administrator access
- Cornerstone API enabled
- Cornerstone Client ID and Client Secret

## Step-by-Step Setup

### Step 1: Generate Client ID and Secret key

1. Sign in to your Cornerstone portal using an account with **Admin privileges**.
2. Navigate to **Admin > Tools > Edge > API Management**.
3. On the **Manage Applications** tab, select **Register New Application**.
4. Enter an **Application Name** (e.g. *Drata Integration*).
5. Enter the **User ID** of an active user in your Cornerstone portal.
6. In the **Scopes** section, select the required API scopes.
   - `obj_users_core:read`
   - `vw_rpt_training:read`
   - `training:read`
   - `transcript:read`
   - `obj_user_status_core:read`
   - `obj_subject_core:read`
   - `vw_rpt_lo_competencies_local:read`
7. Click **Register Application**.
8. The page may refresh and display your client ID and client secret. Copy both values to a safe place.

### Step 2: Configure User Permissions

1. Navigate to **Admin > Tools > Core Functions > Users**. Search for the user that is associated with the newly created application from the previous step.
2. Select the** Options > Permissions**.
3. For each of the permissions listed below, verify that the **Constraint** is set to one of the following:
   - **There are no constraints available for this permission. **(the permission cannot be further restricted), **or**
   - **Restrict to User's Corporation** (access is limited to the user’s organization)
4. Confirm these permissions are configured correctly:
   - **Reporting API — Read only**
   - **Transcript API — Request**
   - **Employee API — View**
5. Save your changes before proceeding.

### Step 3:  Connect Cornerstone to Drata

1. In Drata, go to **Connections** and search for **Cornerstone**.
2. On the connection screen, enter Cornerstone’s :
   • Client ID
   • Client Secret
   • User ID
3. Connect and complete the connection.

## Related articles

- [Bitwarden Integration Guide](bitwarden-integration-guide.md)
- [Egnyte Integration Guide (UAR)](egnyte-integration-guide-uar.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Twilio Integration Guide](twilio-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)
