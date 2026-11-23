# Section 3: Change Management Guide

Source: https://help.drata.com/en/articles/14604051-section-3-change-management-guide
Collection: Getting Started › Drata Rollout Toolkit
Updated: 2026-06-10
Fetched: 2026-11-22
Description: Learn more about ADKAR framework, stakeholder messaging strategies, and communication best practices

## Article text

| **Home Page** | **Previous Page** |
|---|---|
| *For a high-level summary of all phases and tasks, navigate to the [Drata Rollout Toolkit Overview](section-1-drata-rollout-toolkit-overview.md).* | *For the previous section, navigate back to the* *[Section 2: GRC Roles & Responsibilities](section-2-grc-roles-responsibilities.md).* |

## Overview

Implementing Drata is more than a technical deployment — it's an organizational change that affects every department. Research shows that 70% of change initiatives fail due to employee resistance and lack of management support. This guide gives you a structured framework, per-persona messaging, and a stakeholder engagement strategy to drive adoption across your organization.

## The ADKAR Framework

Anchor your Drata rollout in the ADKAR change management model. Successful adoption requires all five elements to be addressed in order for each stakeholder group before moving on.

| **Element** | **What It Means for Drata** |
|---|---|
| A — Awareness | Help people understand WHAT is changing and WHY: compliance requirements, customer demands, risk reduction. This must come before asking anyone to do anything. |
| D — Desire | Build personal motivation — answer "What's in it for me?" for each role. Use the persona-specific one-pagers in Section 4 to speak to each team's priorities and pain points. |
| K — Knowledge | Provide training on HOW to use Drata for their specific responsibilities: policies, evidence, integrations, and tasks. Schedule role-based training sessions per team. |
| A — Ability | Ensure people have access, training, and support to actually do the work in Drata. Confirm integrations are connected and control owners are onboarded before expecting results. |
| R — Reinforcement | Recognize early wins, track metrics, and embed Drata as the "source of truth" vs. spreadsheets. Celebrate milestones publicly and revisit progress monthly. |

|  | **💡 Pro Tip: **For each stakeholder group, ask: "Have I addressed all five ADKAR elements?" A team may have Awareness but no Desire — they know about Drata but don't see why they should care. Address each element before moving to the next. |
|---|---|

## Your Role as Champion

Think of yourself as a "caddy" to your Executive Sponsor and cross-functional leaders. Your job is to provide the right resources at the right time and facilitate — not dictate — adoption.

- Provide the right tools at the right time: this toolkit, one-pagers, email templates, training resources
- Advise on strategy based on your organizational knowledge and relationships
- Facilitate stakeholder conversations rather than driving adoption solo
- Enable internal leaders to become champions in their own departments — people support what they help create

## Communication Best Practices

These principles apply to every message, kickoff session, and conversation throughout your rollout.

| **Principle** | **What This Looks Like in Practice** |
|---|---|
| Start early | Introduce Drata during the procurement process — don't wait until post-sale. Early awareness reduces resistance significantly. |
| Be empathetic | Acknowledge that compliance feels like additional work. Validate concerns while showing the long-term benefit. |
| Personalize the message | Use the role-specific one-pagers in Section 4 to speak to each team's priorities, pain points, and "what's in it for them." |
| Use multiple channels | Email is just one touchpoint. Use kickoff meetings, Slack/Teams announcements, town halls, and 1-on-1s. |
| Create feedback loops | Regularly check in with teams. Resistance often comes from feeling unheard — a quick 1-on-1 often resolves more than a polished presentation. |
| Sequence deliberately | Engage in this order: Executive Sponsor → GRC → IT → Engineering → HR → General Staff. Each group lays the groundwork for the next. |

## Per-Persona Engagement Guide

Use this as your guide when planning messaging and sequencing. Understanding where each stakeholder starts helps you craft the right approach.

### Compliance / Security Team

