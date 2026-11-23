# Troubleshooting Identity Sync Issues in Drata

Source: https://help.drata.com/en/articles/17303289-troubleshooting-identity-sync-issues-in-drata
Collection: Understand the Drata Platform › Troubleshooting
Updated: 2026-11-16
Fetched: 2026-11-22
Description: Troubleshooting Identity Sync Issues in Drata

## Article text

If a user is missing, has an incorrect name, or shows an unexpected employment status in Drata, the cause is usually within your identity provider (IdP), your HRIS, or a manual change made in Drata. Use the checks below to identify and resolve the issue.

## Before You Start

- Allow up to 24 hours for scheduled updates to sync from connected systems.
- Compare the user’s work email, name, account status, group membership, employment status, start date, and separation date across the IdP, HRIS, and Drata.
- In **Personnel**, check the **Sync status** for manual updates or a disabled sync.
- Correct the source system first, then run an [ad-hoc identity and account resync](ad-hoc-identity-and-account-resync.md).

## Common Issues and Fixes

## The user is missing or not updating

1. Confirm that the user is active in the IdP and belongs to an in-scope group.
2. Confirm that the user’s email domain is included in the connection configuration.
3. Verify that the user’s work email matches in the IdP and HRIS.
4. Confirm the HRIS record includes the user’s name, email, employment status, and relevant dates.
5. Check whether the record was manually changed in Drata. Manual changes pause automated syncing for that user.

## Re-enable syncing 

- **One person:** open **Personnel**, select the user, choose the ellipsis menu, select **Re-enable IdP/HRIS sync**, and confirm.
- **Multiple people:** select them, then choose **More > Re-enable IdP/HRIS sync**.

## The user’s name is incorrect or does not match

When an HRIS is connected, it is the source of truth for the user’s name and employment details. Compare the first name, last name, preferred name, spelling, and work email in both systems. Correct the source record instead of repeatedly editing the name in Drata, then resync.

## Workday-Specific Name Duplication Issue

When integrating Drata with Workday, you may encounter an issue where surnames appear duplicated, such as "John Smith Smith." This occurs when the Workday connection is configured to use the "Preferred Name" field, which may contain the full name (e.g., "John Smith") instead of just the given name. Drata pulls this full string into the first name field while separately pulling the surname into the last name field, resulting in duplication.

If multiple HRIS connections are configured, review their priority. The connection order determines which HRIS supplies the user’s name, email, start date, and employment status.

## Resolving Workday Name Duplication

To fix this issue, adjust the Workday connection settings in Drata:

1. Navigate to **Connections** in Drata and open the Workday connection.
2. On the **Overview** tab, locate the **Connection Settings** card and click **Edit**.
3. Change the setting for "Choose which name to use for this HRIS" from **Preferred Name** to **Legal Name**.
4. Save the changes.
5. Perform a manual sync to update the corrected names in Drata:
   - Go to **Personnel** > **...** > **Resync Personnel**.

## Alternative Solution

If your organization prefers to display "Preferred Names" in Drata, ensure that the "Preferred Name" field in Workday contains only the given name (e.g., "John") rather than the full name. This adjustment will prevent duplication while maintaining the use of preferred names.

## The user appears as Unknown, Former, or Future Hire

- **Unknown:** Drata cannot confidently match the HRIS record to an IdP-created personnel record. Align the work email and remove duplicate or conflicting records.
- **Former:** Check the HRIS separation date and status, IdP group scope, manual updates in Drata, and whether the latest change has synced.
- **Future Hire:** Confirm the start date in the HRIS. If the person has started, update the HRIS first and resync.

The HRIS is the source of truth for employment status, start dates, and separation dates. If no HRIS is connected, Drata uses IdP activation and deactivation data to infer Current or Former status.

| ⓘ For detailed causes and step-by-step fixes for each status, see [Troubleshoot employment status issues in Drata](troubleshoot-employment-status-issues-in-drata.md). |
|---|

## Safe Offboarding Practices

1. Update the HRIS with the official separation date and employment status.
2. Disable the user in the IdP and remove them from in-scope groups. If immediate access removal is required, disable the IdP account first and update the HRIS immediately afterward.
3. Do not delete the personnel record in Drata. Keeping it preserves historical compliance and offboarding evidence.
4. Wait for the next sync or run an ad-hoc resync, then verify the user’s status, separation date, Sync status, and offboarding evidence.
5. Do not reuse the former employee’s work email until the records are separated. Use a unique placeholder address for the former employee before assigning the original address to a new hire.

Deleting version control or infrastructure accounts does not remove their historical record from Drata; Drata records an Access Revoked timestamp for auditability.

## Contact Drata Support

If the issue persists, contact Drata Support and provide the affected user’s work email, IdP and HRIS providers, status and email in each source, Drata employment status and Sync status, configured group and domain scope, the time of the source change, and the result of any resync attempts.

## Learn more

- [Identity sync updates in Drata](identity-sync-updates-in-drata.md)
- [Troubleshoot employment status issues in Drata](troubleshoot-employment-status-issues-in-drata.md)
- [Ad-hoc identity and account resync](ad-hoc-identity-and-account-resync.md)
- [Resume IdP and HRIS syncs for personnel](resume-idp-and-hris-syncs-for-personnel.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)

## Related articles

- [Connect your HRIS to Drata](connect-your-hris-to-drata.md)
- [Why active employees may appear as former employees in Drata? (Concept Guide)](why-active-employees-may-appear-as-former-employees-in-drata-concept-guide.md)
- [Integrate Multiple Identity and HRIS Connections](integrate-multiple-identity-and-hris-connections.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)
- [Troubleshoot employment status issues in Drata](troubleshoot-employment-status-issues-in-drata.md)
