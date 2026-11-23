# Auditor API Key Self Service

Source: https://help.drata.com/en/articles/11614342-auditor-api-key-self-service
Collection: The Auditor Experience
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

## What is the Auditor API?

Similar to [Drata’s Public API](drata-public-api.md), the Auditor API allows audit firms to develop integrations with their tools of choice. This includes the integration with [Fieldguide](understanding-the-drata-fieldguide-integration.md) (which is a prebuilt integration). Since auditors have their own auditor tools that they wish to use but need to get certain data out of Drata (e.g. controls, requests, evidence etc.), this API allows our partners to get Audits, Controls, Samples, Evidence and much more in order.

---

## How to Generate API Keys

In order to successfully begin using the API, auditors must generate API keys. This can be done only once they are added to an audit card in AuditHub. From there they perform key generation using the following steps:

1. Login to Drata as an Auditor
2. Receive a MagicLink via email - Click on the link to take you to AuditHub
3. Go to User Profile > Settings > API Keys page.
4. From here, you’ll see the list of API you currently have (status and expiration) as well as the ability to create new API Keys.
5. Set a custom expiration date or use the default of 12 months.

**Important Note**: API keys should be treated as "house keys" and not shared with unauthorized individuals. They currently have an expiration date (set to approximately two years in the future). Users can adjust the expiration date as desired.

API keys should not be shared via email. If possible, share them via 1Password or a similar tool.

If you have any questions or issue while generating API keys or using the API, reach out to your Audit Alliance Manager.

## How to Revoke API Keys

API keys can be revoked at any time through self-service in AuditHub.

To revoke an API key:

1. Login to Drata as an Auditor
2. Receive a MagicLink via email - Click on the link to take you to AuditHub
3. Go to User Profile > Settings > API Keys page.
4. From the list of API keys, select the API key you want to revoke.
5. Click the trash can icon to delete the API key

**Important Note**: Revoking an API key is permanent and will immediately invalidate any integrations or scripts using that key. If you need assistance revoking API keys for security or compliance purposes, contact Drata Support.

## Related articles

- [Understanding the Drata + Fieldguide Integration](understanding-the-drata-fieldguide-integration.md)
- [Set up the Drata + Fieldguide integration in Audit Hub](set-up-the-drata-fieldguide-integration-in-audit-hub.md)
- [Work in a Fieldguide-connected audit in Audit Hub](work-in-a-fieldguide-connected-audit-in-audit-hub.md)
- [What auditors need to do for the Drata + Fieldguide integration](what-auditors-need-to-do-for-the-drata-fieldguide-integration.md)
- [Map audit requests to DCF controls with AI](map-audit-requests-to-dcf-controls-with-ai.md)
