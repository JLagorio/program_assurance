# Risk Assessment Policy Guidance

Source: https://help.drata.com/en/articles/8167887-risk-assessment-policy-guidance
Collection: Policy Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Risk Assessment Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “[]” below the statements of the policy.

## Risk Assessment Policy

## [COMPANY NAME]

____________________________________________________________________________

## Purpose

The purpose of this policy is to define the methodology for the assessment and treatment of information security risks within [COMPANY NAME], and to define the acceptable level of risk as set by [COMPANY NAME]’s leadership.

## Scope

Risk assessment and risk treatment are applied to the entire scope of [COMPANY NAME]’s information security program, and to all assets which are used within [COMPANY NAME] or which could have an impact on information security within it. This policy applies to all employees of [COMPANY NAME] who take part in risk assessment and risk treatment.

## Background

A key element of [COMPANY NAME]’s information security program is a holistic and systematic approach to risk management. This policy defines the requirements and processes for [COMPANY NAME] to identify information security risks. The process consists of four parts: identification of [COMPANY NAME]’s assets, as well as the threats and vulnerabilities that apply; assessment of the likelihood and consequence (risk) of the threats and vulnerabilities being realized, identification of treatment for each unacceptable risk, and evaluation of the residual risk after treatment.

## Policy

## Risk Assessment

- The risk assessment process includes the identification of threats and vulnerabilities having to do with company assets.
- The first step in the risk assessment is to identify all assets within the scope of the information security program; in other words, all assets which may affect the confidentiality, integrity, and/or availability of information in the organization. Assets may include documents in paper or electronic form, applications, databases, information technology equipment, infrastructure, and external/outsourced services and processes. For each asset, an owner must be identified.
- The next step is to identify all threats and vulnerabilities associated with each asset. Threats and vulnerabilities must be listed in a risk assessment table. Each asset may be associated with multiple threats, and each threat may be associated with multiple vulnerabilities.
- For each risk, an owner must be identified. The risk owner and the asset owner may be the same individual.
- Once risk owners are identified, they must assess:
   - Impact for each combination of threats and vulnerabilities for an individual asset if such a risk materializes.
   - Likelihood of occurrence of such a risk (i.e. the probability that a threat will exploit the vulnerability of the respective asset).
   - Criteria for determining impact and likelihood are defined in the tables below.
- The risk level is calculated by multiplying the impact score and the likelihood score.

