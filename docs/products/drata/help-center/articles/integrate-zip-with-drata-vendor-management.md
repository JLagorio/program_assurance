# Integrate Zip with Drata Vendor Management

Source: https://help.drata.com/en/articles/11801416-integrate-zip-with-drata-vendor-management
Collection: Understand the Drata Platform › Vendors › Procurement Connections
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

Effective vendor management is a cornerstone of a robust security and compliance program, especially for audits like SOC 2 and ISO 27001. Drata now offers a native integration with Zip, connecting your procurement workflow directly to your compliance program—so vendor security reviews happen automatically, without manual handoffs between teams.

This article explains how the integration works, what it includes out of the box, how to set it up, and how to customize it for your organization’s needs.

## BEFORE DIVING IN

- Zip now includes an out-of-the-box Drata integration directly within Zip.
- Standard field mappings work automatically. If you need more advanced customization, such as custom field mappings or additional workflow configuration, work with Zip to set that up.

Reach out to the Zip team if you have additional questions.

## How the Integration Works

The Zip × Drata integration closes the gap between procurement and compliance. When a team member submits an intake form in Zip for a new vendor, Drata detects it automatically and:

- Creates the vendor record in Drata—no manual entry required.
- Maps standard fields from the Zip intake form directly to the Drata vendor record, so all context carries through.
- Kicks off a vendor security review according to your configured Drata program settings.

When the review is complete and approved in Drata, the status syncs back to Zip automatically. Procurement sees the approval, vendor onboarding keeps moving, and no vendor slips through the gap.

## Step-by-Step Workflow

1. A team member submits an intake form in Zip and selects a new vendor.
2. Zip detects that the vendor is new and triggers the Drata integration.
3. Drata automatically creates the vendor record and starts a security review based on your program configuration.
4. Relevant documents (SOC 2, ISO certification, bridge letters, pen test reports) are attached automatically based on your configured document type filters.
5. The security team completes and approves the review in Drata.
6. Drata syncs the approval back to Zip.
7. The Zip request is cleared for approval with a verified security review on record.

## What’s Included in the Integration

- **Standard field mapping: **Standard Zip vendor fields map to Drata vendor records out of the box. Custom field mappings are on the roadmap for a future release.
- **Automatic vendor contact mapping: **Vendor contact name and email from the Zip vendor contact object are automatically mapped to Drata—no manual configuration needed.
- **Intake form PDF attachment: **Intake form data can be converted to PDF and attached directly to the Drata vendor record.
- **Configurable document filters: **Document attachments are filtered by type (SOC 2, ISO, bridge letters, pen test) and are configurable per deployment.
- **Deep links: **Direct links to Drata vendor records are returned in the Zip API response.
- **Bi-directional status sync: **Once a security review is approved in Drata, the status syncs back to Zip automatically via webhook.

## Setting Up the Integration in Drata

This integration is configured in Zip. In Drata, you will generate your API credentials, then either share them with your Zip Solutions team or paste them directly into Zip.

1. In Drata, go to **Settings → API Keys**.
2. Generate API credentials with the required scopes.
   - Required scopes: All scopes under the Vendors section. Enable with read access and write access when available.
3. Paste the credentials into Zip, or contact your Zip Solutions team to complete the connection. The rest of the configuration is completed in Zip.
   - Configure your field mappings and set the default Drata User ID for the vendor owner.
   - Choose which document types to attach for each deployment, such as SOC 2, ISO certificates, bridge letters, or penetration test reports.

Your Zip Customer Manager can help answer questions about Zip's API capabilities and support data extraction from the Zip platform.

## Customization Options

The integration is designed to work out of the box with standard Zip fields and Drata’s default vendor review workflow. For organizations that need more:

- **Custom field mappings: working with your Zip team, you may be able to customize field mapping to incorporate any custom fields or mappings**
- **Advanced workflow configuration** (e.g., conditional review routing, custom document filters, additional intake form fields) can be explored by working directly with your Zip Customer Manager or Zip’s technical team.
- **Drata’s Public API** remains available for teams that want to build additional custom automations on top of the native integration. See the [Drata Public API Documentation](https://docs.drata.com) for details.

## Get Started

The Zip × Drata integration is available now. If you have questions about setup or advanced customization, reach out to your Zip Customer Manager — for questions about advanced Zip-side configuration or custom field setup.

## Related articles

- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [Drata MCP — Setup & Usage Guide](drata-mcp-setup-usage-guide.md)
- [Ironclad Integration Guide (Procurement)](ironclad-integration-guide-procurement.md)
- [Ramp Integration Guide](ramp-integration-guide.md)
- [Hosted Technology Vendors: What to Collect and How Drata Can Help](hosted-technology-vendors-what-to-collect-and-how-drata-can-help.md)
