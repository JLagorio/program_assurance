# Microsoft Supplier Security & Privacy Assurance (SSPA) Program v11 Overview

Source: https://help.drata.com/en/articles/12480900-microsoft-supplier-security-privacy-assurance-sspa-program-v11-overview
Collection: Framework Information › Microsoft SSPA
Updated: 2025-10-01
Fetched: 2026-11-22

## Article text

### What is the SSPA Program?

The Microsoft Supplier Security & Privacy Assurance (SSPA) Program ensures that suppliers meet Microsoft’s high standards for privacy, security, and responsible AI. It’s a partnership between Procurement, Legal, Security, and the Office of Responsible AI.

**Key Goals**

The program has three primary goals that extend Microsoft’s commitment to privacy and security to its global supplier base.

- Extend Microsoft’s data protection standards to suppliers
- Provide a consistent baseline through the Supplier Data Protection Requirements (DPR)
- Prepare suppliers to address risks from emerging technologies like AI.

Microsoft considers privacy a fundamental human right, and the SSPA program ensures that suppliers handling Microsoft data operate in alignment with these values and applicable legal requirements.

### The Two Pillars of Compliance

The SSPA framework rests on two interconnected components. Together, they determine what suppliers must do to remain eligible for Microsoft work.

**1. Data Processing Profile (DPP)**

The DPP is your supplier-controlled profile where you declare how you process Microsoft data. These selections drive your compliance requirements.

- Supplier-controlled profile in the Microsoft Supplier Compliance Portal
- Suppliers declare:
   - Types of data they process
   - Where the data will be processed
   - Technologies used for processing
- DPP selections determine the specific compliance requirements for each supplier

**2. Data Protection Requirements (DPR)**

The DPR defines Microsoft’s rules for safeguarding Personal Data and Confidential Data. All suppliers must attest to compliance annually.

- Detailed rules for handling Microsoft Personal Data and Confidential Data
- All suppliers must complete an annual self-attestation
- DPP selections determine whether the full DPR applies or only a subset
- Shared responsibility:
   - Microsoft sets the standard via the DPR
   - Suppliers must accurately declare their activities in the DPP

**Important:** Incorrect selections may prevent eligibility for engagements or trigger non-compliance.

### SSPA Compliance Lifecycle

Compliance follows a structured lifecycle. Each step builds on the previous one to confirm suppliers meet Microsoft’s requirements.

**Step 1: Start (Enroll / Renew) & Set DPP**

Begin by enrolling or renewing your participation and configuring your DPP. This step defines the scope of your compliance obligations.

- Configure or update your DPP in the Supplier Compliance Portal
- Select approvals that match your scope of work, such as Scope, Location, Role, AI Systems

**Step 2: Complete Assigned Tasks**

Once your DPP is set, the portal generates compliance tasks tailored to your selections.

- Portal issues compliance tasks based on DPP selections
- Tasks range from DPR self-attestation to providing evidence like PCI certification, ISO 27001, or an Independent Assessment
- Standard tasks must be completed within 90 days, Independent Assessments may also allow a 90-day extension

**Step 3: Review Submissions**

After you submit evidence and attestations, Microsoft’s SSPA team validates your submissions to confirm accuracy and completeness.

- SSPA team validates all submissions within approximately 10 business days

**Step 4: Achieve SSPA Status**

Once approved, your compliance status is set, which determines your eligibility for Microsoft work.

- Green (Compliant): Eligible for new engagements, mandatory for in-scope work
- Red (Non-Compliant): Hard block on new orders, account may be deactivated if unresolved
- Compliance is continuous; maintain evidence and processes year-round, not just at renewal time

### Configuring Your Data Processing Profile (DPP)

Your DPP drives your compliance obligations. Configuring it accurately is essential for meeting Microsoft’s requirements.

**Step 1: Define Scope**

Identify the type of Microsoft data you will handle. This sets the baseline requirements for your organization.

- Confidential Data: Only Microsoft Confidential Data such as internal technical docs or pre-release marketing
- Personal & Confidential Data: Includes Personal Data such as sensitive health info, identifiers, customer content, and Confidential Data

**Step 2: Specify Location & Role**

Declare where processing occurs and what role your organization plays in handling Microsoft data.

- Processing Location: At Microsoft or Customer, At Supplier (higher risk, requires more controls)
- Processing Role: Controller, Processor, or Subprocessor (designated by Microsoft for high-risk scenarios)

