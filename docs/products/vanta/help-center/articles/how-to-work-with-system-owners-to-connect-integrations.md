# How to Work with System Owners to Connect Integrations

Source: https://help.vanta.com/en/articles/15878268-how-to-work-with-system-owners-to-connect-integrations
Collection: Integrations ; Integrations › Getting Started with Integrations
Fetched: 2026-11-17

## Article text

Who it's for: You own the compliance program but don't have admin access to the systems you need connected (common once IT, DevOps, and HR each own their own tools).
 
Skip this if: You have admin access to everything yourself. Go straight to the setup guide for your integration in All integration setup guides <https://help.vanta.com/en/collections/18953524-integrations-by-type>.
✅ Feature availability: This article references the Vanta Agent, Vanta's in-product AI assistant (top navigation, Agent icon). Availability varies by plan. If you don't see the Agent icon, the email and Slack templates below still work on their own, just skip the "use the Vanta Agent" step and fill in the bracketed fields manually using your Frameworks page and the integration setup guides <https://help.vanta.com/en/collections/18953524-integrations-by-type>.
If you're managing your company's compliance program, you probably don't have admin access to Okta, AWS, or GitHub yourself. Setting up Vanta's integrations means getting the right colleagues, your IT lead, engineering manager, DevOps team, or HR administrator, to do it for you. And getting on their calendar, let alone their roadmap, is often the biggest bottleneck in onboarding.
 
This article gives you what you need to make that ask effectively, move it through any security review, and keep it on track once assigned.
 
 

## Making the business case (before you make the ask)
Before you reach out to a system owner, it helps to have the "why this matters" framing ready, especially if the request needs to go through a CISO, CTO, or engineering lead who will evaluate it against competing priorities.
 
Lead with this: connecting integrations is not an IT project, it's a compliance multiplier. Every week without these connections is a week of manual evidence collection that Vanta could be doing automatically. The ask is small; the return is significant.
 
 

## Addressing the first question: “Is this secure?”
The most common pushback from system owners is a security concern. Here's exactly what to tell them:
- 
Vanta requests only the minimum permissions required for each integration. For monitoring integrations this is typically read-only access to configuration settings. Where write access is needed (for example, to create remediation tickets, post notifications, or comment on issues) Vanta requests only the specific permissions required for that feature.
- 
All credentials and API keys are encrypted in transit and at rest.
- 
Vanta recommends using dedicated service accounts that maintain a clean audit trail without sharing credentials across systems.
You can review the exact permissions Vanta requests for any integration directly on the Integrations page in the product before connecting.
 
 

## Before you reach out: A checklist
On your side: 
- 
Identify which integration you need connected and who owns that system in your org.
- 
Review the setup guide <https://help.vanta.com/en/collections/18953524-integrations-by-type> for that integration so you can describe the ask accurately.
- 
Decide on scoping before the system owner connects (what environments or data sets should Vanta monitor?) — it's much easier to scope upfront than to adjust after the fact.
- 
Confirm whether you need to add the system owner as a Vanta user before they can complete setup, and if so, give them a heads-up that they'll receive an automated welcome email from Vanta.
 
To share with the system owner before they sit down to connect: 
- 
Before connecting, share the Before You Connect: Integration Prerequisites Checklist <https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist> with the system owner. It covers everything they'll need to verify upfront, including admin permissions, service accounts, license tiers, and network restrictions. It takes a few minutes to review and prevents the most common connection failures.
 
 

## Assign the integration in Vanta first 
Before you send an email or Slack message, assign the integration directly to the system owner within Vanta:
- 
Go to Integrations in the left navigation.
- 
Find the integration you need connected.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2528848485/737c2c5488af64fa1516eacff6e2/ef3c87e2-ff17-4e20-8562-c5ea7436163e?expires=1794967200&signature=ff446ec8f7435cca8d04747c8d872f68143616beb746311e88f68889ecde8c95&req=diUlHsF6lYVXXPMW1HO4zc61K4ytFtiyNt1kszPdlWiwKQCx7kYNrFbz%2FDtG%0AGbwHkWjC2IEnA%2BtS%2BPM%3D%0A>
- 
Click the assign icon (a person outlined in a dashed circle) to assign it.
- 
Select the system owner from the list.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2528849311/eb379f441a799ef92b36e2392424/39127114-c483-42f7-aaaa-1eb5d7eb1534?expires=1794967200&signature=15091262f1f50d597f53a3c779012c650990b75dd749c3f356a2a1b7b5ae2665&req=diUlHsF6lIJeWPMW1HO4zXg8mtWpqgUWGepPwbtcJhZqrtrUYygmiYkKfsjz%0AScqILDU7nMvJEYLwBaU%3D%0A>
- 
Once assigned, they'll receive a notification with context on what's needed. This creates a clear record of who is responsible, sets a visible deadline, and means you're not managing the ask entirely over email. It also gives your account team visibility into what's pending and what may need follow-up.
⚠️ Note: The person you assign will need to be added as a Vanta user before they appear in the list. If they're not there yet, add them first under Settings > People. Then give them a heads-up that they'll receive an automated welcome email from Vanta when you do.
 
 

## Choose your outreach format 
Once you've identified your system owner and assigned the integration in Vanta, you're ready to make the ask. How you frame it matters: system owners are more likely to act quickly when they understand exactly what they're being asked to do, why it's relevant to their system specifically, and that the security model has been thought through.
 
The email template below is the best starting point for most situations. It's designed to be specific rather than generic. Use the Vanta Agent prompt in Step 1 to pull the exact frameworks, permissions language, and setup guide link for your system before you fill it in. That way you're sending something accurate and tailored, not a copy-paste that reads like a form letter.
 
