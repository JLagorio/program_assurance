# Connect your HRIS to Drata

Source: https://help.drata.com/en/articles/8699680-connect-your-hris-to-drata
Collection: Understand the Drata Platform › Connections
Updated: 2026-01-07
Fetched: 2026-11-22
Description: Learn how to connect HRIS providers to Drata and the available HRIS providers.

## Article text

## Overview

Connecting an HRIS to Drata allows Drata to automatically track **who is in scope for compliance**, including employee start dates, separation dates, and employment status.

This connection helps ensure Drata is monitoring the **right people at the right time**, and reduces manual work during audits.

### When you should connect an HRIS

You should connect an HRIS if you want Drata to:

- Automatically mark employees as **active or former**
- Track **hire and termination dates** for audit evidence
- Reduce manual updates to personnel records
- Improve accuracy across access reviews, device compliance, and policies

If you do not connect an HRIS, you will need to manage personnel status manually in Drata.

## Prerequisite

- You must have **admin access** to your HRIS
- You must have **Admin access in Drata**

## How to connect your HRIS

1. Go to **Connections** in Drata.
2. Filter by **HRIS** connection type to view available providers.
3. Select the desired connection.
4. Follow the connection steps shown in the setup flow.

During setup, some HRIS integrations (via Merge) may request access to payroll data, but **Drata does not use or sync payroll data**, so this permission is not required.

For detailed setup instructions for specific integrations, go to [Connection support](https://help.drata.com/en/collections/16397047-connection-support).

## What data Drata syncs from HRIS

Drata reads HRIS data only. It does not make changes in your HRIS.

Commonly synced attributes include:

- Employee name and email
- Employment status (active or former)
- Start date and separation date

This data is used to keep personnel records accurate and up to date across Drata.

### Supported HRIS providers

Drata supports a wide range of HRIS providers. To see the current list of available HRIS integrations, go to **Connections → HRIS** in the Drata app.

**Note for Employment Hero:**

- Employment Hero's OAuth application setup does not support detailed or granular access scopes.
- Because of this, it is not possible to use a more specific permission and the available read permission must be granted.
- Ensure to grant read permissions when connecting Employment Hero to Drata.

## Common questions and troubleshooting

**Why do I see duplicate personnel after connecting HRIS?**
Drata matches users by **exact email address**. If the same person has different emails across systems, duplicates may appear. You can mark the extra record as **Out of scope** from the Personnel page.

**Does connecting HRIS change anything in my HRIS?**
No. Drata has read-only access and does not update or modify HRIS data.

**Do I need both an IdP and an HRIS?**
Not required, but many customers use both:

- IdP for access and MFA monitoring
- HRIS for employment status and lifecycle tracking

## Related articles

- [Populating and Managing Personnel Data in Drata (Concept Guide)](populating-and-managing-personnel-data-in-drata-concept-guide.md)
- [Integrate Multiple Identity and HRIS Connections](integrate-multiple-identity-and-hris-connections.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)
- [UKG Ready Integration Guide](ukg-ready-integration-guide.md)
- [Troubleshooting Identity Sync Issues in Drata](troubleshooting-identity-sync-issues-in-drata.md)
