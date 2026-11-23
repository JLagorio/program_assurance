# Scope Determination Checklist for Compliance Audits

Source: https://help.drata.com/en/articles/11759499-scope-determination-checklist-for-compliance-audits
Collection: Assessing Your Readiness
Updated: 2025-07-11
Fetched: 2026-11-22
Description: A practical guide to scoping the right systems, people, data, and processes for compliance frameworks

## Article text

### Purpose

Use this checklist to determine which people, systems, processes, and data should be included (in scope) or excluded (out of scope) from your compliance assessment.

### Step 1: Identify the Product or Service in Scope

- What product, platform, or service are you getting certified for?
- Is this a customer-facing SaaS product, internal tool, or service offering?

Start with the specific service offering. Only the systems, data, and teams that directly support this should be included in initial scope.

### Step 2: Determine What Should Be In Scope

When determining what’s in scope, consider not just direct involvement but also potential risk exposure.

| **Category** | **In Scope If…** | **Examples** |
|---|---|---|
| Systems / Infrastructure | It hosts, processes, or transmits customer or sensitive data | AWS, GCP, Azure, production databases, CI/CD pipelines |
| People | They develop, manage, or support the in-scope product or systems | Engineering, DevOps, Security, IT, support teams |
| Processes | They impact the security, availability, confidentiality, or privacy of the product or sensitive data | Change management, incident response, onboarding/offboarding |
| Vendors | They store/process data or are critical to service delivery | Cloud providers, email tools, audit firms, payment processors |
| Data | It includes PII, PHI, financial data, or CUI | User emails, billing records, healthcare data |
| Risk | It presents a significant security, privacy, or operational risk to the product or sensitive data. | A critical internal tool handling access credentials, an unencrypted data store. |

### Step 3: Ask These Key Questions

- Does this system/person/process handle customer data or directly support the product?
- Could a failure or breach here impact our customers or compliance obligations?
- Would an auditor reasonably expect this to be covered based on the product’s architecture?

***Always confirm scope with your auditor.***

**Common Scoping Pitfalls to Avoid**

- **Scope Creep vs. Underestimation:** Expanding your scope too much adds unnecessary cost and complexity. But underestimating it can lead to gaps and non-compliance.
- **Overlooking Shadow IT: **Tools used without approval can still handle sensitive data and may fall within your scope.
- **Missing Third-Party Touch points: **If sensitive data passes through a vendor’s system, they could be in scope, even if they don’t store it.
- **Skipping Stakeholder Input:** Without alignment from Security, IT, Legal, and others, you risk missing key areas or creating friction later.

### Step 4: Leverage Your Auditor Early

Auditors play a critical role in validating the scope of your compliance assessment. While this checklist can guide internal scoping decisions, auditors are responsible for reviewing, and in some cases formally approving, your defined scope.

| **Framework** | **Scoping Focus** | **Key Tip** |
|---|---|---|
| **SOC 2** | Systems & processes that support the Trust Services Categories (TSC) | Scope can include a single product; the system description must be auditor-approved. |
| **ISO 27001** | The Information Security Management System (ISMS) and its boundaries | You define the ISMS scope;auditors review its appropriateness but **do not set it. ** |
| **HIPAA** | Systems and processes handling Protected Health Information (PHI) | Only systems handling PHI must be included. |
| **PCI DSS** | Systems and processes handling Cardholder Data (CHD) | Use network segmentation to isolate and reduce scope. |
| **GDPR/CCPA** | Systems and processes handling personal data of EU/California residents. | Include systems processing any identifiable user data. Audit can be conducted internally or by appointing a data protection solicitor to undertake the review on the organizations' behalf. |
| **FedRAMP** | Cloud service offerings for U.S. Government agencies | Scope must align with FIPS-199 categorization and include the full system stack. |
| **CMMC / NIST 800-171** | Systems and processes handling Controlled Unclassified Information (CUI). | Demonstrate boundary protection and isolation of CUI. |

### Final Step: Confirm & Document

- Create system boundary documentation clearly outlining what’s in and out of scope.
- Use tools or diagrams that visually map out:
   - **Data Flow Diagrams:** Illustrate how sensitive data moves through your systems, identifying entry points, processing locations, and exit points.
      - Example associated Drata Control Framework (DCF): **DCF-204 (Dataflow Diagram)**
   - **Network Architecture Diagrams:** Visually represent your network segments, identifying where in-scope systems reside and how they communicate.
      - Example associated Drata Control Framework (DCF): **DCF-22 (Network Diagram)**
   - **System Inventories:** A comprehensive list of all IT assets, with clear flags for which are in-scope.
      - Example associated Drata Control Framework (DCF): **DCF-20 (Asset Inventory)**
- Align with Internal Stakeholders: Ensure Security, IT, Compliance, Legal, and other key stakeholders agree on the defined scope.

### Ongoing Maintenance: Review Your Scope Regularly

Compliance scope isn't static. As your business processes change, new systems are adopted, and data flows evolve, your scope will too. It's crucial to **periodically review and re-validate your scope** (e.g., annually or whenever significant architectural changes occur) to ensure your compliance efforts remain relevant and effective.

### Related Help Articles & Resources

- [SOC 2 Trust Services Categories Overview](soc-2-trust-services-categories-overview.md)
- [Introduction to the Drata Control Framework (DCF)](introduction-to-the-drata-control-framework-dcf.md)
- [Frameworks Library](https://help.drata.com/en/collections/2997147-frameworks)
- [Drata’s Pre-Vetted Auditor Network](https://drata.com/auditor/directory)

## Related articles

- [Custom Framework](custom-framework.md)
- [Compliance Program Migration Best Practices](compliance-program-migration-best-practices.md)
- [Introduction to the Drata Control Framework (DCF)](introduction-to-the-drata-control-framework-dcf.md)
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [Marking Requirements In and Out of Scope](marking-requirements-in-and-out-of-scope.md)
