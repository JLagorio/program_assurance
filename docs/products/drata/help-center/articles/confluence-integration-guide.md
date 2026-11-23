# Confluence Integration Guide

Source: https://help.drata.com/en/articles/9293760-confluence-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-07-01
Fetched: 2026-11-22

## Article text

The **Confluence integration** enables security and compliance teams to **sync policy documents from Confluence into Drata**. This allows organizations to continue managing policy content in Confluence while using Drata to manage **policy approvals, versioning, and employee acknowledgements**.

---

## Key Capabilities

- **Policy Sync:** Import policy documents from Confluence into Drata
- **Policy Lifecycle Management:** Use Drata to manage policy approvals and employee acknowledgements
- **Centralized Compliance:** Maintain policies in Confluence while tracking compliance in Drata

Unlike manually uploading policies, this integration allows organizations to **maintain policies in Confluence while leveraging Drata’s policy approval and acknowledgement workflows**.

---

## Prerequisites & Data Access

### Confluence Access Requirements

- The user connecting the integration must have **administrative access to the Confluence spaces** containing policy pages.
- Policy pages must be stored in **shared spaces**, not **personal spaces**.
- Policy pages must be **published pages** (not drafts).
- **Page Configuration Requirements**
   - To ensure policies sync correctly:
      - Pages **must not be personal pages**.
      - Pages **must not be in private spaces**.
      - Pages **must not be draft pages**.
      - Pages **must not contain Confluence macros**.
      Note: Pages with **attachments** will sync, but **attachments themselves are not imported into Drata**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission / Access | Why It’s Needed |
|---|---|
| Confluence space admin access | Allows Drata to retrieve policy pages from selected spaces |
| Page read access | Enables Drata to sync policy content |

---

## Step-by-Step Setup

### Step 1: Prepare Policy Pages in Confluence

Before connecting the integration, ensure your policy pages meet the required configuration:

- Policies are stored in **shared Confluence spaces**.
- Pages are **published and not drafts**.
- Pages **do not contain macros**.
- Policy pages are **not personal pages or private space pages**.

Expected outcome:
Your policy pages are ready to be synced to Drata.

---

### Step 2: Connect Confluence in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Confluence connection process**.
4. Follow the prompts to authorize access to your **Confluence workspace**.

Expected outcome:
Confluence is successfully connected and policy pages can be synced into Drata.

---

## Important Notes

- **Content source:** Policies remain managed in **Confluence**, while Drata manages **policy approval and employee acknowledgement workflows**.
- **Macro limitation:** Confluence pages containing **macros are not supported** for syncing.
- **Attachment behavior:** Attachments on pages are recognized, but **attachment files are not imported into Drata**.

## External resources

Read more about how to use an [External Policy Integration](external-policy-use-confluence-or-notion-to-manage-your-policies.md).

## Related articles

- [AWS Inspector (Amazon Inspector) Integration Guide](aws-inspector-amazon-inspector-integration-guide.md)
- [Notion Integration Guide](notion-integration-guide.md)
- [JetBrains Integration Guide](jetbrains-integration-guide.md)
- [Managing Policies Synced from Confluence in Drata](managing-policies-synced-from-confluence-in-drata.md)
- [External Policy: Use Confluence or Notion to manage your policies](external-policy-use-confluence-or-notion-to-manage-your-policies.md)
