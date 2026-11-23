# Test 88: MFA on Infrastructure Console

Source: https://help.drata.com/en/articles/4777035-test-88-mfa-on-infrastructure-console
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata connects to the company's infrastructure and pulls a list of IAM accounts' auth configurations to determine if MFA is required.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **MFA on Accounts **control that ensures Multi-Factor Authentication (MFA) is being required for access to any sensitive systems or applications. Drata will verify that a user must provide their ID, a password, and then either a One-Time Password (OTP) or certificate to log in to your company Infrastructure Management Console.

## WHAT TO DO IF A TEST FAILS

If Drata finds that there are infrastructure accounts that do not have MFA enabled the test will fail. With a failed test you will receive a list of users that do not have MFA enabled on their account.

### STEPS FOR PASSING

To ensure a validated state when testing for MFA on the Infrastructure Console, please follow the steps listed in the table below. In certain cases, the individual failing users will need to modify their account MFA implementation. Once the provider steps have been completed, the [next nightly user sync](identity-sync-updates-in-drata.md) will pick up the changes and rerun the test to show the latest results.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **Atlas MongoDB** | 1. Atlas' API does not expose user MFA details. As a result, all records on the Managed Accounts page will show as failing MFA. In addition, monitoring test 88 - MFA on Infrastructure Console will show these users as failing. They will need to be excluded. If Atlas is the only connected infrastructure connection, this test can be disabled. |
| **AWS - IAM** | 1. Within AWS, go to the IAM service<br>2. Go to Users<br>3. Add user, add to any user group<br>4. Save user<br>Then, as the new IAM user:<br>1. Login<br>2. Turn on MFA |
| **Azure - Users** | 1. Login to `portal.azure.com` with Office 365 credentials<br>2. Create user with Office 365 email<br>   1. Users created in this way are associated with Office 365 AND Azure<br>3. Click "Authentication Methods", then require re-register MFA in top panel<br>Then, as the new user:<br>1. Login<br>2. Turn on MFA<br>This may take a few hours to propagate within Azure.<br>**Note: **Drata also supports pulling MFA when Conditional Access Policies or Security Defaults are in place. This does require that Microsoft 365 be used as your IdP connection. Please reach out to our Technical Support team if you need more guidance. |
| **Cloudflare - Users** | 1. Within Cloudflare, select an account<br>2. Navigate to the members page<br>3. Turn ON the “Member 2FA enforcement” (This will require invited members to enable their MFA when they accepted the invitation)<br>4. Invite members. (Enter email address)<br>5. Click the invite button<br>**Note:** You will need to make sure that an Admin has connected both the IDP and Cloudflare to Drata. |
| **GCP - IAM** | Accounts within GCP must also be added to Google Workspace (GW, fka GSuite).<br>**To Add a User to GW and GCP**<br>1. Log in to GW and add the account<br>2. Log in to GCP IAM and add the member that was created in GW<br>3. Make sure this user has MFA enabled in GW<br>4. Navigate to the Connections screen in Drata and connect to [GW](google-workspace-integration-guide.md) and [GCP](gcp-integration-guide-manual.md)<br>   1. ***NOTE: please follow the "Permissions Required to Sync GCP Users & MFA" section of the [GCP Connection Details article](gcp-integration-guide-manual.md#h_f4d7868cc6) to ensure Drata can automatically pull MFA for GCP users***<br>5. Navigate to the Manage Infrastructure Accounts page (filtered to clientType=GCP)<br>6. Verify the account has been added<br>7. Verify the user shows as having MFA enabled |
| **Heroku** | 1. Log into Heroku<br>2. Go to [Account Settings](https://dashboard.heroku.com/account)<br>3. Click 'Setup Multi-Factor Authentication'<br>4. Click 'Add' to choose the desired MFA authentication method and follow the on-screen instructions.<br>5. Click 'Done' to finish the setup<br>6. Ensure you receive the confirmation email<br>***NOTE: ensure the user making the [Heroku connection](heroku-integration-guide.md) is part of an Enterprise Team, and that global permissions have been granted to the Drata OAuth application. This will allow Drata to pull MFA for both enterprise and standard team members.*** |

## HELPFUL RESOURCES

- [What is Multi-Factor Authentication (MFA)?](https://www.onelogin.com/learn/what-is-mfa)
- [How to enable MFA for users in AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable.html)
- [How to enable MFA for users in Azure](https://docs.microsoft.com/en-us/azure/active-directory/authentication/howto-mfa-userstates)
- [How to enable MFA on your Cloudflare account](https://support.cloudflare.com/hc/en-us/articles/200167906-Securing-user-access-with-two-factor-authentication-2FA-)
- [How to enable MFA on your Google account](https://www.google.com/landing/2step/)
- [How to enable MFA for your Heroku account](https://devcenter.heroku.com/articles/multi-factor-authentication)

## Related articles

- [GCP Integration Guide (Script Setup)](gcp-integration-guide-script-setup.md)
- [Test 87: MFA on Version Control System](test-87-mfa-on-version-control-system.md)
- [Test 4: SSL/TLS on Admin Page of Infrastructure Console](test-4-ssl-tls-on-admin-page-of-infrastructure-console.md)
- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [Test 225: Hardware MFA for AWS Root Account](test-225-hardware-mfa-for-aws-root-account.md)
