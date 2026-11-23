# Create Evidence

Source: https://help.drata.com/en/articles/13404476-create-evidence
Collection: Understand the Drata Platform › Evidence
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Add and manage evidence in Drata's Evidence Library to support control readiness and audit preparation.

## Article text

Adding relevant, up-to-date evidence helps keep controls ready and prevents audit gaps. Always ensure uploaded artifacts directly support the controls they're mapped to. Outdated or incorrect evidence can negatively impact control readiness.

You can upload evidence directly from your computer or from a connected cloud storage provider.

## Supported File Types

- Local file
   - **Supported file types include**: CSV, DOCX, GIF, HTML, JPEG, JSON, LOG, MP4, MSG, ODP, ODS, ODT, PDF, PNG, PPTX, TXT, XLSX, ZIP
- Google Drive
- Microsoft OneDrive
- SharePoint
- Box
- Dropbox

**Upload rules**

- You can upload **one file per artifact**

**File Size Limits**

- **Individual files:** Up to 50 MB
- **Zipped files:** Up to 100 MB total (each unzipped file must be under 50 MB)

## Add Evidence

1. Navigate to **Compliance > Evidence**.
2. Select **Create Evidence**.
3. Enter the required details:
   - Name
   - Description (optional)
   - Implementation guidance (optional)
4. Add source:
   - **File**: Upload a document from your computer or cloud storage
   - **URL**: Link to a web-based resource
   - **Ticket provider**: Enter the direct URL to the ticket in your ticketing system (for example, a Jira or Linear issue link).
      - **Jira Example:** Open the issue → copy the URL
         `https://yourcompany.atlassian.net/browse/SEC-123`
      - **Linear Example:** Open the issue → copy the URL
         `https://linear.app/yourcompany/issue/SEC-45`
   - **No Artifact**: Use if the evidence will be provided later
5. If uploading from a cloud provider:
   - Sign in with the correct account
   - Browse or search for the file using keywords
6. Enter the **Creation date** and **Renewal date** to support audit timelines.
7. (Optional) Map the evidence to controls.
8. Select **Save**.

The evidence is added to the Evidence Library and linked to any selected controls.

## Add Evidence from the Control page

You can also add evidence directly while working on a control.

1. Go to the **Controls** page and select a control.
2. Open the **Evidence** tab.
3. Select **Map Evidence**.
4. Choose one of the following:
   - **Evidence Library**: Choose existing evidence that already exists in the Evidence page.
   - **Miscellaneous evidence**: Add new evidence.
5. Select **Save**.

## Related articles

- [Create Workflow for Evidence](create-workflow-for-evidence.md)
- [Evidence Overview](evidence-overview.md)
- [Evidence Renewal Date](evidence-renewal-date.md)
- [Manually Export Evidence Data from Drata](manually-export-evidence-data-from-drata.md)
- [Bulk Import Evidence](bulk-import-evidence.md)
