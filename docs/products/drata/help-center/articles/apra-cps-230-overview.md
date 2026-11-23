# APRA CPS 230 Overview

Source: https://help.drata.com/en/articles/15863357-apra-cps-230-overview
Collection: Framework Information › APRA CPS 230
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Overview of APRA’s (Australian Prudential Regulation Authority) Prudential Standard CPS 230 Operational Risk Management.

## Article text

**Prudential Standard CPS 230 Operational Risk Management (CPS 230)** is a cross-industry prudential standard issued by the Australian Prudential Regulation Authority (APRA). In force since 1 July 2025, CPS 230 sets out minimum requirements for how APRA-regulated entities manage operational risk, maintain critical operations through severe disruptions, and manage the risks arising from service providers.

This article explains the three core requirement areas of CPS 230, the key concepts and definitions used throughout the standard, who must comply (and how obligations flow downstream to service providers), how CPS 230 maps to global frameworks such as ISO 27001, SOC 2, and NIST CSF, and practical considerations for implementation.

## What is CPS 230?

CPS 230 is an outcome-focused operational resilience standard. Rather than prescribing specific technical controls, it requires regulated entities to demonstrate that they can withstand and recover from operational disruptions, such as cyberattacks, system outages, process failures, and breakdowns at key service providers, without causing material harm to depositors, policyholders, superannuation beneficiaries, or the broader financial system.

The standard is built around three key requirements. An APRA-regulated entity must:

1. **Identify, assess, and manage its operational risks**, with effective internal controls, monitoring, and remediation;
2. **Be able to continue to deliver its critical operations within tolerance levels** through severe disruptions, with a credible and regularly tested business continuity plan (BCP); and
3. **Effectively manage the risks associated with service providers**, with a comprehensive service provider management policy, formal agreements, and robust monitoring.

An entity’s approach to operational risk must be appropriate to its size, business mix, and complexity.

## Background and Purpose

CPS 230 consolidates and replaces five earlier APRA standards covering outsourcing and business continuity: CPS 231 Outsourcing, CPS 232 Business Continuity Management, SPS 231 Outsourcing, SPS 232 Business Continuity Management, and HPS 231 Outsourcing. Where those legacy standards were largely compliance-driven and siloed, CPS 230 introduces a single, integrated operational resilience framework that connects risk management, business continuity, and third-party risk into one end-to-end discipline.

APRA developed CPS 230 in response to the increasing complexity and interconnectedness of the Australian financial system, in particular the sector’s growing reliance on technology and third-party service providers. The standard is supported by Prudential Practice Guide CPG 230 Operational Risk Management, which provides practical guidance on implementation.

### The Three Core Requirement Areas

| **#** | **Requirement Area** | **What It Requires** |
|---|---|---|
| 01 | **Operational Risk Management** | Identify, assess, and manage the full range of operational risks (including legal, regulatory, compliance, conduct, technology, data, and change management risk). Maintain a comprehensive operational risk profile, design and embed effective internal controls, regularly test controls for design and operating effectiveness, remediate material weaknesses, and identify, escalate, and record operational risk incidents and near misses. Material incidents must be notified to APRA within 72 hours. |
| 02 | **Business Continuity** | Define and maintain a register of critical operations, set Board-approved tolerance levels for disruption (maximum outage period, maximum data loss, and minimum service levels), and maintain a credible BCP that is tested annually against severe but plausible scenarios. Disruptions to critical operations outside tolerance must be notified to APRA within 24 hours. |
| 03 | **Management of Service Provider Arrangements** | Maintain a comprehensive service provider management policy, identify and maintain a register of material service providers (submitted to APRA annually), conduct due diligence before entering material arrangements, maintain formal legally binding agreements with required minimum provisions (including APRA access rights), and monitor performance, controls, and compliance on an ongoing basis. |

### Who Must Comply?

CPS 230 applies directly to all APRA-regulated entities:

- Authorised deposit-taking institutions (ADIs), including foreign ADIs and authorised banking non-operating holding companies (NOHCs);
- General insurers, including Category C insurers, authorised insurance NOHCs, and parent entities of Level 2 insurance groups;
- Life companies, including friendly societies and eligible foreign life insurance companies;
- Private health insurers; and
- Registrable superannuation entity (RSE) licensees, in respect of their business operations.

