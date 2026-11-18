# Audit 103: The Audit Readiness Checklist

Source: https://help.vanta.com/en/articles/11345845-audit-103-the-audit-readiness-checklist
Collection: Audit Readiness ; Audit Readiness › Checklists
Fetched: 2026-11-17

## Article text

Audience: Vanta customers approaching an audit window. Topics covered include: Pre-audit readiness, audit setup, evidence preparation, auditor handoff, and observation-window behavior in Vanta.
 
You are approaching your audit and want to make sure everything in Vanta is in the right state before your auditor starts reviewing. Use this article as your pre-audit operating checklist.
 
Start this review at least 2–4 weeks before your target audit start date so you have time to fix gaps, align with your auditor, and avoid last-minute evidence work.
 
📖 Learn more: The Vanta team has supported companies through thousands of audits. Download the Audit Readiness Checklists listed below.  SOC_2_Audit_Readiness_Checklist.pdf <https://vanta-e0817867462a.intercom-attachments-1.com/i/o/t4a8cs4z/1523789798/385634f50da43d5d3ac89084ffa3/SOC_2_Audit_Readiness_Checklist.pdf?expires=1795068000&signature=d55a6565369d7bb6505c3e6555284937eb186c71c6ec5159c26fedafc9ae05be&req=dSUlFc52lIZWUfMW3Hu4gYaPiOHC67r4ZD5cJfNT1LZZ6ca9G%2FCdwNvt7M%2FW%0Ang%3D%3D%0A>
 
 
 

## Before you begin: add and align with your auditor
Add your auditor early so they can advise on scope, evidence expectations, and workflow. Auditors can’t access your Vanta instance until you grant access and create the audit.
- 
Add the audit firm in your Vanta settings
- 
Create the audit with the appropriate auditors added (or ask the auditor to do this)
- 
If the auditor uses Fieldguide, add the integration user as the auditor and do not upload the request list.
- 
Verify the auditor has completed Vanta training or has worked in Vanta before.
- 
If the auditor needs training, ask them to contact [email protected].
- 
Confirm audit type, start date, observation window, request-list format, and communication cadence.
 
 

## Confirm your audit workflow
Before uploading evidence or opening the audit, confirm how your audit will be managed in Vanta.
 | 
Readiness question | 
Why it matters | 
Action
 | 
Do we have IRLs (Information Request Lists) as part of our package? | 
IRLs let your team or auditor manage custom request lists, owners, deadlines, and evidence in one workspace. | 
If you are on a Professional or Enterprise package or have the audit control SKU, select the option to import your own request list when creating the audit.
 | 
Will the auditor use Fieldguide or another API-connected workflow? | 
Some auditor tools are built around the IRL experience rather than the legacy audit experience. | 
Confirm the integration path and, if using Fieldguide, add the integration user as the auditor.
 | 
Will the auditor log directly into Vanta? | 
If IRL is not enabled or not being used, the auditor may need to review evidence directly in Vanta. | 
Confirm the auditor is comfortable using Vanta directly and understands the available audit view.
 | 
Will we use Vanta’s default request list? | 
The legacy audit experience may use Vanta’s default request list rather than a custom IRL. | 
If advanced options appear, select the default request-list path when creating the audit if using the legacy audit experience with Vanta’s default request list. 
 | 
Does the auditor have custom requests? | 
Auditors may ask for evidence beyond Vanta’s standard prompts. | 
Upload and track additional requests in Vanta so you know what to expect for the audit. 
 
 

## Preview what your auditor can see
Before granting access or handing off the audit, preview the engagement so your team understands what the auditor will be able to see.
- 
Create the audit in Vanta before granting auditor access.
- 
Review the audit view and confirm the scope looks correct.
- 
If using an IRL, review the Requests, Controls, and Data & populations tabs.
- 
Confirm no out-of-scope systems, users, environments, or assets are included.
- 
Confirm additional manual requests are uploaded, assigned, and easy to find.
 
 

