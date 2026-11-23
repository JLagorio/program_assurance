# Asana Integration Guide

Source: https://help.drata.com/en/articles/5008063-asana-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to Asana

## Article text

The Asana integration enables security and compliance teams to automate checks and collect evidence tied to vulnerability management work. It connects Drata to Asana so your team can track security-related tasks/tickets and demonstrate adherence to your vulnerability management policies.

## Prerequisites & Data Access

- You must have one of the following Drata roles: **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager**.
- **Admin access** to your organization’s **Asana** account is required.
- If your Asana workspace uses a label other than **Security** to categorize security issues, update the **Security Tag** (and severity mappings) in Drata’s connection settings.

You can edit severity mappings at any time from the **Connections → Asana** page to match your team’s internal Asana workflow.

## Complete the Connection

In Drata’s **Connections** page, search for the **Asana** connection and then:

| **Drata Field** | **Asana Value** |
|---|---|
| **Account Alias** | Your Asana account display name |
| **Security Tag** | The label or tag Asana uses for security issues (default: `Security`) |
| **Critical Severity Level** | Label for critical vulnerabilities |
| **High Severity Level** | Label for high-severity vulnerabilities |
| **Medium Severity Level** | Label for medium-severity vulnerabilities |
| **Low Severity Level** | Label for low-severity vulnerabilities |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Enable Write Access

Enable **Write Access** to allow Drata to **create and update Asana tickets directly** from within Drata.

## Related articles

- [Shortcut Integration Guide](shortcut-integration-guide.md)
- [GitHub Issues Integration Guide](github-issues-integration-guide.md)
- [GitLab Issues Integration Guide](gitlab-issues-integration-guide.md)
- [Target Process Integration Guide](target-process-integration-guide.md)
- [GitLab Issues (Self-Managed) Integration Guide](gitlab-issues-self-managed-integration-guide.md)
