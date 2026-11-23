# How audit date ranges and evidence sampling affect auditor access

Source: https://help.drata.com/en/articles/13606011-how-audit-date-ranges-and-evidence-sampling-affect-auditor-access
Collection: The Auditor Experience
Updated: 2026-11-09
Fetched: 2026-11-22
Description: This article explains why auditors may not see certain evidence and how audit date ranges and evidence sampling determine what’s included in an audit.

## Article text

Auditors can see only the evidence that falls within the **audit date range** and has been **sampled** for the audit. If evidence appears missing, blank, or outdated, it's usually because of how the audit period or evidence sampling is configured.

## What controls auditor access to evidence

Auditor access to evidence is controlled by **you**, not the auditor. Two things determine what auditors can see: the **audit date range** and **evidence sampling**. To ensure auditors can access evidence, it is crucial to associate evidence with the relevant controls in Audit Hub. Evidence attached directly to an audit request thread will not be visible to auditors. Instead, upload your evidence (e.g., Word or PDF files) directly to the corresponding control and mark the audit request as "Prepared." This ensures all evidence is properly linked and accessible to auditors.

Common scenarios and how to fix them **Evidence visibility controlled by 'Prepared' status:** Evidence is only shared with auditors when a request is moved from "New" to "Prepared" in Audit Hub. Before marking a request as "Prepared," you can review and exclude evidence. Excluded items will not be shared with auditors.

**Auditor reports missing or blank evidence:** Check the sampled date. If the auditor sampled a future date, no automated test evidence will exist yet. Ask the auditor to re-sample after the date has passed.

**New evidence uploaded outside the audit date range:**

1. Update the audit date range to include the new evidence date
2. Notify the auditor that the range has been updated
3. The auditor must **re-sample** the evidence package

Updating the audit date range The evidence cutoff period acts as a snapshot of a specific date range. When you set start and end dates for an audit, Drata requests evidence within that selected period. This helps define the scope of the audit and ensures that only relevant evidence is included.

1. Open the **Audit** page.
2. Select the **edit** icon next to the audit period.
3. Update the start or end date as needed.
4. Save your changes. Only the admin of the Drata tenant can modify the audit period. This ensures that all evidence, including newly uploaded files, falls within the defined audit window.

## Related articles

- [Create and add auditors to an audit](create-and-add-auditors-to-an-audit.md)
- [Using the Drata Audit Portal (New Experience)](using-the-drata-audit-portal-new-experience.md)
- [Audits page overview (New Experience)](audits-page-overview-new-experience.md)
- [What auditors can see in Audit Portal](what-auditors-can-see-in-audit-portal.md)
- [Creating and Navigating an Audit in Drata Training Video](creating-and-navigating-an-audit-in-drata-training-video.md)
