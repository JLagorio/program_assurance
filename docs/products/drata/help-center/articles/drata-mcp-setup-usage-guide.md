# Drata MCP — Setup & Usage Guide

Source: https://help.drata.com/en/articles/13379899-drata-mcp-setup-usage-guide
Collection: Settings
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

The Drata MCP server lets AI assistants (Claude, ChatGPT, Cursor, Microsoft Copilot, and others) securely query and act on your Drata data in natural language — across controls, policies, risks, evidence, frameworks, vendors, personnel, devices, and identities.

Drata provides a remote hosted MCP server:

- **US**: `https://mcp.drata.com/mcp/`
- **EU**: `https://mcp-euc1.drata.com/mcp/`
- **APAC**: `https://mcp-apse2.drata.com/mcp/`

**Access Note:**

Access is governed by OAuth scopes *and* your Drata role: end users can only access the intersection of what the configured scopes allow and what their role already permits in the app — they cannot do anything through the MCP that their role can’t do in Drata. Some scopes allow write and delete actions (creating, updating, and deleting Evidence, creating and updating Controls, and updating Personnel); grant these deliberately, as they let the MCP modify Drata data on the user’s behalf when their role also permits it.

> **ℹ️ Already Connected MCP and need New Capabilities?**
> If your MCP is already set up and you would like to see newly released tools (for example, the Evidence tools) go to [Add New Scope to an existing connection](#h_c0bda42aeb).

> **ℹ️ Want to review example prompts for using the Drata MCP server?**
> Go to [Review example prompts for using the Drata MCP server](#h_ad58f037f3) section.

## Set up Drata MCP for the first time

Setting up Drata MCP requires two steps: first, administrators need to set up OAuth for the tenant, and second, users need to connect Drata Connector using their MCP client (i.e., Claude Desktop, ChatGPT).

#### Set up OAuth (administrators)

1. Click Settings
2. Click MCP OAuth Configuration (Note: you must be an administrator in Drata to access this page)
3. Enter a name for the OAuth Configuration
4. Enter a description of the configuration
5. Set an expiration date on the configuration
6. Select the scopes you want to configure (see *Available scopes & roles* below)

## Available scopes & roles

**Note on roles:**

- For read (`read:*`) scopes, the read-only variant of any role listed above (for example, Read-only Admin, Read-only Control Manager) has the same view access; read-only roles cannot use create, update, or delete scopes.
- The Service User (integration) role also has equivalent access to every scope above.
- A user always receives only the intersection of the configured scope and their role’s permissions.
- A user that `create:user-document` only works paired with `create:evidence` or `update:evidence`.

| **OAuth Scope** | **Permission** | **Description** | **Allowed Roles** |
|---|---|---|---|
| read:risk | Read Risk | View Risks in Risk Registers | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager, Risk Register Owner |
| create:risk | Create Risk | Create new Risks | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager, Risk Register Owner |
| update:risk | Update Risk | Modify Risk details | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager, Risk Register Owner |
| delete:risk | Delete Risk | Delete Risks | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager, Risk Register Owner |
| read:policy | Read Policy | View Policies | Admin, Workspace Administrator, Information Security Lead, Policy Manager |
| read:workspace | Read Workspace | View Workspaces | Admin |
| read:risk-registers | Read Risk Registers | View Risk Registers | Admin, Information Security Lead, Risk Manager, Restricted Risk Manager |
| read:assigned-policies | Read Assigned Policies | View User Assigned Policies | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager, DevOps Engineer, Risk Manager, Restricted Risk Manager, Policy Manager, People Ops, Reviewer, Internal Auditor, Knowledge Base, Trust Center Manager, Trust Center Reviewer, Trust User, Employee |
| read:monitor-test | Read Monitor Tests | View Monitoring Tests | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager, DevOps Engineer |
| create:control | Create Control | Create new Controls | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager, DevOps Engineer |
| update:control | Update Control | Modify Control details | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager, DevOps Engineer |
| read:framework | Read Framework | View compliance Frameworks and their Requirements | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager, DevOps Engineer |
| read:users | Read Users | View Users and Role members | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager, DevOps Engineer, Risk Manager, Restricted Risk Manager, Risk Register Owner, Policy Manager, People Ops, Reviewer, Internal Auditor, Knowledge Base, Trust Center Manager, Trust Center Reviewer, Trust User, Employee |
| read:user | Read User | View User details | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager, DevOps Engineer |
| read:personnel | Read Personnel | View Personnel — records, compliance status, groups, and custom fields | Admin, Workspace Administrator, Information Security Lead, People Ops |
| update:personnel | Update Personnel | Modify Personnel (e.g. employment status / details) | Admin, Workspace Administrator, Information Security Lead, People Ops |
| create:user-document | Create User Document | Upload personnel compliance documents, security training, HIPAA training,MFA evidence, offboarding evidence — for a person | Admin, Workspace Administrator, Information Security Lead, People Ops |
| create-restricted:personnel | File Offboarding Evidence | File offboarding evidence against a person. Grant this only to an application you would trust to write to an individual employee's compliance record | Admin, Workspace Administrator, |
| read:device | Read Device | View Devices and Device Apps (per-personnel device compliance) | Admin, Workspace Administrator, Information Security Lead, DevOps Engineer, People Ops |
| read:evidence | Read Evidence | View Evidence library | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager, DevOps Engineer |
| create:evidence | Create Evidence | Create Evidence items | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager |
| update:evidence | Update Evidence | Modify Evidence items | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager |
| delete:evidence | Delete Evidence | Delete Evidence items | Admin, Workspace Administrator, Information Security Lead, Control Manager, Restricted Control Manager |
| read:vendor | Read Vendor | View Vendors, Questionnaires, and Security Reviews | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager |
| create:vendor | Create Vendor | Create Vendors | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager |
| update:vendor | Update Vendor | Update Vendors | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager |
| delete:vendor | Delete Vendor | Delete Vendors | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager |
| read:vendor-security-review | Read Vendor Security Review | View Vendor Security Reviews | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager |
| read:vendor-document | Read Vendor Document | View Vendor Documents | Admin, Workspace Administrator, Information Security Lead, Risk Manager, Restricted Risk Manager |

## Connect MCP client (user)

#### Claude

- Setup: follow Anthropic’s guide [here](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp).
- Enable the Drata connector per conversation from the + (plus) menu → Connectors.

#### ChatGPT

- Setup: follow OpenAI’s guide [here](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt/).
- By default, the Drata connector (shown under "Apps") can only search and fetch. To use write-capable tools (for example, creating evidence or updating personnel), enable Developer Mode (beta) in ChatGPT settings — available on the web for Plus, Pro, Business, Enterprise, and Edu plans.
- In Developer Mode, ChatGPT shows the request payload and asks for confirmation before each write action — review it before approving.

#### Cursor

- Setup: follow Cursor’s guide [here](https://cursor.com/docs/context/mcp).
- Add the Drata MCP server under Settings → Tools & MCP (or install it from the Cursor MCP marketplace), then use Agent mode — Cursor automatically discovers and calls the available tools.
- Use the Tools & MCP panel to toggle individual servers or tools on and off.

#### Microsoft Copilot

- Setup: follow Microsoft’s guide [here](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent).

## Add new scopes to an existing connection

As Drata releases new MCP tools (for example, the Evidence tools, or the new Personnel & Device tools), you may want to grant access to capabilities you didn’t originally enable. If you’ve already connected your MCP and would like to see more tools, follow these steps.

#### Administrator: add the new scope(s)

- Go to Settings → MCP OAuth Configuration and edit your existing configuration
- Under Scopes, select the new scope(s) you want to grant (for example, read:evidence, read:personnel, or read:device)
- Save the configuration

#### End user: reconnect to pick up the new scopes

Newly added scopes are not applied to an active session automatically — your existing token was issued with the old set of scopes. To refresh it:

- In your MCP client (for example, Claude), Go to customize->Connector-> Disconnect the Drata connector
- Reconnect and complete the OAuth sign-in again — approve the new scopes on the consent screen

The new tools will now be available. As always, you will only be able to use a new capability if your assigned Drata role also permits it.

## Best practices

#### Mention Drata by name

Always include “Drata” in your prompts. This helps the AI model correctly route your request to the Drata MCP tools rather than relying on its built-in knowledge.

- ✅ “Which controls are missing evidence in Drata?”
- ❌ “Which controls are missing evidence?”

#### Be specific with your requests

The more specific your prompt, the better the results. Include details like framework names, time ranges, risk categories, or team names when relevant.

- ✅ “Create a report of risks that don’t have a treatment plan in Drata”
- ❌ “Show me risks”

#### Use natural language

You don’t need to know Drata’s API or data model. Ask questions the way you’d ask a compliance analyst. Refer to a control by its code (e.g., CC6.1) and an owner by name or email rather than by ID. The same applies to people and devices — refer to personnel by name or email, to a personnel group by its name (e.g., “Engineering”), and to a custom field by its label (e.g., “Department”).

#### Security reminders

- Drata’s MCP server uses OAuth authentication — your credentials are never shared with the AI client
- The AI client can only access data you have permissions for in Drata
- Scopes that allow create, update, or delete should be granted deliberately, since they let the MCP modify Drata data on your behalf
- As an administrator, you can revoke access at any time from your Drata account or from the AI client’s connector settings

## Review example prompts for using the Drata MCP server

**Note:** Example prompts grouped by area.

Create, update, and delete prompts require the matching write scope *and* a role that permits the action. For control owners and other relation lists, “set the owner” **replaces** the existing set unless you say “without removing the current ones.”

### General & knowledge

- Am I allowed to use Jira on my phone?
- How often am I required to come into our office to work during the week?
- How often am I required to do security awareness training?
- What is the SLA in our policies for fixing critical vulnerabilities?
- My engineering team is handling an incident related to our application. What are the incident response steps I should be aware of in Drata based on our policies and controls?

### Controls

- Which controls in Drata are not ready?
- List controls in Drata that are monitored but currently failing.
- Show controls in Drata mapped to SOC 2 CC6.
- Which controls in Drata are owned by [jane@company.com](mailto:jane@company.com)?
- Who is the owner for our access controls in Drata?
- Create a report of controls in Drata that are not ready and tell me what frameworks they are related to.
- Create a control in Drata called “Quarterly access reviews” and map it to SOC 2 CC6.1.
- Create a control in Drata for “Annual penetration testing” and assign [jane@company.com](mailto:jane@company.com) as the owner.
- Assign [jane@company.com](mailto:jane@company.com) as an owner of control CC1.1 in Drata.
- Add [John@company.com](mailto:John@company.com) as an owner of DCF-15 in Drata without removing the current owners.
- Update the description of control CC6.1 in Drata.
- Link the Change Management Policy to control DCF-37 in Drata.
- Map control DCF-15 to the SOC 2 and ISO 27001 requirements in Drata.

### Frameworks & requirements

- How ready are we for ISO 27001 in Drata — list the requirements not yet met.
- Which SOC 2 requirements in Drata have no controls mapped?
- List the SOC 2 requirements in Drata that aren’t ready yet.
- Find CCPA requirements in Drata that mention “1798”.

### Policies

- Search Drata policies for our password / MFA requirements.
- List our Drata policies and who owns each.

### Evidence

- Which evidence in Drata is expired or due for renewal?
- List evidence in Drata owned by [jane@company.com](mailto:jane@company.com).
- List the evidence in Drata linked to control DCF-15.
- Create a new piece of evidence in Drata and attach it to control DCF-15.
- Upload evidence in Drata named “2026 Pen Test Report”, owned by [jane@company.com](mailto:jane@company.com), linked to control CC7.1.
- Create evidence in Drata from this URL and link it to control DCF-37.
- Rename the evidence “Old Report” to “2026 Report” in Drata.
- Change the owner of [evidence] to [jane@company.com](mailto:jane@company.com) in Drata.
- Re-link [evidence] to controls CC6.1 and CC6.2 in Drata.
- Update the renewal date or cadence on [evidence] in Drata.
- Delete the outdated evidence item “[name]” in Drata.
- Archive evidence {x} in my {evidence bucket}
- Add 5 screenshots to evidence {bucket name}
- Remove artifact {y} from evidence folder {name}

### Risks

- Create a report of risks in Drata that need attention.
- Which risks in Drata are high severity without a treatment plan?
- Create a report of risks in Drata created in the last 6 months that don’t have a treatment plan.
- What risks don’t have a treatment plan in Drata and who are their owners?
- What risks in Drata are associated with background checks and security training for personnel?
- I’m monitoring a risk regarding our cloud infrastructure. What risks in Drata are currently related to this?
- List the risks in our [name] risk register in Drata.
- What risk registers do we have in Drata?
- Show me the risks in the Health risk register in Drata.
- List all our active risks in Drata.
- Find risks in Drata related to finances.
- Find risks in Drata that mention ransomware.
- How many risks do we have in total in Drata?
- Show me risks in Drata sorted by highest risk first.
- Show me the 10 oldest open risks in Drata.
- Show me risks in Drata tagged with both Artificial Intelligence and Governance - Finance.
- Show me risks in Drata tagged with Artificial Intelligence or Governance - Finance.
- Show me all risks in Drata mapped to control DCF-802.
- Show me active risks in Drata for the [workspace name] workspace.
- What risks in Drata is John responsible for?
- Which risks in Drata is Jane reviewing?
- Show me risks in Drata that are either Accepted or Actively Mitigated.
- Which risks in Drata have a high impact score, even if likelihood hasn't been scored?
- Show me risks in Drata where the {custom field} is between 500 and 600.
- What's the average {custom field} value for risks in Drata in the Engineering department?
- How many risks do we have in Drata, broken down by status?
- Give me a breakdown of risks in Drata by treatment plan and type.
- We just discovered our staging environment has no rate limiting on login — log that as a new risk in Drata.
- Create a risk in Drata for “Vendor without a signed data processing agreement,” assign it to [jane@company.com](mailto:jane@company.com), and set its Cost custom field to 750.
- Add a new risk in Drata called “No offboarding checklist for terminated employees.”
- The unpatched load balancer risk in Drata has been resolved — close it out.
- Change the treatment plan for [risk name] in Drata to Accepted.
- Add Luis as an owner of Sample Risk in Drata without removing the current owners.
- Delete the risk [risk name or code] in Drata.

### Monitoring tests

- Are there any failing tests for version control systems connected in Drata?
- Do we have tests in Drata ensuring data is not publicly accessible?
- Which monitoring tests in Drata are failing for our cloud provider?
- Create a report of all failing tests in Drata and rank them by priority.
- Show all failing tests in Drata grouped by the control they support.

### Personnel & compliance

- List all personnel in Drata who aren’t compliant.
- How many personnel are fully compliant in Drata — break it down by employment status.
- Who in Drata is missing MFA?
- How many people in Drata haven’t accepted their policies?
- List contractors in Drata who haven’t completed security training.
- Who in Drata hasn’t completed their background check?
- Is Jane Doe compliant in Drata — and is it a device or a policy issue?
- What personnel groups do we have in Drata?
- Who in the Engineering group in Drata is non-compliant?
- List personnel in Drata where the Department custom field is “Sales”.
- Mark [john@company.com](mailto:john@company.com) as a former employee in Drata.
- Mark [person] as out of scope in Drata with a reason.
- Set [jane@company.com](mailto:jane@company.com)’s Department custom field to “Security” in Drata.
- Update [person]’s start date or employment details in Drata.
- Show me everyone having {numeric custom field} that is above > 5.
- Upload [jane@company.com](mailto:jane@company.com)'s security awareness training certificate in Drata — she completed it on 2026-08-20.
- File John Doe's HIPAA training evidence in Drata, completed 2026-07-15.
- Add MFA evidence for [jane@company.com](mailto:jane@company.com) in Drata.
- File offboarding evidence for [john@company.com](mailto:john@company.com) in Drata.
- Give me a link to upload Jane Doe's security training certificate in Drata — completed 2026-08-20.
- I have four security training certificates for [jane@company.com](mailto:jane@company.com), all completed 2026-08-20 upload them in Drata.
- Upload security training for [jane@company.com](mailto:jane@company.com) (completed 2026-08-20) and HIPAA training for [john@company.com](mailto:john@company.com) (completed 2026-07-15) in Drata.

### Devices

- Who in Drata is missing disk encryption?
- Which personnel in Drata have a failing antivirus check?
- How many devices in Drata are failing each compliance check?
- Which personnel in Drata are missing a password manager?
- Show me devices in Drata without auto-updates enabled.
- Show me the device compliance for [jane@company.com](mailto:jane@company.com) in Drata.
- List John Doe’s devices in Drata and which checks are failing.

### Identity & access

- Who has Admin access in Drata?
- List all members of the [role name] role in Drata.
- What is Jane Doe’s role in Drata?

### Vendor

- Which vendors is John Doe the security owner for?
- List vendors renewing on 2026-09-01.
- Which vendors do not have any renewal schedule?
- Which vendors have a six-month renewal schedule?
- Which vendors have an annual renewal schedule?
- Show vendors with reviews due soon or overdue.
- Which vendors need action right now?
- Show vendors that are not sub-processors.
- List all Engineering or Finance vendors.
- Show all Contractors and Partners.
- Show the vendor details for Acme Vendor.
- How many moderate-risk vendors do we have?
- Show vendors with critical inherent risk.
- List the security reviews for Acme Vendor.
- Show completed SOC report reviews for Vendor Acme.
- Which of Acme Vendor's reviews were approved?
- Create a vendor named Acme Vendor, assign it to Finance, set its type to Supplier, assign John Doe as the security owner, mark it as a sub-processor, and set its password policy to SSO.
- Create Acme Services as a prospective vendor with an annual renewal schedule and a renewal date of 2027-01-01.
- Create Acme Analytics and set its {custom fields}.
- Move Acme Analytics from prospective to active.
- Archive Vendor Acme.
- Reassign Acme Vendor's security owner to John Doe.
- Set Acme Vendor's residual risk to High and impact level to Critical.
- Mark Acme Services as a sub-processor.
- Update Acme Vendor's renewal date to 2026-12-31 and set its renewal schedule to annual.
- Put Acme on hold.
- Change Acme Docs' business unit to Engineering.
- Delete vendor Acme Analytics.

## Troubleshooting

### Callback URL mismatch

If you see the error **“Callback URL mismatch,”** the issue is related to the authentication provider, Auth0—not a Drata configuration page.

This commonly happens when you create a separate OAuth Application under **Settings → OAuth Applications** and manually enter that application’s client ID and client secret in your AI client’s connector settings.

**MCP OAuth Configuration** and **OAuth Applications** are different features:

- **MCP OAuth Configuration:** Connects AI clients such as Claude, ChatGPT, Cursor, and Copilot to Drata.
- **OAuth Applications:** Provides direct API access using tokens, a client ID, and a client secret.

To resolve the error:

1. Open your AI client’s connector settings.
2. Remove any manually entered client ID and client secret.
3. Configure the connector using only the Drata MCP server URL for your region:
   - US: `https://mcp.drata.com/mcp/`
   - EU: `https://mcp-euc1.drata.com/mcp/`
   - APAC: `https://mcp-apse2.drata.com/mcp/`
4. Restart the sign-in flow.
5. Approve the requested permissions.

## Related articles

- [Role Administration & RBAC](role-administration-rbac.md)
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md)
- [Microsoft Copilot MCP Integration Guide](microsoft-copilot-mcp-integration-guide.md)
- [Hosted Technology Vendors: What to Collect and How Drata Can Help](hosted-technology-vendors-what-to-collect-and-how-drata-can-help.md)