**Material Service Providers (MSPs) are also affected. **Although CPS 230 does not regulate service providers directly, its obligations flow downstream through contracts. APRA-regulated entities must ensure agreements with material service providers reflect CPS 230 requirements, which means MSPs are expected to provide assurance over their operational risk management, business continuity capabilities, and subcontractor (fourth party) arrangements. Importantly, it is the APRA-regulated customer, not the provider, that determines whether a provider is material.

## Key Concepts and Definitions

| **Concept** | **Definition** |
|---|---|
| **Critical operations** | Processes undertaken by an entity or its service provider which, if disrupted beyond tolerance levels, would have a material adverse impact on depositors, policyholders, beneficiaries, other customers, or the entity’s role in the financial system. At a minimum (unless justified otherwise): payments, deposit-taking and management, custody, settlements and clearing (ADIs); claims processing (insurers); investment management and fund administration (RSE licensees); and customer enquiries and supporting systems (all entities). |
| **Tolerance levels** | Board-approved thresholds set for each critical operation, covering: (1) the maximum period of time the entity would tolerate a disruption; (2) the maximum extent of data loss the entity would accept; and (3) the minimum service levels the entity would maintain while operating under alternative arrangements. |
| **Material service provider (MSP)** | A provider the entity relies on to undertake a critical operation, or one that exposes the entity to material operational risk. At a minimum (unless justified otherwise): credit assessment, funding and liquidity management, and mortgage brokerage (ADIs); underwriting, claims management, insurance brokerage, and reinsurance (insurers); fund administration, custodial services, investment management, and arrangements with promoters and financial planners (RSE licensees); and risk management, core technology services, and internal audit (all entities). |
| **Fourth party** | A party that a service provider relies on in delivering services to an APRA-regulated entity (for example, a subcontractor of an MSP). Entities must address fourth-party risk in their service provider management policy where fourth parties are relied upon to deliver a critical operation. |
| **Severe but plausible scenarios** | The disruption scenarios against which the BCP must be tested, including disruptions to services provided by material service providers and scenarios where contingency arrangements are required. |

## Mapping CPS 230 to Common Frameworks

Although CPS 230 is an Australian prudential standard, its requirements align conceptually with internationally recognized frameworks. This mapping is provided for illustrative purposes to show how implementing CPS 230 can support, and be supported by, broader security and governance efforts.

| **CPS 230 Requirement Area** | **ISO 27001:2022** | **NIST CSF 2.0** | **SOC 2 Trust Services Criteria** |
|---|---|---|---|
| Operational risk management and internal controls | Clause 6 (Planning), Clause 8 (Operation), A.5.1 (Policies) | GV.RM (Risk Management Strategy), ID.RA (Risk Assessment) | CC3.1–CC3.4 (Risk Assessment), CC5.1–CC5.3 (Control Activities) |
| Incident identification, escalation, and notification | A.5.24–A.5.27 (Incident management), A.6.8 (Event reporting) | DE.AE (Adverse Event Analysis), RS.MA (Incident Management) | CC7.3–CC7.5 (System Operations) |
| Business continuity and tolerance levels | A.5.29 (ICT continuity), A.5.30 (ICT readiness for business continuity), A.8.13 / A.8.14 (Backup and redundancy) | RC.RP (Incident Recovery Plan Execution), PR.IR (Technology Infrastructure Resilience) | A1.2, A1.3 (Availability), CC7.5 (Recovery) |
| Service provider and third-party risk management | A.5.19–A.5.23 (Supplier relationships and cloud services) | GV.SC (Cybersecurity Supply Chain Risk Management) | CC9.2 (Vendor and Business Partner Risk) |
| Governance, roles, and Board oversight | Clause 5 (Leadership), A.5.2 (Roles and responsibilities) | GV.RR (Roles, Responsibilities, and Authorities), GV.OC (Organizational Context) | CC1.1–CC1.5 (Control Environment) |

**Note: **CPS 230 also intersects closely with Prudential Standard CPS 234 Information Security. CPS 230 explicitly requires entities to meet CPS 234’s requirements when managing technology risks, and an information security incident reported under CPS 234 does not need to be separately reported under CPS 230.

## Key Dates and Transitional Arrangements

