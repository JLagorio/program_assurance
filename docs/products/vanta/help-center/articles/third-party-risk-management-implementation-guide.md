# Third Party Risk Management Implementation Guide

Source: https://help.vanta.com/en/articles/11487926-third-party-risk-management-implementation-guide
Collection: Risk, TPRM & AI Gov ; Risk, TPRM & AI Gov › Third-Party Risk Management
Fetched: 2026-11-17

## Article text

Third-Party Risk Management (TPRM) was previously called Vendor Risk Management (VRM). This guide is your go-to resource for implementing TPRM, from setting up workflows to completing your first vendor assessment (such as a security assessment). Designed for companies with 200 or more employees, this guide ensures your team gets up and running confidently and effectively.
 
By the end of this guide, you will:
- 
Understand how to classify and manage vendors
- 
Complete a full vendor assessment (such as a security review)
- 
Automate evidence collection and risk workflows
- 
Save time and gain confidence with Vanta AI support
​
📖 Learn more: Explore the Vanta Academy <https://learningvanta.sana.ai/>—take our self-paced course or join an instructor-led workshop on policy writing. If you can’t attend live, you’ll receive a recording after.
 

## 90-day plan

## Days 1–30: Foundations and initial workflows
Goal: Establish operational groundwork and onboard vendor data.
 
Key Activities:
- 
Assign a TPRM owner (typically a member of the GRC, Security, or Procurement team)
- 
Import vendor data from procurement, legal, IT, or finance
- 
Classify vendors by risk level (e.g., high, medium, low) and business criticality
- 
Define your vendor review criteria (e.g., access to sensitive data, compliance impact)
- 
Build initial workflows for vendor onboarding, due diligence, and approvals
- 
Configure notification rules, ownership assignments, and SLA tracking
- 
Train internal stakeholders on vendor classification and review processes
Deliverables:
- 
Vendor inventory loaded and classified by risk tier
- 
Initial workflows created for review processes
- 
Stakeholder training completed

## Days 31–60: Launch assessments and automate evidence collection
Goal: Conduct vendor assessment and reduce manual workload through automation.
 
Key Activities:
- 
Launch formal assessments (e.g., security reviews) for high-risk vendors (start with a prioritized subset)
- 
Automate the distribution of questionnaires (e.g., SIG, CAIQ) and evidence collection.
- 
Use Vanta AI to analyze documentation (e.g., SOC 2 reports, penetration tests)
- 
Track remediation tasks and assign follow-ups
- 
Refine workflows based on stakeholder feedback
- 
Communicate with vendors to ensure smooth participation in the review process
Deliverables:
- 
Vendor assessments completed for high-risk vendors
- 
Automated workflows for questionnaires and document analysis in place
- 
Review the feedback loop established

## Days 61–90: Optimize and scale
Goal: Scale the process, generate reporting, and embed TPRM in your risk posture.
 
Key Activities:
- 
Expand reviews to medium- and low-risk vendors based on available capacity
- 
Use dashboards and reporting to track assessment status, remediation progress, and risk levels
- 
Integrate workflows with tools like JIRA, Slack, or GRC platforms
- 
Hold a retrospective with stakeholders to optimize the process
- 
Formalize your vendor review cadence and update TPRM policy documentation
- 
Train backup reviewers and build resilience into your review process
Deliverables:
- 
Scalable, repeatable end-to-end TPRM process
- 
Internal reporting package for compliance and leadership
- 
Documented TPRM policy and assessment cadence
By Day 90, your team will be able to:
- 
Classify and assess vendors confidently
- 
Run consistent and automated assessment workflows
- 
Leverage Vanta AI to reduce manual workload
- 
Demonstrate defensible vendor due diligence for audits and customer assessments
 

## Stage 1: Discovery and preparation

## Key questions to answer with your team
- 
Do you have a procurement workflow?
- 
Zip: Use Zip integration
- 
Task tracker (e.g., Jira): Set up task tracker integrations
- 
Coupa or ServiceNow: Use Vanta's API and developer docs
- 
No workflow: Use the API to simulate intake forms (e.g., trigger risk scoring from intake data)
- 
Do you use a Shadow IT tool?
- 
If yes, skip vendor Discovery.
- 
If no, use Discovery with your IdP & MDM.
- 
Do you have a list of vendors to import?
- 
Use Vanta's import tool or API. Include:
- 
Vendor category / risk level
- 
Full URL (used to fetch logos and Trust Center data)
- 
Vendor contact email (enables auto evidence requests)
- 
Do you have past security reviews to attach?
- 
For now, upload as PDFs to each vendor's "Evidence" section under "Other Security Assessment".
- 
Want to track findings in Jira?
- 
Set up the Jira integration
- 
For other tools, use the API for custom workflows
 

## Stage 2: Configuration and setup

## Settings to configure before import
- 
Inherent risk rubric <https://help.vanta.com/en/articles/11345560-inherent-risk-rubric-customization>
- 
Assign risk levels based on vendor category and data type
- 
Important: Set this before importing vendors
- 
Assessment settings <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews#h_db4b354092>
- 
Cadence: How often reviews occur (e.g., yearly for high-risk vendors)
- 
Preferred Evidence: Automatically request SOC 2, ISO, etc.
- 
Preferred Questionnaire: Auto-send standard forms
- 
Automation: Auto-request evidence 30 days before reviews
- 
All settings can be overridden at the vendor level or assessment level

## Saving time with TPRM: What features matter most
 | 
Feature | 
Benefit | 
How to Use
 | 
Auto-requesting evidence | 
Hands-off collection | 
Works if the preferred evidence & vendor contact email are set
 | 
