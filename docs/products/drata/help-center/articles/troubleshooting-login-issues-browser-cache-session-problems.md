# Troubleshooting Login Issues: Browser, Cache & Session Problems

Source: https://help.drata.com/en/articles/16988712-troubleshooting-login-issues-browser-cache-session-problems
Collection: Framework Information › General
Updated: 2026-11-03
Fetched: 2026-11-22
Description: Step-by-step fixes for login failures caused by browser cache, cookies, sessions, or extensions. Try these before contacting support.

## Article text

If you're unable to log in to Drata and are not seeing an error related to your SSO provider or account status, the issue may be caused by your browser's cached data, an active session conflict, or a browser extension. Work through the steps below in order.

This guide focuses on browser-related troubleshooting steps. If your issue is related to SSO, account status, or other non-browser issues, you may need to contact your administrator or Drata Support for further assistance.

### Step 1: Try an incognito or private browsing window

Open a new incognito or private window and go to auth.drata.com. This bypasses cached credentials and active sessions without deleting your browser data.

- Chrome / Edge: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
- Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
- Safari: File → New Private Window

If this works, the issue is likely due to an issue with your regular browser session. Continue to Step 2.

### Step 2: Clear your browser cache and cookies

Stale cached data or cookies can cause login loops and authentication failures. Clear your cache and cookies for auth.drata.com, then try logging in again.

1. Open your browser settings
2. Navigate to Privacy & Security → Clear browsing data
3. Select Cookies and other site data and Cached images and files
4. Set the time range to All time
5. Click Clear data
6. Close and reopen your browser, then go to [auth.drata.com](https://auth.drata.com)

### Step 3: Disable browser extensions

Ad blockers, password managers, and security extensions can interfere with the authentication flow. Temporarily disable all extensions and try logging in again.

1. Open your browser's extensions or add-ons menu
2. Disable all active extensions
3. Go to auth.drata.com and attempt to log in
4. If login succeeds, re-enable extensions one at a time to identify the conflicting one

### Step 4: Try a different browser

If the steps above don't resolve the issue, try logging in using a different browser (for example, if you normally use Chrome, try Firefox or Edge). This helps confirm whether the issue is browser-specific.

### Step 5: Use the direct login URL

Go directly to auth.drata.com rather than using a bookmark or a link from an email. Bookmarks can sometimes point to outdated URLs that redirect incorrectly.

Ensure that there are no typos, leading spaces, or trailing spaces in your email address when entering it. For example:

- Leading space: `' sarah@drata.com'`
- Trailing space: `'sarah@drata.com '`. Additionally, avoid adding a period at the end of the URL (e.g., `auth.drata.com.`).

### Still unable to log in?

If you've completed all steps above and still cannot access your account, contact Drata Support. Please include the following to help us investigate:

Additionally, if your account is inactive or marked as "out of scope," you may need to contact your Drata administrator or IT team to verify your account status and ensure it is active and properly configured.

- The browser and version you are using
- The exact error message or behavior you see
- Whether the issue occurs in incognito mode
- Whether you are using SSO to log in

- If the above steps do not resolve your issue, capture a HAR file to help diagnose the problem:
   1. Open your browser’s Developer Tools and go to the "Network" tab.
   2. Enable the "Preserve log" option.
   3. Reproduce the login issue by attempting to sign in from the Drata login page.
   4. Export and save the network activity as a HAR file (ensure you include content).
   5. Note the browser you used and share the HAR file with Drata support for further analysis.

## Related articles

- [Signing In to Drata (New Experience)](signing-in-to-drata-new-experience.md)
