# Audit 102: Working With Your Auditor

Source: https://help.vanta.com/en/articles/11739823-audit-102-working-with-your-auditor
Collection: Audit Readiness ; Audit Readiness › Audits
Fetched: 2026-11-17

## Article text

Audience: Vanta customers and audit partners preparing to manage an audit in Vanta. Topics covered include: audit engagements managed in Vanta, including workflows using Vanta directly, IRLs, Fieldguide, or a legacy audit experience.
 
After you set up Vanta, align with your auditor on scope, timing, access, evidence expectations, and how the audit will be managed in Vanta.
 
The earlier you involve your auditor, the easier it is to avoid rework later. Use this article as your pre-audit conversation guide.
 
 

## How the auditor relationship works
Your auditor is an independent expert whose job is to assess whether your security controls are real, operational, and effective. They are not there to 
trick you or look for mistakes unnecessarily. They are there to evaluate the evidence and issue the applicable report, opinion, certification, or findings.
 
The audit relationship generally moves through three phases:
- 
Pre-audit planning: Align on scope, timing, audit approach, request-list format, and evidence expectations.
- 
Observation window or audit period: Controls are live, evidence is collected, often toward the end of the audit period or after the period end date, and your auditor reviews activity and artifacts.
- 
Report issuance or final review: Findings are documented, exceptions or remediation are discussed, and the final report or outcome is issued.
 
 

## Step 1: Confirm your auditor and access path
Before your auditor can review your Vanta environment, they need the right access path. Confirm these items early:
- 
Has the auditor been added to Vanta?
- 
Has the auditor completed Vanta training or worked with Vanta before?
- 
Does the auditor plan to log directly into Vanta, or connect through an auditor API, such as Fieldguide?
- 
Who will create the audit in Vanta: your team or the auditor? For the Fieldguide API to work, the customer must create the audit in Vanta and add the integration user as the auditor.
- 
If the auditor has not been trained on Vanta, ask them to contact [email protected] for access and training.
Before your auditor can see the audit view, your team needs to add the audit firm in settings. Either you or your auditor can create the audit with the appropriate auditors added. If your auditor uses Fieldguide, you need to be the one to create the audit and add the integration user as the auditor.
 
 

## Step 2: Confirm whether you will use an IRL or the legacy audit experience
Your audit setup depends on whether Information Request Lists (IRLs) are enabled in your Vanta account and whether your auditor wants to use Vanta directly or work from another audit platform. Only customers on a Professional or Enterprise package, or with the Audit Control SKU, have IRLs enabled in their Vanta instance.
 | 
Scenario | 
What to confirm | 
What to do in Vanta
 | 
IRL is enabled and auditor logs directly into Vanta | 
Confirm whether your team or the auditor will create the audit and upload the request list. Confirm owners, due dates, and request categories. | 
Create the audit (if the auditor isn’t doing so) and select the option to import your own request list. Review Requests, Controls, and Data & populations tabs. Make sure the auditor has uploaded the IRL. Otherwise, you will need to upload one.
 | 
Auditor uses Fieldguide or another API-connected workflow with IRLs | 
Confirm that the audit platform supports the IRL experience and whether the auditor can stay in their tool. | 
Create the audit in Vanta and select the option to import your own request list. Add the auditor integration user as the auditor (for Fieldguide). Confirm setup with your auditor before the audit starts. If you’re using Fieldguide, the auditor must upload the IRL.
 | 
IRL is not enabled or not being used (legacy audit view is being used) | 
The auditor will need to log directly into Vanta to use the legacy audit experience. Confirm whether auditor or customer will create the audit in Vanta. | 
Create the audit using Vanta’s default request list if advanced options are available. The auditor can upload custom requests as documents or evidence when needed.
 | 
Auditor has custom requests outside Vanta’s defaults | 
Ask whether Vanta’s evidence requests satisfy the audit requirements or whether the auditor will provide additional requests. | 
Add additional requests in Vanta so owners, evidence, and status are centralized.
To use IRLs, contact your account manager to confirm whether you need to upgrade your package or add the Audit Control SKU.
 
 

