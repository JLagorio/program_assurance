# Your Drata Domain

Source: https://help.drata.com/en/articles/10197849-your-drata-domain
Collection: Settings
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

It determines:

- Who can log in to Drata
- How your Identity Provider (IdP) connects
- Which email addresses sync to the Personnel page
- How ownership and access are preserved during audits

⚠️ **Important: **Changing your domain incorrectly can break logins, disconnect integrations, and invalidate ownership data across your account. Always plan domain changes in advance.

## How Domain Setup Works

1. **Notify Drata early** if you are creating a new domain or planning a domain change.
2. **Provide the required information** (refer to the checklist below).
3. **Drata configures your tenant domain** and updates connections to your IdP and HRIS.
4. **You confirm** that admins can log in and personnel are syncing correctly.
5. **Support finalizes the update and confirms continuity of compliance data. 6. Verify that all processes related to the domain change have been completed successfully, including ensuring there are no unresolved issues with access or administrative roles.**

**⏱️ Typical turnaround**: Domain updates are generally processed within a few business days, but timing may vary depending on complexity. Contact Support in advance to avoid downtime or login issues.

## Information Drata Needs

Whether you need to set up or update your domain, you need to provide the following information.

1. What is the domain where your in-scope personnel emails live?
2. What is the primary domain in this IdP? Is it the same as what you provided in question # 1?
   - If it is not the same, is the email domain from #1 a secondary or verified domain in this same IdP?
3. Do you have in-scope emails on domains in addition to the domain you specified in #1?
   - If so, what are they?
   - **Note**: This information is essential for our teams to determine if multi-domain support must be enabled.
4. In what IdP platform do these in-scope emails live (e.g. Google Workspace, Microsoft 365 (Azure/Entra), Okta)?
   - If you said yes to question 3, do those additional domains also live in this same IdP?
   - If not, please list out which domains live in which IdP.
5. What is the global or super admin email address used to log into this IdP and conduct administrative activities? While this may or may not be the same email address you use for daily correspondence or other day-to-day activities, it MUST be able to receive email.
   - Does the domain of this admin email match what you provided in #1 and #2?
   - If it does not:
      - Do you have access to an admin email with a domain that matches to what you provided in #1 and #2?
      - Does your email have admin visibility and control over the emails and domain you provided in #1 and #2?
   - **Note**:
      - This information is essential for IdP connections. The domain used to create your Drata account must match the email domain of your global or super admin who is configuring that IdP connection.
      - This is a requirement for Google Workspace and Microsoft 365 (Azure/Entra). Service accounts can also be used but further customization may be required.
      - You can reach out to our technical support team if you prefer to utilize a service account.

## What Happens if You Don’t Update Your Domain

Failing to configure an updated domain within Drata can result in:

- Admins (including primary admin) unable to log in
- IdP or HRIS connections stopping or syncing 0 emails
- Large chunks of personnel move to an employment status of “Former Employee” or “Former Contractor,” potentially on the same day. This would block login.
- This change of employment status would also cause a loss of ownership data for items like controls, evidence, policies, risks, tasks, vendors, etc.
- Duplicate users (old and new emails both appear)
- Users may also be automatically removed during a domain change if transition processes fail. It is essential to verify that the domain change process is complete to ensure users regain access.

**Example:**

- Before the change: `name@testai.com` exists
- After the change: both `name@testai.com` and `name@newai.com` appear

## Email Syntax Changes

If your organization is **only changing the domain** (e.g., `name@testai.com → name@newai.com`):

- Drata updates your account domain and personnel emails.

If the **email syntax is changing** (e.g., `name@testai.com → firstname.lastname@newai.com`):

- Drata’s personnel model enforces uniqueness on email addresses. This kind of syntax change will introduce new emails into Drata.
   - Drata does not currently offer a way to automatically map existing compliance data, device/asset ownership, role permissions, or policy/vendor/etc. ownership between emails.
- New personnel emails will be responsible for completing all compliance checks.
- If you want the same person to continue to get credit for past compliance checks, and for all existing role and owner relationships to be preserved, do the following:
   1. Create a **CSV mapping** of old → new emails
   2. Send it to Drata Support
   3. We’ll guide you through the required sequence of steps

## Related articles

- [Populating and Managing Personnel Data in Drata (Concept Guide)](populating-and-managing-personnel-data-in-drata-concept-guide.md)
- [Connect your HRIS to Drata](connect-your-hris-to-drata.md)
- [Integrate Multiple Identity and HRIS Connections](integrate-multiple-identity-and-hris-connections.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)
- [Troubleshooting Identity Sync Issues in Drata](troubleshooting-identity-sync-issues-in-drata.md)
