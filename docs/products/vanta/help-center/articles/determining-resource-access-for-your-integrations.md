# Determining Resource Access for Your Integrations

Source: https://help.vanta.com/en/articles/15878326-determining-resource-access-for-your-integrations
Collection: Integrations ; Integrations › Getting Started with Integrations
Fetched: 2026-11-17

## Article text

Who it's for: You've connected an integration and want to control exactly what Vanta monitors, especially relevant if you run separate prod/staging/sandbox environments, multiple cloud accounts, or subscriptions.
 
Skip this if: You haven't connected your integrations yet. Start with Integration Journey: What to Connect First in Vanta <https://help.vanta.com/en/articles/15878233-integration-journey-what-to-connect-first-in-vanta>. 
When you connect an integration to Vanta, the platform discovers every resource it can see: cloud accounts, repositories, devices, user accounts, and more. Not everything it finds needs to be monitored. Deciding which resources Vanta should watch and which it should ignore is what this article covers.
ℹ️ Note on terminology: In this article, "scope" refers to which resources Vanta has access to and monitors — it's about resource access, not compliance relevance. This is different from framework scope, which determines whether an already-in-scope resource matters for a specific framework like SOC 2 or HIPAA. We'll keep those two ideas separate throughout this article, and use "scope" here to mean the first one unless we say otherwise.
 Getting this right reduces noise in your compliance dashboard, keeps your tests focused on what actually matters, and prevents failures on resources that were never meant to be monitored in the first place.
💡Tip before you connect: Scoping is much easier to think through before an integration is live than after, when you're looking at thousands of discovered resources. See the Before You Connect: Integration Prerequisites Checklist <https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist> for a pre-connection scoping checklist.
 
 

## Where to configure resource access for integrations
ℹ️ Note: Not all integrations support granular scoping. Many integrations are scoped primarily at the resource type or individual resource level. Some integrations don't expose scoping options at all.
There are two places in Vanta where you can configure integration scope: 
 

### 1. Integrations page (primary)
Path: Integrations > Connected > [Integration] > Configure scope
 
This is where you'll do most of your scoping work. After selecting an integration, the Configure resource scope modal shows your resources grouped by account, with a dropdown for switching between accounts if you have multiple. From here you can:
- 
Toggle individual resources in or out of scope
- 
Filter resources to find specific ones quickly
- 
Use Mark all in / Mark all out to bulk-configure an entire resource type or account at once
ℹ️ Note: Mark all in / Mark all out applies to all resources of that type within the selected account. These buttons are disabled when filters are applied. Clear your filters first to use bulk actions.
 

### 2. During integration setup (connection wizard) 
For integrations that support it, the connection wizard may include a scope configuration step near the end of setup. If your integration does not include this step, you can configure scope afterward from the Integrations page. 
 
If applicable, during the connection steps you'll see a list of discovered resources grouped by type, with the ability to toggle them in or out before the integration goes live. This is the best time to do initial scoping, since you're making decisions before tests have started running.
⚠️ Note: Scope changes may take up to an hour (or more in some cases) to be reflected across your tests and evidence. This is expected. Don't be concerned if tests don't update immediately after you make a change.
 
 

## Key decisions to make before you scope integrations

### Decision 1: Which environments should be in scope? 
Before you open the Configure resource scope modal, map your systems to your audit scope. Common questions to work through:
- 
Do you have separate production, staging, and sandbox environments? In most cases, only production needs to be in scope.
- 
Which cloud accounts or projects process or store customer data?
- 
Are there resource types that are clearly irrelevant to your compliance posture? For example, a large number of S3 buckets used only for static assets with no sensitive data.
Getting clarity on these questions before connecting saves significant cleanup time afterward.
 

### Decision 2: How to approach multi-account cloud environments 
If you have AWS Organizations, a GCP Organization, or Azure with multiple subscriptions, connect at the organization or management account level rather than connecting individual accounts one by one.
 
Connecting at the top level gives you:
- 
Automatic discovery of new accounts or projects as they're created
- 
A single view for scoping decisions across all accounts
- 
The ability to include some accounts and exclude others without managing multiple separate connections
 | 
Cloud provider | 
Connect at | 
What you can then scope
 | 
AWS | 
Organization (management account) | 
Sub-accounts → resource types → individual resources
 | 
GCP | 
Organization | 
Projects → resource types → individual resources
 | 
Azure | 
Tenant (management credential) or individual subscription | 
Subscriptions → resource types → individual resources
 

### Decision 3: What a “narrow” vs “broad” scoping approach means for you 
There's no universal right answer on how tightly to scope, but two common patterns:
- 
Start broad, exclude what doesn't belong: Bring everything in scope when you connect, then remove resources that aren't relevant. This ensures comprehensive coverage from day one and reduces the risk of gaps. The tradeoff: more initial noise from tests on resources you'll eventually exclude.
- 
Start narrow, add what you need: Exclude most resources on connection and manually bring in what's relevant. This keeps your compliance dashboard clean immediately but requires more upfront configuration and carries the risk of missing something that should be monitored.
For most customers, starting broad and scoping down is the easier path, especially if you're not yet sure exactly what should or shouldn't be in scope.
 
 