## Step 3: Review the audit scope with your auditor
Scope determines which systems, users, locations, processes, frameworks, criteria, vendors, and evidence are included. Deciding the following is important:
- 
Which framework or frameworks are in scope? Often these are determined by customer demands. 
- 
For SOC 2, which Trust Services Criteria are in scope: Security, Availability, Confidentiality, Processing Integrity, Privacy, or a combination?
- 
Which systems, environments, users, locations, and business processes are in scope? Typically, systems that store or process customer data are in scope.
- 
Which systems or environments are explicitly out of scope?
- 
Are all in-scope systems connected to Vanta or documented as manual evidence items?
- 
Are dev, test, sandbox, and non-production resources marked out of scope where appropriate?
Action item: Make sure all frameworks being audited are enabled or purchased in Vanta, the applicable SOC 2 criteria are added, all in-scope systems are integrated where possible, and out-of-scope assets are marked out of scope in Vanta.
 
 

## Step 4: Review controls and evidence
Review your controls in Vanta and add, delete, or edit them to fit your environment. Vanta includes default controls and evidence mappings, but your team should review and tailor them to your environment. Ask:
- 
Have we updated Vanta’s default controls to reflect our actual environment?
- 
Do we already have a control set to import into Vanta instead of using Vanta’s out-of-the-box controls?
- 
If I am using Vanta’s out of the box controls, did I make sure to review these controls to tailor them to my environment?
 
Action item: If your auditor needs a control list, export it from Frameworks > Controls > More options > Export controls. 
 
Questions to ask your auditor are:
- 
Will the evidence requests attached to controls in Vanta satisfy the audit requirements?
- 
If there are additional requests that Vanta doesn’t cover, can you provide the list so we can track them in Vanta?
- 
Are there any systems where you prefer manual evidence over automated tests?
 
Action item: If the auditor needs evidence broken out by framework codes or controls, export framework evidence from Frameworks > Controls > More options > Export framework evidence.
 
If you receive additional requests, upload and track them in your Vanta documents section so your team can assign owners and keep evidence in one place.
 
 

## Step 5: Discuss timeline and communication
Before the audit starts, align on communication expectations and milestones. This prevents surprises and helps your team plan internal work.
- 
What are the key audit milestones, such as kickoff, observation window or as-of date, evidence upload deadline, draft report, and final report?
- 
How often should we expect communication during the observation window? 
- 
How will we communicate? Through evidence request comments? Email? Slack?
- 
Should we expect to see status changes on evidence in Vanta? 
- 
What meetings should we expect before, during, and after the audit?
- 
If remediation is required, how will that affect the report timeline?
- 
Can we handle all requests through Vanta or the API instead of email?
- 
Respond quickly to auditor requests in Vanta, even if there are no major updates.
 
 

## Step 6: Understand SOC 2 Type I vs. Type II
 | 
Question | 
SOC 2 Type I | 
SOC 2 Type II
 | 
What it assesses | 
Whether controls are designed appropriately at a point in time | 
Whether controls operated effectively over an observation period
 | 
Typical duration | 
A one-day snapshot or as-of date | 
Usually 3-12 months; many first-time audits use a 3-month period
 | 
Report timing | 
Often issued several weeks after the audit date | 
Often issued several weeks after the observation period ends
 | 
Best for | 
Early proof that your program is designed appropriately | 
Stronger assurance and what many customers ultimately request
Typically, customers start with a Type I audit and move to a Type II audit, but this is not required.
 
 

## What not to change during the observation window
Once the observation window starts, avoid making major scope, evidence, or control changes without checking with your auditor first. Well-intentioned changes can create exceptions.
- 
Do not disable tests without auditor approval.
- 
Do not remove users or systems from scope without auditor approval.
- 
Do not enable dev or test resources if they should remain out of scope.
- 
Do not disable production resources without discussing the impact.
- 
Do not change SLA settings during the window.
- 
Do not alter uploaded documents such as policies, org charts, or job descriptions unless your auditor confirms the change is acceptable.
 
 

## Common pitfalls
- 
Waiting too long to involve the auditor.
- 
Assuming the auditor will use the same workflow as your previous audit.
- 
Not confirming whether IRL, legacy audit experience, Fieldguide, or direct Vanta access will be used.
- 
Not aligning on scope before evidence collection begins.
- 
Using default controls without tailoring them to your environment.
- 
Uploading additional auditor requests outside Vanta and losing track of owners or status.
- 
Making changes during the observation window without auditor approval.
 
 

## What to do next
- 
Schedule an audit kickoff call before the audit window opens
- 
Confirm auditor access, training, workflow, and request-list format
- 
Review Audit 103: The Audit Readiness Checklist  <https://help.vanta.com/en/articles/11345845-audit-readiness-checklist>before scheduling or opening the observation window
- 
Ask your CSM for help if your team and auditor need support aligning on the Vanta workflow.

## Images

- none
