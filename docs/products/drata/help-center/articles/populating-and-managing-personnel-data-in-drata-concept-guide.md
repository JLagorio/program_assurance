# Populating and Managing Personnel Data in Drata (Concept Guide)

Source: https://help.drata.com/en/articles/5308992-populating-and-managing-personnel-data-in-drata-concept-guide
Collection: Understand the Drata Platform › Personnel
Updated: 2026-08-05
Fetched: 2026-11-22
Description: How Drata uses data from your HRIS to supplement personnel information

## Article text

Accurate personnel data is critical for access control, compliance monitoring, and audit readiness. Drata uses data from your Identity Provider (IdP) and Human Resource Information System (HRIS) to create and maintain personnel records used across compliance workflows.

This article explains how personnel data is populated, how different systems contribute to personnel records, and how employment status is determined in Drata.

## How personnel data is populated

Drata populates personnel data using information from your Identity Provider (IdP) and, if connected, your Human Resource Information System (HRIS).

Drata supports multiple IdP and HRIS connections. Learn more at [Multi IDP and HRIS](https://help.drata.com/en/articles/12194071-integrate-multiple-identity-and-hris-connections).

### Identity Provider (IdP)

Connecting an Identity Provider (IdP) is required to populate active personnel and allow users to authenticate into Drata. When connected, Drata imports identity information such as name, email address, avatar, and account metadata to create personnel records.

**Why this matters**

- Establishes personnel records in Drata
- Ensures personnel can sign in to Drata
- Provides the foundation for access control monitoring

When only an IdP is connected, Drata imports personnel as **Current employee** by default, unless the email address appears to be an obvious alias (for example, `admin@`, `marketing@`, or `info@`).

### Human Resource Information System (HRIS)

Drata matches HRIS records to existing IdP personnel records using email identifiers. HRIS is considered the **auditor’s source of truth** for names, start/separation dates, and employment status. HRIS data enriches personnel records beyond what IdP provides.

**Why this matters**

- Provides accurate employment lifecycle data for audits
- Ensures terminated employees remain visible in Drata for audit trail purposes, even if removed from the IdP
- Reduces manual updates and potential data gaps

## Employment status in Drata

Each person in Drata is assigned an employment status that determines whether they are considered in scope for compliance.

**Available employment statuses**

Drata assigns one of the following statuses:

- Current employee
- Former employee
- Current contractor
- Former contractor
- Out of scope (ignore)
- Out of scope (service account)
- Unknown

### How employment status is determined

Employment status is determined based on the data sources connected to Drata.

- **IdP only:** Personnel are imported as *Current employee* unless the account appears to be non-human (for example, aliases such as admin@ or info@).
- **With HRIS connected:** Drata uses hire and separation dates from HRIS to determine whether personnel are current or former.
- **Manual updates:** Certain statuses may be set intentionally to document audit-relevant exceptions or edge cases.

### Out-of-scope personnel and exclusions

Personnel who should not be evaluated for compliance can be marked as **Out of scope**, such as users who do not have access to regulated systems.

- Out-of-scope status should be applied carefully. Accounts with access to production systems, sensitive data, or customer information must remain in scope for frameworks such as SOC 2.

When specific compliance checks do not apply to certain personnel, exclusions can be created. Exclusions require a business justification, which appears in audit download packages.

## Summary

- **IdP connection:** Required. Creates active personnel records and enables authentication.
- **HRIS connection:** Optional but recommended. Provides audit-ready employment data and preserves historical records.
- **Together:** These systems allow Drata to demonstrate proper access control and strengthen compliance posture.

## Related articles

- [Confirm your personnel](confirm-your-personnel.md)
- [Connect your HRIS to Drata](connect-your-hris-to-drata.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)
- [Personnel Overview](personnel-overview.md)
- [UKG Ready Integration Guide](ukg-ready-integration-guide.md)