If the ask is low-stakes or you already have a good working relationship with the system owner, the Slack template is a faster option. And if their situation involves specific concerns the templates don't address like a required approval chain, strong security objections, or a system that has unusual setup requirements, use the "Generate a Custom Message" prompt at the bottom to have the Vanta Agent write something from scratch.
 

### Email template

### Step 1: Use the Vanta Agent to fill in the brackets 
Before you write your email, open the Vanta Agent (click the Agent icon in the top navigation from anywhere in Vanta) and paste in the prompt below with the system name filled in. It's context-aware, so it'll have already picked up relevant details about your program before you even ask.
I'm drafting an email asking a system owner to connect [SYSTEM NAME] to Vanta. Return exactly four items, plain text, no commentary, so I can paste them into an email:
 
1. FRAMEWORKS: Framework(s) currently enabled in our Vanta environment, as a natural list.
 
2. SETUP GUIDE LINK: Direct URL to Vanta's help center setup guide for this system. If none exists, use the closest integration-type guide and say so.
 
3. ACCESS TYPE: One short, factual clause on the permission level Vanta requests (e.g. "read-only access to configuration and metadata"). No persuasion language.
 
4. VALUE STATEMENT: First-person plural ("our SOC 2 audit," never "your"). Frame everything as audit evidence automation — Vanta collecting and documenting configuration state for auditors. Do not use security-posture or risk-management language at all (e.g. "security posture," "risk profile," "security program," "technical security requirements," "audit requirements") even as a paraphrase — name only concrete, specific test categories (disk encryption, MFA enforcement, IAM roles, branch protection, vulnerability findings, onboarding/offboarding timing, etc.). Never describe Vanta as remediating, tracking remediation, or keeping systems in a "known-good state"; for ongoing checks (e.g. vulnerability scanning), call it continuous evidence collection. Write one sentence per genuinely distinct category this integration covers — do not restate the same category in different words to hit a length target. Most integrations will need 1–2 sentences; write a 3rd only if there's a third distinct category to name. Tie to frameworks from #1 where natural, not forced.
 
If Vanta does not have an integration with this system, say so plainly: "Vanta does not have an integration with [SYSTEM NAME]." Do not return a category, and do not attempt items 2–4.
 
System name: [SYSTEM NAME]
💡 Tip before you send: Paste the setup guide link into your browser to confirm it works. The agent will flag if a direct link isn't available, but it's worth a quick check either way.
 

### Step 2: Drop the results into this template 
Subject: Connecting [SYSTEM NAME] to Vanta for our [FRAMEWORKS] program
 
Hi [NAME],
As part of our work toward [FRAMEWORKS], we're using Vanta to automate our compliance monitoring. I'd love your help connecting our [SYSTEM NAME] account to the platform.
 
Why this matters: [VALUE STATEMENT]
Vanta uses [ACCESS TYPE] — it verifies configuration settings without accessing any underlying data.
 
What's involved: The setup is quick. Here's the relevant guide: [SETUP GUIDE LINK]. Before you start, it's worth spending a few minutes on this prerequisites checklist <https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist>. It covers common requirements like service accounts, license tiers, and network restrictions that are worth confirming upfront.
I've assigned this to you in Vanta so you'll have all the context there too. Let me know if you have a few minutes this week, or if it's easier for me to walk through it with you.
 
Thanks!
 
P.S. If I need to add you to Vanta to complete the setup, you may receive an automated welcome email from the platform. Feel free to ignore it for now. I'll follow up directly with next steps.
 
 

### Slack template (for a lighter touch ask)
 
Hey [NAME], we're connecting [SYSTEM NAME] to Vanta for our [FRAMEWORKS] program. I've assigned it to you in Vanta and here's the setup guide: [SETUP GUIDE LINK]. Before you start, here's a quick prerequisites checklist <https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist> worth skimming. Happy to hop on a quick call if that's easier!
💡 Tip: You can use the Vanta Agent prompt above to get your [FRAMEWORKS] and [SETUP GUIDE LINK] values for this template too.
 
 
 

### Generate a custom message from scratch
 
If your situation doesn't fit the template (i.e. the system owner has raised specific concerns, the ask needs to go through an approval chain, or you want a fully written message rather than a filled-in template), then use this prompt to have the Vanta Agent write the whole thing for you.
I need to ask someone to connect an integration to Vanta for our compliance program. Help me write a message to send them.
 
- System to connect: [e.g., GitHub, Okta, AWS]
- Their role: [e.g., IT lead, engineering manager, HR administrator]
- Our compliance goal: [e.g., SOC 2 Type II, ISO 27001]
- Format: [email / Slack message / both]
- Anything else I should address: [e.g., they've raised concerns about data access / they need manager approval before taking on new tasks / they want to know exactly what permissions Vanta will request]
The agent will generate a message you can send as-is or edit before sending.
 
 
 

## What to do if you hit a blocker
If a system owner can't complete the setup on your timeline (conflicting priorities, pending approvals, missing prerequisites), don't let it stall your program. Escalate to your account team and in the meantime, use Vanta's manual evidence upload to cover the control gap temporarily. Your account team can also help you set up a placeholder so the pending integration stays visible and tracked.
 
 

## Related resources
- 
Before You Connect: Integration Prerequisites Checklist <https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist>
- 
Integration Journey: What to Connect First in Vanta <https://help.vanta.com/en/articles/15878233-integration-journey-what-to-connect-first-in-vanta>
- 
All integration setup guides <https://help.vanta.com/en/collections/18953524-integrations-by-type>

## Images

- [image 01] ../../images/ux/integrations/how-to-work-with-system-owners-to-connect-integrations--01.png
- [image 02] ../../images/ux/integrations/how-to-work-with-system-owners-to-connect-integrations--02.png
