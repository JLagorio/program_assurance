# Integration Journey: What to Connect First in Vanta

Source: https://help.vanta.com/en/articles/15878233-integration-journey-what-to-connect-first-in-vanta
Collection: Integrations ; Integrations › Getting Started with Integrations
Fetched: 2026-11-17

## Article text

Who it's for: You're setting up Vanta for the first time, or you've connected a few integrations and want to know what to prioritize next.
 
Skip this if: Your integrations are already connected and you're trying to control which resources within them get monitored. In that case, see Determining Resource Access for Your Integrations <https://help.vanta.com/en/articles/15878326-determining-resource-access-for-your-integrations> instead.
Integrations are how Vanta does its job. When you connect your cloud environment, your identity provider, your HR system, and your other tools, Vanta can continuously monitor your infrastructure, collect evidence automatically, and alert you when something falls out of compliance. Connect in the right order and compliance automation starts working immediately. Connect in the wrong order (or skip high-priority integrations) and you spend weeks doing manually what Vanta could be doing for you.
 
 

## How to think about priority: tests and access
As you connect systems, Vanta's automation surfaces through two core features:
 
A test is a 24/7 automated check of a specific security setting (for example, whether MFA is enabled) that generates live, audit-ready evidence when it passes. The more integrations you have, the more tests Vanta can run automatically.
 
Vanta's Access page (under Personnel > Access) gives you a unified view of who has access to what across all your connected systems. Your Identity Provider supplies the "who" (your employee list). Every other integration supplies the "what." Together, they make access reviews and offboarding evidence dramatically simpler.
 
 

## Integration journey at a glance
 | 
Phase | 
Integrations | 
Why it matters
 | 
1 | 
Cloud Provider + Identity Provider | 
Unlocks the largest share of compliance automation and defines your core scope
 | 
2 | 
MDM + Version Control + Vulnerability Scanner | 
Covers device, code, and vulnerability security controls
 | 
3 | 
HRIS + Task Tracker | 
Completes your user data foundation and streamlines remediation workflows
 | 
4 | 
Specialized tools | 
Expands automation depth and framework coverage
If you only connect two integrations this month, make them Phase 1.
💡 Tip: Before you start connecting, review the Before You Connect: Integration Prerequisites Checklist <https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist> before your first setup session. It covers the most common requirements across integrations, including admin permissions, service accounts, license tiers, and network restrictions, and helps prevent connection failures before they happen.
 
 

## Phase 1: The foundation
Connect: Cloud Service Provider (CSP) + Identity Provider (IdP)
 
Examples: AWS / Google Cloud / Azure, and Okta / Google Workspace / Microsoft 365
 
Your CSP is the heart of your audit scope. Connecting it gives us continuous visibility into how your production environment is configured: encryption, access controls, logging, and more. It also populates your real-time asset inventory under Assets > Inventory and begins collecting infrastructure evidence across frameworks.
 
Your IdP defines your employee list for all personnel-based tests. It enables us to detect accounts that remain active after termination, powers the Access page's unified view, and drives automated access review workflows under Personnel > People.
 
When you need to make the case internally for prioritizing these connections, see How to Work with System Owners to Connect Integrations <https://help.vanta.com/en/articles/15878268-how-to-work-with-system-owners-to-connect-integrations>.
⚠️ Note: Connecting your IdP is not the same as enabling SSO. SSO requires additional configuration within your IdP.
For setup instructions, see:
- 
Connecting AWS with CloudFormation <https://help.vanta.com/en/articles/11345623-connecting-aws-with-cloudformation> | Azure: Integration Guide <https://help.vanta.com/en/articles/15693150-azure-integration-guide> | GCP Organization <https://help.vanta.com/en/articles/11345626-connecting-a-gcp-organization>
- 
Scoping cloud resources and frameworks <https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope>
- 
Getting started with integrations <https://help.vanta.com/en/collections/18953711-getting-started-with-integrations>
- 
Cloud providers <https://help.vanta.com/en/collections/18953623-cloud-providers>
 
 

## Phase 2: Endpoint, code, and vulnerability security
Connect: Mobile Device Management (MDM) + Version Control System (VCS) + Vulnerability Scanner
 
Examples: Jamf / Kandji / Microsoft Intune; GitHub / GitLab; Crowdstrike (multiple category integration) / Tenable / Qualys
 
Your MDM integration gives us automated, system-verified proof that every employee device meets your security standards: disk encryption, screen lock, and firewall configuration are checked continuously. Results appear under Personnel > Computers.
 
Your VCS integration lets us verify that your software development lifecycle follows secure practices, including branch protection rules and required code reviews. This integration is most valuable for companies actively shipping software; if you don't maintain a codebase in version control, it can be deprioritized. Repository metadata and vulnerability findings appear under Assets > Code Changes. If your VCS is configured to surface vulnerability findings, those may also appear under Assets > Vulnerabilities.
 
