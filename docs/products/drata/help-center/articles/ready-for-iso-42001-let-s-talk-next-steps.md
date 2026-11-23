# Ready for ISO 42001? Let’s Talk Next Steps

Source: https://help.drata.com/en/articles/12591328-ready-for-iso-42001-let-s-talk-next-steps
Collection: Framework Information › ISO 42001
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

ISO/IEC 42001 defines the requirements for establishing, implementing, maintaining, and continually improving an Artificial Intelligence Management System (AIMS). Think of it as a “standard for managing AI responsibly” that helps you show customers and regulators that your AI is safe, fair, and well-governed. For more details, see our [ISO 42001 Framework Overview](iso-42001-framework-overview.md) help article.

Below is a simple, step‑by‑step guide to get started using Drata.

## 1) Understand what ISO 42001 asks you to do

- Build an AI Management System (AIMS): Your playbook for how you design, build, use, and monitor AI.
- Manage AI risks: Identify where AI could cause harm (e.g. bias, security, privacy) and how you will reduce those risks.
- Set clear roles and responsibilities: Who approves AI models, who monitors them, who handles incidents.
- Be transparent: Document what your AI does, what data it uses, and how you handle issues.
- Monitor and improve: Keep checking your AI and your processes and fix gaps over time.
- Drata provides templates, monitoring, and evidence collection to help you put this into practice, as described in the ISO 42001 Framework Overview | Drata Help Center and our product page for ISO 42001.

## 2) Expand your existing ISMS to include AI

If you already follow ISO 27001, you’re ahead. Add AI into your current scope:

- Update your scope statement to include “development, provision, and use of AI systems.”
- Tip: Leverage the “Artificial Intelligence Management System (AIMS) Plan” template to extend your ISMS to AI,
- Reuse what you can (access control, vendor reviews, change management) and add AI‐specific parts (e.g. bias checks, model monitoring).
- Use cross‐mapped controls to save effort, as highlighted on ISO 42001.
- Remember that while ISO 42001 can build on your ISO 27001 foundation, it is a separate management system standard with its own certification process. You can integrate them operationally, but certification requires an independent AIMS scope and audit.
- To access the "Artificial Intelligence Management System (AIMS) Plan" template, ensure that the ISO 42001 framework is enabled in your Drata account. Navigate to the Policy Library and use the Policy Center search if the template is not readily visible.

## 3) Create your AIMS basics in Drata

- **Policies**: Start with your Drata policy templates and tailor them to how you use AI.
   - **Note**: Besides the AI-specific policies, the exact updates on your remaining policies depend heavily on how your organization is using AI, what data you’re training it on, and how that data is being shared or applied.
      - ISO 42001 AI-specific customizable policies:
         - AI Governance Policy
         - AI Risk Management Policy
         - AI System Development and Evaluation Policy
         - Artificial Intelligence Management System (AIMS) Plan
- **Roles:** Name owners for AI risk, model approvals, testing, incident response, and vendor reviews.
- **Processes:** Define simple, repeatable steps for model changes, testing before release, and monitoring after release.
- Keep it practical – document what you actually do.

## 4) Do an AI‑focused risk assessment

- **Identify AI risks: **fairness/bias, data quality, privacy, security, misuse, hallucinations, explainability, and regulatory exposure.
- **Score risks and decide treatments: **reduce, accept, transfer, or avoid.
- Track these in Drata’s Risk Management and Evidence Library. Drata’s risk registers are tailored to AI-specific risks.
- Start with your highest‑impact AI systems first.

## 5) Map and implement AI controls

- Use Drata’s cross‑mapped controls to reuse ISO 27001 work where possible (access, logging, change control), then add AI‑specific controls (e.g. dataset quality checks, model fairness testing, monitoring for drift).
   - AI-Specific Controls; ISO 42001 introduces new or modified controls (e.g., DCF-170.AI, DCF-184.AI) focused on AI governance, risk, and ethics. You’ll need to implement and evidence these controls separately, as they address risks and objectives unique to AI systems.
   - Currently, there are 38[DCFs](introduction-to-the-drata-control-framework-dcf.md) or Controls mapped to ISO 42001.