## Company settings and audit setup
- 
Confirm all company information is complete and accurate
- 
Verify audit type, start date, auditor, and observation window are correctly entered in Vanta
- 
Confirm users are added and roles are assigned correctly.
- 
Confirm all frameworks being audited are enabled or purchased in Vanta
- 
For SOC 2, confirm the correct Trust Services Criteria are in scope
- 
Export controls or framework evidence if your auditor wants to review them before the audit starts
To export controls, go to Frameworks > Controls > More options > Export controls. To export evidence by framework codes or controls, go to Frameworks > Controls > More options > Export framework evidence.
 
 

## Integrations and scope
Scope issues are one of the easiest ways to create audit friction. Review scope before the window opens.
- 
Only production environment systems are marked as in scope unless your auditor confirms otherwise
- 
All in-scope systems are connected to Vanta where an integration is available
- 
Systems that cannot be integrated are documented for manual evidence collection
- 
Dev, test, sandbox, and non-production resources are marked out of scope where appropriate
- 
Assets that are not in scope are marked out of scope in the integrations page
- 
Tell your auditor which in-scope systems are not connected to Vanta. These systems may require manual evidence.
 
 

## Policies
Auditors usually check whether each policy exists, is current, and is followed.
- 
Review all policies in Vanta.
- 
Confirm policy PDFs or published versions have been created or reviewed within the last 12 months, unless your auditor gives a different requirement.
- 
Confirm required employees have read and accepted policies before the audit begins.
- 
Configure policy SLAs and confirm they align with approved policies.
- 
Do not alter uploaded policies during the observation window without auditor approval.
 
 

## Vulnerabilities
Vulnerability management is a required control in many audits. Your auditor will want evidence that scanning exists, issues are tracked, and remediation follows your policy.
- 
Connect your vulnerability scanning tool or upload manual evidence such as scan results and remediation samples
- 
If using a third-party tool that is not integrated with Vanta, upload screenshots or exported reports directly
- 
Review the SLA violations tab and acknowledge or remediate violations
- 
Document remediation plans for open high or medium vulnerabilities
- 
Confirm with your auditor before marking vulnerabilities out of scope or deactivating monitoring
- 
Prepare evidence for scanning configuration, ticketing or issue tracking, severity definitions, and alerting procedures
Depending on your audit type, your auditor may also request a penetration test. For example, some PCI levels require one, and many SOC 2 auditors consider it a best practice.
 
 

## Access
Access control is a core part of nearly every security audit. Your auditor will verify that accounts belong to real, individual employees and that access is reviewed appropriately.
- 
Link all user accounts to employees in Vanta.
- 
Verify that no shared accounts are present unless formally approved and documented.
- 
Review cloud infrastructure, identity providers, version control, and other integrated systems.
- 
If Access Reviews are enabled, set up automated review schedules
- 
Assign an owner to each review.
- 
Create manual reviews where automated reviews are not available.
- 
Confirm offboarding evidence is complete for terminated employees.
 
 

## Risk assessment
A completed risk assessment is required for most audit types. Vanta’s risk module helps you document risks, owners, assessments, and treatment plans.
- 
Configure risk management settings.
- 
Upload existing risks or select risks from Vanta’s Risk Library.
- 
Review the Risk Register and assign owners.
- 
Complete assessments for each in-scope risk.
- 
Document a treatment plan for every identified risk.
- 
Create a Risk Snapshot as audit evidence before the as of date (SOC 2 Type I) or within the audit window (SOC 2 Type II).
 
 

## Vendors
Third-party vendors with access to sensitive data are usually in scope. Auditors will verify that your team reviewed and documented vendor security posture.
- 
Make sure all vendors with access to sensitive data are marked as high or critical risk, have completed vendor reviews, and have SOC 2 reports reviewed where available.
- 
Make sure vendor reports are the latest available versions.
- 
Ensure all in-scope vendors are listed, including vendors added manually
- 
Upload a SOC 2 Type II, SOC 3, ISO 27001 report, or equivalent evidence for each vendor where available.
- 
Complete security questionnaires for vendors that do not have a report uploaded.
- 
Add a vendor review comment that summarizes your findings.
- 
Add the vendor review date for each entry.
- 
Confirm vendor scope with your auditor if you are unsure whether a vendor should be included.
 
 