**Step 3: High-Risk Approvals**

Certain activities involve higher risk and require explicit approval before you can proceed.

- Payment Card Processing (PCI)
- Software as a Service (SaaS) certifications (ISO 27001)
- Use of subcontractors
- Website hosting
- Healthcare (PHI / HIPAA)
- AI Systems (Responsible AI, Section K)

**Demonstrating Compliance**

Suppliers must prove they meet Microsoft’s standards. This can be done through attestations, independent assessments, or recognized certifications.

**1. Self-Attestation**

Every supplier must complete an annual attestation confirming compliance with DPR requirements.

- Annual attestation via the Supplier Compliance Portal
- Authorized representative confirms compliance with all applicable DPR requirements

**2. Independent Assessment**

High-risk suppliers must undergo a third-party review to validate compliance.

- Required for high-risk DPP selections such as handling Highly Confidential Data, acting as a Subprocessor, providing AI systems
- Conducted by a qualified third-party assessor

**3. Certification Alternatives**

Certain globally recognized certifications can substitute for an independent assessment.

- ISO 27701 + ISO 27001 (privacy & security)
- SOC 2 Type 2 (security-focused)
- HITRUST (healthcare)
- ISO 42001 (Responsible AI for Sensitive Use)

**Quick-Reference Table: DPP → Assurance → Certification**

This table links DPP selections with the required assurance method and any accepted certifications that can be used as alternatives.

- **DPP Selection / Scenario:** What the supplier declares in their Data Processing Profile
- **Required Assurance:** Compliance tasks the supplier must complete, including self-attestation or independent assessment
- **Accepted Certification Alternatives:** Globally recognized certifications that can satisfy the requirement

| DPP Selection / Scenario | Required Assurance | Accepted Certification Alternatives |
|---|---|---|
| Processing only Microsoft Confidential Data on Microsoft’s network | Self-Attestation to the DPR | N/A |
| Processing Highly Confidential Data at supplier’s own facilities | Self-Attestation + Independent Assessment | ISO 27001 |
| Processing Personal Data as a Processor at supplier’s own facilities | Self-Attestation + Independent Assessment | ISO 27001 + ISO 27701, or SOC 2 (Security) |
| Providing a Software as a Service (SaaS) solution | Self-Attestation + ISO 27001 | ISO 27001 (specific to functional service) |
| Using Subcontractors to process Personal or Confidential Data | Self-Attestation + Independent Assessment | ISO 27001 + ISO 27701 |
| Providing AI Systems (non-sensitive use) | Self-Attestation + Independent Assessment (incl. Section K) | ISO 27001 + ISO 27701 + Independent Assessment on Section K, or ISO 42001 |
| Providing AI Systems for “Sensitive Use” cases | Self-Attestation + Independent Assessment + ISO 42001 | ISO 42001 mandatory |

### Key Terms (Glossary)

- AI Systems: Systems that make predictions or decisions using optimized models
- Controller / Processor / Subprocessor: Roles defining responsibility for personal data processing
- Data Incident: Any unauthorized disclosure, loss, or access to Microsoft data
- Microsoft Personal Data: Any data relating to an identifiable individual
- Microsoft Confidential Data: Non-public Microsoft information that could cause harm if disclosed

### Reporting a Data Incident

- Notify Microsoft immediately via SupplierWeb portal or [SuppIR@microsoft.com](mailto:SuppIR@microsoft.com)
- Include incident date, supplier name/ID, Microsoft contacts, PO number, and a summary of the incident

### Summary

The SSPA program ensures suppliers:

- Understand and adhere to Microsoft’s security and privacy standards
- Complete annual self-attestations and high-risk assessments
- Maintain a Green SSPA status to remain eligible for Microsoft engagements
- Use the Microsoft Supplier Compliance Portal to manage DPP selections, complete tasks, and maintain evidence
- Treat compliance as an ongoing process, not a once-a-year activity

## Related articles

- [Frameworks](frameworks.md)
- [ISO 27001 Certification Review Template](iso-27001-certification-review-template.md)
- [Vendor Management Policy Guidance](vendor-management-policy-guidance.md)
- [ISO 42001 Framework Overview](iso-42001-framework-overview.md)
- [HITRUST e1/i1 Overview](hitrust-e1-i1-overview.md)