Some controls, like DCF-170.AI and DCF-184.AI, need separate implementation and evidence to address AI-specific challenges like transparency and fairness. This ensures compliance is tailored to the unique risks posed by AI.

Assign each control to an owner and set a simple testing cadence (e.g. quarterly fairness review).

## 6) Set up continuous monitoring and evidence

- Turn on continuous monitoring for relevant controls where supported by Drata.
- Collect evidence as you work: model cards, test results, approvals, incident logs, risk reviews. Store in Drata’s Evidence Library.
- Make evidence collection part of your normal workflow, not a one‐time scramble.
- Use Drata’s Policy Library to locate templates like the "Artificial Intelligence Management System (AIMS) Plan." Confirm ISO 42001 is activated and search within the Policy Center for ease of access.

## 7) Manage AI‑related vendors and data sources

- List any AI vendors, models, datasets, or tooling you rely on.
- Run Third‑Party Risk reviews focused on AI risks (data handling, bias, security) using the Drata Vendor Management.
- Keep contracts and assessments in your Evidence Library.

## 8) Prepare your SoA 

- **Statement of Applicability (SoA):** You can maintain a standalone or integrated Statement of Applicability (SoA) that includes ISO 42001 Annex A controls, justified based on AI risk.

- ISO 42001 Annex A controls must be justified in your SoA based on AI risk assessment, ensuring transparency in your decision-making process around control inclusion or exclusion.

## 9) Be transparent through your Trust Center

Use Drata’s Trust Center to share your AI governance posture with customers and partners, as highlighted on ISO 42001. Publish high‑level policies, certifications, and FAQs.

## 10) Keep improving

Set a quarterly, semi‑annual, or annual review to:

- Revisit risks and controls based on new models or uses.
- Refresh training and awareness.
- Review incidents and lessons learned.
- Update your AIMS and SoA.
- Common pitfalls to avoid
- Policies that don’t match reality. Keep them short and accurate.
- Skipping bias/fairness checks. Even basic pre‑release testing is better than none.
- Treating AI as “just another system.” It has unique risks; address them plainly.
- One‑time setup. ISO 42001 expects ongoing monitoring and improvement.
- Quick start checklist
- Update ISMS scope to include AI.
- Adopt and tailor AIMS policies.
- Complete an AI risk assessment.
- Map and activate AI controls in Drata.
- Set up continuous monitoring and evidence.
- Review AI vendors and datasets.
- Prepare SoA and audit evidence.
- Publish highlights in the Trust Center.
- Schedule regular reviews.

## Common pitfalls to avoid

- Policies that don’t match reality. Keep them short and accurate.
- Skipping bias/fairness checks. Even basic pre‑release testing is better than none.
- Treating AI as “just another system.” It has unique risks; address them plainly.
- One‑time setup. ISO 42001 expects ongoing monitoring and improvement.
- Confusing ISO 42001 with “just an ISMS extension."

## Quick start checklist

- Update ISMS scope to include AI.
- Adopt and tailor AIMS policies.
- Complete an AI risk assessment.
- Map and activate AI controls in Drata.
- Set up continuous monitoring and evidence.
- Review AI vendors and datasets.
- Prepare SoA and audit evidence.
- Publish highlights in the Trust Center.
- Schedule regular reviews.

## Related articles

- [ISO 27001:2022 Checklist](iso-27001-2022-checklist.md)
- [Policies to Framework Summary](policies-to-framework-summary.md)
- [ISO 27001:2022 Updates as of 5/7/2024](iso-27001-2022-updates-as-of-5-7-2024.md)
- [ISO 42001 Framework Overview](iso-42001-framework-overview.md)
- [Example Evidence for Not Monitored Controls (ISO 42001)](example-evidence-for-not-monitored-controls-iso-42001.md)
