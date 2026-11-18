# Frequently Asked Questions: HR Integration Needs to be Reconnected

Source: https://help.vanta.com/en/articles/11346107-frequently-asked-questions-hr-integration-needs-to-be-reconnected
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

## Why did my HR integration unlink?
The most common reasons an HR integration disconnects from Vanta include:
- 
The person who originally connected the integration left the organization
- 
When that user's account is deactivated or their credentials change, the integration loses its authentication and stops working.
- 
API token expiration
- 
Tokens used during the initial connection have a natural lifecycle and can expire over time.
- 
Permission changes
- 
If the permissions of the connected account were modified in the third-party system, the integration may lose access.
- 
Third-party connection failures
- 
Occasional outages or changes on the integration provider's side can also cause disconnections.
​
Seeing a "not authorized" error or missing employees after reconnecting? This is a common symptom of the departing-employee scenario. Follow the steps below to resolve it. 
 

## How do I fix it?
There is no single fix that works for every integration, but these steps resolve most reconnection issues:
 

## Step 1: Choose the right user account 
- 
If the person who originally connected the integration has left, you will need to reconnect using a current employee's account that has the required permissions in the third-party system.
- 
As a best practice, consider using a non-employee or service account (if supported by the integration) so future employee departures do not disrupt the connection.

## Step 2: Verify permissions
Before reconnecting, confirm that the account you are using has all the necessary permissions in the third-party system: 
- 
Check that no permission changes have occurred.
- 
Some integrations require specific roles, policies, or access levels. Verify all required permissions are present for the account you plan to use.

## Step 3: Reconnect in Vanta
IMPORTANT: Do not delete the integration. Use the Reconnect option to avoid losing your configuration and sync history. 
- 
Clear your browser cookies and cache.
- 
Sign in to your third-party system with the account you want to use for the reconnection.
- 
In Vanta, go to the Integrations page.
- 
Find your HR integration under Human Resources/Payroll.
- 
Click the (...) menu and select Reconnect.
- 
Follow the on-screen prompts to complete the connection. If prompted to select an import date, use the same date as your original setup to keep the same users in your account.
- 
Wait a few hours for the sync to complete.
Tip: If the reconnection appears to succeed but the integration still shows an error, wait 5-15 minutes and check the integration page again before retrying. 

## Step 4: If your integration uses an API key 
- 
Regenerate a new API key in the third-party system.
- 
Re-link the integration in Vanta using the new key.
 

## Still not working? 
If you have followed the steps above and the integration is still failing, contact Vanta Support. Be ready to share:
- 
The name of the integration
- 
The error message you are seeing (a screenshot is helpful)
- 
What steps you have already tried

## Images

- none
