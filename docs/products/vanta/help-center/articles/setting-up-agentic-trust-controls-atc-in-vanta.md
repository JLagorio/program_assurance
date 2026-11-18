# Setting Up Agentic Trust Controls (ATC) in Vanta

Source: https://help.vanta.com/en/articles/18183352-setting-up-agentic-trust-controls-atc-in-vanta
Collection: Security Frameworks
Fetched: 2026-11-17

## Article text

## Setting Up Agentic Trust Controls (ATC) in Vanta
Agentic Trust Controls (ATC) is an open-source framework created by Vanta to help organizations manage the security and governance risks of AI agents. It includes controls for organizations that build agents, deploy agents from other providers, or both.
 
ATC covers 12 risk domains, including agent identity, tool use, human oversight, monitoring, and accountability. Use this guide to choose your baseline, assign owners, document your processes, and track supporting evidence in Vanta.
 
⚙️ User permissions: You need permission to manage frameworks and controls to complete this workflow. Your assigned role may limit the actions you can take. Refer to User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>.
 
 

## Before you begin
Identify the agents and business processes you want to govern. For each agent, document:
- 
Its purpose and owner
- 
The systems, tools, and data it can access
- 
Whether your organization builds it or deploys it from another provider
- 
The actions that require human approval
An AI agent can perform tasks and take actions toward a goal, like retrieving information, updating records, or calling tools. For example, a customer support agent might retrieve account information and issue a refund. Its safeguards should define which accounts it can access, when it needs approval, and how its actions are recorded.
 
ATC complements your existing security and governance program. Continue maintaining your other framework requirements, and reuse evidence where it supports the relevant control.
 
 

## Activate ATC and choose your baseline
To set up ATC:
- 
Go to Frameworks.
- 
Find Agentic Trust Controls among the available frameworks.
- 
Start the activation flow.
- 
Select the baseline that matches your organization’s responsibilities.
- 
Complete the activation flow.
- 
Go to the ATC framework details page to review the included controls.
Use the following table to choose your baseline:
 | 
Baseline | 
Select this when
 | 
Developer | 
Your organization builds agentic systems, like an agent embedded in your product.
 | 
User | 
Your organization deploys agents built by other providers, like an agent in a business application.
 | 
Both | 
Your organization builds agents and deploys agents from other providers.
The User baseline covers your responsibilities when deploying another provider’s agents. These include managing access, oversight, and internal accountability.
 
 

## Review your framework requirements
To review ATC controls:
- 
Go to Frameworks.
- 
Click the ATC framework.
- 
Review the controls included in your baseline.
- 
Compare each control’s requirements with your current practices.
- 
Review the supporting evidence requirements.
Identify:
- 
Safeguards already implemented
- 
Existing evidence that supports the requirements
- 
Missing safeguards or documentation
- 
Work that needs help from engineering, security, IT, legal, or business owners
The framework details page shows control progress and evidence readiness. Use it to identify where to begin and monitor progress.
 
 

## Assign control owners
To assign an owner:
- 
Go to Controls.
- 
Find the ATC control you want to assign.
- 
Click the control’s Owner field.
- 
Select the responsible person or team.
Choose an owner who can make sure the control operates and its evidence stays current. For example, IT might own access controls for a deployed agent, while engineering owns safeguards for an agent your company builds.
 
Review ownership of mapped tests and documents, and assign responsibility where needed.
 
ℹ️ Note: Assigning someone as a control owner does not automatically give them access to the framework or its mapped policies. Refer to User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area> for access details.
 
 

## Document how each control operates
To add implementation details:
- 
Go to Controls.
- 
Click the control you want to document.
- 
Enter your process in Implementation details.
- 
Save your changes.
Include:
- 
Who performs the work
- 
Which agents, systems, and tools are covered
- 
How the safeguard operates
- 
When it runs or is reviewed
- 
What evidence it produces
For example:
The Support Operations team configures the refund agent to require manager approval for refunds above the approved threshold. The team reviews the configuration monthly and retains approval records and configuration exports as evidence.
 
Describe current practices accurately. Track planned improvements separately.
📖 Learn more: Control Implementation Details <https://help.vanta.com/en/articles/17602559-control-implementation-details>
 
 

## Review supporting evidence and policies
To review the work supporting a control:
- 
Go to Controls.
- 
Click an ATC control.
- 
Review its mapped tests, documents, and policies.
- 
Complete the relevant work described below.
- 
Repeat for the remaining controls.
 | 
Item | 
Action
 | 
Tests | 
Review results and follow remediation guidance for failing tests.
 | 
Documents | 
Review the evidence requirements and submit records that demonstrate the control operates.
 | 
Policies | 
Update policies to reflect your practices and complete the relevant approval and employee acceptance steps.
Before reusing evidence, check that it covers the relevant agents, systems, activities, and time period.
 
A policy requiring approval explains the expectation. Configuration records and completed approvals help demonstrate that the requirement is followed.
 
 

## Address gaps and monitor progress
To review your progress:
- 
Go to Frameworks.
- 
Click the ATC framework.
- 
Review control completion and evidence readiness.
- 
Identify controls with missing or failing evidence.
- 
Assign follow-up work to the responsible owners.
On the Controls page, control status reflects mapped tests and documents:
 | 
Status | 
Meaning
 | 
Ok | 
All mapped automated tests and documents are passing.
 | 
Needs evidence | 
The control has no mapped tests or documents, or one or more are not passing.
Passing evidence supports your readiness review. It does not represent an auditor’s assessment or establish that every agent risk has been addressed.
 
Prioritize gaps based on each agent’s access and the impact of its actions. Review progress regularly.
 
 

## Keep your baseline current
Review your baseline when your organization starts building agents, deploys agents from more providers, or changes its responsibilities.
To change your baseline:
- 
Go to the ATC framework details page.
- 
Select More.
- 
Select Change control set.
- 
Review your baseline selection.
- 
Check the proposed changes before confirming.
- 
Review newly included controls and assign owners.
Update implementation details and evidence when agents gain new tools, access different data, or take on more responsibilities.
 
 

## ATC and certification
We provide the framework and tools to manage supporting evidence. We do not issue an ATC certification.
 
If you plan to include agent controls in an existing audit, agree on the scope and evidence expectations with your auditor.
 
 

## Related resources
- 
Framework Details Page <https://help.vanta.com/en/articles/11345369-framework-details-page>
- 
Controls Page <https://help.vanta.com/en/articles/11345373-controls-page>
- 
Control Implementation Details <https://help.vanta.com/en/articles/17602559-control-implementation-details>
- 
Getting Started with Policies <https://help.vanta.com/en/articles/11345363-getting-started-with-policies>
- 
Agentic Trust Controls <https://www.trustcontrols.ai/>

## Images

- none