| **Date** | **Milestone** |
|---|---|
| 1 July 2025 | CPS 230 commenced for all APRA-regulated entities. |
| 1 October 2025 | First material service provider registers due to APRA from ADIs, insurers, and RSE licensees. Registers must then be submitted annually. |
| 1 July 2026 | Pre-existing service provider contracts must comply by the earlier of the next contract renewal date or 1 July 2026. Deferred business continuity requirements (relating to BCP content, capability maintenance, and testing) also commence for non-significant financial institutions (non-SFIs) on this date. |

## Why CPS 230 Matters

CPS 230 represents a fundamental shift from compliance-driven controls to outcome-focused resilience. Implementing the standard well helps organizations:

- Maintain critical services for customers through severe disruptions, including cyberattacks, technology outages, and third-party failures;
- Establish clear Board and senior management accountability for operational risk;
- Build end-to-end visibility of the people, technology, information, facilities, and service providers that critical operations depend on;
- Strengthen contractual protections, oversight, and exit planning for material service providers; and
- Reuse work already done for frameworks such as ISO 27001, SOC 2, and CPS 234, since many controls satisfy multiple frameworks simultaneously.

For service providers, alignment with CPS 230 is increasingly a commercial differentiator. Providers that can demonstrate operational resilience and provide ready assurance to APRA-regulated customers position themselves as preferred partners in the Australian financial services market.

## Common Implementation Challenges

Organizations often run into the following pitfalls when implementing CPS 230:

- Incomplete identification of critical operations, or failure to map the end-to-end processes and resources (people, technology, information, facilities, and service providers) that support them;
- Tolerance levels that are aspirational rather than evidence-based, or that are not approved by the Board;
- Business continuity plans that exist on paper but are not tested against severe but plausible scenarios, including scenarios involving material service provider disruption;
- Material service provider registers that are incomplete, out of date, or missing fourth-party (subcontractor) visibility;
- Legacy contracts that have not been uplifted to include CPS 230-required provisions such as APRA access rights, subcontractor notification, and termination rights;
- Treating operational risk, business continuity, and vendor management as separate programs rather than one integrated framework; and
- Missing or untested notification processes for the 72-hour (incident), 24-hour (tolerance breach), and 20-business-day (material arrangement) APRA notification obligations.

## Implementation Guidance

To successfully implement CPS 230:

- **Start** by identifying your critical operations and mapping the processes, resources, and providers that support them end-to-end.
- **Define** Board-approved tolerance levels for each critical operation, grounded in business impact analysis and scenario testing.
- **Uplift** your BCP so that it reflects the critical operations register and tolerance levels, and establish a systematic annual testing program.
- **Identify** your material service providers, build your MSP register, and prioritize contract uplift and ongoing monitoring for those providers first.
- **Integrate** operational risk management into your broader risk management framework under CPS 220, rather than running it as a standalone compliance exercise.
- **Use** CPG 230 Operational Risk Management as APRA’s definitive guidance on better practice for each requirement.

## Additional Resources

- APRA Prudential Standard CPS 230 Operational Risk Management: [https://handbook.apra.gov.au/standard/cps-230](https://handbook.apra.gov.au/standard/cps-230)
- APRA Prudential Practice Guide CPG 230 Operational Risk Management: [https://handbook.apra.gov.au/ppg/cpg-230](https://handbook.apra.gov.au/ppg/cpg-230)
- APRA Operational Risk Management hub: [https://www.apra.gov.au/operational-risk-management](https://www.apra.gov.au/operational-risk-management)

**Note: **For additional support on CPS 230, your request will be forwarded to the Drata Team based in APAC for further assistance.

## Related articles

- [EU DORA Framework Overview](eu-dora-framework-overview.md)
- [DORA's Five Pillars of Compliance](dora-s-five-pillars-of-compliance.md)
- [APRA CPS 230: Set Up Guidance (APRA-Regulated Entity vs. Material Service Provider)](apra-cps-230-set-up-guidance-apra-regulated-entity-vs-material-service-provider.md)
- [APRA CPS 230: A Requirement-Level Guide](apra-cps-230-a-requirement-level-guide.md)
- [Example Evidence for Not Monitored Controls (CPS 230)](example-evidence-for-not-monitored-controls-cps-230.md)
