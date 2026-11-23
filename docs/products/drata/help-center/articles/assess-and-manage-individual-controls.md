# Assess and Manage Individual Controls

Source: https://help.drata.com/en/articles/13372784-assess-and-manage-individual-controls
Collection: Understand the Drata Platform › Controls
Updated: 2026-11-09
Fetched: 2026-11-22

## Article text

The **Controls** page displays a table of all controls in your workspace and provides a centralized place to browse and manage them.

When you select a control, you can view and manage all information related to that control, including its evidence, monitoring tests, policies, framework mappings, and associated risks.

Each control includes the following tabs, which are covered in this guide: **Overview**, **Evidence**, **Monitoring**, **Policies**, **Frameworks**, and **Risks**.

## Prerequisites

- Appropriate permissions to view and manage controls

## Access Controls

From the main application, go to **Compliance > Controls** to view the list of all controls. Then, select a control to view its details.

## Overview Tab

The **Overview** tab provides a high-level summary of a control’s readiness and configuration.

From this tab, you can:

- View readiness indicators for Evidence, Monitoring, Policies, and Approvals
- Edit control information
- Assign control owners
- Manage required approvals

The top-level cards provide a snapshot of your control’s readiness. Selecting a card opens more detailed information.

These cards indicate whether evidence, monitoring tests, policies, or approvals are contributing to the control’s readiness. Items that are **not factored into readiness** do not positively or negatively affect the readiness score.

For **Monitoring**, the following test states are not factored into readiness:

- Inactive
- Not tested or disabled
- Non-production
- Erroring

Examples of issues that **do affect readiness** include:

- Missing evidence artifacts
- Policies that are not published
- Required approvals that are still pending

### Info

Use the **Info** section to:

- Update the control’s name and description
- View the control code

Clear and accurate descriptions help both internal teams and auditors understand what the control covers.

### Owners

Assign one or more **Control Owners** who are responsible for maintaining the control, collecting evidence, monitoring tests, and supporting audits.

### Required Approvals

Use **Required Approvals** to track reviews and approvals from key stakeholders. This demonstrates strong control governance and provides auditors with clear evidence of oversight.

---

## Evidence Tab

The **Evidence** tab provides an at-a-glance view of all evidence linked to the control. From this tab, you can:

- Link or unlink evidence
- Create new evidence or map existing evidence from the Evidence Library
- Create miscellaneous evidence that exists only on the control and is not added to the Evidence Library
- Download evidence for reference or record-keeping
- Select evidence to view additional details in the Evidence Library

---

## Monitoring Tab

The **Monitoring** tab displays all monitoring tests mapped to the control, along with their pass or fail history.

From this tab, you can:

- View test results
- Download test information
- Select tests to view more details
- Map additional monitoring tests to the control

---

## Policies Tab

The **Policies** tab displays all policies linked to the control.

From this tab, you can:

- Download policies
- Link additional policies
- Unlink policies
- Select a policy to view more details on the policy page

---

## Frameworks Tab

The **Frameworks** tab shows all framework requirements mapped to the control.

From this tab, you can:

- View mapped framework requirements
- Map additional requirements from supported frameworks

---

## Risks Tab

The **Risks** tab displays all risks associated with the control.

From this tab, you can:

- Map additional risks
- Update Impact and Likelihood values
- Unlink risks
- Select a risk to view more information

---

## Internal Notes, Tasks, and Tickets

From the control view, you can manage **internal notes**, **tasks**, and **tickets** related to the control. These tools help teams track work, document context, and coordinate remediation efforts.

## Related articles

- [Are Your Controls Ready? Understanding the Relationship Between Policies, Evidence, and Controls](are-your-controls-ready-understanding-the-relationship-between-policies-evidence-and-controls.md)
- [Dashboard overview](dashboard-overview.md)
- [Create, Edit, and Manage Controls](create-edit-and-manage-controls.md)
- [Drata Controls (DCFs) Training Video (New Experience)](drata-controls-dcfs-training-video-new-experience.md)
- [Section 5: Control Owners](section-5-control-owners.md)
