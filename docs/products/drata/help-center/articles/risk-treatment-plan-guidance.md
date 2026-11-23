# Risk Treatment Plan Guidance

Source: https://help.drata.com/en/articles/6116040-risk-treatment-plan-guidance
Collection: Understand the Drata Platform › Risk
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Risk Assessment Results and Treatment Plan

## Article text

**Risk Treatment Plan Guidance**

Compliance frameworks such as SOC 2 and ISO 27001 require organizations to define and apply a structured risk treatment process. To help meet this requirement, Drata’s Risk Assessment Report includes two key tables: **Risk Assessment Results** and **Risk Treatment Plan**. A complete risk assessment and corresponding treatment plan should be maintained and reviewed at least annually to meet compliance expectations.

The **Risk Assessment Results** table summarizes the risks identified during your assessment, along with a risk rating calculated using the likelihood and impact values assigned by your organization.

The **Risk Treatment Plan** table outlines how each identified risk will be addressed. The first two columns of this table are automatically populated by Drata when the report is generated. The remaining columns are designed for your team to complete based on your selected treatment approach. This structure helps demonstrate to auditors and internal stakeholders that risks are being actively managed.

Below is a breakdown of each column in the Risk Treatment Plan and guidance on how to complete it:

- ***Remediation Plan – Describe how the risk will be treated. This may include mitigation strategies (such as technical or procedural controls) or other treatment options like risk acceptance, transference, or avoidance. Where applicable, include links to support tickets, project plans, or technical documentation. If the risk is not being mitigated, clearly state the rationale (e.g., accepted or transferred) and mark the remaining columns as “N/A.”
   *
- ***Remediation Owner – Identify the individual responsible for implementing the remediation or overseeing the chosen treatment. This ensures accountability and helps track progress.
   *
- ***Target Remediation Date – Specify the intended completion date for remediation. Auditors may review past-due remediation targets, so it’s important to keep this information current and realistic.
   *
- ***Likelihood After Remediation – Estimate the likelihood of the risk occurring after the remediation is implemented. Use the same 1–5 scale applied in the original risk assessment.
   *
- ***Impact After Remediation – Estimate the potential impact to the organization if the risk were to materialize after remediation. Again, use the same 1–5 scale as in the original assessment.
   *
- ***Risk Rating After Remediation – Calculate the residual risk by multiplying the Likelihood After Remediation by the Impact After Remediation. This gives a clear view of risk reduction effectiveness.
   *
- ***Relevant Requirements – Identify any compliance criteria or controls that apply to this risk and its treatment, such as SOC 2 Trust Services Criteria or ISO 27001 Annex A controls. Refer to the “Recommended Requirements Mapping” section below for guidance on how risks may align with specific framework requirements.*

The following is an example of completed “Risk Assessment Results” and “Risk Treatment Plan” tables for example identified risks as a result of completing the Risk Assessment within Drata.

**4. Risk Assessment Results**

| **Item #** | **Observation** | **Category** | **Threat** | **Likelihood** | **Impact** | **Risk Rating** |
|---|---|---|---|---|---|---|
| 1 | AcmeCorp does not encrypt Customer Data while the data is in transit | Engineering | Customer Data may be accessed by unauthorized parties while in transit | 3 | 4 | 12 - HIGH |
| 2 | AcmeCorp has not conducted an Incident Response test or tabletop in the last 12 months | Information Security | Without proper training, key stakeholders may not know how to react or respond in the event of a real incident | 2 | 3 | 6 - MEDIUM |
| 3 | [...] | [...] | [...] | [...] | [...] | [...] |
| 4 | [...] | [...] | [...] | [...] | [...] | [...] |
| 5 | [...] | [...] | [...] | [...] | [...] | [...] |
| 6 | [...] | [...] | [...] | [...] | [...] | [...] |
| 7 | [...] | [...] | [...] | [...] | [...] | [...] |
| 8 | [...] | [...] | [...] | [...] | [...] | [...] |
| 9 | [...] | [...] | [...] | [...] | [...] | [...] |

**5. Risk Treatment Plan**

