# Resolve Authorization Errors in Drata

Source: https://help.drata.com/en/articles/12418856-resolve-authorization-errors-in-drata
Collection: Settings › Role Administration
Updated: 2026-11-03
Fetched: 2026-11-22

## Article text

This article outlines common causes of login and authorization errors in Drata and provides steps to resolve them. Following this guide helps restore access to required features efficiently.

## Troubleshoot Browser Issues

If you see a "You are not authorized" message:

1. Open Drata in an incognito or private browsing window.
2. If the issue resolves, clear your browser cache and cookies.
3. Ensure your browser settings do not block required cookies or scripts.
4. Verify that your email address has no leading or trailing spaces and matches the one associated with your Identity Provider (IdP).
5. Ensure you are signing in at `[app.drata.com](https://app.drata.com)` without any trailing periods (e.g., `[app.drata.com](https://app.drata.com).` will not work).6. If the issue persists, try using a different browser to log in.

## Verify Assigned Roles

Authorization errors may be caused by incorrect role assignments:

1. Review your assigned RBAC role in Drata.
2. Compare it against the required permissions for the feature you’re trying to access.
3. If changes are needed, contact a team member with the **Admin (Write)** role to update your role.
4. 4. If you encounter a 'Not Authorized' screen, it may be tied to your assigned role. Have an admin remove the conflicting role and assign a suitable one, such as 'Information Security Leader,' via the Role Administration page: [https://app.drata.com/account-settings/role-administration](https://app.drata.com/account-settings/role-administration).

## Magic Link Email Issues

- Check your Inbox and Junk Email folders for the magic link email.
- Confirm whether you are logging in as a user or an auditor.
- If logging in as an auditor, ensure your client has added you to the specific audit in Drata.

## Advanced Troubleshooting Steps

### Persistent Login Issues

If login issues persist after trying the above steps, follow these additional troubleshooting measures:

1. **Developer Console Logs**:

- Open the developer console:
- Right-click (Windows) or Control + Click (Mac).
- Click 'Inspect' and navigate to the 'Console' tab.
- Reproduce the error and take a screenshot of the log.

1. **Screen Recording**:

- Provide a screen recording of your login attempt to help identify the issue.

1. **Identity Provider (IdP) Connection**:

- Reconnect your IdP if it is disconnected or experiencing issues. Only administrators can log in using a magic link during such times.4. **Inactive Accounts**: Accounts marked as inactive (e.g., due to integration issues like Gusto marking a user as a former employee) need to be reactivated by an admin.

**After completing these steps:**

- Refresh the page or log in again.
- Confirm access to the feature or page previously restricted.- If problems persist, contact your administrator or Drata support for further assistance.

## Related articles

- [Your Drata Domain](your-drata-domain.md)
- [Common Policy Management Issues in Drata (and How to Resolve Them)](common-policy-management-issues-in-drata-and-how-to-resolve-them.md)
- [Signing In to Drata (New Experience)](signing-in-to-drata-new-experience.md)
- [Internal audits in Drata (New Experience)](internal-audits-in-drata-new-experience.md)
- [Map IdP Groups to Drata Roles](map-idp-groups-to-drata-roles.md)
