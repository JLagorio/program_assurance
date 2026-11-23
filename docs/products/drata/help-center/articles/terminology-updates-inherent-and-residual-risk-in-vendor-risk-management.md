# Terminology Updates: Inherent and Residual Risk in Vendor Risk Management

Source: https://help.drata.com/en/articles/14328058-terminology-updates-inherent-and-residual-risk-in-vendor-risk-management
Collection: Understand the Drata Platform › Risk
Updated: 2026-05-05
Fetched: 2026-11-22
Description: To better align with industry-standard Governance, Risk, and Compliance (GRC) frameworks, Drata has updated the terminology used within the Vendor Risk Management (VRM) experience.

## Article text

We have replaced legacy terms with standard risk methodology labels to help your security, compliance, and procurement teams maintain a consistent language.

**This is a terminology-only change;** your existing configurations, risk scores, and underlying data remain exactly as they were.

## At a Glance: What Changed?

The following table outlines the mapping from legacy Drata terms to the new industry-standard terms:

| **Legacy Term** | **Industry-Standard Term** | **Definition** |
|---|---|---|
| **Impact Level** | **Inherent Risk** | The raw level of risk associated with a vendor *before* considering any mitigating controls. |
| **Overall Risk** | **Residual Risk** | The risk that remains *after* your internal controls and mitigations have been applied. |

## Why We Made These Changes

Many organizations with mature Third-Party Risk Management (TPRM) programs already use "Inherent" and "Residual" risk in their internal policies. By standardizing these terms, Drata:

- **Aligns with Global Frameworks:** Matches established risk methodologies used by auditors and regulators.
- **Reduces Confusion:** Makes it easier to compare Drata data against your internal risk registers.
- **Improves Communication:** Ensures all stakeholders—from legal to IT—speak the same language regarding vendor exposure.

---

## What Stays the Same

These updates are **purely label changes** in the user interface.

For both inherent and residual risk:

- **Risk calculations are unchanged**
   - The underlying logic and scoring that drive these values remain the same.

- **Data model and APIs are unchanged**
   - Backend fields and storage continue to use the existing implementation; only the UI labels are updated.
   - No backend field renames are included in this work.

- **Your current configurations continue to work**
   - Any workflows, filters, or configurations that depend on these fields continue to function as before; they now simply present as Inherent risk and Residual risk in the UI.

For residual risk specifically, any **existing residual risk values** you use today (for example, levels such as None, Low, Moderate, High) remain as configured. Changes to how those values are mapped or interpreted will be addressed in a later iteration.

---

## Where You’ll See Inherent Risk

You’ll now see **Inherent risk** in places where **Impact level** or **Impact assessment** previously appeared:

- **Vendor profiles (current & prospective)**
   - Vendor header labels previously showing Impact level
   - The Impact assessment section, now labeled Inherent risk assessment
   - Field labels that previously referenced Modified Impact Level / Recommended impact level, now simplified to Inherent risk
- **Add Vendor flows**
   - For Current vendors and Prospective vendors, the Impact assessment sections are now Inherent risk assessment
   - Any “Impact level” field labels now read Inherent risk
- **Vendor criteria & configuration (TPRM Agent)**
   - Criteria page columns labeled Vendor impact level now display Vendor inherent risk
   - Add/Edit Criteria modals now use Vendor inherent risk as the field label
   - Criteria configuration filters previously labeled Impact level now use Inherent risk
- **Vendor tables & filters**
   - Filters on Current Vendors and Prospective Vendors tables now use Inherent risk instead of Impact level
- **Security reviews**
   - Security Review pages that referenced Impact level now reference Inherent risk
   - The “Change vendor impact level” modal is now “Change vendor inherent risk level,” and the modal body has been updated to reference inherent risk.

---

## Where You’ll See Residual Risk

You’ll now see **Residual risk** in places where **Overall risk** previously appeared:

- **Vendor profiles (current & prospective)**
   - Header labels that showed Overall risk are now labeled Residual risk

- **Vendor internal details**
   - In the Internal Details section on vendor profiles, Overall risk is now Residual risk
- **Add Vendor (Current vendors)**
   - Any field label that previously referenced Overall risk now appears as Residual risk
- **Vendor tables & filters**
   - Filters on Current Vendors and Prospective Vendors tables now use Residual risk in place of Overall risk

These changes are consistent across both current and prospective vendors to maintain a unified view of residual risk.

---

## Do I Need to Take Any Action?

In most cases, **no action is required**:

- You do **not** need to re-onboard vendors or re-run assessments solely because of these label changes.
- Existing workflows, automations, that depend on these risk fields will continue to run as before.

You may optionally:

- Update internal documentation, screenshots, or training materials that reference **Impact level** or **Overall risk** so that they instead reference **Inherent risk** and **Residual risk**.
- Communicate the terminology update to internal stakeholders who regularly review vendor risk in Drata, so they understand the conceptual mapping.

---

## FAQ

**Does this change any vendor’s risk score?**

No. These are terminology-only updates. The underlying calculations and stored values for both inherent and residual risk remain the same.

**What is the difference between inherent risk and residual risk?**

- **Inherent risk** is the risk associated with a vendor **before** you consider mitigating controls.
- **Residual risk** is the risk that remains **after** you apply your controls and mitigations.

**Do I need to reconfigure my criteria or vendor settings?**

No. Your existing criteria, filters, and configurations continue to work. Only the labels you see in the UI have changed.

**Will my reports or exports break?**

No. Reports and exports that rely on these fields will continue to function. You’ll now see **Inherent risk** and **Residual risk** labels where you previously saw **Impact level** and **Overall risk**, but the underlying data is unchanged.

**Are you changing how residual risk values (e.g., None/Low/Moderate/High) are mapped?**

Not at this time. Remapping or changing legacy residual risk values will be handled in a separate, future update.

## Related articles

- [Risk management in Drata: An overview](risk-management-in-drata-an-overview.md)
- [Residual Risk in Security Reviews](residual-risk-in-security-reviews.md)
- [Add a vendor or prospective vendor](add-a-vendor-or-prospective-vendor.md)
- [Customize vendor risk levels](customize-vendor-risk-levels.md)