| **Item #** | **Remediation Plan** | **Remediation Owner** | **Target Remediation Date** | **Likelihood after remediation** | **Impact after remediation** | **Risk Rating after remediation** | **Relevant Requirements** |
|---|---|---|---|---|---|---|---|
|  |  | ***Who is responsible for the risk remediation?*** | ***When does the remediation need to be completed?*** | ***What is the new likelihood of this risk occurring after remediation has been put in place?*** | ***What is the new impact of this risk after remediation has been put in place?*** | **Multiply the new likelihood and new impact to determine the new risk rating** | ***Which controls are relevant to this risk and remediation plan?*** |
| 1 | Acme Corp will enforce TLS on the connection between the customer and Acme Corp’s SaaS Application | Head of Engineering | 01/31/2022 | 1 | 4 | 4 - LOW | **ISO (2013):**<br>A.10.1.1<br>A.13.1.1<br>A.14.1.2<br>**ISO (2022):**<br>A.8.20<br>A.8.24<br>A.8.26<br>**SOC 2:**<br>CC6.6<br>CC6.7 |
| 2 | Acme Corp will conduct an Incident Response Tabletop with key stakeholders | CISO | 02/28/2022 | 1 | 3 | 3 - LOW | **ISO (2013):**<br>A.16.1.1<br>A.16.1.2<br>A.16.1.3<br>A.16.1.4<br>A.16.1.5<br>A.16.1.6<br>A.16.1.7<br>**ISO (2022):**<br>A.5.24<br>A.5.25<br>A.5.26<br>A.5.27<br>A.5.28<br>A.6.8<br>**SOC 2:**<br>CC7.5 |
| 3 | [...] | [...] | [...] | [...] | [...] | [...] |  |
| 4 | [...] | [...] | [...] | [...] | [...] | [...] |  |
| 5 | [...] | [...] | [...] | [...] | [...] | [...] |  |
| 6 | [...] | [...] | [...] | [...] | [...] | [...] |  |
| 7 | [...] | [...] | [...] | [...] | [...] | [...] |  |
| 8 | [...] | [...] | [...] | [...] | [...] | [...] |  |
| 9 | [...] | [...] | [...] | [...] | [...] | [...] |  |

## Recommended Requirements Mapping

When using these recommendations, remove the requirements from the relevant requirements column that do not apply to your organization. The item # below will align to the item # in your complete risk assessment report.

