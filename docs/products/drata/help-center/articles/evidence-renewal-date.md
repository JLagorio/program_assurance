# Evidence Renewal Date

Source: https://help.drata.com/en/articles/13417542-evidence-renewal-date
Collection: Understand the Drata Platform › Evidence
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Set and manage renewal dates for evidence to keep controls audit-ready and avoid compliance gaps.

## Article text

The evidence renewal date determines whether linked controls remain **Ready**. If evidence is past its renewal date, it is considered outdated, and the associated control may no longer be audit-ready.

Keeping renewal dates accurate ensures your controls reflect current, valid proof and reduces last-minute audit gaps.

## How Evidence Renewal Dates Affect Readiness

- Evidence **within** its renewal date supports control readiness.
- Evidence **past** its renewal date is treated as outdated and can negatively impact readiness.
- Updating the renewal date or replacing the artifact restores relevance and readiness.

Renewal dates apply to **manual evidence** (files, URLs, tickets). Test evidence is managed through test results, not renewal dates.

## Prerequisites

Users with the following roles can view and manage evidence renewal dates:

- Admins
- Information Security Leads
- Workspace Managers
- Control Managers
- DevOps Engineers

## Helpful Filters on the Evidence Page

On the Evidence page, use **Status** filters to find evidence that needs attention:

- **Needs attention**
- **Upcoming renewal**
- **Ready**

## View or Update a Renewal Date

1. Go to **Compliance > Evidence**.
2. Select an evidence item.
3. In the **Current artifact** section, you can:
   - View current artifact
   - Add a new artifact
   - Update the **creation date** or **renewal date**
4. Save your changes.

## Add or Update Renewal Dates for Miscellaneous Evidence on a Control

Use this method when you're working directly from a specific control and need to add or update evidence renewal dates.

### Add a new miscellaneous evidence

1. Go to **Controls**.
2. Select a control to open its details page.
3. Open the **Evidence** tab.
4. Under **Miscellaneous evidence**, select **Add**.
5. Upload a file or add a URL.
6. Set the **Creation date** and **Renewal date**.
7. Select **Save**.

### Update the renewal date for existing evidence

1. Go to **Controls**.
2. Select a control.
3. Open the **Evidence** tab.
4. Select an existing evidence item.
5. Scroll to and expand the **Artifact** section.
6. Update the **Renewal date**.
7. Select **Save**.

The updated renewal date is reflected immediately on the control and affects readiness.

## Best Practices

- Review renewal dates regularly, especially before audits.
- Use renewal dates to reflect how often evidence should realistically be refreshed.
- Replace outdated artifacts instead of extending renewal dates when the content has changed.
- Use Evidence filters to proactively manage expiring evidence.

## Related articles

- [Are Your Controls Ready? Understanding the Relationship Between Policies, Evidence, and Controls](are-your-controls-ready-understanding-the-relationship-between-policies-evidence-and-controls.md)
- [Evidence Overview](evidence-overview.md)
- [Create Evidence](create-evidence.md)
- [Add Jira Tickets as Evidence](add-jira-tickets-as-evidence.md)
- [Managing Evidence in Drata Training Video (New Experience)](managing-evidence-in-drata-training-video-new-experience.md)
