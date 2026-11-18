# Resolve 'MFA on Office 365' test

Source: https://help.vanta.com/en/articles/11345773-resolve-mfa-on-office-365-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This article provides more information on how to resolve the MFA on Office 365 test <https://app.vanta.com/tests?taskType=TEST#office-user-mfa-enabled>. 
​​

## What is Vanta looking for?
- 
Vanta checks that MFA is enabled for Office 365 (Entra) users via the "isMfaRegistered" field from the following credentialUserRegistrationDetails endpoint from the Microsoft Graph API: https://docs.microsoft.com/en-us/graph/api/reportroot-list-credentialuserregistrationdetails?view=graph-rest-beta&tabs=http <https://docs.microsoft.com/en-us/graph/api/reportroot-list-credentialuserregistrationdetails?view=graph-rest-beta&tabs=http>
- 
If that field returns false, Vanta checks if legacy MFA is being used by checking the "isMfaRegistered" field from the reports/authenticationMethods/userRegistrationDetails endpoint.
*Note - A user will only fail this test if they have logged in previously (signInActivity isn't null from the Graph API) in addition to not having the MFA method registered. This assists in not flagging users who were created but haven't had the chance to sign in and setup MFA (new employees).
 

## How can I test this?
- 
You can see information from the credentialUserRegistrationDetails endpoint in the Entra UI here. <https://entra.microsoft.com/#view/Microsoft_AAD_IAM/AuthenticationMethodsMenuBlade/~/UserRegistrationDetails/fromNav/> Vanta will require that the users have a registered method listed:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765890/5efbcb8de6a9070bbef2714efe81/16265176388372?expires=1794967200&signature=3965efa4dc062342d7f61fafdf283f4fe23cb1909c2f92c12bbc57e5330253d1&req=dSUmEM54mIlWWfMW1HO4zXJV3HkdwlxY%2FEllnlw73IhFgTVi3gMpMMjKwlrg%0A5V6QLWJmyrMOlvmoc1I%3D%0A>
- 
You can also use Microsoft Graph Explorer to check what this endpoint is returning for users. To test this, log in to the graph explorer here <https://developer.microsoft.com/en-us/graph/graph-explorer> and query the following endpoint: https://graph.microsoft.com/beta/reports/credentialUserRegistrationDetails <https://graph.microsoft.com/beta/reports/credentialUserRegistrationDetails>
​ 
You will find the user details in the response data preview:
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765891/b854b6dcc89e5b75f3bd21f33e4c/8413528353812?expires=1794967200&signature=19c6b8c88c4caf4c579fd68742708edc011363bbdad0e9b7433c4b114d75dedf&req=dSUmEM54mIlWWPMW1HO4zbH4L5lo0K1Z1UADlXCvJ7G1vH%2BT3JXHEUpRV7i6%0AtaJb%0A>
- 
If the "IsMfaRegistered" field returns false, Vanta will show that the user does not have MFA enabled for their account. Ensure that the user has MFA turned on and that it is registered for their account.
- 
The same can be done for the reports/authenticationMethods/userRegistrationDetails endpoint if legacy MFA is being used. You'll choose "beta" and enter the following - https://graph.microsoft.com/beta/reports/authenticationMethods/userRegistrationDetails <https://graph.microsoft.com/beta/reports/authenticationMethods/userRegistrationDetails>
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765897/4b738adf32f4bbb47885694db980/16381716042132?expires=1794967200&signature=79eabf98d62cdfe76d38630442b7dfa8b7bc8daa1b0b705b2892e722c15cad58&req=dSUmEM54mIlWXvMW1HO4zaRMG7v7d3o6%2Bpd39WQl12kGoFMRSkHojZrcUP3c%0AKFps1cC%2BxvFj%2Bm0uDcU%3D%0A>
 

## Service accounts
Personnel marked as Service Accounts <https://help.vanta.com/en/articles/11345579> in Vanta may be flagged on the MFA on Office 365 <https://app.vanta.com/tests?taskType=TEST#office-user-mfa-enabled> test if Vanta detects past logins to Office 365 (Entra) on the account.
 
To see if this is the case, export the test results <https://help.vanta.com/en/articles/11345971> spreadsheet. If the service account in question has a time populated in the 'lastLoginTime' column, the account is expected to appear on the test and will need to be remediated or deactivated <https://help.vanta.com/en/articles/11346051-deactivate-monitoring-for-a-resource-on-a-test>.
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765896/5c3e6adda5cc9b171d0127e319f6/36932146701588?expires=1794967200&signature=cb1d825903e2e0fa732fbfa2d2329f334f1d82a202ae5562b93f58d75ae78bce&req=dSUmEM54mIlWX%2FMW1HO4zWK%2BDEdklVb9LDbjgrwmHCO76Pdldp4lk0DQpIn%2F%0AGRrkQODSZNtAYDpvlv4%3D%0A>

## Images

- [image 01] ../../images/integrations/microsoft/resolve-mfa-on-office-365-test--01.png
- [image 02] ../../images/integrations/microsoft/resolve-mfa-on-office-365-test--02.png
- [image 03] ../../images/integrations/microsoft/resolve-mfa-on-office-365-test--03.png
- [image 04] ../../images/documentation/resolve-mfa-on-office-365-test--04.png