## Common scoping tasks

### Access scope settings for an integration
- 
Go to Integrations in the left navigation. 
- 
Click on the Connected tab. 
- 
Find and select the integration you want to configure.
- 
Click the Configure scope button (if applicable).
- 
Adjust settings to your preference.

### Exclude multiple resources of the same type at once 
- 
Go to Integrations > [Integration] > Configure scope
- 
Use the dropdown to filter by resource type. 
- 
Select the resources you want to exclude and use the bulk action to mark them out of scope. 
- 
Or, if nothing in an entire account is relevant, toggle the account out of scope directly. 

### Exclude specific individual resources
- 
Go to Integrations > [Integration] > Configure scope.
- 
Select the relevant account from the dropdown.
- 
Locate the specific resource (use the filter if needed).
- 
Toggle it out of scope.
This creates a scope exemption for that resource. It will remain out of scope even if other resources of the same type are later marked in. 
 

### Bring a resource back into scope
- 
Go to Integrations → [Integration] → Configure scope.
- 
Find the resource using the filter.
- 
Toggle it back in scope. 

### Configure scope during initial connection
- 
If the connection wizard for your integration includes a scope configuration step, it will appear near the end of the setup process.
- 
Review the discovered resources grouped by type.
- 
Toggle resource types or individual resources in or out as needed.
- 
Continue to complete the connection.
You can always adjust scope later from the Integrations page.
 
 

## Pitfalls to avoid
Scope exemptions can be cleared by parent-level changes. If you've set individual resource exemptions and then change the parent account's scope to fully in or fully out of scope, those exemptions may be cleared. If you need to make a broad change to a parent's scope, review any exemptions underneath it first.
 
Starting narrow means you can miss things. If you exclude a large portion of your environment at connection and don't have a process to revisit scope regularly, it's easy to end up with resources that should be monitored sitting quietly outside your compliance coverage.
 
Sandbox and test resources can still fail tests. Until you've explicitly scoped them out, Vanta will monitor them and generate test failures. If you're seeing unexpected failures on non-production resources, check their scope status first.
 
 

## Scoping and your audit trail
Every scope configuration change in Vanta is logged automatically. The activity log captures who made the change, what was changed, when it happened, and which integration it applies to.
 
This matters for auditors. Scope decisions are not just a product configuration, they're a documented record of what your organization chose to include in its compliance program and why. When an auditor asks why a particular resource wasn't monitored, you have a timestamped, attributed record of the scope change to reference.
 
 

## FAQs

### My integration connected successfully, but I don't see the resources I expected. Why?
This is usually one of three things: a permission gap on the connection itself, a sync delay (scope and resource discovery can take up to an hour to fully populate), or a resource type your integration doesn't support discovering yet. Start by checking the account dropdown in Configure resource scope to confirm you're looking at the right account, then check your integration's permission scope on the Integrations page. 
 

### I marked a resource out of scope, but it's still failing a test. What's going on?
Two common causes. First, scope changes take up to an hour to fully reflect across tests and evidence, so a recent change may not have propagated yet. Second, if you set an individual scope exemption and then changed the parent account or resource type's scope afterward, that broader change may have cleared your exemption. Check the resource's current scope status directly rather than assuming your last change is still in effect.
 

### What's the difference between "out of scope," framework scope, and a test just not applying to a resource?
These are three separate systems that don't always move together:
- 
Integration/resource scope controls what Vanta monitors at all, set from the Configure scope page.
- 
Framework scope controls which of your monitored resources apply to a specific compliance framework (SOC 2, ISO 27001, etc.), even if they're in scope for monitoring generally.
- 
Test-level behavior can vary by test: a resource can be in scope and still not trigger a specific test if that test doesn't apply to that resource type.
If something looks like it should be excluded but isn't behaving that way, check all three levels rather than assuming one setting controls everything. See Adaptive Framework Scoping <https://help.vanta.com/en/articles/11345359-adaptive-framework-scoping> for how framework scope works specifically.
 

### If I scope something out in my identity provider, does that apply across my other integrations too?
It depends on your configuration. If user scope sync is enabled, scoping a person out in your IdP will automatically scope out their associated accounts in other integrations. If it’s not enabled, scope decisions are set per integration independently.
 
 

## Next steps
Once you've configured which resources Vanta monitors within your integrations, you can further control which of those resources apply to specific compliance frameworks. See Adaptive Framework Scoping <https://help.vanta.com/en/articles/11345359-adaptive-framework-scoping> for how to manage framework-level scope.
 
 

## Related resources
- 
Integration Journey: What to Connect First in Vanta <https://help.vanta.com/en/articles/15878233-integration-journey-what-to-connect-first-in-vanta>
- 
Before You Connect: Integration Prerequisites Checklist <https://help.vanta.com/en/articles/15292833-before-you-connect-integration-prerequisites-checklist>
- 
How to Work with System Owners to Connect Integrations <https://help.vanta.com/en/articles/15878268-how-to-work-with-system-owners-to-connect-integrations>
- 
Frequently Asked Questions: How do I Mark Resources Out of Scope <https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope>

## Images

- none
