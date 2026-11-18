# Vanta EU and AUS regions: Sign-In, Integrations, and Data Residency

Source: https://help.vanta.com/en/articles/14667543-vanta-eu-and-aus-regions-sign-in-integrations-and-data-residency
Collection: Integrations ; Integrations › Getting Started with Integrations
Fetched: 2026-11-17

## Article text

If your organization uses Vanta in the EU or AUS region, knowing your regional setup helps you avoid sign-in errors, integration failures, and allowlisting issues. This article is for account admins and IT administrators who need to confirm their region, troubleshoot integration connections, or plan for a region migration.
ℹ️Note: Your Vanta region determines where your Vanta environment is hosted. It does not guarantee that all supporting services, network paths, or subprocessors operate exclusively in that region. Review the Trust Center <https://trust.vanta.com/> and your DPA with your legal, privacy, or security team for details.
 

## Overview

### Which Vanta region am I using?
Your Vanta region is reflected in the link you use to sign in.
- 
US: app.vanta.com <http://app.vanta.com>
- 
EU: app.eu.vanta.com <http://app.eu.vanta.com>
- 
AUS: app.aus.vanta.com <http://app.aus.vanta.com>
Your organization's physical location doesn't automatically determine your Vanta region. For example, an organization based in Europe may still use the US region unless an EU tenant was requested.
 
If your organization is in the EU or AUS region, always start from the correct regional link when you sign in or connect an integration. Using the wrong regional link can cause:
- 
domain not found errors
- 
sign-in failures
- 
authorization or redirect failures
- 
integrations not appearing as expected
 

### How your region affects integration setup
Your Vanta region determines which IP address Vanta uses to connect to your third-party services. If a service requires IP allowlisting, you must allowlist the IP address shown on your Integrations page in Vanta. This IP address differs by region.
Beyond allowlisting, integration setup steps are the same regardless of which Vanta region you use. You do not need to follow different instructions for connecting integrations in the EU or AUS regions.
ℹ️Note: Some integrations (such as PingOne or ManageEngine) ask you to select a region during setup. This refers to where your data is hosted with that provider, not your Vanta region.
 

### Sign-in and authorization
If something looks wrong during setup, first confirm that you are signed in to the correct Vanta region for your company. 
 
 

### Allowlisting Vanta’s IP address
Some services require you to allowlist Vanta’s IP address before the integration can connect successfully.
 
You can find your region-specific Vanta IP address on the Integrations page in Vanta. The IP address may differ by region. If your team has already allowlisted Vanta for one region and you later connect from another region, verify that the correct regional IP address is allowlisted.
 | 
ℹ️Note: The IP address shown on the Integrations page is the address Vanta uses to connect to your third-party services. It may not match the IP address you see when looking up Vanta's web application URL in browser or network tools.
 
 

## Data residency and storage expectations
Vanta offers regional hosting options in the US, EU, and AUS regions. If your organization has data residency requirements, review both:
- 
where your Vanta environment is hosted
- 
where Vanta subprocessors may store or process data
If your organization has strict internal or contractual residency requirements, review the Trust Center <https://trust.vanta.com/>, subprocessor information <https://trust.vanta.com/subprocessors>, and your DPA with your legal, privacy, or security team before uploading sensitive information.
 
 

## Frequently asked questions

### Why do I see a different IP address when I look up app.eu.vanta.com?
The IP address used for allowlisting integrations is not the same as every IP address you may see in browser or network tools. If you have questions about hosting and processing locations, review the Trust Center <https://trust.vanta.com/> and subprocessor list <https://trust.vanta.com/subprocessors>.
 

### Does choosing an EU or AUS tenant mean all processing stays in that region?
No. Choosing a regional tenant means your Vanta environment is hosted in that region, but some supporting services or subprocessors may still operate in other regions.
 
 

## Common issues to check
If you're running into problems with a regional tenant or data residency concern, start here. 
 | 
Issue | 
Likely cause | 
What to do
 | 
Domain not found when signing in | 
Wrong regional link | 
Verify you're using the correct regional link for your organization
 | 
Integration doesn’t connect or authorize | 
Signed in to the wrong Vanta region | 
Sign out, sign in to the correct region, and try again
 | 
Integration stops working after migration | 
Allowlist or provider configuration needs an update | 
Review allowlisting and provider-specific setup
 | 
A regional tenant shows an unexpected IP address | 
Looking at a different network path than the integration allowlist IP | 
Review the IP guidance and Trust Center <https://trust.vanta.com/> resources
 | 
You are not sure whether data stays in one region | 
Need more detail on hosting vs. processing | 
Review the FAQ above and the Trust Center <https://trust.vanta.com/>
 

## How to migrate to another Vanta region
To move from one Vanta region to another, email [email protected] and include:
- 
your current region
- 
the region you want to move to
- 
whether you use Vanta Device Monitor
- 
any key integrations you rely on
Regional migration is not currently available if your organization:
- 
Is part of a multi-organization workspace
- 
Is managed by an MSP (Managed Service Provider)
- 
Is an MSP console (manages other Vanta accounts)
- 
Has SCIM provisioning enabled
- 
Is an auditor organization
- 
Has devices running outdated versions of the Vanta Agent (see "Before migration" above)
If any of these apply, contact Vanta support to discuss your options.
 

### Before migration
Review the integrations and services your team relies on. If you use Vanta Device Monitor, make sure all agents are updated to the latest version before requesting a migration. Migrations cannot proceed if any active agents are running an outdated version. If you allowlist Vanta's IP address with any third-party services, plan to update that allowlist after the migration.
 

### After migration
After your migration is complete, take these steps in order:
- 
Sign in using your new regional link (see "Which Vanta region am I using?" above).
- 
Review all active integration connections including any custom or private integrations, and reconnect any that are no longer authorized.
- 
Update your IP allowlist with the new regional IP address, found on the Integrations page in Vanta.
- 
If you use Vanta Device Monitor, confirm your agents have reconnected successfully.
Some integrations may automatically reconnect after migration. Review each integration’s status and reconnect only those that show errors. 
 
If you're not sure what to update, email [email protected] for help reviewing your next steps.

## Images

- none
