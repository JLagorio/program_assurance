# Alternative Compliance Paths

Source: https://help.vanta.com/en/articles/11345426-alternative-compliance-paths
Collection: Audit Readiness ; Audit Readiness › Audits
Fetched: 2026-11-17

## Article text

For organizations that cannot or choose not to integrate common systems such as Cloud Service Providers (CSPs), Version Control Systems (VCS), Identity Providers (IdPs), or Human Resource Information Systems (HRIS), there are alternative paths to achieving compliance. This section outlines the manual evidence required to meet SOC 2 and ISO 27001 standards without these integrations.
 
By understanding the manual compliance process, organizations can ensure they meet auditor requirements while making informed decisions about their security and operational strategies.
 
For more information on this process, please refer to Managing Documents <https://help.vanta.com/en/articles/11345479-managing-documents>.
 

## No Cloud Integration
Cloud integration plays a crucial role in maintaining security and compliance by automating evidence collection and reducing the risk of human error. It enables continuous monitoring of security configurations, access controls, and encryption settings, streamlining the audit process. Without this integration, organizations must manually compile and present evidence to meet compliance requirements, significantly increasing effort and potential for inconsistencies.
 
Organizations that choose not to integrate their Cloud Service Provider (CSP) with Vanta, such as AWS, GCP, Azure, DigitalOcean, or Heroku, must manually collect and provide substantial evidence during compliance audits. Over 100 automated tests cannot be performed without cloud integration. As a result, organizations will face significantly increased effort to meet SOC 2 and ISO 27001 requirements.
 
Required Manual Evidence for No Cloud Integration
 
Organizations must manually provide:
- 
Access Listings: Exports and screenshots showing user access and permissions.
- 
Encryption Configurations: Screenshots of encryption settings on data stores.
- 
Cloud Configuration Details: Reports on general cloud settings.
- 
Network Access Control Lists: Evidence of access restrictions and firewall rules.
- 
Audit Logging Configurations: Screenshots of logging and monitoring settings.
- 
Key Rotation Configurations: Reports on encryption key management.
- 
Backup Configurations: Document backup strategies for data recovery.
- 
Password Policies & Authentication Settings: Evidence of enforced security policies.
- 
Traffic & Intrusion Detection Logs: Network traffic monitoring and alert configurations.
- 
Asset Inventory Listings: A detailed list of assets, including ownership and user data.
This manual evidence aligns with 31 ISO 27002 (Annex A) controls and Availability, CC2.0, CC6.0, CC7.0, and CC8.0 SOC 2 criteria.
 

## No VCS Integration
Version control system (VCS) integration enhances security and compliance by enforcing peer reviews, tracking changes, and maintaining an audit trail of code modifications. This reduces the risk of unauthorized changes and improves accountability in software development processes. If an organization opts not to connect its version control system (VCS), such as GitLab, GitHub, or Bitbucket, it will miss out on more than 15 automated tests. This requires extensive manual documentation for compliance efforts.
 
Required Manual Evidence for No VCS Integration
 
Organizations must manually provide:
- 
Access Listings: Exported user access reports.
- 
Version Control Configurations: Screenshots of peer review and approval settings.
- 
Issue Tracking Reports: Listings including priority, owner, status, and description.
- 
Asset Inventory Documentation: A detailed list of systems and ownership.
This manual evidence is necessary for 15 ISO 27002 (Annex A) controls and CC6.0, CC7.0, and CC8.0 SOC 2 criteria.
 

## No IdP Integration
Organizations that do not integrate their identity provider (IdP), such as JumpCloud, Google Workspace, or Okta, will miss out on at least eight automated tests and must provide manual reports on identity management and access control.
 
Required Manual Evidence for No IdP Integration
 
Organizations must manually provide:
- 
User Access Listings: Reports showing all users and their assigned roles.
- 
Authentication & MFA Configurations: Screenshots demonstrating authentication settings.
- 
Deprovisioning Reports: Documentation of user offboarding processes.
- 
Asset Inventory Listings: A compiled list of assets linked to specific users.
This manual evidence applies to eight ISO 27002 (Annex A) controls and CC6.0 SOC 2 criteria.
 

## No HRIS Integration
If an organization does not integrate its human resource information system (HRIS), such as Bob, BambooHR, or Gusto, it will lose access to one automated test linking HR accounts to users. While this is less effort than other integrations, manual tracking is still necessary.
 
Required Manual Evidence for No HRIS Integration
 
Organizations must manually provide:
- 
Employee Status Reports: System-generated lists of existing, new, and offboarded personnel.
- 
User Access Reviews: Documentation verifying HR-linked access control.
This manual evidence supports auditor testing for personnel controls (A.6) under ISO 27001 and aligns with CC1.0, CC2.0, and CC6.0 SOC 2 criteria.
 
Opting out of these integrations will require additional manual effort to maintain compliance. Understanding these requirements empowers organizations to make informed security and compliance strategy decisions by manually generating and maintaining compliance evidence. Leveraging Vanta’s automated integrations can streamline compliance efforts and reduce the time and effort needed to meet regulatory requirements.

## Images

- none
