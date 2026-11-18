# FedRAMP r5 Control Sets

Source: https://help.vanta.com/en/articles/11345796-fedramp-r5-control-sets
Collection: Audit Readiness ; Audit Readiness › Compliance Standards Library
Fetched: 2026-11-17

## Article text

## Frameworks Control Sets
A controls set is a collection of security controls designed to help organizations meet specific cybersecurity frameworks or compliance requirements. These sets are organized by FedRAMP r5 Impact Levels, providing a structured approach to managing your security program.
In the context of FedRAMP r5, controls are organized into Baselines. These baselines are designed to align with an organization's size, complexity, and risk tolerance, ensuring that the controls selected are both manageable and effective for the specific environment. Each Baseline provides a progressively more robust set of controls, addressing varying levels of cybersecurity risk.

## What Are the FedRAMP r5 Implementation Groups?
FedRAMP r5 is structured around four distinct control sets, each tailored to different types of organizations and risk profiles. Here’s a breakdown of these levels:
- 
Impact Level—Low: This applies to cloud systems where the loss of confidentiality, integrity, or availability would have limited adverse effects on organizational operations, assets, or individuals. Typically, these systems handle information that is publicly available or has a low sensitivity level.
- 
Impact Level - Li-SaaS: A specialized low-impact baseline for Low Impact Software-as-a-Service (Li-SaaS) systems. This baseline is designed for low-risk SaaS products that do not store sensitive information, offering a more streamlined control set for simple cloud services.
- 
Impact Level - Moderate: Covers systems where losing confidentiality, integrity, and availability would result in serious adverse effects on an agency’s operations, assets, or individuals. Serious adverse effects could include significant operational damage to agency assets, financial loss, or individual harm that is not loss of life or physical.
- 
Impact Level - High: Designed for cloud systems where the impact of a security breach would have severe or catastrophic effects on organizational operations, assets, or individuals. These systems typically involve highly sensitive data, such as law enforcement information, emergency services, and other critical infrastructure sectors.

## How to Change the FedRAMP r5 Control Baselines
Before changing the control set, carefully assess which Baseline aligns with your organization’s risk tolerance, operational requirements, and available resources. Remember that moving to a higher Baseline will introduce additional controls that may require significant investment in IT resources and staff training. Moving to a lower Baseline could reduce the control burden but may increase risk if not carefully considered.
Restrictions to Keep in Mind:
- 
Only Vanta Admins are authorized to make changes to the baselines.
- 
Baseline changes are not allowed during an active audit. Adjusting the baselines during an audit could alter the audit scope, impacting the accuracy of results and potentially increasing audit costs.

## Steps to Change the Control Set
- 
Locate the Control Set Filter:
- 
Navigate to the framework management section of your Vanta dashboard. Next to the framework name, a filter icon appears.
- 
View Available Baselines:
- 
Click the filter to view a list of available baselines (e.g., Impact Level Low, Li-SaaS, Moderate, High). The list will show the current set your organization is using and available sets for switching.
- 
Select Your New Baseline:
- 
After selecting a different baseline, a modal will appear displaying:
- 
Your current baseline control set.
- 
The baseline control set you are updating to.
- 
A comparison of the baseline controls between the two sets.
- 
Review the Impact:
- 
Carefully review the differences between the current and new baseline control set, including any controls that will be added or removed. Consider the change's operational and compliance implications.
- 
Confirm Your Changes:
- 
Once you have reviewed the differences, confirm the change. Be aware of the following:
- 
New controls may require additional resources to implement and maintain.
- 
Removed controls could weaken your security posture, leaving your organization vulnerable.
- 
Baseline/Control set changes do not automatically deactivate or add controls. You must manually manage specific controls.

## Impact on Your FedRAMP r5 Environment
Audit Scope Changes:
Changing the baseline control set during an audit is prohibited, as it could alter the scope and accuracy of the audit. Modifying the baseline control set mid-audit could also result in higher audit costs. Ensure that your audit is complete before making any baseline control set changes.
Operational Changes:
Moving to a different Baseline (e.g., from Low to Moderate or High) can introduce new controls that require:
- 
Increased operational capacity: Implementing new security measures may demand additional staff, training, or IT infrastructure.
- 
Continuous monitoring: As controls become more advanced, your organization will need to increase its efforts in monitoring and maintaining compliance.
Risk Exposure:
Lowering your Baseline (e.g., moving from Impact Level High to Moderate or Low) may reduce control complexity but can expose your organization to higher risk. Ensure that such changes do not leave critical assets unprotected or compromise your organization’s cybersecurity posture.

## Images

- none
