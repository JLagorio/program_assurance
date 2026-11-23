# MIM Dashboard

Source: https://help.drata.com/en/articles/9677750-mim-dashboard
Collection: Getting Started › MIM
Updated: 2026-11-09
Fetched: 2026-11-22
Description: View compliance health metrics for all the accounts that you manage.

## Article text

View compliance health metrics for all the accounts that you manage.

If you are a Managed Security Service Provider (MSSP), virtual CISO, or manager of multiple Drata accounts, the MIM Dashboard gives you a centralized view of compliance health across all your accounts. Use it to quickly identify which accounts need attention — such as accounts with unsatisfied framework requirements, failing connections, or incomplete onboarding.

## Before you begin

- You must be set up as a guest administrator within Drata.
- You must have accounts assigned to your guest administrator profile.
- The accounts displayed are scoped to your existing guest administrator assignments. Each guest administrator sees only the business accounts they manage within their MIM account domain.

## Dashboard overview

The MIM Dashboard is organized into three sections: **Account**, **Workspace**, and **Framework** level metrics. You can search by account name or email domain, and sort on various columns within each section.

## Account level metrics

The Account section displays aggregated compliance metrics that cover the entire business account, including all workspaces under that account.

| **Column** | **Description** |
|---|---|
| Accounts | Displays the account name and email domain |
| Active connections | Displays all active and failing connections |
| Approved policies | Displays the total count of approved policies |
| Tests passing | Displays the percentage of passing tests across the account |
| Tests failing | Displays the percentage of failing tests across the account |
| Onboarding completion | Displays the percentage of personnel who have completed onboarding |
| Risk assessment completion | Displays the completed percentage of any started risk assessment |

## Workspace level metrics

The Workspace section sits below the account level and displays compliance health metrics for each individual workspace within a business account. Metrics include control readiness, test results by category, and more.

| **Column** | **Description** |
|---|---|
| Workspace | Displays the workspace name and associated email domain |
| Non-ready controls | Displays the total count of controls that are not ready for the workspace |
| Control readiness | Displays the percentage of controls considered ready for each workspace |
| Infrastructure tests | Displays the number of passing and failing automated infrastructure tests |
| Identity tests | Displays the number of passing and failing automated identity tests |
| Version control tests | Displays the number of passing and failing automated version control tests |
| Ticketing tests | Displays the number of passing and failing automated ticketing tests |
| Observability tests | Displays the number of passing and failing automated observability tests |
| Policy tests | Displays the number of passing and failing automated policy tests |
| In Drata tests | Displays the number of passing and failing automated In Drata tests |
| Agent tests | Displays the number of passing and failing automated agent tests |

## Related articles

- [Test 86: MFA on Identity Provider](test-86-mfa-on-identity-provider.md)
- [Navigate the Workspaces Dashboard (Beta)](navigate-the-workspaces-dashboard-beta.md)
- [Dashboard overview](dashboard-overview.md)
- [Monitoring Overview](monitoring-overview.md)
- [Understand Accounts, Workspaces, and MIM](understand-accounts-workspaces-and-mim.md)