## Frameworks and controls
Controls connect your framework requirements to tests, documents, policies, risks, and other evidence. Review them before your auditor arrives.
- 
Review the Frameworks page to confirm progress across all active frameworks
- 
Use Vanta’s default controls as a starting point if that is your audit approach
- 
Tailor default controls to your environment where needed (add/delete/edit controls)
- 
If using controls from a previous audit or a custom control framework, upload them to the Controls section and map evidence to the new controls
- 
Delete or replace out-of-the-box controls only when your team and auditor agree on the approach
- 
Add custom controls needed to cover gaps
- 
Assign owners to all controls
- 
Review control language with owners so they can explain their process in their own words
Example: An auditor may ask your HR lead to walk through onboarding. If the process they describe does not match the onboarding policy or evidence, that mismatch could become an exception.
 
 

## Documents and evidence
- 
Complete all pre-audit documents.
- 
Use the Time Sensitivity filter to identify documents that should wait until the audit period starts.
- 
Upload additional auditor requests to Vanta rather than tracking them only in email.
- 
Assign owners and due dates for manual evidence items.
- 
Confirm evidence is mapped to the correct controls or framework requirements.
- 
Do not alter uploaded documents during the observation window without auditor approval.
 
 

## Final checklist: before the observation window opens
 | 
Area | 
Ready when...
 | 
Auditor setup | 
Auditor is added, trained or enabled, and aligned on IRL, legacy audit experience, Fieldguide, or direct Vanta workflow.
 | 
Scope | 
Production systems, users, frameworks, criteria, vendors, and environments are correctly marked in or out of scope. Review the integrations page. 
 | 
Tests and controls | 
Automated tests are passing or have documented remediation plans; controls have owners and mappings.
 | 
Documents | 
Required documents are complete, policies are approved and accepted, and manual requests are tracked in Vanta. Any additional audit-firm requests are uploaded to the Documents section to help prepare for the audit.
 | 
Risk and access | 
Risk settings are configured, a Risk Snapshot is created, accounts are tied to individual users, and access reviews are complete or scheduled. For Type II audits, complete this during the observation period. For Type I audits, complete this before the as-of date.
 | 
Vulnerabilities and vendors | 
Open vulnerabilities have documented remediation plans, vendor reviews are complete, and supporting evidence is uploaded.
 | 
Auditor preview | 
Your team has previewed what the auditor can see and confirmed no out-of-scope information is exposed.
 
 

## During the observation window: the rules
 | 
Do | 
Do not
 | 
Check the Tests page daily | 
Disable tests without auditor approval
 | 
Respond promptly to auditor requests in Vanta | 
Remove users or systems from scope without auditor approval
 | 
Keep tests green or document remediation plans | 
Enable dev or test environment resources unless they are in scope
 | 
Communicate changes to your auditor before making them | 
Disable production resources, change SLA settings, or alter uploaded documents without auditor approval
 
 

## How Vanta helps
- 
Automated test monitoring flags failing controls in real time.
- 
Audit readiness views help you track progress across controls, tests, and documents.
- 
IRLs centralize auditor requests, owners, deadlines, and evidence when enabled
- 
AI evidence checks can help identify gaps before auditor handoff where available.
- 
Auditor access controls let you manage what your auditor can see and when.
 
 

## What to do next
- 
Work through this checklist 2-4 weeks before your target audit start date.
- 
Meet with your auditor to review your Vanta account before opening the window.
- 
Preview the audit view before granting access or handing off the engagement.
- 
Once ready, notify your auditor using the agreed readiness process or Audit Readiness Form if applicable.
 
 

## Related articles
- 
Information Request List (IRL) in Vanta <https://help.vanta.com/en/articles/12293647-information-request-list-irl-in-vanta>
- 
Previewing Vanta as an auditor <https://help.vanta.com/en/articles/11345983-previewing-vanta-as-an-auditor>
- 
Exporting controls and framework evidence <https://help.vanta.com/en/articles/14998654-exporting-your-data-from-vanta>

## Images

- none
