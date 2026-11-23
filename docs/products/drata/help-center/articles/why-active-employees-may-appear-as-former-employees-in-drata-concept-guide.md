# Why active employees may appear as former employees in Drata? (Concept Guide)

Source: https://help.drata.com/en/articles/12939479-why-active-employees-may-appear-as-former-employees-in-drata-concept-guide
Collection: Understand the Drata Platform › Personnel
Updated: 2026-01-26
Fetched: 2026-11-22
Description: Use this article to understand why active employees may appear as Former Employee or not appear in the Personnel list in Drata.

## Article text

Drata updates personnel records based on data from connected identity providers (IdP), HRIS integrations, and manual changes. When that data changes or becomes unavailable, Drata updates personnel status accordingly.

## What affects personnel status

### Group sync configuration

When group sync is enabled, Drata imports only users who belong to the selected groups.

Drata applies group sync rules during:

- Initial group sync setup
- Daily automated syncs
- Manual personnel resyncs

If a user no longer belongs to a synced group, Drata updates that user’s status based on the current configuration. This can cause active users to appear as **Former Employee**. Navigate to the Connections page to review the synced groups for your connected IdP or HRIS integrations.

### IdP or HRIS connectivity

Drata relies on active connections to retrieve personnel data. If an IdP or HRIS connection becomes inactive or loses authentication:

- Drata may not retrieve current user data
- Users may appear as **Former Employee**
- Users may appear as **Unknown** if Drata cannot match records

Reconnecting the integration and re-triggering the personnel resync usually restores the correct status.

### Profile mismatches between systems

Drata matches users across systems based on email address. If these fields do not match between the IdP and HRIS:

- Drata may assign an unexpected status
- Users may not appear in the Personnel list

Incomplete or inconsistent data commonly causes these issues.

## Related articles

- [Populating and Managing Personnel Data in Drata (Concept Guide)](populating-and-managing-personnel-data-in-drata-concept-guide.md)
- [Connect your HRIS to Drata](connect-your-hris-to-drata.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)
- [Troubleshoot employment status issues in Drata](troubleshoot-employment-status-issues-in-drata.md)
- [Troubleshooting Identity Sync Issues in Drata](troubleshooting-identity-sync-issues-in-drata.md)
