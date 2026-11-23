# Manually Export Evidence Data from Drata

Source: https://help.drata.com/en/articles/13464187-manually-export-evidence-data-from-drata
Collection: Understand the Drata Platform › Evidence
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Learn how to manually download evidence from Drata using the Evidence Library, Controls, Event Tracking, or Audit Hub.

## Article text

This article explains the available methods for manually exporting evidence and when to use each one. Drata does not currently offer a single bulk export feature without API access. Instead, evidence must be downloaded from different areas of the application depending on how it is stored or generated. Drata also supports exporting other data types, such as Framework Mappings, Policies, Personnel, Vendors, Risks, and Reports, from their respective sections.

## Methods to Export Evidence Data

### 1. Download Evidence from the Evidence Library

The Evidence Library is a centralized repository for evidence files that have been uploaded or generated and linked to controls.

**To download evidence from the Evidence Library:**

1. Go to **Compliance > Evidence**.
2. Select the evidence item you need.
3. In the **Current artifact** section, select the ellipse and then download.

**When to use this method:**

- Best for downloading specific, known evidence items
- Files must be downloaded individually, which may be time-consuming for large volumes

---

### 2. Download Evidence Linked to a Control

Evidence is often attached directly to individual controls.

**To download evidence from a control:**

1. Go to **Controls**.
2. Select a control.
3. Open the **Evidence** tab (available to users opted into Early Access).
4. Select the **Download** near the top-right corner of the evidence table.
5. When the download is ready, a notification appears in the bottom-right corner.

**When to use this method:**

- Useful for reviewing or exporting evidence tied to a small number of controls
- Not efficient for exporting evidence across many controls

---

### 3. Download Raw Evidence from Events

Some evidence is generated through system events and stored in Event Tracking.

**To download event-based evidence:**

1. Go to **Events**.
2. Select an event to open its details.
3. Choose one of the following options:
   - **Raw Evidence and Event Details (.pdf)**
   - **Raw result (.txt)**

**When to use this method:**

- Best for investigating or exporting individual event records
- Not intended for broad or bulk evidence collection

---

### 4. Collect Evidence by Date Range Using Audit Hub

The Audit Hub can be used to gather a consolidated set of evidence for a defined audit period. While this is **not a full export of all evidence**, it provides a centralized package of evidence relevant to a specific timeframe.

**To use the Audit Hub:**

1. Go to **Compliance > Audit**.
2. Select an audit or create a new one by specifying a date range for the evidence you want to include. The date range determines which evidence items are pulled into the pre-audit package.
3. Select the **ellipse > Pre-Audit package > Request package**.
4. Optionally, edit the package to select specific categories (e.g., Vendors, Policies, Assets) before downloading.
5. If new evidence is added later, regenerate the package to include updates.
6. Once the audit is no longer needed, you can delete it.

The Pre-Audit package includes evidence associated with the audit and date range, primarily sourced from the Evidence Library and linked controls. It may not include all evidence types stored elsewhere in Drata.

## Related articles

- [Drata Evidence Library Sync](drata-evidence-library-sync.md)
- [Evidence Overview](evidence-overview.md)
- [Create Evidence](create-evidence.md)
- [Audits page overview (New Experience)](audits-page-overview-new-experience.md)
- [Creating and Navigating an Audit in Drata Training Video](creating-and-navigating-an-audit-in-drata-training-video.md)
