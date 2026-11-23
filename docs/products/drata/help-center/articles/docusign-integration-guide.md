# DocuSign Integration Guide

Source: https://help.drata.com/en/articles/6513179-docusign-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Learn how to connect DocuSign to Drata to automatically send NDAs to Trust Center requesters before granting access to private documents.

## Article text

The **DocuSign integration** allows organizations to automatically send **NDA agreements to Trust Center requesters** before granting access to private documents. When connected, Drata sends NDA envelopes through DocuSign and tracks signing status before allowing access to sensitive files.

This integration helps streamline document access management and NDA workflows within the Trust Center.

---

## Key Capabilities

- **Automated NDA Requests:** Send NDAs to Trust Center requesters before granting access
- **Envelope Tracking:** Monitor NDA signing status directly within Drata
- **Secure Document Access:** Ensure NDAs are signed before private files are shared

---

## Prerequisites & Data Access

### DocuSign Access Requirements

- Your **DocuSign plan must include Organization Management**.
- You must have the **Organization Admin role** in DocuSign.
- Your **NDA template must be configured as a one-way template**.
- The NDA document must be **pre-signed** so only the requester needs to sign.

---

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Send envelopes | Allows Drata to send NDA envelopes to Trust Center requesters |
| Templates: Use | Allows Drata to use the configured NDA template |
| View and manage envelope rights via API | Allows Drata to track the status of NDA envelopes |
| Send on behalf of other users via API | Allows Drata to send envelopes automatically through the connected DocuSign account |

---

## Step-by-Step Setup

### Step 1: Verify DocuSign Administrative Access

You must be an **Admin in Drata** and an **Organization Admin in DocuSign**.

1. Navigate to the **DocuSign Organization Admin portal**:
   [https://apps.docusign.com/admin/organization/](https://apps.docusign.com/admin/organization/)
2. Log in to your **DocuSign account**.
3. On the **Users page**, select the **Administrator** tab.
4. Select **Add Administrator**.
5. Enter the required details and ensure the **Permission Profile** is set to: **Administrator**

**Expected outcome:**
Your account has the required **DocuSign Organization Admin permissions**.

---

### Step 2: Connect DocuSign in Drata

1. Log in to **Drata → go to the Connections page**.
2. Navigate to **Available Connections**.
3. Search for and start the **DocuSign connection process**.
4. Select **Connect your DocuSign account**.
5. You will be redirected to **DocuSign** to authorize the connection.

**Expected outcome:**
DocuSign is successfully connected to Drata.

---

## Configure NDA Templates for Trust Center

Before enabling NDA enforcement in Drata, you must configure your **DocuSign template**.

### Configure the NDA Template

When creating the NDA template in DocuSign:

- The **recipient role must be set to "Signer"**
- The document must be **pre-signed**
- Only the requester should need to add their signature

**Important:**
If you update your NDA template, **replace the document within the existing template instead of creating a new template**. Deleting the template will break existing Trust Center request workflows.

---

## Enable DocuSign for Trust Center NDAs

1. Navigate to **Trust Center → Settings** in Drata.
2. Locate **Document Access Management**.
3. Select the **edit icon**.
4. Under **Set up preferences for Trust Center document access**, choose:

**Use DocuSign for NDA**

Enter the **Template ID** for the DocuSign NDA template.

**Expected outcome:**
DocuSign is configured as the NDA provider for Trust Center requests.

---

## How the NDA Workflow Works

Once the integration is enabled:

1. A requester submits a **Trust Center access request**.
2. An administrator reviews the request and selects **Approve**.
3. Drata automatically sends a **DocuSign envelope containing the NDA**.
4. The requester signs the NDA in DocuSign.
5. After the signature is completed, **Drata automatically grants access to the requested files**.

You can track the **NDA status** directly from the Trust Center request page.

---

## Important Notes

- **Template management:** Do not delete your DocuSign template after configuring it in Drata.
- **Permissions adjustment:** After the connection is established, the Organization Admin access level can be reduced, but the required API permissions must remain enabled.
- **Template configuration:** The template must allow **requesters to sign as the recipient**.

---

## Related articles

- [Google Workspace Integration Guide](google-workspace-integration-guide.md)
- [Lever Integration Guide](lever-integration-guide.md)
- [Twilio Integration Guide](twilio-integration-guide.md)
- [PingOne Integration Guide](pingone-integration-guide.md)
- [SafeBase Trust Center NDA Set up Training Video](safebase-trust-center-nda-set-up-training-video.md)