Your vulnerability scanner integration has become one of the highest-priority connections for many customers. It surfaces open vulnerabilities across your systems and enables us to track remediation, creating a continuous, auditable record of how your team identifies and resolves risks. If you have a vulnerability scanner in place, connecting it in Phase 2 is strongly recommended.
 
 

## Phase 3: User data and remediation workflows
Connect: Human Resource Information System (HRIS) + Task Tracker
 
Examples: Workday / BambooHR / Gusto / Rippling; Jira / Asana / Linear
 
Your HRIS integration is nearly as foundational as your IdP. While the IdP tells Vanta who currently has access, your HRIS provides the authoritative record of when employment started and ended, which eliminates one of the most common audit risks: evidence gaps around onboarding and offboarding timing. HRIS is the priority integration in this phase. If you have capacity, consider connecting it alongside your Phase 2 work. 
 
Your task tracker integration closes the loop between detection and remediation. Vanta can create and assign tickets for failing tests, risk scenarios, and access review tasks directly within your team's existing project boards. For Jira, ticket creation can be fully automated.
ℹ️ Note: Connecting your task tracker improves operational workflow but has lower direct compliance value compared to other integrations in this roadmap. If you're resource-constrained, prioritize your HRIS first and treat the task tracker as a workflow optimization rather than a compliance necessity.
💡 Tip: Connect Jira after your other integrations are scoped and tested to avoid a flood of automated tickets before you're ready.
 
 

## Phase 4: Expanding your automation
Once your foundational integrations are in place, expand into specialized tools based on what your framework requires and what your org actually uses.
- 
Security awareness training platforms: Connect if your framework requires documented proof of annual security training for all employees. SOC 2, ISO 27001, and HIPAA all include training requirements.
- 
Background check providers: Connect if your framework or employment policy requires pre-employment screening documentation. Most relevant for SOC 2 and regulated industries.
- 
Cloud access security brokers: Most relevant if your team accesses sensitive data across multiple SaaS applications and you need visibility into who is accessing what, from where.
- 
Additional vulnerability and scanning tools: Connect if you have infrastructure not covered by your Phase 2 scanner, or if your framework requires broader or more specialized scanning coverage beyond what your current tool provides.
Each new connection adds context, reduces manual effort, and deepens your real-time GRC coverage.
 
 

## A note on notification integrations
Slack and Microsoft Teams can connect Vanta's alerting to the channels your team already uses, so failing tests, access review reminders, and task assignments surface where people are already working.
💡 Tip: Hold off on connecting Slack or Teams until your program is configured and scoping is complete. Connecting them too early triggers a high volume of alerts before your controls are tuned, which creates noise and can frustrate your team. Connect them once you're ready to act on what Vanta is telling you.
 
 

## FAQs

### Do I need to connect every integration, or only the important ones?
Only the ones relevant to your actual tech stack and framework requirements. Not every company has a task tracker, a vulnerability scanner, or an MDM in active use, and connecting a tool you don't really rely on doesn't add compliance value. Use the phase framework above as a priority order for what you do use, not a checklist of everything Vanta supports.
 

### We already get personnel data from one integration. Is there any reason to connect another one that also covers personnel?
Usually yes, and it depends on which integration. Your identity provider tells Vanta who currently has access to your systems. Your HRIS tells Vanta when someone's employment actually started and ended, which your IdP doesn't reliably capture. The two serve different purposes even though both touch personnel data, so having one doesn't make the other redundant.
 

### Will connecting or changing an integration undo other work I've already done?
No. Connecting a new integration or adjusting an existing one doesn't reset or remove your other integrations, tests, or remediation work. Each integration and its scope settings are independent.
 

### What if an integration can't be connected right now? 
Not every integration can be installed on your ideal timeline. System owners may be unavailable, permissions may need approval, or a tool may require prerequisites you haven't yet met.
 
If you run into blockers during setup, see How to Work with System Owners to Connect Integrations <https://help.vanta.com/en/articles/15878268-how-to-work-with-system-owners-to-connect-integrations> for next steps and interim options.
 
 

## Next Steps
- 
Ready to connect? Start with the Before You Connect: Integration Prerequisite Checklist <https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist>, then browse the Vanta Integrations page <https://help.vanta.com/en/collections/12575285-integrations> for setup guides. 
- 
Getting colleagues to connect their systems: How to Work with System Owners to Connect Integrations <https://help.vanta.com/en/articles/15878268-how-to-work-with-system-owners-to-connect-integrations>
- 
Questions about scoping? See Adaptive Framework Scoping <https://help.vanta.com/en/articles/11345359-adaptive-framework-scoping> and Marking resources out of scope <https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope>
- 
Need help? Contact your account team, Support, or explore the Integrations Help Center collection <https://help.vanta.com/en/collections/12575285-integrations>.

## Images

- none
