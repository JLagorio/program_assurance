# Framework Control Sets (CIS: Center of Internet Security)

Source: https://help.vanta.com/en/articles/11345798-framework-control-sets-cis-center-of-internet-security
Collection: Audit Readiness ; Audit Readiness › Compliance Standards Library
Fetched: 2026-11-17

## Article text

## Frameworks Control Sets
A control set is a collection of security controls designed to help organizations meet specific cybersecurity frameworks or compliance requirements. These sets are organized by levels or tailored requirements, providing a structured approach to managing your security program.
In the context of CIS (Center for Internet Security) v8.1, control sets are organized into Implementation Groups (IGs). These groups are designed to match an organization's size, complexity, and risk tolerance, ensuring that the selected controls are manageable and effective for the organization’s specific environment. Each IG offers progressively more robust controls to address varying cybersecurity risk levels.
 

## What Are the CIS Implementation Groups?
CIS v8.1 is structured around three Implementation Groups (IGs), each tailored to different types of organizations. Here's a detailed breakdown:
- 
IG1 (Implementation Group 1):
Designed for small to medium-sized organizations with limited IT or cybersecurity resources. The focus is on fundamental cybersecurity hygiene, addressing the most basic threats. This group typically applies to organizations that have minimal exposure to cybersecurity risks or handle less sensitive data. IG1 focuses on implementing controls that are easier to manage, with lower overhead.
- 
IG2 (Implementation Group 2):
Aimed at organizations with moderate complexity in their IT environment and a higher need for robust security measures. IG2 is appropriate for organizations that manage more sensitive data and face increased cybersecurity risks. The controls in IG2 build upon IG1, adding additional layers of protection, including more advanced monitoring, authentication, and response capabilities.
- 
IG3 (Implementation Group 3):
Designed for large organizations or those with highly sensitive information, such as financial institutions or healthcare providers. These organizations typically face elevated risk levels, requiring advanced security controls to protect against sophisticated threats. IG3 controls are the most comprehensive, covering everything from incident response to detailed auditing, encryption, and continuous monitoring.
 

## Understanding the Difference Between SOC 2 TSCs and CIS Implementation Groups
When updating your own Trust Services Criteria (TSCs) in Vanta, it's important to know that these criteria are specific to the SOC 2 framework. They include categories like Security, Availability, Confidentiality, Processing Integrity, and Privacy.
 
If you're seeing references to CIS Implementation Groups (IGs), these relate to the CIS Controls framework, not SOC 2. CIS IGs help organizations prioritize security controls based on their size, complexity, and resources.
 
SOC 2 TSCs and CIS Implementation Groups do not directly map to one another, as they serve different purposes:
- 
SOC 2 TSCs are used to evaluate controls for trust and assurance in a service organization
- 
CIS IGs guide how to implement cybersecurity controls based on maturity level
To keep things clear:
- 
If you're customizing controls under the SOC 2 framework, focus on the TSCs
- 
If you're working with the CIS framework, CIS IGs will guide your control selection
We recommend reviewing the framework settings carefully to ensure you're updating the correct criteria for your needs.
 

## How to Change the CIS v8.1 control set
Before changing the control set, it's important to assess which IG aligns best with your organization’s needs and resources. Keep in mind that moving to a higher IG can introduce additional controls that may require significant investment in IT resources and staff training. Similarly, moving to a lower IG may reduce the control burden, but it could expose your organization to increased risk if not carefully considered.
 

## Restrictions to Keep in Mind:
- 
Only Vanta Admins have the privilege to make changes to the control set.
- 
Changing the control set is not allowed during an active audit. Modifying the control set during an audit could alter the audit scope, potentially impacting the accuracy of the audit results and increasing audit costs.
Steps to Change the Control Set:
- 
Locate the control set filter:
You can just navigate to the framework management section of your Vanta dashboard. You will see a filter icon located next to the framework name.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516754608/1f45f2d500fc932c650eea23b4d2/30938473145364?expires=1794967200&signature=f75e320e6f80fcdc5651cbfd5f2f9ed018fb8bc32504dc23c05d4532a859f53b&req=dSUmEM57mYdfUfMW1HO4zUFHpfVsYUdXVHF9jd%2BFTlKtg4n0qA%2F43zMuJu8u%0AxfS2MK87mAg9kgaMSR8%3D%0A>
- 
View available control sets:
Click the filter to view a list of available control sets (IG1, IG2, IG3). This list will show the current set your organization is using and the available sets you can switch to.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516754609/b5c789e18ad9fd4d856be18912a5/30938473147796?expires=1794967200&signature=4028b7aa5e964f9d53303beef5c625cc5538ab861fffe37bf81f4fd4d90198d6&req=dSUmEM57mYdfUPMW1HO4zZQ%2ByYuCYgkg84XeJLZUg6rs%2B1lN2qGxJFb9sTWW%0AOeKZ7PE8iwV%2FDiQpWNU%3D%0A>
- 
Select your new control set:
Once you select a different control set, a modal will appear. This modal will display the following:
- 
The current control set your organization is using.
- 
The control set you are about to update to.
- 
A comparison highlights the controls differences between your current set and the new one.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516754611/74fc5d63615011ef7db13c89df63/30938473149972?expires=1794967200&signature=d4c6d24c08a63a4afd852a759517d1235775e16758b85cd4a8970c8dbbf6c45b&req=dSUmEM57mYdeWPMW1HO4zR8qQqFlmUK8qwGx0w%2FMtLcqlNYzt1byb8kEjkxQ%0AUn6EdvQpDfzOJKTQPsA%3D%0A>
- 
Review the impact:
Carefully review the differences between your current control set and the one you plan to implement. This includes any new controls that will be introduced or any existing controls that will be removed.
- 
Confirm your changes:
After reviewing, confirm the change. Be aware that updating the control set can have a significant impact on your compliance environment, including:
- 
New controls may require additional resources to implement and maintain.
- 
Removed controls could reduce your organization’s overall security posture, potentially leaving it more vulnerable to cyber threats.
- 
Changes to your control set will not automatically deactivate or add controls. If you deactivate a control manually or introduce a new one, these actions will not reflect in the control set itself.
Impact on Your CIS Environment:
- 
Audit Scope Changes:
Modifying your control set, especially during an active audit, can disrupt the audit process. Changes in the control set may alter the scope of the audit, affecting its accuracy and potentially leading to additional audit fees. If your audit is active, you must wait until it is completed before adjusting your control set.
- 
Operational Changes:
Moving to a different IG, particularly from IG1 to IG2 or IG3, may introduce controls that require:
- 
Increased operational capacity: Implementing new security controls may require additional staff, training, or IT infrastructure.
- 
Ongoing monitoring and maintenance: As controls become more advanced, your organization will need to continuously monitor these controls to ensure continuous compliance and security.
- 
Risk Exposure:
Lowering your control set (e.g., moving from IG3 to IG2) might reduce complexity and increase risk exposure. Ensure that such a change does not leave critical assets unprotected or undermine your organization's cybersecurity strategy.

## Images

- [image 01] ../../images/ux/frameworks/framework-control-sets-cis-center-of-internet-security--01.png
- [image 02] ../../images/ux/frameworks/framework-control-sets-cis-center-of-internet-security--02.png
- [image 03] ../../images/ux/frameworks/framework-control-sets-cis-center-of-internet-security--03.png
