# Using Vanta: Secure Implementation Guidelines

Source: https://help.vanta.com/en/articles/12069112-using-vanta-secure-implementation-guidelines
Collection: Getting Started Hub ; Getting Started Hub › Getting Started Guides
Fetched: 2026-11-17

## Article text

This article provides an overview of the security features and best practices to guide you when using app.vanta.com <http://app.vanta.com>. Utilizing security features and using Vanta as intended ensures your data is protected and secure, which is critical to your security program. 
 
Customers should assess their own organization and consider prioritizing the security measures that will most strengthen your program, assign clear accountability, and see actions through to completion. 
 
As part of those considerations, you can review and implement the following best practices from Vanta’s Security Team:
 | 

### Recommendation | 

### Why it Matters
 | 
User Access | 
 
 | 
Utilize Secure Sign-on (SSO) with MFA and disable Magic Links <https://help.vanta.com/en/articles/11345383-disabling-the-magic-link> for login, where possible. | 
SSO with MFA enhances security by reducing the risk of unauthorized access in the event of a compromised email account. SSO also ties logins to a centralized identity provider, which improves access control and auditability.
 | 
Include privileged access to the Vanta application as part of your regular access reviews <https://help.vanta.com/en/articles/11345416-access-reviews>. | 
Regular review of Vanta enforces the principle of least privilege, so that access is reasonable, limited, and appropriate. Especially as a trust management platform, this ensures only authorized personnel can make changes to your compliance framework and access information about your security.
 | 
Employ the principle of least-privilege when assigning roles and ownership <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>, especially when giving access to risks, vulnerabilities, and tests with sensitive or critical security information. | 
Ensuring users only have access to information they truly need helps reduce the risk of accidental exposure or misuse of sensitive or critical security data. Utilize granular permissions, including custom roles, where possible. 
 | 
General Compliance | 
 
 | 
Do not upload unneeded or excessive sensitive information. (Or where needed, redact extraneous information.)  | 
Uploading only the necessary sensitive information helps minimize data exposure risk and aligns with the principle of data minimization. Providing more than what’s needed can also complicate the audit process. You can also mark custom documents as sensitive <https://help.vanta.com/en/articles/11345473-marking-custom-documents-as-sensitive> to restrict access.
 | 
Assign and periodically review ownership <https://help.vanta.com/en/articles/11345482-assignment-and-ownership-for-tests-policies-and-documents> of items in Vanta, such as controls, tests, documents, risks, and more. | 
By assigning ownership, you can ensure accountability to track progress, follow-up, and appropriately prepare for audit. While ownership typically resides with these process owners, including groups <https://help.vanta.com/en/articles/11345484-assigning-group-ownership-to-inventory-items>, executive leadership can provide strategic oversight and help align these responsibilities with broader organizational objectives.
 | 
Configure automated notifications <https://help.vanta.com/en/articles/11345394-notifications-and-notification-settings> where possible to ensure completion of necessary security tasks and prevent overdue SLAs. | 
Prompt action and remediation of items (such as tests, onboarding and offboarding requirements, risks, etc.) are key to ensuring your security program is mature and meeting the audit requirements you set-out. Automatic notifications ensure that prompt remediation is at the forefront of your processes.
 | 
Integrations | 
 
 | 
When generating API keys in Vanta, perform the configuration from a company-managed device on a secure, trusted network and store all API keys securely. | 
Secure and industry-standard API management <https://help.vanta.com/en/articles/11346088-api-guide> includes testing, proper secrets management, preventing unauthorized access to integrated systems, monitoring, and protecting against potential data exfiltration. This ensures that you can surely use the Vanta API  <https://help.vanta.com/en/articles/11345411-vanta-api>to build private integrations.
 | 
Ensure integrations are appropriately configured <https://help.vanta.com/en/collections/12575285-integrations>, and if a connection error occurs, reconnect promptly. | 
Promptly addressing connection errors prevents data gaps that could impact compliance validation. Consistent monitoring data provides better visibility into your security posture and enables more accurate information.
 | 
Vanta Device Monitor | 
 
 | 
If you utilize Vanta Device Monitor, ensure it is on the latest version and in the event it does not update on its own, follow the appropriate steps to download manually. <https://help.vanta.com/hc/en-us/articles/17408855768596-Updating-the-Vanta-Agent> | 
Keeping Vanta Device Monitor updated ensures you receive the latest security features, vulnerability patches, and monitoring capabilities. Outdated software may miss critical security features, creating blind spots in your security posture and potentially impacting compliance validation.
The recommendations above will help you stay secure as you utilize Vanta, but keep in mind it’s important to continue to stay current and implement best practices. For any questions about using the Vanta product securely, check-out Vanta's Getting Started Guides <https://help.vanta.com/en/collections/12575233-getting-started-hub>, or contact [email protected].

## Images

- none
