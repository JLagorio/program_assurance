# Getting started with a risk assessment (Concept Guide)

Source: https://help.drata.com/en/articles/9400813-getting-started-with-a-risk-assessment-concept-guide
Collection: Understand the Drata Platform › Risk
Updated: 2026-01-08
Fetched: 2026-11-22
Description: Understanding how to apply risk management principles to Drata’s Risk Management Standard offering

## Article text

> 💡 **About this article**
> This article explains the **core concepts and stages of a risk assessment**, based on industry-standard risk management practices.
>
> It is intended for educational purposes and does not provide step-by-step instructions for completing tasks in Drata.

## Overview

The process of risk management helps organizations identify, analyze, and respond to risks that could affect business objectives. In Drata, the Risk Management feature supports these practices by providing a structured way to document risks, assess their impact, apply treatment decisions, and track mitigation over time.

This article introduces the **core principles of risk management** and explains how those principles are supported within Drata.

## Step 1: Identify risks

The first step in risk management is identifying risks that may affect your organization.

Risks are typically documented as **risk scenarios**, which describe a potential event or situation that could negatively impact the business. A risk scenario generally includes:

- Context and contributing factors
- Potential consequences
- Conditions under which the risk might occur

Organizations commonly identify risk scenarios by:

- Interviewing executives and employees about potential threats
- Reviewing legal and contractual obligations
- Considering internal and external business contexts
- Evaluating emerging technologies and trends

Drata provides a library of more than 200 prebuilt risk scenario templates. The templates were developed by Drata’s GRC team using industry references such as [NIST 800-30, HIPAA SRA Tool, and ISO 31000](https://help.drata.com/en/collections/2997147-framework-information). You can copy these templates into the risk register to start tracking progress towards assessment and/or mitigation.

## Step 2: Analyze

Once risks have been identified, the next step is analyzing their **potential impact** and **likelihood**.

Drata supports a quantitative risk analysis approach using a **5 × 5 scoring matrix** (impact × likelihood) to calculate an inherent risk score. Scores range from **1 (lowest)** to **25 (highest)**.

In general, higher scores indicate more critical risks that may require additional attention or treatment.

## Step 3: Treat

After evaluating a risk’s impact and likelihood, organizations determine how to respond to the risk. This decision is known as **risk treatment**.

Drata aligns with four common risk treatment options:

1. **Accept**: Acknowledge the risk without implementing additional controls.
2. **Avoid**: Eliminate the activity or condition that introduces the risk.
3. **Transfer**: Shift the risk to another party, such as through insurance or outsourcing.
4. **Mitigate**: Implement controls to reduce the likelihood or impact of the risk.
   For example, security awareness training can help reduce phishing-related risks.

## Step 4: Plan

For risks that require mitigation, organizations develop a **risk treatment plan**.

A treatment plan typically outlines how the risk will be reduced to an acceptable level and may include:

- The rationale for the selected actions
- Proposed activities
- Required resources
- Key performance indicators
- Expected timelines
- Reporting requirements
- Responsible individuals

After the treatment plan has been completed, **residual impact and likelihood** are used to represent the remaining level of risk.

## Reporting and documentation

Risk management activities are commonly documented through reports that summarize identified risks, scoring decisions, and treatment plans. Drata supports exporting this information for reporting and analysis purposes.

Some report section, such as participant details and company information, may require manual completion, depending on organizational needs.

## Related articles

- [Understanding the Drata Risk Register](understanding-the-drata-risk-register.md)
- [Integrating Fraud Risk into Your Risk Assessment (Concept Guide)](integrating-fraud-risk-into-your-risk-assessment-concept-guide.md)
- [Risk management in Drata: An overview](risk-management-in-drata-an-overview.md)
- [Assess and Manage Individual Risks](assess-and-manage-individual-risks.md)
- [Risk Management Training Videos (New Experience)](risk-management-training-videos-new-experience.md)
