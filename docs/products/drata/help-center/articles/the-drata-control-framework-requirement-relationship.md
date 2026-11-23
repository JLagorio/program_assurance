# The Drata Control Framework & Requirement Relationship

Source: https://help.drata.com/en/articles/11095971-the-drata-control-framework-requirement-relationship
Collection: Understand the Drata Platform › Controls › The Drata Control Framework
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Explain what the Drata Control Framework is, how it relates to requirements, and why multiple controls may map to a single requirement.

## Article text

## Overview

Compliance requirements—especially in frameworks such as ISO 27001, SOC 2, HIPAA, and GDPR—are often lengthy and complex. A single written requirement may contain multiple expectations, covering governance, processes, technical safeguards, and oversight.

This complexity can make it difficult to determine whether a requirement has been fully satisfied.

To make compliance more manageable and actionable, Drata breaks down complex requirements into smaller and more focused controls. These controls are organized within the **Drata Control Framework (DCF)** and serve as the foundation for how compliance is implemented, tracked, and automated in Drata. The Drata Control Framework helps:

- Add clarity around what's needed
- Make it easier to track completeness
- Support cross-mapping of controls across multiple frameworks
- Reuse the same controls modularly where they apply in different contexts

## Core Concepts: Requirements, Controls, and DCF

Understanding how requirements and controls relate to one another is key to understanding why the DCF is structured the way it is.

### What is a Requirement?

A requirement is a formal expectation set by a standard, regulation, or framework that an organization must meet to demonstrate compliance. It sets the objective or expectation, often around reducing risk, protecting data, or maintaining security.

Requirements define *what* must be achieved – but not necessarily how to achieve it. That’s where controls come into play. Think of requirements as the ***goals***, and controls as the ***actions *taken to meet those goals.

#### Requirement Examples

- Personal data shall be: (a) processed lawfully, fairly and in a transparent manner in relation to the data subject (‘lawfulness, fairness and transparency’)
   **(GDPR Article 5(1)(a))**

- Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities in the pursuit of objectives
   **(SOC 2, CC1.3)**

- Actions to address risks and opportunities - Information security risk assessment
   **(ISO 27001:2022, Clause 6.1.2)**

### What is a Control?

A control is a measure that is modifying risk. Controls include any process, policy, device, practice, or other actions which modify risk.

#### Control Examples

- A formal Access Control Policy
- Enabling MFA (Multi-Factor Authentication)
- Conducting annual security training
- Maintaining a vendor risk assessment process

### What is a DCF?

The **Drata Control Framework (DCF)** is Drata’s proprietary control catalog. It is a comprehensive set of security and compliance activities that help satisfy the requirements of numerous frameworks, standards, and regulations, while acting as the primary “nodes” for Drata’s compliance and automation elements to which they are connected: requirements, risks, policies, monitoring tests, and other features.

DCF controls are framework-agnostic and are developed in such a way that they would address similar requirements across the widest range of frameworks.

The DCF catalog helps accelerate and standardize your ongoing compliance efforts and reduce compliance fatigue. The DCF catalog is therefore neither prescriptive nor exhaustive in nature. Organizations are encouraged to evaluate their selection of controls through the context of their business and customize as needed.

**Why DCF Controls Change Over Time?**

Drata will periodically add new DCF controls to the catalog or revise or deprecate existing ones. Factors that drive these changes include:

- Addition of new frameworks to Drata
- New updates or versions of frameworks, standards, and regulations published by the authoritative sources
- Realignment of DCF Controls with other connected Drata features (e.g., monitoring tests, policies, etc.)
- Administrative maintenance and standardization
- Alignment with industry standards and definitions
- Industry developments and emerging technologies (e.g., AI)
- Scope calibration and removal of redundancies

**Please note that DCFs are still CONTROLS that meet the definition and fit into the categories described in the section above.**

## Why Multiple DCFs for One Requirement?

Certain requirements are made up of several components, so instead of trying to meet all of them with one control, we use multiple controls – each one targeting a specific part of the requirement to ensure complete coverage. In other words, the entirety of the requirement must be fully satisfied with either one or a combination of multiple DCFs.

**Is Mapping Multiple Controls to One Requirement a Best Practice?**

Mapping multiple controls to a single requirement is a **common and accepted practice in compliance**, especially when those controls address different aspects of that requirement.

### Example 1: SOC 2

**Requirement:**
“The entity demonstrates a commitment to integrity and ethical values.”
(SOC 2, CC1.1)

This requirement may map to multiple DCF controls, such as:

- **DCF-32 (Security Policies)**
- **DCF-38 (Performance Evaluations)**
- **DCF-39 (Background Checks)**
- **DCF-44 (Code of Conduct)**

### Example 2: ISO 27001:2022

**Requirement:**
“Actions to address risks and opportunities – Information security risk assessment.” (Clause 6.1.2)

This could map to several DCFs such as:

- **DCF-15 (Risk Assessment Policy)**
- **DCF-16 (Periodic Risk Assessment)**
- **DCF-17 (Risk Treatment Plan)**
- **DCF-143 (Board Oversight Briefings Conducted)**

## Related articles

- [Frameworks](frameworks.md)
- [Framework Requirements](framework-requirements.md)
- [Custom Framework](custom-framework.md)
- [NIST SP 800-53 (Rev. 5) Control & Policy Mapping Updates](nist-sp-800-53-rev-5-control-policy-mapping-updates.md)
- [Introduction to the Drata Control Framework (DCF)](introduction-to-the-drata-control-framework-dcf.md)