| **Item #** | **Risk Statement** | **Relevant Requirements** |
|---|---|---|
|  |  | ***Which controls are relevant to this risk and remediation plan?*** |
| 1 | Do you use industry standards (i.e. OWASP Software Assurance Maturity Model, ISO 27034, BSIMM) to build in security for your Systems/Software Development Lifecycle (SDLC)? * | **SOC 2: **CC8.1<br>**ISO 27001 (2013): **A.14.1.1, A.14.2.1<br>**ISO 27001 (2022):** A.5.8, A.8.25<br>**HIPAA: **164.306(a), 164.306(b)<br>**PCI DSS v4.0: **6.3 |
| 2 | Are file integrity (host) and network intrusion detection (IDS) tools implemented to help facilitate timely detection, investigation by root cause analysis, and response to incidents? * | **SOC 2: **CC6.6, CC6.8, CC7.1, CC7.2<br>**ISO 27001 (2013):** C9.1, A.12.4.3, A.12.6.1**,** A.12.6.2, A.13.1.1, A.13.1.2<br>**ISO 27001 (2022):** C9.1, A.8.8, A.8.15, A.8.19, A.8.20, A.8.21<br>**HIPAA: **164.308(a)(5)(ii)(B), 164.312(c)(1)<br>**PCI DSS v4.0: **11.4.1, 11.5.1, 11.5.2 |
| 3 | Do you use a synchronized time-service protocol (e.g., NTP) to ensure all systems have a common time reference? * | **SOC 2: **CC7.1, CC7.2, CC7.3<br>**ISO 27001 (2013): **A.12.4.1, A.12.4.2, A.12.4.3<br>**ISO 27001 (2022): **A.8.15<br>HIPAA: 164.308(a)(5)(ii)(C), 164.312(b), 164.312(c)(2)<br>**PCI DSS v4.0: **10.6.1 |
| 4 | Do you segregate production and non-production environments? * | **SOC 2: **CC8.1<br>**ISO 27001 (2013):** C9.1, A.12.1.4, A.14.2.2, A.14.2.8, A.14.2.9<br>**ISO 27001 (2022): **C9.1, A.8.31, A.8.32, A.8.29<br>PCI DSS v4.0: 6.4.1 |
| 5 | Are system and network environments protected by a firewall or virtual firewall to ensure business and customer security requirements? * | **SOC 2**: CC6.6<br>**ISO 27001 (2013):** C9.1, A.13.1.1, A.13.1.2, A.13.1.3<br>**ISO 27001 (2022): **C9.1, A.8.20, A.8.21, A.8.22<br>**PCI DSS v4.0: **1.2.1, 1.4.1 |
| 6 | Do you use manual and/or automated source-code analysis to detect security defects in code prior to production? * | **SOC 2**: CC7.1, CC8.1<br>**ISO 27001 (2013)**: A.12.1.2, A.12.6.1, A.14.2.1, A.14.2.2, A.14.2.8, A.18.2.3<br>**ISO 27001 (2022):** A.5.36, A.8.8, A.8.25, A.8.28, A.8.29, A.8.32<br>**PCI DSS v4.0**: 6.2.2, 6.2.3 |
| 7 | Do you review your applications for security vulnerabilities and address any issues prior to deployment to production? * | **SOC 2: **CC7.1, CC8.1<br>**ISO 27001 (2013):** A.12.1.2, A.12.6.1, A.14.2.1, A.14.2.2, A.14.2.8, A.18.2.3<br>**ISO 27001 (2022): **A.5.36, A.8.8, A.8.25, A.8.29, A.8.32<br>**HIPAA: **164.306(a), 164.306(b), 164.306(c), 164.306(d), 164.306(e), 164.308(a)(1)(i), 164.316(a)<br>**PCI DSS v4.0: **6.3.1, 6.4.2<br>**GDPR: **32 |
| 8 | Do you conduct application penetration tests of your cloud infrastructure regularly as prescribed by industry best practices and guidance? * | **SOC 2:** CC1.2, CC3.1, CC3.4, CC4.1, CC4.2, CC5.1, CC5.2, CC7.1<br>**ISO 27001 (2013): **C9.3, A.12.6.1, A.18.2.2, A.18.2.3<br>**ISO 27001 (2022): **C9.3.1, A.5.36, A.8.8<br>**HIPAA: **164.308(a)(1)(ii)(A), 164.308(a)(1)(ii)(B), 164.308(a)(8)<br>**PCI DSS v4.0: **11.3.1, 11.3.2<br>**GDPR:** 32 |
| 9 | Does your organization have a plan or framework for business continuity management or disaster recovery management? * | **SOC 2:** CC5.3, CC9.1, A1.2, A1.3, P4.2<br>**ISO 27001 (2013): **A.11.1.4, A.12.3.1, A17.1.1, A.17.1.2, A.17.1.3<br>**ISO 27001 (2022): **A.5.29, A.5.30, A.7.5, A.8.13<br>**HIPAA: **164.308(a)(7)(i), 164.308(7)(ii)(B), 164.308(a)(7)(ii)(C), 164.310(a)(2)(i), 164.312(a)(2)(ii)<br>**PCI DSS v4.0: **12.10.1<br>**GDPR:** 32 |
| 10 | Are there policies and procedures in place to triage and remedy reported bugs and security vulnerabilities for product and service offerings? * | **ISO 27001 (2013):** A.5.1.1, A.12.1.1, A.12.7.1, A.18.2.3<br>**ISO 27001 (2022):** A.5.1, A.5.36, A.5.37, A.8.8, A.8.34<br>**HIPAA:** 164.306(a), 164.306(b), 164.306(c), 164.306(d), 164.306(e), 164.308(a)(1)(i), 164.316(a)<br>**PCI DSS v4.0:** 6.3.1<br>**GDPR: **32 |
| 11 | Do you have controls in place to restrict and monitor the installation of unauthorized software onto your systems? | **SOC 2: **CC6.8<br>**ISO 27001 (2013): **A.12.6.2<br>**ISO 27001 (2022):** A.8.19<br>**HIPAA: **164.310(b)<br>**PCI DSS v4.0: **5.2.3 |
| 12 | Do you have policies/procedures in place to ensure production data shall not be replicated or used in non-production environments? * | **SOC 2: **C1.1<br>**ISO 27001 (2013): **C7.5.3, A.12.1.4, A.14.2.2, A.14.3.1<br>**ISO 27001 (2022): **C7.5.3, A.8.31, A.8.32, A.8.33<br>**PCI DSS v4.0: **6.4.3 |
| 13 | Do you have key management policies binding keys to identifiable owners? * | **SOC 2: **CC6.1<br>**ISO 27001 (2013): **A.9.1.1, A.9.1.2, A.9.4.1, A.10.1.1, A.10.1.2<br>**ISO 27001 (2022): A.5.15, A.8.3, A.8.24**<br>**HIPAA:** 164.308(a)(4)(i), 164.312(a)(2)(iv)<br>**PCI DSS v4.0:** 3.6 |
| 14 | Do you encrypt tenant data at rest (on disk/storage) within your environment as well as data in transit? * | **SOC 2: **CC6.1, CC6.7, PI1.5<br>**ISO 27001 (2013):** A.6.2.1, A.9.1.2, A.9.2.2, A.10.1.1, A.12.3.1, A.13.1.1, A.14.1.2, A.18.1.3<br>**ISO 27001 (2022): **A.5.15, A.5.18, A.5.33, A.8.1, A.8.13, A.8.20, A.8.24, A.8.26<br>**HIPAA: **164.312(a)(2)(iv), 164.312(e)(1), 164.312(e)(2)(ii)<br>**PCI DSS v4.0: **3.5, 4.2<br>**GDPR: **32 |
| 15 | Do you restrict, log, and monitor access to your information security management systems (e.g., hypervisors, firewalls, vulnerability scanners, network sniffers, APIs, etc.)? * | **SOC 2:** CC6.8, CC7.1, CC7.2<br>**ISO 27001 (2013): **C9.1, A.12.4.1, A.12.4.2, A.12.4.3, A.13.1.1<br>**ISO 27001 (2022): **C9.1.1, A.8.15, A.8.20<br>**HIPAA: **164.308(a)(5)(ii)(C), 164.312(b)<br>**PCI DSS v4.0:** 10.5.5, 10.6.1, 10.7.3 |
| 16 | Are infrastructure audit logs centrally stored, retained, and reviewed on a regular basis for security events (e.g., with automated tools)? * | **SOC 2: **CC7.2<br>**ISO 27001 (2013): **A.12.4.1, A.12.4.2, A.12.4.3<br>**ISO 27001 (2022): **A.8.15<br>**HIPAA: **164.312(b)<br>**PCI DSS v4.0: **10.5.1, 10.5.4 |
| 17 | Does your system's capacity requirements take into account current, projected, and anticipated capacity needs for all systems used to provide services to the tenants? * | **SOC 2: **A1.1<br>**ISO 27001 (2013): **C9.1, A.12.1.3<br>**ISO 27001 (2022): **C9.1.1, A.8.6 |
| 18 | Do you regularly update network architecture diagrams that include data flows between security domains/zones? | **SOC 2: **CC2.1<br>**ISO 27001 (2013): **C7.5.1<br>**ISO 27001 (2022): **C7.5.1<br>**HIPAA: **164.308(a)(4)(ii)(A)<br>**PCI DSS v4.0: **1.2.2 |
| 19 | Do you collect capacity and use data for all relevant components of your cloud service offering? * | **SOC 2: **A1.1<br>**ISO 27001 (2013): **C9.1, A.12.1.3<br>**ISO 27001 (2022): **C.9.1.1, A.8.6 |
| 20 | Do your engineers review code changes for injection flaws, such as SQL injections and OS command injection? * | **SOC 2: **CC6.8<br>**ISO 27001 (2013): **A.12.1.2, A.12.6.1, A.14.2.1, A14.2.2<br>**ISO 27001 (2022): **A.8.8, A.8.25, A.8.32<br>**PCI DSS v4.0: **6.3.2 |
| 21 | Do you deliver SDLC and/or OWASP Top 10 training to full time and contractor developers who develop or maintain code and infrastructure that can affect the security of the system? * | **ISO 27001 (2022): **A.8.28<br>**PCI DSS v4.0: **6.4.2 |
| 22 | Do you consistently identify systems that contain user data as containing user data in an inventory list of digital assets? * | **SOC 2:** CC2.1, CC6.1<br>**ISO 27001 (2013):** A.8.1.1, A.8.2.1<br>**ISO 27001 (2022):** A.5.9, A.5.12<br>HIPAA: 164.310(d)(2)(iii)<br>**PCI DSS v4.0: **2.4.1, 2.4.2 |
| 23 | Do you configure networks to restrict inbound and outbound traffic to only that which is absolutely necessary, especially for sensitive assets, such as databases and storage points that contain sensitive user data? * | **SOC 2: **CC6.1<br>**ISO 27001 (2013): **A.13.1.2<br>**ISO 27001 (2022): **A.8.21<br>**PCI DSS v4.0: **1.2.3, 1.4.2 |
| 24 | Do you conduct functionality testing on new code changes to ensure changes do not adversely affect the availability or security of the system? * | **SOC 2: **CC8.1<br>**ISO 27001 (2013): **A.12.1.2, A.14.2.2, A.14.2.8<br>**ISO 27001 (2022): **A.8.29, A.8.32<br>**PCI DSS v4.0: **6.5.3 |
| 25 | Do you enforce a QA stage within your development practices that includes testing functionality on a staging server before code is pushed to production? * | **SOC 2:** CC8.1<br>**ISO 27001 (2013): **A.12.1.2, A.14.2.2, A.14.2.8<br>**ISO 27001 (2022): **A.8.29, A.8.32<br>**PCI DSS v4.0:** 6.5.3 |
| 26 | Regarding security headers, do your web endpoints meet an 'A' grade according to securityheaders.io ? (note: this could be scripted if a list of URLs is provided) * | **SOC 2: **CC6.1<br>**ISO 27001 (2013): **A.10.1.1<br>**ISO 27001 (2022): **A.8.24<br>PCI DSS v4.0: 6.4.1, 6.4.2 (related to secure coding/app protection)<br>**GDPR: **5, 32 |
| 27 | Does your web framework encode all rendered output, e.g., React JSX? * | **SOC 2: **CC6.1<br>**ISO 27001 (2013): **A.10.1.1<br>**ISO 27001 (2022): **A.8.24<br>PCI DSS v4.0: 6.4.1, 6.4.2 (related to secure coding/app protection)<br>**GDPR: **5, 32 |
| 28 | Do you enforce application password requirements? * | **SOC 2: **CC6.1, CC6.6, C1.1<br>**ISO 27001 (2013): **A.9.2.4<br>**ISO 27001 (2022): **A.5.17<br>**HIPAA: **164.312(a)(2)(i), 164.312(c)(1), 164.312(e)(2)(i)<br>**PCI DSS v4.0: **8.3.6, 8.3.7, 8.3.8, 8.3.9 |
| 29 | Do you monitor for and apply security patches for vulnerabilities in third party libraries and their dependencies? Do you use a software composition analysis tool? * | **SOC 2:** CC6.8<br>**ISO 27001 (2022):** A.6.3, A.8.28<br>**PCI DSS v4.0:** 6.3.3 |
| 30 | Are your information security policies and procedures made available to all impacted personnel and business partners, authorized by accountable business role/function and supported by the information security management program as per industry best practices (e.g. ISO 27001, SOC 2)? | **SOC 2: **CC1.1, CC2.2, CC5.2, CC5.3<br>**ISO 27001 (2013): **A.5.1.1<br>**ISO 27001 (2022): **A.5.1<br>**HIPAA: **164.316(a)<br>**PCI DSS v4.0: **12.1.1, 12.6.2<br>**GDPR: **5, 24, 25, 32 |
| 31 | Do you disclose which controls, standards, certifications, and/or regulations you comply with? | **N/A** |
| 32 | Are your technical, business, and executive managers responsible for maintaining awareness of and compliance with security policies, procedures, and standards for both themselves and their employees as they pertain to the manager and employees' area of responsibility? | **SOC 2: **CC1.2, CC5.3<br>**ISO 27001 (2013): **C9.3, A.5.1.2, A.18.2.2<br>**ISO 27001 (2022): **C9.3.1, C9.3.3, A.5.1, A.5.36<br>**HIPAA: **164.306(e), 164.308(a)(8), 164.316(b)(2)(iii) |
| 33 | Do you have the capability to continuously monitor and report the compliance of your infrastructure against your information security baselines? | **SOC 2**: CC2.1, CC2.2, CC5.1, CC5.2, CC7.1<br>**ISO 27001 (2013)**: A.12.7.1, A.13.1.1<br>**ISO 27001 (2022):** A.8.20, A.8.34<br>**HIPAA:** 164.312(b) |
| 34 | Do you conduct risk assessments associated with data governance requirements at least once a year? | **SOC 2**: CC1.2, CC2.1, CC3.1, CC3.2, CC3.3, CC3.4, CC4.1, CC4.2, CC5.1, CC5.2<br>**ISO 27001 (2013):** C6.1.2, C6.2, C8.2, A.18.2.1, A.18.2.2<br>**ISO 27001 (2022): **C6.1.2, C6.2, C8.2, A.5.35, A.5.36<br>**HIPAA: **164.308(a)(1)(ii)(A), 164.308(a)(1)(ii)(B), 164.308(a)(8)<br>**PCI DSS v4.0**: 12.2.1 |
| 35 | Is a formal disciplinary or sanction policy established for employees who have violated security policies and procedures? | **SOC 2: **CC2.1, CC5.3<br>**ISO 27001 (2013):** C4.1, C5.1, C5.2, C6.2, A.5.1.1, A.7.2.3<br>**ISO 27001 (2022): **C4.1, C5.1, C5.2, C6.2, A.5.19, A.6.4<br>**HIPAA: **164.308(a)(1)(ii)(C)<br>**PCI DSS v4.0: **12.6.2 (as part of security awareness)<br>**GDPR: **32 |
| 36 | Are employees made aware of what actions could be taken in the event of a violation via their policies and procedures? | **SOC 2: **CC2.1, CC5.3<br>**ISO 27001 (2013)**: C4.1, C5.1, C5.2, C6.2, A.5.1.1, A.7.2.3<br>**ISO 27001 (2022): **C4.1, C5.1, C5.2, C6.2, A.5.1, A.6.4<br>**HIPAA: **164.308(a)(1)(ii)(C)<br>**PCI DSS v4.0: **12.6.1<br>**GDPR:** 32 |
| 37 | Do you perform, at minimum, annual reviews to your privacy and security policies? | **SOC 2: **CC1.2, CC5.3, P1.1<br>**ISO 27001 (2013):** C9.3, A.5.1.2, A.18.1.4, A.18.2.2<br>**ISO 27001 (2022): **C9.3.1, C9.3.2, C9.3.3, A.5.1, A.5.34, A.5.36<br>**HIPAA: **164.306(e), 164.308(a)(8), 164.316(b)(1)(i), 164.316(b)(1)(ii), 164.316(b)(2)(iii)<br>**PCI DSS v4.0: **12.1.1<br>**GDPR:** 24, 25 |
| 38 | Is the likelihood and impact associated with inherent and residual risk determined independently, considering all risk categories? | **SOC 2: **CC1.2, CC2.1, CC3.1, CC3.2, CC3.3, CC3.4, CC4.1, CC4.2, CC5.1, CC5.2<br>**ISO 27001 (2013):** C6.1.2, C6.2, C8.2, A.18.2.1, A.18.2.2<br>**ISO 27001 (2022): **C6.1.2, C6.2, C8.2, A.5.35, A.5.36<br>**HIPAA: **164.308(a)(1)(ii)(A), 164.308(a)(1)(ii)(B), 164.308(a)(8)<br>**PCI DSS v4.0: **12.2.1 |
| 39 | Do you have a documented security incident response plan? | **SOC 2: **CC2.2, CC2.3, CC4.2, CC7.3, CC7.4, CC7.5, CC9.1<br>**ISO 27001 (2013): **A.5.1.1, A.16.1.1, A.16.1.5, A.16.1.6, A.16.1.7<br>**ISO 27001 (2022):** A.5.1, A.5.24, A.5.26, A.5.27, A.5.28<br>**HIPAA:** 164.308(a)(6)(i), 164.308(a)(6)(ii), 164.316(a), 164.402<br>**PCI DSS v4.0:** 12.10.1<br>**GDPR: **32 |
| 40 | Have you tested your security incident response plans in the last year? | **SOC 2: **CC7.5<br>**ISO 27001 (2013):** C7.2, A.16.1.1, A.16.1.6<br>**ISO 27001 (2022): **C7.2, A.5.24, A.5.27<br>**HIPAA: **164.308(a)(6)(i), 164.308(a)(6)(ii)<br>**PCI DSS v4.0: **12.10.3 |
| 41 | Do you conduct application-layer and network-layer vulnerability scans regularly as prescribed by industry best practices? | **SOC 2: **CC1.2, CC3.1, CC3.2, CC3.4, CC4.1, CC4.2, CC5.1, CC5.2, CC7.1, CC7.2<br>**ISO 27001 (2013):** A.12.6.1, A.18.2.2, A.18.2.3<br>**ISO 27001 (2022):** A.5.36, A.8.8<br>**HIPAA: **164.308(a)(1)(ii)(A), 164.308(a)(1)(ii)(B)<br>**PCI DSS v4.0:** 6.3.1, 11.2.1, 11.2.2<br>**GDPR: **32 |
| 42 | Does your company require employment agreements to be signed by newly hired or onboarded workforce personnel prior to granting access to corporate facilities, resources, and assets? * | **SOC 2: **C1.1, P6.4<br>**ISO 27001 (2013): **A.7.1.2, A.7.2.1<br>**ISO 27001 (2022):** A.5.4, A.6.2 |
| 43 | Does your company conduct background verification screening for all employees and contractors? | **SOC 2: **CC1.1, CC1.4<br>**ISO 27001 (2013): **A.6.1.1, A.7.1.1<br>**ISO 27001 (2022): **A.5.2, A.6.1<br>**HIPAA: **164.308(a)(3)(ii)(B)<br>**PCI DSS v4.0:** 12.7.1 |
| 44 | Do your employment offers include non-disclosure or confidentiality agreements reflecting the organization's needs for the protection of data and operational details? * | **SOC 2: **C1.1, P6.4<br>**ISO 27001 (2013): **A.7.1.2, A.7.2.1<br>**ISO 27001 (2022): **A.5.4, A.6.2 |
| 45 | Do you define allowance and conditions for BYOD devices and its applications to access corporate resources? * | **SOC 2: **CC1.1, CC1.5, CC2.2, CC6.1<br>**ISO 27001 (2013): **A.5.1.1, A.7.2.1, A.8.1.3<br>**ISO 27001 (2022): **A.5.1, A.5.4, A.5.10<br>**HIPAA: **164.306(a), 164.306(b), 164.306(c), 164.310(b)<br>**PCI DSS v4.0:** 12.3.5, 12.3.6 |
| 46 | Do you provide a formal security awareness training program for all applicable personnel at least once per year? * | **SOC 2: **CC1.4, CC1.5, CC2.2, CC5.2<br>**ISO 27001 (2013): **C7.3, A.5.1.1, A.7.2.2<br>**ISO 27001 (2022): **C7.3, A.5.1, A.6.3<br>**HIPAA: **164.308(a)(5)(i), 164.530(b)<br>**PCI DSS v4.0: **12.6.1 |
| 47 | Do you document employee acknowledgment of training they have completed? * | **SOC 2: **CC1.4, CC1.5, CC2.2, CC5.2<br>**ISO 27001 (2013): **C7.3, A.5.1.1, A.7.2.2<br>**ISO 27001 (2022): **C7.3, A5.1, A.6.3<br>**HIPAA: **164.308(a)(5)(i), 164.530(b)<br>**PCI DSS v4.0: **12.6.1 |
| 48 | Do you specifically train your employees regarding their specific role and the information security controls they must fulfill? * | **SOC 2:** CC1.4<br>**HIPAA: **164.308(a)(5)(i), 164.530(b)<br>**PCI DSS v4.0: **6.4.2, 12.6.1 |
| 49 | Is successful completion of the security awareness training considered a prerequisite for acquiring and maintaining access to sensitive systems? | **SOC 2: **CC1.4, CC1.5, CC2.2, CC5.2<br>**ISO 27001 (2013): **C7.3, A.5.1.1, A.7.2.2<br>**ISO 27001 (2022): **C7.3, A.5.1, A.6.3<br>**HIPAA: **164.308(a)(5)(i), 164.530(b)<br>**PCI DSS v4.0: **12.6.1 |
| 50 | Are personnel informed of their responsibilities for maintaining awareness and compliance with published security policies, procedures, standards, and applicable regulatory requirements? * | **SOC 2: **CC1.1, CC2.2, CC5.2, CC5.3<br>**ISO 27001 (2013): **A.7.1.2, A.7.2.1, A.8.1.3<br>**ISO 27001 (2022): **A.6.2, A.5.4, A.5.10<br>**HIPAA: **164.316(a)<br>**PCI DSS v4.0: **12.1.1, 12.6.1<br>**GDPR:** 5, 24, 25, 32 |
| 51 | Are personnel informed of their responsibilities for maintaining a safe and secure working environment? | **SOC 2: **C1.1<br>**ISO 27001 (2013): **A.5.1.1, A.7.2.1, A.11.2.9<br>**ISO 27001 (2022): **A.5.1, A.5.4, A.7.7<br>**HIPAA: 1**64.306(a), 164.306(c), 164.316(a) |
| 52 | Are personnel informed of their responsibilities for ensuring that equipment is secured and not left unattended? | **SOC 2: **CC1.1, CC1.5, CC2.2, CC6.1<br>**ISO 27001 (2013): **A.5.1.1, A.7.2.1, A.8.1.3<br>**ISO 27001 (2022): **A.5.1, A.5.4, A.5.10<br>**HIPAA: **164.306(a), 164.306(b), 164.306(c), 164.310(b)<br>**PCI DSS v4.0:** 9.3.1 |
| 53 | Do you have asset return procedures for terminated employees outlining how company assets should be returned within an established period? | **SOC 2: **CC6.2, CC6.3, CC6.4, CC6.5, C1.2, P.4.3<br>**ISO 27001 (2013): **A.7.1.2, A.7.3.1, A.8.1.4<br>**ISO 27001 (2022): **A.5.11, A.6.2, A.6.5<br>**HIPAA: **164.308(a)(4)(i) |
| 54 | Does your company restrict and/or control access to your accounting software and digital records? | **SOC 2: **CC6.1 |
| 55 | Does your company compare two independent sets of records for one set of transactions? (ex: matching delivery receipts to vendor payments, matching bank statements to the general ledger) | **SOC 2: **CC3.0 |
| 56 | Does your company continuously monitor its financial performance? (ex: comparing budgeted to actual cash flow) | **SOC 2: **CC3.0 |
| 57 | Does your company segregate various financial responsibilities? (ex: requiring two people to make purchases: one signs checks, one authorizes the purchase) | **SOC 2: **CC3.0 |
| 58 | Are new Finance employees trained on your financial reporting control requirements? | **SOC 2: **CC3.0 |
| 59 | Are new bank accounts or credit cards only opened through the direction and approval of the Board of Directors? | **SOC 2: **CC3.0 |
| 60 | Are all manually generated checks reviewed and approved by a Finance Manager? | **SOC 2: **CC3.0 |
| 61 | Do Finance personnel prepare amortization schedules for all recorded prepaid expenses, to then be reviewed and approved by management? | **SOC 2: **CC3.0 |
| 62 | Does management periodically review a fixed assets register to verify the existence and right to the assets, and document and report on the findings? | **SOC 2: **CC3.0 |
| 63 | Are employee benefit obligation adjustments regularly compared to budget and are significant variances investigated and reported on? | **SOC 2: **CC3.0 |
| 64 | Does management conduct monthly financial statement reviews to compare to budget, and investigate significant variances? | **SOC 2: **CC3.0 |
| 65 | Are invoices authorized and accompanied by appropriate supporting documentation, and only after confirming the customer exists in a master customer file? | **SOC 2: **CC3.0 |
| 66 | Do you have predefined communication channels for workforce personnel and external business partners to report incidents in a timely manner adhering to applicable legal, statutory, or regulatory compliance obligations? | **SOC 2: **CC2.2, CC5.3, A1.1, A1.3, P6.5<br>**ISO 27001 (2013): **A.16.1.2<br>**ISO 27001 (2022): **A.6.8<br>**HIPAA: **164.314(a)(2)(i)(c), 164.402<br>**PCI DSS v4.0: **12.10.1 |
| 67 | Does legal counsel review all third-party agreements? | **SOC 2: **CC2.3, CC3.2, CC3.4, CC4.1, CC4.2, CC9.2, P6.2<br>**ISO 27001 (2013): **A.15.1.2<br>**ISO 27001 (2022): **A.5.20<br>**HIPAA: **164.314(a)(1), 164.314(a)(2)(iii) |
| 68 | Do third-party agreements include provision for the security and protection of information and assets? | **SOC 2: **CC2.3, CC3.2, CC3.4, CC4.1, CC4.2, CC9.2, P6.2<br>**ISO 27001 (2013): **A.15.1.2<br>**ISO 27001 (2022): **A.5.20<br>**HIPAA: **164.314(a)(1), 164.314(a)(2)(iii) |
| 69 | Do you have the capability to recover data for a specific customer in the case of a failure or data loss? | **SOC 2: **A1.3<br>**ISO 27001 (2013): **A.12.3.1, A.17.2.1<br>**ISO 27001 (2022): **A.8.13, A.8.14<br>**HIPAA: **164.308(a)(7)(ii)(A), 164.310(d)(2)(iv) |
| 70 | Do you have the capability to restrict the storage of customer data to specific countries or geographic locations? | **GDPR: **44, 45, 46, 49 |
| 71 | Can you provide the physical location/geography of storage of a tenant’s data upon request? | **GDPR: **44, 45, 46, 49 |
| 72 | Do you provide the client with a list and copies of all subprocessing agreements and keep this updated? | **SOC 2: **CC2.3<br>**ISO 27001 (2013): **A.18.1.4<br>**ISO 27001 (2022): **A.5.34<br>**HIPAA: **164.316(a)<br>**GDPR: **19, 28, 29 |
| 73 | Do you mandate annual information security reviews and audits of your third party providers to ensure that all agreed upon security requirements are met? | **SOC 2: **CC2.3, CC3.2, CC6.4, CC9.2, P6.2, P6.4<br>**ISO 27001 (2013): **A.15.1.2, A.15.2.1<br>**ISO 27001 (2022): **A.5.20, A.5.22<br>**HIPAA: **164.308(b)(1), 164.314(a)(1)<br>**PCI DSS v4.0:** 12.8.3, 12.8.4 |
| 74 | Do you have external third party services conduct vulnerability scans and periodic penetration tests on your applications and networks? | **SOC 2: **CC1.2, CC3.1, CC3.2, CC3.4, CC4.1, CC4.2, CC5.1, CC5.2, CC7.1, CC7.2<br>**ISO 27001 (2013): **A.12.6.1, A.18.2.2, A.18.2.3<br>**ISO 27001 (2022): **A.5.36, A.8.8<br>**HIPAA: **164.308(a)(1)(ii)(A), 164.308(a)(1)(ii)(B)<br>**PCI DSS v4.0: **6.3.1, 11.3.1, 11.3.4<br>**GDPR: **32 |
| 75 | Are sales transactions, volumes, and values reviewed monthly and compared to budget, and are explanations documented for any significant variances or differences? | **SOC 2: **CC3.0 |
| 76 | Are sales agreements reviewed by personnel with requisite experience to determine if the revenue recognition criteria are met? | **SOC 2: **CC3.0 |
| 77 | Are sales transactions that trigger promotional allowances or discounts reviewed and approved by management prior to executing an agreement? | **SOC 2: **CC3.0 |
| 78 | Are total promotional discounts reviewed monthly and compared to budget for significant variance? | **SOC 2: **CC3.0 |
| 79 | Are the methods by which promotional discounts are calculated and granted reviewed monthly by management and documented? | **SOC 2: **CC3.0 |

## Related articles

- [Frameworks](frameworks.md)
- [Policies to Framework Summary](policies-to-framework-summary.md)
- [October 2024 Release: AWS Drata test](october-2024-release-aws-drata-test.md)
- [February 2025 Release: AWS and Azure Drata Tests](february-2025-release-aws-and-azure-drata-tests.md)
- [Control Mapping Updates for Policies - 10/17/2025](control-mapping-updates-for-policies-10-17-2025.md)