- **Primary role: **Own frameworks, controls, policies, and act as primary Drata admins.
- **Typical friction: **Deeply invested in spreadsheet or legacy GRC workflows; skepticism about automation and auditor acceptance.
- **Key messages: **
   - "Augment, not replace": Drata automates evidence and monitoring — you still design and oversee the program
   - Reduction in audit prep and manual evidence collection
   - Multi-framework hub: single place for SOC 2, ISO 27001, HIPAA, and more with cross-mapped controls
   - Drata can run in parallel with current processes initially — no forced cut-over before your next audit

### IT Team

- **Primary role: **Own and configure IdP, MDM, SSO, and security tools. Gatekeepers for key integrations.
- **Typical friction: **Concern about credentials, data access, and integration security. Perception that Drata is "one more tool."
- **Key messages: **
   - Read-only, least-privilege integrations: metadata only, no production impact, no ability to modify systems
   - Fewer manual requests: automates access reviews, MFA checks, offboarding verification, and auditor asks
   - After initial setup, Drata reduces workload — not increases it

### Engineering / DevOps

- **Primary role: **Own infrastructure, SDLC tooling, CI/CD, version control, and technical controls.
- **Typical friction: **Compliance seen as a distraction from shipping features. Concern about repo access, pipeline noise, and overhead.
- **Key messages: **
   - "Let devs code, not collect" — Drata pulls evidence from Git, cloud, and CI/CD so engineers stop screenshotting and exporting logs
   - No pipeline impact: read-only, asynchronous checks. Validates controls, doesn't block builds
   - Tests and alerts are configurable — tuned for signal over noise in the first 30–60 days

### HR Team

- **Primary role: **Gatekeepers to HRIS and background check tools. Co-owners of onboarding/offboarding and personnel controls.
- **Typical friction: **Concern about PII exposure and process disruption. Feeling that "compliance isn't really HR's job."
- **Key messages: **
   - Drata reads only minimal employee data: name, email, employment status, basic dates, and background check status — not compensation or performance data
   - Automates training, policy acknowledgments, and onboarding/offboarding checks — less chasing and manual reporting
   - Drata sits on top of your existing workflows — it doesn't redesign them

### Executive Leadership

- **Primary role: **Provide sponsorship, resourcing, and visible support. Resolve cross-functional conflicts.
- **Typical friction: **May see compliance as a cost center or "something we already pass manually." Concerns about team bandwidth.
- **Key messages: **
   - Revenue impact: faster security reviews, Trust Center, and continuous compliance shorten sales cycles and improve win rates
   - Cost & risk reduction: thousands of hours saved; reduced exposure between audits; better board-level visibility
   - The heaviest lift is short, one-time integration work — after that, automation reduces ongoing effort across all teams

### General Employees

- **Primary role: **Complete Drata tasks — policies, training, device checks, questionnaires.
- **Typical friction: **"Another tool." Unclear why it matters. Fear of extra admin work.
- **Key messages: **
   - Simple, occasional tasks with clear prompts — no technical knowledge needed
   - Their actions directly support customer trust, deals, and company reputation

|  | **💡 Pro Tip: **Identify your "Green" (champion), "Yellow" (neutral), and "Red" (resister) stakeholders before sending any communications.<br>For Red stakeholders, schedule small-group sessions to hear specific objections and co-design how they'll work in Drata. People support what they help create. |
|---|---|

## Next Steps

[Section 4: Team Briefs & Email Templates](section-4-team-briefs-email-templates.md)

## Related articles

- [Scope Determination Checklist for Compliance Audits](scope-determination-checklist-for-compliance-audits.md)
- [Section 1: Drata Rollout Toolkit Overview](section-1-drata-rollout-toolkit-overview.md)
- [Section 2: GRC Roles & Responsibilities](section-2-grc-roles-responsibilities.md)
- [Section 4: Team Briefs & Email Templates](section-4-team-briefs-email-templates.md)
- [Section 6: Implementation Roadmap + Success Metrics](section-6-implementation-roadmap-success-metrics.md)
