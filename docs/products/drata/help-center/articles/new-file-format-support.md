# New File Format Support

Source: https://help.drata.com/en/articles/8500557-new-file-format-support
Collection: Understand the Drata Platform › Evidence
Updated: 2026-11-20
Fetched: 2026-11-22
Description: This article covers the new file formats supported in Evidence Library, Controls, and RIsk Management.

## Article text

This article covers the file formats supported in Controls, Evidence Library, and Risk Management, and how Drata scans uploaded files for malicious content.

## Here's why

Uploading evidence to Drata is essential for maintaining your compliance posture. We want to ensure certain file types uploaded to your account do not contain malicious content that could affect Drata or your account.

These file types won't be saved in Drata until after we've scanned them. The Drata Open API supports these same file formats, except where noted.

## Supported file formats

### Controls (Miscellaneous Evidence)

The following file formats are supported:

- **Upload: **`.pdf`, `.docx`, `.odt`, `.xlsx`, `.ods`, `.pptx`, `.odp`, `.gif`, `.jpeg`, `.png`, `.csv`, `.txt`, `.json`, `.zip`
- **Scanned for malicious content and saved:** `.zip`, `.txt`, `.json`, `.csv`
- **Not supported:** `.log`, `.msg`, `.mp4`, `.html`, `.markdown`, `.md`
   - **Note: **Depending on how certain text-based files are saved and how their mimetype is read, a Public API upload may fail. A mimetype of `text/plain` will fail, whereas a mimetype of `text/markdown` will succeed and be scanned.

### Evidence Library Artifacts

The following file formats are supported:

- **Upload: **`.pdf`, `.docx`, `.odt`, `.xlsx`, `.ods`, `.pptx`, `.odp`, `.gif`, `.jpeg`, `.png`, `.csv`, `.txt`, `.json`, `.zip`, `.msg`, `.mp4`, `.log`, `.html`
   - **Note: **`.html` files cannot be uploaded via the Public API
- **Scanned for malicious content and saved:** `.zip`, `.txt`, `.json`, `.csv`, `.log`, `.msg`, `.mp4`
- **Scan and save (download-only, not previewed in browser):** `.html`
- **Upload via API only and scanned:** `.markdown`, `.md`

### Risk Management (Supporting Documents)

The following file formats are supported:

- **Upload: **`.pdf`, `.docx`, `.odt`, `.xlsx`, `.ods`, `.pptx`, `.odp`, `.gif`, `.jpeg`, `.jpg`, `.png`, `.csv`, `.txt`, `.json`, `.zip`
- **Scanned for malicious content and saved:** `.zip`, `.txt`, `.json`, `.csv`
- **Not supported:** `.log`, `.msg`, `.mp4`, `.html`, `.markdown`, `.md`

## File size limits

- **Individual files:** 50 MB maximum per file
   - **Note: **when uploading individual supporting documents for Risks, the Public API restricts file sizes to a maximum of 25 MB.
- **Zip files:** Up to 100 MB total (unzipped). Each individual file inside the zip must be under 50 MB.

## Zip file details

A ZIP file may include:

- One additional ZIP file inside, or
- Files with the listed extensions above (`.txt`, `.json`, `.markdown`, `.md`, `.csv`)

If a zip file is scanned and rejected due to potentially malicious content, the event tracking details will include which file in the zip was identified as potentially malicious.

## Uploading a file that needs to be scanned

1. Select the file you want to upload.
2. Drata will scan the file.
3. If the file is safe, Drata will save it.
4. If potentially malicious content is detected, Drata will reject the file and create an event in Event Tracking.
5. An email will be sent to the user who tried to upload the file, notifying them it was rejected along with a link to the event tracking details.

## If the file is a required step

If the file is required at a step in Drata, you will have to wait until after the scan is complete to continue.

For example, if you are uploading miscellaneous evidence to a control, the file is required. If you select **Save File** before scanning is complete, there will be an error.

You can always close the modal by selecting **Cancel** at any time. Once the file is saved, you can select **Save File** and continue.

## Related articles

- [Import Risk in Bulk (New Experience)](import-risk-in-bulk-new-experience.md)
- [Drata Evidence Library Sync](drata-evidence-library-sync.md)
- [Create Evidence](create-evidence.md)
- [Map evidence and policies to controls (New Experience)](map-evidence-and-policies-to-controls-new-experience.md)
- [Bulk Import Evidence](bulk-import-evidence.md)
