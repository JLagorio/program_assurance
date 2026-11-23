# Hosted Technology Vendors: What to Collect and How Drata Can Help

Source: https://help.drata.com/en/articles/17317072-hosted-technology-vendors-what-to-collect-and-how-drata-can-help
Collection: Understand the Drata Platform › Vendors
Updated: 2026-10-02
Fetched: 2026-11-22
Description: What to collect from hosted technology vendors like Render, Supabase, Customer.io, and Vercel for your audit, and how to manage that evidence in Drata.

## Article text

## Overview

Hosted platforms such as Render, Supabase, Customer.io, Vercel, and similar providers are typically treated as key vendors because they host, process, store, or transmit information used by your organization. You rely on their security, availability, and operational controls, even though the underlying infrastructure is operated by the provider.

This creates a **shared-responsibility model**:

- The vendor is responsible for controls within its service environment.
- Your organization remains responsible for how the service is configured and used, including access, environment separation, backups, logging, and vendor oversight.
- Your auditor determines which vendor controls and customer-side controls are relevant to your audit scope.

SOC 2 Type II is commonly requested for critical vendors because it provides independent assurance that security controls operated effectively over a defined period. If a vendor does not provide a SOC 2 report, alternatives may include a completed security questionnaire, ISO 27001 certification, or another independent security attestation.

See the [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md).

## Information to collect from each hosted vendor

### Vendor and service profile

- Vendor name, service description, and primary relationship owner
- Systems, data types, and business processes supported
- Whether the vendor accesses, processes, stores, or transmits sensitive or customer information
- Risk or criticality rating
- Services, regions, and environments used by your organization

### Assurance and due diligence

- Current SOC 2 Type II report, where available
- Report scope, covered services, audit period, and the auditor's opinion
- Exceptions or deficiencies that may affect your use of the service
- Complementary user-entity controls your organization is expected to perform
- Subservice organizations relied upon by the vendor
- Security questionnaire or alternative certification if a SOC 2 report is unavailable
- Documented review decision and any follow-up actions

For critical vendors, Drata recommends attaching supporting assurance documentation and documenting the security review and decision. Review vendor compliance documentation at least annually.

See [Reviewing Your Vendors' SOC 2 Reports Using Drata](reviewing-your-vendors-soc-2-reports-using-drata.md).

### Contract and service documentation

- Executed agreement or order form
- Security, confidentiality, and data-processing terms, where applicable
- Breach-notification obligations
- Relevant service-level, availability, backup, or data-retention commitments

## Typical evidence by audit period

Manual evidence is generally needed only for controls that are not automatically monitored or covered by a native integration. For many configuration controls, one current screenshot or export per audit period may be sufficient. Controls that evaluate recurring operations, such as access reviews, backup monitoring, or change management, may require evidence at the frequency defined by the control and your auditor.

| **Control area** | **Typical evidence** | **Common cadence or trigger** |
|---|---|---|
| Unique accounts and access | User list, roles, permissions, and evidence of access review | At least once per audit period; refresh after material access changes |
| Testing and production separation | Screenshots or URLs showing separate staging/testing and production environments | Once per audit period or after architecture changes |
| Database backups | Backup configuration, backup status, logs, or restoration evidence | Once per audit period for configuration; recurring records if backup operation is tested |
| Centralized logging | Screenshot or export showing log destination, retention, and access restrictions | Once per audit period or after logging configuration changes |
| Auto-scaling and capacity | Auto-scaling configuration, capacity settings, or vendor documentation plus configuration evidence | Once per audit period or after configuration changes |
| Change management | Sample deployment or configuration-change record showing review, testing, and approval | Based on auditor sampling during the audit period |
| Vendor oversight | Vendor register entry, assurance report review, documented decision, and follow-up actions | Vendor review at least annually; update when reports or risk change |

For examples of acceptable evidence formats, such as screenshots for separate testing and production environments, vendor report reviews, centralized logs, auto-scaling configuration, and backup monitoring, see [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md).

## Ways to manage hosted vendor evidence in Drata

### Centralize vendor oversight

Use Drata's [Vendor Directory](vendors-overview-in-drata.md) and [security review workflow](start-and-manage-security-reviews-for-your-vendors.md) to maintain the vendor profile, risk classification, assurance report, questionnaire, review notes, decision, and renewal dates in one place.

### Use a native connection when coverage is available

If Drata has a connection for a specific vendor and the connection supports the required control, Drata can monitor the relevant configuration or status automatically. For example, Drata offers a [Render Integration Guide](render-integration-guide.md) and a [Vercel Integration Guide](vercel-integration-guide.md). Native coverage should be validated against the exact control you need; a connection may automate some evidence while other controls still require manual artifacts.

### Use the Drata API for unsupported or custom evidence

For evidence that is not covered by a native connection, your team can use [Drata's API](drata-public-api.md) to:

- Pull data from the vendor's API or an internal service
- Send structured JSON evidence into Drata
- Define validation logic or custom tests against the incoming data
- Map the result to the applicable controls
- Schedule the process to run automatically
- Maintain a timestamped evidence trail and surface failures for remediation

This approach is useful when the vendor exposes APIs for user lists, backup status, environment configuration, logs, deployments, or scaling settings. Your engineering team or an automation platform can build the integration that calls the vendor API and submits the result to Drata.

### Combine methods with a hybrid approach

A practical implementation is often hybrid:

- Upload or link the vendor's SOC 2 report, questionnaire, contract, and review decision manually, and renew them periodically
- Pull repetitive configuration data through a native connection or Drata API workflow
- Continue using a screenshot, export, ticket, or other manual artifact for controls without reliable API data

## Recommended steps for managing hosted vendor evidence

1. Identify which hosted vendors are critical or high risk
2. Confirm the services and data used by your organization
3. Obtain the vendor's SOC 2 report or equivalent assurance
4. Review scope, exceptions, subservice organizations, and customer responsibilities
5. Map your own configuration controls to the evidence they require
6. Upload one-time or periodic artifacts to Drata, or automate recurring data through a native connection or Drata API
7. Refresh evidence when it reaches its renewal date, when the configuration changes, or when your auditor requests updated samples

Confirm your final evidence set with your auditor, since requirements vary by framework, scope, control design, and audit period.

## Related articles

- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)
- [Reviewing Your Vendors' SOC 2 Reports Using Drata](reviewing-your-vendors-soc-2-reports-using-drata.md)
- [Drata Public API](drata-public-api.md)

## Related articles

- [How to Determine Key Vendors to include in Drata?](how-to-determine-key-vendors-to-include-in-drata.md)
- [SOC 2 Checklist](soc-2-checklist.md)
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [Audits page overview (New Experience)](audits-page-overview-new-experience.md)
- [Creating and Navigating an Audit in Drata Training Video](creating-and-navigating-an-audit-in-drata-training-video.md)
