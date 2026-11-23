# Map evidence and policies to controls (New Experience)

Source: https://help.drata.com/en/articles/13416972-map-evidence-and-policies-to-controls-new-experience
Collection: Understand the Drata Platform › Controls
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

Mapping evidence to controls shows auditors **how your controls are implemented and maintained**. This is especially important for controls that don’t rely on automated monitoring tests and instead require **manual proof**, such as policies, screenshots, reports, or tickets.

By mapping evidence directly to controls in Drata, you keep audit documentation **centralized, current, and easy to review**, which reduces audit back-and-forth and improves control readiness.

## Prerequisite

- Drata roles: Admins, Information security leads, Workspace managers, Control managers, and DevOps engineers have access to this section within Drata.

## Map Evidence to Controls

You can link evidence to controls from either the **Controls page** or the **Evidence Library**.

### Option 1: Map Evidence from a Control

Use this method when you want to attach **manual evidence (files or URLs)** directly to a specific control.

1. Go to **Controls**.
2. Select a control to open its details page.
3. Open the **Evidence** tab.
4. Select **Add evidence**.

From here, you can either:

- **Select existing evidence** from the Evidence Library, or
- **Add new (miscellaneous) evidence** by uploading a file or adding a URL.

### Upload a File as Evidence

Use file-based evidence for items such as screenshots, reports, exports, or written procedures. When uploading a file:

- Enter a **name** and **description** (optional; the file name is used if omitted).
- Enter a **creation date** and **renewal date**.
   These dates affect **control readiness**.
- Upload a supported file type.

**Supported file types: **CSV, DOCX, GIF, JPEG, JSON, ODP, ODS, ODT, PDF, PNG, PPTX, TXT, XLSX, ZIP

**File size limit:** 25 MB per file

### Add a URL as Evidence

Use URL-based evidence when proof lives outside Drata, such as:

- Ticketing system links (for example, Jira or ServiceNow)
- External dashboards
- Hosted documentation or internal tools

When adding a URL:

- Enter a **name** (required).
- Enter **creation** and **renewal** dates.
- Optionally add a **description**.
- Select **Save**.

### Save the Evidence

Once all required fields are complete, select **Save**. The evidence is now linked to the control and contributes to control readiness.

### Option 2: Map Controls from an Evidence Item

1. Go to **Compliance > Evidence.**
2. Select an evidence and then the **Control** tab.
3. Map the desired control.

If the control you need does not exist yet, you can create a new control from this flow and then link it to the evidence.

## Map Policies to Controls

Policies document **intent, governance, and expectations** for controls. Mapping policies to controls improves traceability and makes audits easier to follow. To map a policy:

1. Go to **Controls**.
2. Open a control.
3. Select the **Policies** tab.
4. Select **Map policies**.
5. Choose one or more policies and **Save**.

You can also select **Create a new policy** from the modal if needed.

**Note:** Drata’s templated policies are automatically mapped to applicable controls. You can unmap any policy at any time.

## Related articles

- [Are Your Controls Ready? Understanding the Relationship Between Policies, Evidence, and Controls](are-your-controls-ready-understanding-the-relationship-between-policies-evidence-and-controls.md)
- [Evidence Overview](evidence-overview.md)
- [External Policy: Use BambooHR to manage your policies](external-policy-use-bamboohr-to-manage-your-policies.md)
- [Using the Drata Audit Portal (New Experience)](using-the-drata-audit-portal-new-experience.md)
- [Section 5: Evidence Owners](section-5-evidence-owners.md)
