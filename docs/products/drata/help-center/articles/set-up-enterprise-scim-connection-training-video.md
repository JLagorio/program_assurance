# Set Up Enterprise SCIM Connection Training Video

Source: https://help.drata.com/en/articles/18179087-set-up-enterprise-scim-connection-training-video
Collection: Understand the Drata Platform › Training Videos › Training Videos (New Experience)
Updated: 2026-11-04
Fetched: 2026-11-22
Description: Learn how to set up enterprise SCIM with Okta and sync users automatically.

## Article text

## Set Up an Enterprise SCIM Connection

Walk through the setup wizard to connect Okta to Drata, configure Directory sync with SCIM, enable SSO, and keep the existing Okta connection monitoring multi-factor authentication (MFA). Let the first user and group sync finish before continuing, since Drata uses the synced directory as the source of truth for personnel.

**Key Takeaways**

- Start the wizard from the "Set up SCIM" banner or from Directory sync in Identity connections.
- Choose synced groups carefully, as they can change roles and ownership in Drata.
- After the first sync finishes, convert the existing Okta connection to MFA-only monitoring.

[Video (arcade): https://app.arcade.software/share/zZXnbSxuXeLcEEDeHP0g](https://app.arcade.software/share/zZXnbSxuXeLcEEDeHP0g)

## Sync a New User with SCIM

Add a new user to a synced Okta group and watch SCIM bring them into Drata's Personnel list within minutes, with MFA status following on the overnight sync.

**Key Takeaways**

- SCIM sends group membership changes to Drata within minutes, with no wait for the nightly sync.
- New users appear in the Personnel list with directory sync shown as their source, with no manual updates needed.
- MFA status updates after the next overnight sync, not right away.

[Video (arcade): https://app.arcade.software/share/iyVBRNjwFRweVQGaVn0d](https://app.arcade.software/share/iyVBRNjwFRweVQGaVn0d)

## Related articles

- [Okta Integration Guide (Identity Management Provider)](okta-integration-guide-identity-management-provider.md)
- [Okta Integration Guide (User Access Review)](okta-integration-guide-user-access-review.md)
- [SafeBase Integrations Training Video](safebase-integrations-training-video.md)
- [Integrating an Okta Tenant with Drata Training Video](integrating-an-okta-tenant-with-drata-training-video.md)
- [Enterprise SCIM Integration Guide](enterprise-scim-integration-guide.md)