- **[The Risk Assessment can be completed using Drata’s ‘Risk Assessment’ or ‘Risk Management’ modules. For information about Drata’s included Risk Assessment module, please see here: [https://help.drata.com/en/articles/4770255-how-does-the-risk-assessment-process-work-in-drata?q=risk+management](https://help.drata.com/en/articles/4770255-how-does-the-risk-assessment-process-work-in-drata?q=risk+management). If you have purchased the ‘Risk Management’ module within Drata, you would instead rely on that module to conduct the risk assessment. For more information on Drata’s Risk Management module, please see here: [https://help.drata.com/en/articles/6406513-risk-management](risk-management-in-drata-an-overview.md)]**

**Description of Impact Levels and Criteria:**

| **Impact Value** | **Definition** |
|---|---|
| **Incidental (1.0)** | - Minimal loss/damage<br>- Local media attention quickly remedied<br>- Not reportable to regulator<br>- Isolated staff dissatisfaction |
| **Minor (2.0)** | - Minor financial loss<br>- Local reputational damage<br>- Reportable incident to regulator, no follow up<br>- General staff morale problems and increase in turnover |
| **Moderate (3.0)** | - Moderate financial loss<br>- National short-term negative media coverage<br>- Report of breach to regulator with immediate correction to be implemented<br>- Widespread staff morale problems and high turnover |
| **Major (4.0)** | - Significant financial loss<br>- National long-term negative media coverage; significant loss of market share<br>- Report to regulator requiring major project for corrective action<br>- Some senior managers leave, high turnover of experienced staff, not perceived as employer of choice |
| **Extreme (5.0)** | - Massive financial loss<br>- International long-term negative media coverage; game-changing loss of market share<br>- Significant prosecution and fines, litigation including class actions, incarceration of leadership<br>- Multiple senior leaders leave |

**[ Impact levels can be tailored to meet your organizational needs. NOTE: Same tailored values should be reflected on your Risk Assessment Report]**

**[ Definitions for Impact levels can be tailored as needed. NOTE: Same tailored values should be reflected on your Risk Assessment Report.]**

**Description of Likelihood Value and Criteria:**

| **Likelihood Value** | **Description** |
|---|---|
| **Rare (1)** | Once in 100+ years (<10% chance of occurrence over the life of the company) |
| **Unlikely (2)** | Once in 50 to 100 years (10% to 35% chance of occurrence over the life of the company) |
| **Possible (3)** | Once in 25 to 50 years (35% to 65% chance of occurrence over the life of the company) |
| **Likely (4)** | Once in 2 to 25 years (65% to 90% chance of occurrence over the life of the company) |
| **Certain (5)** | Up to once in 2 years (90% or greater chance of occurrence over the life of the company) |

- **[The Likelihood Value and Description can be changed but by default these are not configurable within the Drata risk modules. If you do choose to make a change to these metrics, you would also need to make sure to update the Drata generated risk assessment reports as well.] **

**Risk Rating Criteria:**

| **Risk Value** | **Risk Score** |
|---|---|
| **Low** | Less than or equal to 4 |
| **Medium** | Greater than 4 but less than or equal to 9 |
| **High** | Greater than 9 but less than or equal to 16 |
| **Critical** | Greater than 16 |

**[Risk Values and the criteria for Risk Scores can be tailored to meet your organizational needs. NOTE: Same tailored values should be reflected on your Risk Assessment Report and your Risk Score Matrix, if applicable.]**

## Risk Score Matrix

Include a Risk Score Matrix to display Impact, likelihood, and Risk ratings.

(Risk Score Matrix Example, based on a 5x5 scoring scale).

- Likelihood is measured on the rows
- Impact is measured on the columns

| **LIKELIHOOD** | **IMPACT -->** |  |  |  |  |
|---|---|---|---|---|---|
|  | INCIDENTAL<br>(1) | MINOR<br>(2) | MODERATE<br>(3) | MAJOR<br>(4) | EXTREME<br>(5) |
| CERTAIN<br>(5) | **MEDIUM**<br>5 x 1 = 5 | **HIGH**<br>5 x 2 = 10 | **HIGH**<br>5 x 3 = 15 | **CRITICAL**<br>5 x 4 = 20 | **CRITICAL**<br>5 x 5 = 25 |
| LIKELY<br>(4) | **LOW**<br>4 x 1 = 4 | **MEDIUM**<br>4 x 2 = 8 | **HIGH**<br>4 x 3 = 12 | **HIGH**<br>4 x 4 = 16 | **CRITICAL**<br>4 x 5 = 20 |
| POSSIBLE<br>(3) | **LOW**<br>3 x 1 = 3 | **MEDIUM**<br>3 x 2 = 6 | **MEDIUM**<br>3 x 3 = 9 | **HIGH**<br>3 x 4 = 12 | **HIGH**<br>3 x 5 = 15 |
| UNLIKELY<br>(2) | **LOW**<br>2 x 1 = 2 | **LOW**<br>2 x 2 = 4 | **MEDIUM**<br>2 x 3 = 6 | **MEDIUM**<br>2 x 4 = 8 | **HIGH**<br>2 x 5 = 10 |
| RARE<br>(1) | **LOW**<br>1 x 1 = 1 | **LOW**<br>1 x 2 = 2 | **LOW**<br>1 x 3 = 3 | **LOW**<br>1 x 4 = 4 | **MEDIUM**<br>1 x 5 = 5 |

**Risk Remediation and Treatment**

- As part of this risk remediation process, the Company shall determine objectives for mitigating or treating risks. All high and critical risks must be treated. For continuous improvement purposes, company managers may also opt to treat medium and/or low risks for company assets.
- **Treatment options for risks include the following options:**
   - Selection or development of security control(s).
   - Transferring the risks to a third party; for example, by purchasing an insurance policy or signing a contract with suppliers or partners.
   - Avoiding the risk by discontinuing the business activity that causes such risk.
   - Accepting the risk; this option is permitted only if the selection of other risk treatment options would cost more than the potential impact of the risk being realized.
- After selecting a treatment option, the risk owner should estimate the new impact and likelihood values after the planned controls are implemented.

- **[For more guidance on Risk Remediation and Treatment , please see here: [https://help.drata.com/en/articles/6116040-risk-assessment-results-and-treatment-plan](risk-treatment-plan-guidance.md)]**

**Risk Appetite**

**[The Risk Appetite section is OPTIONAL for SOC 2 , but may be REQUIRED for other frameworks]**

[COMPANY NAME]'s risk appetite reflects its risk attitude and its willingness to accept risk in specific scenarios, with a governance model in place for risk oversight.

The maximum amount of residual risk [COMPANY NAME] will accept, after implementing security controls and necessary additional measures will be as follows:

- **<APPETITE LEVEL/TYPE OF RISK/etc.>**
- **<APPETITE LEVEL/TYPE OF RISK/etc.>**

**Risk Tolerance**

- **[The ‘Risk Tolerance’ section is required for NIST CSF and is optional for all other frameworks.]**

[COMPANY NAME] will define the level of risk it will tolerate, in relation to its specific security and privacy objectives. The criticality of a risk will determine the level of tolerance and the person responsible for accepting a non-mitigated risk. [COMPANY NAME] will:

- Tolerate <TYPE/RISK SCORE/CRITICALITY OF RISK>.
- Not tolerate <TYPE/RISK SCORE/CRITICALITY OF RISK>.
   - **[It is common to tolerate low risk and/or medium risk items. Conversely, it is common to not tolerate high and critical risk items and require remediation for those items.]**

**Regular Reviews of Risk Assessment and Risk Treatment**

The Risk Assessment Report must be updated when newly identified risks are identified. At a minimum, this update and review shall be conducted **once per year**.

- **[The risk assessment review and subsequent risk treatment plan must be conducted at least annually.]**

**Reporting**

The results of risk assessments, and all subsequent reviews, shall be documented in a Risk Assessment Report.

## APPENDIX A

**[APPENDIX A is applicable to GDPR only]**

**Data Protection Impact Assessment**

In accordance with GDPR regulations, [COMPANY NAME] is required to conduct a Data Protection Impact Assessment, particularly when:

- A systematic and extensive evaluation of personal aspects relating to natural persons which is based on automated processing, including profiling, and on which decisions are based that produce legal effects concerning the natural person or similarly significantly affect the natural person;
- Personal data processing on a large scale of special categories of data referred to in Article 9(1), or of personal data relating to criminal convictions and offenses referred to in Article 10; or,
- A systematic monitoring of a publicly accessible area on a large scale

The DPIA will contain all of the following information:

- A systematic description of the envisaged processing operations and the purposes of the processing;
- An assessment of the necessity and proportionality of the processing operations in relation to the purposes;
- An assessment of the risks to the rights and freedoms of data subjects referred to in paragraph 1 of Article 39 of the Regulation 2018/1725; and
- The measures envisaged to address the risks, including safeguards, security measures and mechanisms to ensure the protection of personal data and to demonstrate compliance with this Regulation taking into account the rights and legitimate interests of data subjects and other persons concerned

Where necessary, [COMPANY NAME] will carry out a review to assess if the data processing is being performed in accordance with the data protection impact assessment, at least when there is a change of the risk represented by processing operations.

## APPENDIX B

**[ Appendix B is applicable to GDPR only]**

**Privacy Regulation Key Terminology**

|  | ***GDPR*** |
|---|---|
| Controller | The natural or legal person, public authority, agency or other body which, alone or jointly with others, determines the purposes and means of the processing of personal data; where the purposes and means of such processing are determined by Union or Member State law, the controller or the specific criteria for its nomination may be provided for by Union or Member State law; |
| Processor | A natural or legal person, public authority, agency or other body which processes personal data on behalf of the controller; |
| Processing | Any operation or set of operations which is performed on personal data or on sets of personal data, whether or not by automated means, such as collection, recording, organization, structuring, storage, adaptation or alteration, retrieval, consultation, use, disclosure by transmission, dissemination or otherwise making available, alignment or combination, restriction, erasure or destruction. |
| Pseudonymisation | The processing of personal data in such a manner that the personal data can no longer be attributed to a specific data subject without the use of additional information, provided that such additional information is kept separately and is subject to technical and organizational measures to ensure that the personal data are not attributed to an identified or identifiable natural person. |
| Third Party | A natural or legal person, public authority, agency or body other than the data subject, controller, processor and persons who, under the direct authority of the controller or processor, are authorized to process personal data. |
| Consent | Any freely given, specific, informed and unambiguous indication of the data subject’s wishes by which he or she, by a statement or by a clear affirmative action, signifies agreement to the processing of personal data relating to him or her;<br>‘personal data breach’ means a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data transmitted, stored or otherwise processed. |
| Supervisory Authority | An independent public authority established by a Member State pursuant to Article 51. *Supervisory authority concerned* means a supervisory authority which is concerned by the processing of personal data because:<br>- The controller or processor is established on the territory of the Member State of that supervisory authority;<br>- Data subjects residing in the Member State of that supervisory authority are substantially affected or likely to be substantially affected by the processing; or,<br>- A complaint has been lodged with that supervisory authority. |
| Cross-Border Processing | - Processing of personal data which takes place in the context of the activities of establishments in more than one Member State of a controller or processor in the Union where the controller or processor is established in more than one Member State; or,<br>- Processing of personal data which takes place in the context of the activities of a single establishment of a controller or processor in the Union but which substantially affects or is likely to substantially affect data subjects in more than one Member State. |

## APPENDIX C

**[Appendix C is OPTIONAL for SOC 2, but may be REQUIRED for other frameworks such as ISO 27001:2022.**]

**Threat Assessment Plan**

[COMPANY NAME] collects and analyzes information about existing or potential threats to prevent harm to the organization through informed actions.

[COMPANY NAME]'s Threat assessment activities include identifying, collecting, processing, and analyzing threat-related information and appropriately communicating and sharing the assessment with relevant entities. The threat assessment will be implemented in the company’s risk management process, and used for additional inputs for putting safeguards in place.

[COMPANY NAME] will follow the following plan to conduct a threat assessment:

**<THREAT ASSESSMENT PLAN>**

- **[Please see here for an example Threat Assessment Plan: [https://help.drata.com/en/articles/6915781-example-threat-assessment-plan](example-threat-assessment-plan.md)]**

## APPENDIX D

**Plan of Action and Milestones (POA&M)**

**[Appendix D is REQUIRED for NIST SP 800-53; it is not currently required for other frameworks.]**

[COMPANY NAME] will develop a plan of action and milestones (POA&M) for its information system to:

- Document the remedial actions to address deficiencies identified during the assessment of the security controls.
- Reduce or eliminate known vulnerabilities in the system.

The POA&M will be updated **<FREQUENCY>**, based on the findings from security controls assessments, security impact analyses, and continuous monitoring activities.

The POA&M will consider the following:

- Unique ID
- Milestones
- Responsible Entities
- Resource Estimate (e.g., funded/unfunded/reallocation)
- Creation Date
- Deficiency Name
- Deficiency Description
- Deficiency Source
- Severity Level (e.g., Low, Moderate, High)
- Scheduled Completion Date
- Changes to Milestones
- Status (e.g., Ongoing or Complete)
- Actual Completion Date
- Controls in Place

## Related articles

- [Getting started with a risk assessment (Concept Guide)](getting-started-with-a-risk-assessment-concept-guide.md)
- [Understanding the Drata Risk Register](understanding-the-drata-risk-register.md)
- [Your First Risk Assessment: A Step-by-Step Guide (Concept Guide)](your-first-risk-assessment-a-step-by-step-guide-concept-guide.md)
- [Risk management in Drata: An overview](risk-management-in-drata-an-overview.md)
- [Assess and Manage Individual Risks](assess-and-manage-individual-risks.md)
