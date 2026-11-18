# Troubleshooting Office365 MFA Issues

Source: https://help.vanta.com/en/articles/11346059-troubleshooting-office365-mfa-issues
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

If you're encountering issues with your Microsoft Office account MFA Status syncing to Vanta. First, try the following steps below to determine if MFA has been correctly configured via Azure AD:
- 
View your User Registration details via the Authentication Methods Activity Dashboard <https://portal.azure.com/#view/Microsoft_AAD_IAM/AuthenticationMethodsActivity.ReactView>

​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768907/c646836fbee2015809523c1d4e6b/16870694614804?expires=1794967200&signature=e96842f26f2779302e6034405716a9445d7f69b6a74185b9064f072dec6463ae&req=dSUmEM54lYhfXvMW1HO4zVoSx7q0Tb45QZB6%2BwiK%2FrIT%2BqTB%2BadgK2Y1e7dH%0A0V9P%0A>
 
- 
Confirm that your User account is first Capable of Multifactor Authentication registration, then has an authentication method registered and set as a default.
- 
Read more on Microsoft's new authentication methods activity dashboard <https://portal.azure.com/#view/Microsoft_AAD_IAM/AuthenticationMethodsActivity.ReactView>
- 
Read more on Microsoft's Supported authentication methods  <https://learn.microsoft.com/en-us/azure/active-directory/authentication/concept-authentication-methods>
 
Azure Premium License required for Office365 MFA Test
Currently, We can only support the detection of MFA on Azure AD Premium P1 or Azure AD Premium P2 plans. These plans expose the 'IsMfaRegistered' field on users through the MSGraph API. If your users aren't showing as passing the test, Confirm that you have a compatible Azure AD Plan via the information below:
- 
If your Azure AD License is the Free version, our MFA Tests will not be able to retrieve MFA User information from MSGraphAPI:
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768909/ecc5d89b5b07c5ee39d254636545/16896248015508?expires=1794967200&signature=e76a92891dee44120249e8592c37da9713c5a4217056ea2cca829937ab750ad7&req=dSUmEM54lYhfUPMW1HO4zR2V3h6wkyQ9sYP%2F%2BKVjTO1DeFhF%2FGelmTJkzwDg%0AezJf%0A>
 
- 
If you're a user of Microsoft 365 Business Premium <https://www.microsoft.com/microsoft-365/business> and EMS <https://www.microsoft.com/security/business/enterprise-mobility-security> or Microsoft 365 E3 and E5 <https://www.microsoft.com/microsoft-365/enterprise/compare-office-365-plans> then your Azure Plan includes Azure AD Premium P2 or Azure AD Premium P1 and is compatible!
- 
Read more about Azure Active Directory pricing plans <https://azure.microsoft.com/en-us/pricing/details/active-directory/>
- 
Read more on Available versions of Azure AD Multi-Factor Authentication <https://learn.microsoft.com/en-us/azure/active-directory/authentication/concept-mfa-licensing#available-versions-of-azure-ad-multi-factor-authentication>
 
Troubleshooting MFS via MSGraph Explorer
- 
If you would like to see info directly from the API, you can use the following steps:
- 
Log in to the graph explorer here <https://developer.microsoft.com/en-us/graph/graph-explorer> and hit the following endpoint
- 
https://graph.microsoft.com/beta/reports/credentialUserRegistrationDetails <https://graph.microsoft.com/beta/reports/credentialUserRegistrationDetails>
- 
Find the user's details in the returned list:
​ 
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768908/b77f76b41e0b9e1f44645429c4f6/6561432478996?expires=1794967200&signature=f33c3eb61c3cf7b5d2c601b073eaab0c7a479debd3d0840853264d9215e61827&req=dSUmEM54lYhfUfMW1HO4zcF63ZiyF0U4CrJDL3itojk9Z35ZMxDmQm0XWFWJ%0AdS8n%0A>
 
- 
The "IsMfaRegistered" field must be set to true

## Images

- [image 01] ../../images/integrations/azure/troubleshooting-office365-mfa-issues--01.png
- [image 02] ../../images/integrations/azure/troubleshooting-office365-mfa-issues--02.png
- [image 03] ../../images/integrations/microsoft/troubleshooting-office365-mfa-issues--03.png