Pull from Trust Centers | 
Faster access to SOC2, policies | 
Automatically pulls from vendor public Trust Centers
 | 
Reuse old evidence | 
Saves time | 
Helpful if the last SOC 2 is still valid
 | 
AI + vendor answer comparison | 
Confident decisions | 
Use a side-by-side view for clarity

## Advanced configuration
- 
Templates: Use custom templates for questionnaires, DPAs, and BAAs
- 
Metadata Management: Define groups, owners, and account managers
- 
Security Owner Assignment: Tag the responsible internal users
- 
Findings Workflow: Integrate with Jira for task follow-up
 

## Stage 3: Complete a security assessment
Follow these steps to complete your first assessment, oftentimes a security assessment:
 | 
Step | 
Why it Matters | 
Pro Tips
 | 
Add a vendor | 
Kicks off the workflow | 
Vendors added through procurement are 30% more likely to be reviewed
 | 
Start a security assessment | 
Initializes the assessment process | 
Add a due date, and you are 13% more likely to complete
 | 
Add evidence | 
Essential for AI assistance | 
Pull from the Trust Center or upload manually
 | 
Send questionnaire/evidence request | 
Engages vendors | 
Assessments with responses are 2x more likely to be completed
 | 
Review answers | 
AI + vendor answers | 
Select final answers, flag gaps
 | 
Add findings | 
Captures risk | 
Link findings, create Jira tickets if needed
 | 
Make a risk decision | 
Final assessment | 
Set residual risk, add summary
 | 
Schedule next assessment | 
Enables automation | 
Vanta will auto-request evidence next time
 

## Ongoing success
- 
Complete other assessments: Continue with other types of assessments needed for each vendor, such as privacy, AI, legal, or your custom type.
- 
Monitor assessment completion: Use the assessments table to track progress. Use "Needs Review" Tab: Focus on vendors ready for analysis
- 
Regularly update vendors: Add new vendors monthly or as they come in
- 
Maintain automation settings: Keep global settings current

## Best practices for success
 | 
Action | 
Why it Works
 | 
Start with a strong rubric | 
Drives automation and consistency
 | 
Add vendors through procurement | 
Improves completion rates
 | 
Use due dates and automation | 
Keeps reviews on schedule
 | 
Upload and request evidence | 
Enables AI and saves time
 | 
Make decisions + plan next review | 
Completes the workflow loop
 

## TPRM key terms glossary
 | 
Term | 
Definition
 | 
TPRM (Third-Party Risk Management) | 
A process to identify, assess, monitor, and manage risks associated with third-party vendors. Vanta's TPRM tool streamlines this process using automation, evidence collection, and AI.
 | 
Inherent Risk | 
The level of risk assigned to a vendor based on factors like data sensitivity and vendor category, before any mitigating controls are applied. Drives automation of assessments and settings.
 | 
Inherent Risk Rubric | 
A customizable framework used to auto-score vendors based on the type of data they handle and their business function.
 | 
Vendor Assessment | 
A structured review of a vendor against a specific risk domain (e.g., Security, Privacy, Legal) to evaluate risk, collect evidence, and document a recommendation.
 | 
Security Assessment/Review | 
A workflow in Vanta used to evaluate a vendor's security posture by collecting and analyzing evidence, questionnaires, and risks.
 | 
Preferred Evidence | 
Documents (e.g., SOC 2, ISO 27001, penetration test) that are automatically requested from vendors as part of an assessment, based on their risk level.
 | 
Preferred Questionnaire | 
A standardized set of questions is automatically sent to vendors during an assessment.
 | 
Auto-requesting Evidence | 
A Vanta automation that triggers evidence collection 30 days before a scheduled assessment. Requires a vendor contact email and due date.
 | 
Trust Center (Vendor) | 
A public-facing portal where vendors may host their security documentation. Vanta can pull evidence from vendor Trust Centers during a review.
 | 
Findings | 
Identified risks or issues discovered during an assessment such as a security review. Can be tracked internally or followed up using Jira integration.
 | 
Residual Risk | 
The level of risk remaining after mitigating actions or compensating controls have been considered. Set at the end of a security assessment.
 | 
Discovery Tool | 
A feature in Vanta that helps identify unknown or unmanaged vendors through integrations with IdPs and MDMs.
 | 
Shadow IT | 
Technology, software, or systems used within an organization without explicit approval. Discovery helps detect vendors from shadow IT.
 | 
Account Manager (Vendor Contact) | 
The vendor representative is responsible for receiving evidence or questionnaire requests. A valid email address is required for automations.
 | 
Groups (Access Management) | 
Teams within your organization that are granted access to vendor records in Vanta. Helpful in managing offboarding and ownership.
 | 
Jira Integration | 
Connects Vanta to Jira to automatically create tickets for findings or remediation tasks resulting from assessments.
 | 
API (Application Programming Interface) | 
Vanta's programmatic interface allows customers to automate workflows, manage vendors, and integrate with external tools.
 | 
AI Answer Extraction | 
A Vanta AI capability that scans uploaded documents to answer questions automatically, saving time during analysis.
 | 
Needs Review Tab | 
A table view within the TPRM dashboard displays which vendors are ready for analysis based on the completion of evidence collection.
 | 
Assessment Cadence | 
The frequency at which vendors are reviewed, based on their risk level (e.g., annually for high-risk vendors).
 | 
Vanta Exchange | 
A portal experience where vendors can respond to questionnaires and share evidence directly with customers, supporting collaborative assessments.
 | 
Compensating Controls | 
Measures are put in place to mitigate risks when a vendor fails to meet a specific security requirement. Can be flagged as part of a finding.

## Images

- none
