# Test 87: MFA on Version Control System

Source: https://help.drata.com/en/articles/4776860-test-87-mfa-on-version-control-system
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata connects to your companies' Version Control System and pulls all user accounts to determine if each has MFA enabled.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **MFA on Accounts **control that ensures Multi-Factor Authentication (MFA) is being required for access to any sensitive systems or applications. Drata will verify that in order to log in to your version control tool a user needs to provide their ID, a password, and then either a One-Time Password (OTP) or certificate.

**WHAT TO DO IF A TEST FAILS**

If Drata finds that there are users in your version control tool that do not have MFA enabled the test will fail. With a failed test you will receive a list of users that do not have MFA enabled on their account.

**STEPS FOR PASSING**

To ensure a validated state when testing for MFA on the Version Control System, please follow the links below. In certain cases, the individual failing users will need to modify their account MFA implementation. Once each user has taken steps to modify their MFA settings, the [next nightly user sync](identity-sync-updates-in-drata.md) will pick up the changes and rerun the test to show the latest results.

**AZURE DEVOPS REPOS**

- In order for Test 87 - MFA on Version Control System to pass for the Azure DevOps Repos connection, both of the following must be true:
   1. Microsoft 365 must be your connected IdP
   2. You must be enforcing MFA on Microsoft 365 via Conditional Access Policies or Security Defaults

**HELPFUL RESOURCES**

- [What is Multi-Factor Authentication (MFA)?](https://www.onelogin.com/learn/what-is-mfa)
- [How to enable MFA for users in AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable.html)
- [How to enable MFA on your Azure/MSFT account](https://docs.microsoft.com/en-us/azure/active-directory/authentication/howto-mfa-userstates)
- [How to enable MFA on your Bitbucket account](https://support.atlassian.com/bitbucket-cloud/docs/enable-two-step-verification/)
- [How to enable MFA on your GitHub account](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication)
- [How to enforce MFA for all GitLab group members](https://docs.gitlab.com/ee/security/two_factor_authentication.html#enforce-2fa-for-all-users-in-a-group)
   - [See this Drata help article for GitLab group setting screenshots](gitlab-mfa-configurations.md)

## Related articles

- [Test 5: A Version Control System is being Used](test-5-a-version-control-system-is-being-used.md)
- [Test 88: MFA on Infrastructure Console](test-88-mfa-on-infrastructure-console.md)
- [Test 97: Employees have Unique Version Control Accounts](test-97-employees-have-unique-version-control-accounts.md)
- [GitLab Integration Guide](gitlab-integration-guide.md)
- [Manage connected version control](manage-connected-version-control.md)
