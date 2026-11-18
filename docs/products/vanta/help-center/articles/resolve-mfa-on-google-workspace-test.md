# Resolve 'MFA on Google Workspace' Test

Source: https://help.vanta.com/en/articles/11345534-resolve-mfa-on-google-workspace-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

## How to Fix
- 
Enforce multifactor authentication on all your organization's Google accounts.
- 
Log in to the Google admin console <https://admin.google.com/>.
- 
Click Security | Authentication | 2-step-verification to enforce 2-step verification.
- 
Select Turn on enforcement from date.
- 
Enter a date by which all of your users are required to use multifactor authentication to access their Google accounts. We recommend selecting a date two to four weeks in the future, as employees without multi-factor authentication will be unable to sign in to their accounts once enforcement is in effect. (More information from Google Workspace <https://support.google.com/a/answer/184711?hl=en>)
​
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769672/183fb99caee62371edc372c0ca48/17318376377108?expires=1794967200&signature=8adc2b419a3a11ddd3d8ab00649760efbfc1c5b40fe58753a3e09e427c399690&req=dSUmEM54lIdYW%2FMW1HO4zXWnS0y4jWKTFgiaGl8wFnK1NyvqU5PxiD4GQqDB%0AN30S%0A>
This setting enforces 2-step verification across your organization. However, individual users must log in and complete setup before MFA is active for their account.
 

## Confirm that 2-Step verification is enabled for the user
Even if 2-step verification is enforced at the organizational level, it is not considered active for a specific user until they log in and complete setup.
 
To confirm whether MFA is enabled for a user:
- 
Go to the Users page in the Google Admin console.
- 
Locate the user.
- 
Check the 2-step verification column.
If 2-step verification is enabled for the user, it will show as On (or similar status).
Global enforcement alone does not mean the user has completed setup.
 
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2128203465/fdb4d8f490a992839779d8ee4f09/image.png?expires=1794967200&signature=02bc60f35c778ccdebfee8f0e9cff3680d5d13c73fb02c13ffe1e7e6f360c68c&req=diElHst%2BnoVZXPMW1HO4zYhCUIhp3MrX3r4FuJSx143eA%2B8ipFo%2BoInF%2Bql2%0A3OgwKFNxMZeaLJ6I7xM%3D%0A>
 
 

## Common reasons for failure
- 
Enforcing MFA works by requiring individual users to complete the setup the next time they log in. If a user has not logged out or their SSO Session has remained active, the setup may not have been completed.
- 
If a user is failing this test, it is recommend they try logging out of their current Google instance. They should be prompted to use MFA when logging back in.
Further information on managing Google Workspace security settings can be found on the Google Workspace Admin Help page <https://support.google.com/a/answer/2537800?hl=en&ref_topic=7556597>
- 
Vanta is only able to identify MFA settings enforced directly in Google Workspace, and is unable to recognize if accounts are accessing Google through a different SAML provider (AKA Okta).

## Images

- [image 01] ../../images/integrations/google-workspace/resolve-mfa-on-google-workspace-test--01.png
- [image 02] ../../images/integrations/google-workspace/resolve-mfa-on-google-workspace-test--02.png
