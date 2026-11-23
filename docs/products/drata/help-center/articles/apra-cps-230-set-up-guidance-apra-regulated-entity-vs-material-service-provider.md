# APRA CPS 230: Set Up Guidance (APRA-Regulated Entity vs. Material Service Provider)

Source: https://help.drata.com/en/articles/15863587-apra-cps-230-set-up-guidance-apra-regulated-entity-vs-material-service-provider
Collection: Framework Information › APRA CPS 230
Updated: 2026-08-27
Fetched: 2026-11-22
Description: How to scope Drata’s CPS 230 framework to match your organization’s role.

## Article text

Drata’s APRA CPS 230 framework, co-developed with our audit alliance partner Sensiba, is designed to serve two distinct audiences within a single framework: **APRA-regulated entities** (banks, insurers, and superannuation trustees regulated directly by APRA) and **Material Service Providers (MSPs)** (vendors that support an APRA-regulated entity’s critical operations or expose it to material operational risk).

This article explains why the framework distinguishes between the two, how to determine which configuration applies to your organization, and how to scope the framework correctly in Drata by marking the requirements and controls that do not apply to you as Out of Scope.

## Why Two Configurations? Accountability Under CPS 230

CPS 230 essentially says: **you can outsource services, but you cannot outsource accountability for operational risk.** The standard applies directly to APRA-regulated entities, but its obligations flow downstream to service providers through updated contracts. By 1 July 2026, or the next contract renewal (whichever comes first), APRA-regulated entities must ensure all agreements with their MSPs reflect CPS 230 requirements.

This creates two related but distinct sets of questions:

- **For the APRA-regulated entity: **“What assurance should I expect from my MSPs to show they’re managing operational risk in line with CPS 230, so I can be confident in my own accountability for operational risk?”
- **For the MSP: **“Since I’m not regulated by APRA, what do I need to implement to align with CPS 230, and what assurance information should I provide to my APRA-regulated customers?”

To resolve this ambiguity, Drata developed the CPS 230 framework alongside local Australian auditors with complementary sets of controls that clearly define the requirements for both parties: controls for the **APRA-regulated entity** and controls specifically for **Material Service Providers**. This establishes clear ownership and accountability across both parties, improving transparency, reducing ambiguity, and building trust in how responsibilities are managed and executed.

**Note: **An organization’s MSP status is determined by its APRA-regulated customers, not by the provider itself. APRA defines MSPs as vendors that support a critical operation or introduce material operational risk; examples include core technology and IT infrastructure providers, mortgage brokers, credit assessors, and claims processors. If a customer has designated you as material, the MSP configuration of this framework applies to you.

## How the Framework Is Structured in Drata

When you enable the APRA CPS 230 framework in Drata, the **default configuration reflects an APRA-regulated entity**. All requirements and their mapped Drata Controls (DCFs) are in scope by default.

Within the framework, you will find DCF controls that include **“MSP” in the control title**. These controls apply specifically, and only, to Material Service Providers. They address the obligations that flow down to providers, such as supporting customer-defined tolerance levels, participating in customer-led business continuity testing, providing assurance reporting, and disclosing material subcontractors (fourth parties).

| **Your Organization Is...** | **How to Scope the Framework** |
|---|---|
| **An APRA-regulated entity** | Keep the default configuration. Mark the requirements mapped only to MSP-titled DCF controls as Out of Scope, since those obligations apply to your service providers rather than to you. (You will instead hold your MSPs to those expectations through your contracts and monitoring.) |
| **A Material Service Provider** | Keep all MSP-titled DCF controls in scope. Mark the requirements that apply only to APRA-regulated entities (for example, obligations to notify APRA directly, submit the MSP register to APRA, or obtain Board approval of tolerance levels as a regulated entity) as Out of Scope, with an appropriate business rationale. |
| **Both (a regulated entity that also provides material services to other regulated entities)** | Keep both sets in scope. CPS 230 requires an APRA-regulated entity to conduct a comprehensive risk assessment before providing a material service to another party, so both perspectives of the framework will be relevant to you. |

## Guidance for APRA-Regulated Entities

As the directly regulated party, your accountability for operational risk cannot be transferred to your providers. After scoping the framework:

- Use Drata’s integrated risk management to bring internal and vendor risk into one place, prioritized, monitored, and actionable;
- Leverage the pre-defined CPS 230 controls, which are cross-mapped to other frameworks (such as SOC 2) so you can “test once to satisfy many”;
- Maintain your Material Service Provider register in Drata as the single source of truth for vendors, supporting the annual register submission to APRA; and
- Use Vendor Risk Management to streamline vendor risk reviews and gather CPS 230-aligned assurance from your MSPs, including visibility of their material subcontractors.

## Guidance for Material Service Providers

If your organization has been designated an MSP by one or more APRA-regulated customers, the MSP-titled DCF controls define what you should implement and evidence. Key focus areas include:

- **Contracts: **Review agreements with APRA-regulated customers to ensure they reflect CPS 230 requirements, including audit and access rights for APRA, subcontractor transparency and accountability, and service levels aligned with customer-defined tolerance levels (such as uptime guarantees and recovery time objectives).
- **Business continuity: **Ensure your business continuity plan supports your customers’ ability to maintain critical operations within their tolerance levels. For example, if a customer tolerates a four-hour outage, your recovery time objective for the supporting service must be four hours or less. Expect to participate in customer-led BCP testing for severe but plausible scenarios.
- **Subcontractor (fourth party) management: **Identify and disclose material subcontractors to your customers, and accept accountability for subcontractor performance. This fourth-party visibility is a key element of operational risk mapping under CPS 230.
- **Assurance reporting: **Many MSPs streamline assurance by combining CPS 230-specific elements with an existing SOC 2 engagement (for example, a SOC 2+ report covering security, confidentiality, and availability plus key CPS 230 elements), allowing one report to address multiple customer assurance needs.

For MSPs, CPS 230 alignment isn’t just a compliance exercise; it’s an opportunity to improve operational maturity, strengthen customer trust, and become a preferred partner for APRA-regulated organizations.

### Related Articles

- [APRA CPS 230 Overview](apra-cps-230-overview.md)
- [APRA CPS 230: A Requirement-Level Guide](apra-cps-230-a-requirement-level-guide.md)
- [Example Evidence for Not Monitored Controls (CPS 230)](example-evidence-for-not-monitored-controls-cps-230.md)
- [Marking Requirements In and Out of Scope](marking-requirements-in-and-out-of-scope.md)
- [Navigating CPS 230 as a Service Provider (Sensiba)](https://sensiba.com/resources/insights/navigating-cps-230-as-a-service-provider/)

## Related articles

- [2023: CCPA Updates](2023-ccpa-updates.md)
- [The Drata Control Framework & Requirement Relationship](the-drata-control-framework-requirement-relationship.md)
- [APRA CPS 230 Overview](apra-cps-230-overview.md)
- [APRA CPS 230: A Requirement-Level Guide](apra-cps-230-a-requirement-level-guide.md)
- [Example Evidence for Not Monitored Controls (CPS 230)](example-evidence-for-not-monitored-controls-cps-230.md)
