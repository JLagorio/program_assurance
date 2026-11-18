# PCI Requirement Changes

Source: https://help.vanta.com/en/articles/11345805-pci-requirement-changes
Collection: Audit Readiness ; Audit Readiness › Compliance Standards Library
Fetched: 2026-11-17

## Article text

What is the official requirement-by-requirement change log?
- 
Straight from the PCI Standards Council <https://www.pcisecuritystandards.org/document_library/>, this is a slightly condensed version of the requirements change log between 3.2.1 and 4.0:
 | 
Requirement 1
 | 
Requirement 1- General | 
Updated principal requirement title to reflect the focus on “network security controls.”
Replaced “firewalls” and “routers” with “network security controls” to support a broader range of technologies used to meet the security objectives traditionally met by firewalls. | 
Evolving requirement
 | 
1.1.5 | 
1.1.2 | 
Replaced requirement for “Description of groups, roles, and responsibilities for management of network components” with general requirement for roles and responsibilities for Requirement 1. | 
Evolving requirement
 | 
1.1 | 
1.2.1 | 
Refocused former “null” requirement (all content pointed to other requirements) on defining, implementing, and maintaining configuration standards for network security control rulesets. | 
 
Clarification or guidance
 | 
1.1.1 | 
1.2.2 | 
Clarified that changes are managed in accordance with the change control process defined at Requirement 6.5.1. | 
Clarification or guidance
 | 
1.1.4 |  | 
Removed redundant requirement. | 
Clarification or guidance
 | 
1.1.6 | 
1.2.5
1.2.6 | 
Separated into two requirements to clarify intent of each. | 
Clarification or guidance
 | 
1.1.7 | 
1.2.7 | 
Clarified the intent of reviewing configurations of network security controls at least once every six months. | 
Clarification or guidance
 | 
1.2 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
1.2.2 | 
1.2.8 | 
Clarified the intent of securing configuration files. | 
Clarification or guidance
 | 
1.2.1
1.3.4 | 
1.3.1
1.3.2 | 
Separated Requirement 1.2.1. into two requirements to clarify intent of each.
Removed redundant Requirement 1.3.4. | 
Clarification or guidance
 | 
1.2.3 | 
1.3.3 | 
Clarified the intent of implementing network security controls between wireless networks and the CDE. | 
Clarification or guidance
 | 
1.3 | 
1.4.1 | 
Refocused a former null requirement (all content pointed to other requirements).
Clarified that the intent is to implement controls between trusted and untrusted networks. | 
Clarification or guidance 
 | 
1.3.1
1.3.2
1.3.5 | 
1.4.2 | 
Merged requirements to clarify that the intent is to restrict inbound traffic from untrusted networks. | 
Clarification or guidance
 | 
1.3.6 | 
1.4.4 | 
Clarified the intent is that system components storing cardholder data are not directly accessible from untrusted networks. | 
Clarification or guidance
 | 
1.4 | 
1.5.1 | 
Clarified that the intent is to implement security controls on any computing device that connects to both untrusted networks and the CDE. | 
Clarification or guidance
 | 
Requirement 2
 | 
Requirement 2 - General | 
Updated principal requirement title to reflect that the focus is on secure configurations in general, and not just on vendor-supplied defaults. | 
Clarification or guidance
 |  | 
2.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments | 
Evolving requirement
 | 
2.1 | 
2.2.2 | 
Clarified that the intent is to understand whether vendor default accounts are in use and to manage them accordingly. | 
Clarification or guidance
 | 
2.2.1 | 
2.2.3 | 
Clarified the intent of the requirement for managing primary functions that require different security levels. | 
Clarification or guidance
 | 
2.2.2
2.2.5 | 
2.2.4 | 
Combined requirements to align similar topics. | 
Structure or format
 | 
2.2.3 | 
2.2.5 | 
Clarified that the intent of the requirement is if any insecure services, protocols, or daemons are present. | 
Clarification or guidance
 | 
2.1.1 | 
2.3.1
2.3.2 | 
Split requirement for changing all wireless vendor defaults into two requirements to clarify the focus of each. | 
Clarification or guidance
 | 
2.4 | 
12.5.1 | 
Moved requirement to align related content. | 
Structure or format
 | 
2.6 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
Requirement 3
 | 
Requirement 3 - General | 
Updated principal requirement title to reflect the focus on account data. | 
Clarification or guidance
 |  | 
3.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
3.1 | 
3.2.1 | 
New requirement bullet to address SAD stored prior to completion of authorization through implementation of data retention and disposal policies, procedures, and processes.
This bullet is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
3.3.2 | 
New requirement to encrypt SAD that is stored electronically prior to completion of authorization.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement 
 | 
3.2.a
3.2.b | 
3.3.3 | 
Added a requirement to address former testing procedures that any storage of SAD by issuers is limited to that which is needed for a legitimate issuing business need and is secured. | 
Clarification or guidance
 | 
3.3 | 
3.4.1 | 
Clarified that PAN is masked when displayed such that only personnel with a business need can see more than the BIN/last four digits of the PAN. | 
Evolving requirement
 | 
12.3.10 | 
3.4.2 | 
New requirement for technical controls to prevent copy and/or relocation of PAN when using remote- access technologies. Expanded from former Requirement 12.3.10.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
3.4 | 
3.5.1 | 
Removed pads from the “Index tokens and pads” bullet for rendering PAN unreadable. | 
Evolving requirement
 |  | 
3.5.1.1 | 
New requirement for keyed cryptographic hashes when hashing is used to render PAN unreadable.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
3.5.1.2 | 
New requirement that disk-level or partition-level encryption is used only to render PAN unreadable on removable electronic media or, if used on non- removable electronic media, the PAN is also rendered unreadable via a mechanism that meets Requirement 3.5.1.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
3.5.1 | 
3.6.1.1 | 
New requirement bullet for service providers only to include in the documented description of the cryptographic architecture that use of the same cryptographic keys in production and test environments is prevented.
This bullet is a best practice until 31 March 2025. | 
Evolving requirement
 | 
Requirement 4
 | 
Requirement 4 - General | 
Updated principal requirement title to reflect the focus on “strong cryptography” to protect transmissions of cardholder data. | 
Clarification or guidance
 |  | 
4.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
4.1 | 
4.2.1 | 
New requirement bullet to confirm certificates used for PAN transmissions over open, public networks are valid and not expired or revoked.
This bullet is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
4.2.1.1 | 
New requirement to maintain an inventory of trusted keys and certificates.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
Requirement 5
 | 
Requirement 5 - General | 
Updated principal requirement title to reflect the focus on protecting all systems and networks from malicious software. | 
Clarification or guidance
 | 
Replaced “anti-virus” with “anti-malware” throughout to support a broader range of technologies used to meet the security objectives traditionally met by anti- virus software. | 
Evolving requirement
 |  | 
5.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
5.1.2 | 
5.2.3 | 
Clarified requirement by changing focus to “system components that are not at risk for malware.” | 
Clarification or guidance
 |  | 
5.2.3.1 | 
New requirement to define the frequency of periodic evaluations of system components not at risk for malware in the entity’s targeted risk analysis.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
5.2 | 
5.3.1
5.3.2
5.3.4 | 
Split one requirement into three to focus each requirement on one area:
· Keeping the malware solution current via automatic updates,
· Performing periodic scans and active or real-time scans (with a new option for continuous behavioral analysis),
· Generation of audit logs by the malware solution. | 
Clarification or guidance
 |  | 
5.3.2.1 | 
New requirement to define the frequency of periodic malware scans in the entity’s targeted risk analysis.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
5.3.3 | 
New requirement for a malware solution for removable electronic media.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
5.4.1 | 
New requirement to detect and protect personnel against phishing attacks.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
Requirement 6
 | 
Requirement 6 - General | 
Updated principal requirement title to include “software” rather than “applications.”
Clarified that Requirement 6 applies to all system components, except for Requirement 6.2, which applies only to bespoke and custom software. | 
Clarification or guidance
 |  | 
6.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
6.3 | 
6.2.1 | 
Moved requirement for developing software securely to align all software development content under Requirement 6.2. | 
Structure or format
 | 
Replaced “internal and external” with “bespoke and custom” software.
Clarified that this requirement applies to software developed for or by the entity for the entity’s own use and does not apply to third-party software. | 
Clarification or guidance
 | 
6.5 | 
6.2.2 | 
Moved the elements of Requirement 6.5 for training of software developers to align all software development content under Requirement 6.2.
Clarified training requirements for software development personnel. | 
Clarification or guidance
 | 
6.3.2 | 
6.2.3
6.2.3.1 | 
Moved requirement for reviewing custom software prior to release to align all software development content under Requirement 6.2.
Split requirement to separate general code review practices from those needed if manual code reviews are performed. | 
Clarification or guidance 
 | 
6.5.1 – 6.5.10 | 
6.2.4 | 
Moved requirements for addressing common coding vulnerabilities to align all software development content under Requirement 6.2.
Combined methods to prevent or mitigate common software attacks into a single requirement and generalized the language describing each type of attack. | 
Clarification or guidance
 | 
6.1
6.2 | 
6.3 | 
Moved requirements for identifying security vulnerabilities and protecting system components from vulnerabilities via patching under Requirement 6.3. | 
Structure or format
 | 
6.1 | 
6.3.1 | 
Added a bullet to clarify applicability to vulnerabilities for bespoke and custom and third-party software. | 
Clarification or guidance
 |  | 
6.3.2 | 
New requirement to maintain an inventory of bespoke and custom software.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
6.6 | 
6.4.1 | 
Moved requirement for addressing new threats and vulnerabilities for public-facing web applications under Requirement 6.4. | 
Structure or format
 |  | 
6.4.2 | 
New requirement to deploy an automated technical solution for public-facing web applications that continually detects and prevents web-based attacks. This new requirement removes the option in Requirement 6.4.1 to review web applications via manual or automated application vulnerability assessment tools or methods.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
6.4.3 | 
New requirement for management of all payment page scripts that are loaded and executed in the consumer’s browser.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
6.3.1
6.4
6.4.1 – 6.4.6 | 
6.5.1 – 6.5.6 | 
Moved and combined requirements for changes to system components under Requirement 6.5. | 
Structure or format
 | 
6.4 | 
6.5.3
6.5.4
6.5.5
6.5.6 | 
Removed requirement for specific documented procedures and added testing procedures to verify policies and procedures to each related requirement. | 
Clarification or guidance
 | 
6.4.1 | 
6.5.3 | 
Changed term from “development/test and production” to “production and pre-production” environments. | 
Clarification or guidance
 | 
6.4.2 | 
6.5.4 | 
Changed term from “development/test and production” to “production and pre-production” environments.
Changed term “separation of duties” and clarified that separation of roles and functions between production and pre-production is intended to provide accountability so that only approved changes are deployed. | 
Clarification or guidance
 | 
6.4.3 | 
6.5.5 | 
Changed term from “testing or development” to “pre- production” environments.
Clarified that live PANs are not used in pre- production environments except where all applicable PCI DSS requirements are in place. | 
Clarification or guidance
 | 
Requirement 7
 | 
Requirement 7 - General | 
Updated principal requirement title to include system components and cardholder data. | 
Clarification or guidance
 |  | 
7.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
7.1 | 
7.2.1
7.2.2
7.2.3 | 
Removed requirement for specific documented procedures and added testing procedures to verify policies and procedures to each related requirement. | 
Clarification or guidance
 | 
7.1.1 | 
7.2.1 | 
Clarified requirement is about defining an access control model. | 
Clarification or guidance
 | 
7.1.2
7.1.3 | 
7.2.2 | 
Combined requirements for assigning access based on job classification and function, and least privileges. | 
Structure or format
 | 
7.1.4 | 
7.2.3 | 
Clarified requirement is about approval of required privileges by authorized personnel. | 
Clarification or guidance
 |  | 
7.2.4 | 
New requirement for review of all user accounts and related access privileges.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
7.2.5 | 
New requirement for assignment and management of all application and system accounts and related access privileges.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
7.2.5.1 | 
New requirement for review of all access by application and system accounts and related access privileges.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
8.7 | 
7.2.6 | 
Moved requirement since it aligns better with the content in Requirement 7. | 
Structure or format
 | 
7.2 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
Requirement 8
 | 
Requirement 8 - General | 
Standardized on terms “authentication factor” and “authentication credentials.”
Removed “non-consumer users” and clarified in the overview that requirements do not apply to accounts used by consumers (cardholders). | 
Clarification or guidance
 | 
Removed note in overview that listed requirements that do not apply to user accounts with access to only one card number at a time to facilitate a single transaction and added that note to each related requirement. | 
Structure or format
 |  | 
8.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
8.1.1 | 
8.2.1 | 
Added a note that this requirement is not intended to apply to user accounts on point-of-sale terminals that have access to only one card number at a time to facilitate a single transaction. | 
Clarification or guidance
 | 
8.5 | 
8.2.2 | 
Changed focus of requirement to allow use of shared authentication credentials, but only on an exception basis. | 
Evolving requirement
 | 
Added a note that this requirement is not intended to apply to user accounts on point-of-sale terminals that have access to only one card number at a time to facilitate a single transaction. | 
Clarification or guidance
 | 
8.5
8.5.1 | 
8.2.2
8.2.3 | 
Moved requirements for group, shared, or generic accounts and for service providers with remote access to customer premises under Requirement 8.2. | 
Structure or format
 | 
8.1.8 | 
8.2.8 | 
Added a note that this requirement is not intended to apply to user accounts on point-of-sale terminals that have access to only one card number at a time to facilitate a single transaction. | 
Structure or format
 | 
8.2 | 
8.3.1 | 
Added a note that this requirement is not intended to apply to user accounts on point-of-sale terminals that have access to only one card number at a time to facilitate a single transaction. | 
Structure or format
 | 
8.1.6
8.1.7 | 
8.3.4 | 
Merged requirements and moved under Requirement 8.3
Added a note that this requirement is not intended to apply to user accounts on point-of-sale terminals that have access to only one card number at a time to facilitate a single transaction. | 
Structure or format
 | 
Increased the number of invalid authentication attempts before locking out a user ID from six to 10 attempts. | 
Evolving requirement
 | 
8.2.6 | 
8.3.5 | 
Clarified that this requirement applies only if passwords/passphrases are used as an authentication factor to meet Requirement 8.3.1. | 
Clarification or guidance
 | 
8.2.3 | 
8.3.6 | 
New requirement to increase password length from a minimum length of seven characters to minimum length of 12 characters (or if the system does not support 12 characters, a minimum length of eight characters).
This requirement is a best practice until 31 March 2025.
Clarified that, until 31 March 2025, passwords must be a minimum length of at least seven characters in accordance with v3.2.1 Requirement 8.2.3.
Clarified that this requirement applies only if passwords/passphrases are used as an authentication factor to meet Requirement 8.3.1.
Added a note that this requirement is not intended to apply to user accounts on point-of-sale terminals that have access to only one card number at a time to facilitate a single transaction. | 
Evolving requirement
 | 
8.2.5 | 
8.3.7 | 
Added a note that this requirement is not intended to apply to user accounts on point-of-sale terminals that have access to only one card number at a time to facilitate a single transaction. | 
Structure or format
 | 
8.4 | 
8.3.8 | 
Moved content about communicating user authentication policies and procedures under Requirement 8.3. | 
Structure or format
 | 
8.2.4 | 
8.3.9 | 
Clarified that this requirement applies if passwords/passphrases are used as the only authentication factor for user access (i.e., in any single-factor authentication implementation).
Added a note that this requirement is not intended to apply to user accounts on point-of-sale terminals that have access to only one card number at a time to facilitate a single transaction.
Added a note that this requirement does not apply to service providers’ customer accounts, but does apply to accounts for service provider personnel. | 
Clarification or guidance
 | 
8.2.4 | 
8.3.9 | 
Added the option to determine access to resources automatically by dynamically analyzing the security posture of accounts, instead of changing passwords/passphrases at least once every 90 days. | 
Evolving requirement
 | 
8.2.4.b | 
8.3.10 | 
Moved content from a former testing procedure to a requirement for service providers to provide guidance to customers about changing passwords/ passphrases.
Added a note that this requirement will be superseded by Requirement 8.3.10.1 once Requirement 8.3.10.1 becomes effective. | 
Structure or format
 |  | 
8.3.10.1 | 
New requirement for service providers only – if passwords/passphrases are the only authentication factor for customer user access, then passwords/passphrases are either changed at least once every 90 days or access to resources is automatically determined by dynamically analyzing the security posture of the accounts.
This requirement is a best practice until 31 March 2025.
Added a note that this requirement does not apply to accounts of consumer users accessing their payment card information.
Added a note that this requirement will supersede Requirement 8.3.10 once it becomes effective, and until that date, service providers may meet either Requirement 8.3.10 or 8.3.10.1. | 
Evolving requirement
 | 
8.6 | 
8.3.11 | 
Moved requirement about authentication factors such as physical or logical security tokens, smart cards, and certificates under Requirement 8.3. | 
Structure or format
 | 
8.3 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 |  | 
8.4.2 | 
New requirement to implement multi-factor authentication (MFA) for all access into the CDE.
This requirement is a best practice until 31 March 2025.
Added a note to clarify that MFA is required for both types of access specified in Requirements 8.4.2 and
8.4.3; and that applying MFA to one type of access does not replace the need to apply another instance of MFA to the other type of access. | 
Evolving requirement
 |  | 
8.5.1 | 
New requirement for secure implementation of multi- factor authentication systems.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
8.6.1 | 
New requirement for management of system or application accounts that can be used for interactive login.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
8.6.2 | 
New requirement for not hard-coding passwords/passphrases into files or scripts for any application and system accounts that can be used for interactive login.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
8.6.3 | 
New requirement for protecting passwords/passphrases for application and system accounts against misuse.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
8.7 | 
7.2.6 | 
Moved requirement since it aligns better with the content in Requirement 7. | 
Structure or format
 | 
Requirement 9
 | 
Requirement 9 - General | 
In the overview, clarified the three different areas covered in Requirement 9 (sensitive areas, CDE, and facilities).
Throughout, clarified whether each requirement applies to the CDE, sensitive areas, or facilities. | 
Clarification or guidance
 |  | 
9.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
9.1 | 
9.2.4 | 
Added a requirement to address a former testing procedure bullet to restrict access to consoles in sensitive areas via locking when not in use. | 
Clarification or guidance
 | 
9.2 | 
9.3.1
9.3.2 | 
Split requirement for identifying personnel and visitors into separate requirements, Requirements 9.3.1 and
9.3.2 respectively. | 
Structure or format
 | 
9.4
9.4.1
9.4.2 | 
9.3.2 | 
Combined requirements for authorizing and managing visitor access together in Requirement 9.3.2. | 
Structure or format
 | 
9.5
9.5.1 | 
9.4.1
9.4.1.1
9.4.1.2 | 
Removed requirement for procedures to physically secure media (9.5) and merged the procedures into the related requirements.
Split requirement for storing media backups in a secure location and reviewing the security of the offline backup location at least every 12 months into 2 requirements. | 
Clarification or guidance
 | 
9.6
9.6.1
9.6.2
9.6.3 | 
9.4.2
9.4.3
9.4.4 | 
Removed requirement for procedures for internal and external distribution of media (9.6) and merged the procedures into the related requirements. | 
Clarification or guidance
 | 
9.7
9.7.1 | 
9.4.5
9.4.5.1 | 
Removed requirement for procedures for strict control over storage and accessibility of media (9.7) and merged the procedures into the related requirements.
Split requirement for maintaining media inventory logs and conducting media inventories annually into 2 requirements. | 
Clarification or guidance
 | 
9.8
9.8.1
9.8.2 | 
9.4.6
9.4.7 | 
Removed requirement for procedures for media destruction when media is no longer needed (9.8) and merged the procedures into the related requirements.
Clarified options for destroying media when no longer needed includes either destruction of electronic media or rendering cardholder data unrecoverable. | 
Clarification or guidance
 | 
9.9 | 
9.5.1 | 
Clarified the focus of the requirement is on “Point-of- interaction (POI) devices that capture payment card data via direct physical interaction with the payment card form factor.”
Clarified that this requirement applies to deployed POI devices used in card-present transactions. | 
Clarification or guidance
 |  | 
9.5.1.2.1 | 
New requirement to define the frequency of periodic POI device inspections based on the entity’s targeted risk analysis.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
Requirement 10
 | 
Requirement 10 - General | 
Updated principal requirement title to reflect focus on audit logs, system components, and cardholder data.
Clarified that these requirements do not apply to user activity of consumers (cardholders).
Replaced “Audit trails” with “Audit logs” throughout. | 
Clarification or guidance
 |  | 
10.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
10.2 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
10.5 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
10.5.1 – 10.5.5 | 
10.3.1 – 10.3.4 | 
Moved audit log protection requirements under Requirement 10.3. | 
Structure or format
 | 
10.5.3
10.5.4 | 
10.3.3 | 
Combined requirements to align similar topics. | 
Structure or format
 | 
10.6 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
10.6.1 – 10.6.3 | 
10.4.1 – 10.4.3 | 
Moved requirements for audit log reviews under Requirement 10.4. | 
Structure or format
 |  | 
10.4.1.1 | 
New requirement for the use of automated mechanisms to perform audit log reviews.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
10.4.2.1 | 
New requirement for a targeted risk analysis to define the frequency of periodic log reviews for all other system components (not defined in Requirement 10.4.1)
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
10.7 | 
10.5.1 | 
Moved requirement for audit log history to 10.5.1. | 
Structure or format
 | 
10.4
10.4.1 – 10.4.3 | 
10.6.1 – 10.6.3 | 
Moved and reorganized requirements for time synchronization under 10.6. | 
Structure or format
 | 
10.8 | 
10.7.1 | 
Moved requirement for service providers to detect, alert, and promptly address failures of critical control systems to Requirement 10.7.1. | 
Structure or format
 |  | 
10.7.2 | 
New requirement for all entities to detect, alert, and promptly address failures of critical security control systems.
This requirement is a best practice until 31 March 2025.
This new requirement applies to all entities - it includes two additional critical security controls not included in Requirement 10.7.1 for service providers. | 
Evolving requirement
 | 
10.8.1 | 
10.7.3 | 
New requirement to respond promptly to failures of any critical security controls.
For service providers: this is current PCI DSS v3.2.1 requirement.
For all other (non-service provider) entities: this is a new requirement.
This requirement is a best practice (for non-service providers) until 31 March 2025. | 
Evolving requirement
 | 
Requirement 11
 | 
Requirement 11 - General | 
Minor update to principal requirement title. | 
Clarification or guidance
 |  | 
11.1.2 | 
New requirement for roles and responsibilities.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
11.1 | 
11.2.1 | 
Clarified the intent of the requirement is to manage both authorized and unauthorized wireless access points.
Clarified that this requirement applies even when a policy exists to prohibit the use of wireless technology. | 
Clarification or guidance
 |  | 
11.3.1.1 | 
New requirement to manage all other applicable vulnerabilities (those not ranked as high-risk or critical) found during internal vulnerability scans.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
11.3.1.2 | 
New requirement to perform internal vulnerability scans via authenticated scanning.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
11.2.3 | 
11.3.1.3
11.3.2.1 | 
Separated requirement to perform internal and external vulnerability scans and rescans after any significant changes into a requirement for internal scans (11.3.1.3) and external scans (11.3.2.1). | 
Structure or format
 | 
11.3 | 
11.4.1 | 
Clarified the following:
· The methodology is defined, documented, and implemented by the entity.
· Penetration testing results are retained for at least 12 months.
· The methodology includes a documented approach to assessing and addressing risk posed by exploitable vulnerabilities and security weaknesses found during penetration testing.
· The meaning of testing from inside the network (internal penetration testing) and from outside the network (external penetration testing). | 
Clarification or guidance
 | 
11.3.3 | 
11.4.4 | 
Clarified that penetration test findings are corrected in accordance with the entity’s assessment of the risk posed by the security issue. | 
Clarification or guidance
 |  | 
11.4.7 | 
New requirement for multi-tenant service providers to support their customers for external penetration testing.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
11.5.1.1 | 
New requirement for service providers to use intrusion-detection and or intrusion-prevention techniques to detect, alert on/prevent, and address covert malware communication channels.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
11.6.1 | 
New requirement to deploy a change-and-tamper- detection mechanism to alert for unauthorized modifications to the HTTP headers and contents of payment pages as received by the consumer browser.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
11.2 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
11.1.2 | 
12.10.5 | 
Moved requirement for incident response procedures if unauthorized wireless access points are detected to align with other incident response items. | 
Structure or format
 | 
11.5.1 | 
12.10.5 | 
Moved requirement to respond to alerts generated by the change-detection solution to align with other the incident response items. | 
Structure or format
 | 
Requirement 12
 | 
Requirement 12 - General | 
Updated principal requirement title to reflect that the focus is on organizational policies and programs that support information security. | 
Clarification or guidance
 | 
12.2 |  | 
Removed requirement for a formal organization-wide risk assessment and replaced with specific targeted risk analyses (12.3.1 and 12.3.2). | 
Evolving requirement
 | 
12.4 | 
12.1.3 | 
Added formal acknowledgment by personnel of their responsibilities. | 
Evolving requirement
 | 
12.5
12.5.1 – 12.5.5 | 
12.1.4 | 
Clarified that responsibilities are formally assigned to a Chief Information Security Officer or other knowledgeable member of executive management.
Merged requirements for formally assigning responsibility for information security. | 
Clarification or guidance
 | 
12.3
12.3.1 – 12.3.9 | 
12.2.1 | 
Clarified the intent of the requirement is for acceptable use policies for end-user technologies.
Merged and removed requirements to focus on explicit management approval, acceptable uses of technologies, and a list of hardware and software products approved by the company for employee use. | 
Clarification or guidance 
 | 
12.3.10 | 
3.4.2 | 
Removed requirement and added new Requirement
3.4.2 for technical controls to prevent copy and/or relocation of PAN when using remote-access technologies. | 
Evolving requirement
 |  | 
12.3.1 | 
New requirement to perform a targeted risk analysis for any PCI DSS requirement that provides flexibility for how frequently it is performed.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
12.3.2 | 
New requirement for entities using a Customized Approach to perform a targeted risk analysis for each PCI DSS requirement that the entity meets with the customized approach.
This requirement is effective immediately for all entities undergoing a v4.0 assessment and using a customized approach. | 
Evolving requirement
 |  | 
12.3.3 | 
New requirement to document and review cryptographic cipher suites and protocols in use at least once every 12 months.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
12.3.4 | 
New requirement to review hardware and software technologies in use at least once every 12 months.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
12.11
12.11.1 | 
12.4.2
12.4.2.1 | 
Moved requirements for reviews to confirm that personnel are performing PCI DSS tasks in accordance with policies and procedures under Requirement 12.4, to align with other requirements for managing PCI DSS compliance activities. | 
Structure or format
 | 
2.4 | 
12.5.1 | 
Moved under Requirement 12.5 to align with other requirements for documenting and validating PCI DSS scope. | 
Structure or format
 |  | 
12.5.2 | 
New requirement to document and confirm PCI DSS scope at least every 12 months and upon significant change to the in-scope environment.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 |  | 
12.5.2.1 | 
New requirement for service providers to document and confirm PCI DSS scope at least once every six months and upon significant change to the in-scope environment.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
12.5.3 | 
New requirement for service providers for a documented review of the impact to PCI DSS scope and applicability of controls upon significant changes to organizational structure.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
12.6 | 
12.6.1 | 
Clarified that the intent is that all personnel are aware of the entity’s information security policy and their role in protecting cardholder data. | 
Clarification or guidance
 |  | 
12.6.2 | 
New requirement to review and update (as needed) the security awareness program at least once every 12 months.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
12.6.1
12.6.2 | 
12.6.3 | 
Merged requirements for security awareness training. | 
Structure or format
 |  | 
12.6.3.1 | 
New requirement for security awareness training to include awareness of threats and vulnerabilities that could impact the security of the CDE.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
12.6.3.2 | 
New requirement for security awareness training to include awareness about the acceptable use of end- user technologies in accordance with Requirement 12.2.1.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
12.8 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
12.8.1 – 12.8.5 | 
12.8.1 – 12.8.5 | 
Replaced “Service Provider” with Third-Party Service Provider (TPSP).
Clarified that the use of a PCI DSS compliant TPSP does not make an entity PCI DSS compliant, nor does it remove the entity’s responsibility for its own PCI DSS compliance. | 
Clarification or guidance
 | 
12.8.2 | 
12.8.2 | 
Replaced “Service Provider” with Third-Party Service Provider (TPSP). | 
Clarification or guidance
 | 
12.8.3 | 
12.8.3 | 
Replaced “Service Provider” with Third-Party Service Provider (TPSP). | 
Clarification or guidance 
 | 
12.8.4 | 
12.8.4 | 
Replaced “Service Provider” with Third-Party Service Provider (TPSP).
Clarified that where an entity has an agreement with a TPSP for meeting PCI DSS requirements on behalf of the entity, the entity must work with the TPSP to make sure the applicable PCI DSS requirements are met. If the TPSP does not meet those applicable PCI DSS requirements, then those requirements are also “not in place” for the entity. | 
Clarification or guidance
 | 
12.8.5 | 
12.8.5 | 
Replaced “Service Provider” with Third-Party Service Provider (TPSP).
Clarified that the information about PCI DSS requirements managed by the TPSP and the entity should include any that are shared between the TPSP and the entity. | 
Clarification or guidance
 |  | 
12.9.2 | 
New requirement for service providers to support their customers’ requests for information to meet Requirements 12.8.4 and 12.8.5.
This requirement is effective immediately for all v4.0 assessments. | 
Evolving requirement
 | 
12.10 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 | 
12.10.1 | 
12.10.1 | 
Replaced “system breach” and “compromise” with “suspected or confirmed security incident.” | 
Clarification or guidance
 | 
12.10.3 | 
12.10.3 | 
Replaced “alerts” with “suspected or confirmed security incidents.” | 
Clarification or guidance
 | 
12.10.4 | 
12.10.4 | 
Replaced “system breach” with “suspected or confirmed security incidents.” | 
Clarification or guidance
 |  | 
12.10.4.1 | 
New requirement to perform a targeted risk analysis to define the frequency of periodic training for incident response personnel.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
12.10.5
11.1.2
11.5.1 | 
12.10.5 | 
Merged requirements and updated the security monitoring systems to be monitored and responded to as part of the incident response plan to include the following:
· Detection of unauthorized wireless access points (former 11.1.2),
· Change-detection mechanism for critical files (former 11.5.1),
· New requirement bullet for use of a change- and tamper-detection mechanism for payment pages (relates to new requirement 11.6.1).
This bullet is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
12.10.7 | 
New requirement for incident response procedures to be in place and initiated upon detection of stored PAN anywhere it is not expected.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
Appendix A1
 | 
Appendix A1 - General | 
Updated principal requirements title to reflect focus on multi-tenant service providers.
Updated requirement overview to describe multi- tenant service providers and their environments, and to clarify responsibilities between multi-tenant service providers and their customers.
Updated “shared hosting provider” to “multi-tenant hosting provider” throughout. | 
Clarification or guidance
 | 
A1 |  | 
Removed “null” requirement (all content pointed to other requirements). | 
Structure or format
 |  | 
A1.1.1 | 
New requirement for to implement logical separation between providers’ environments and customers’ environments.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
A1.1.4 | 
New requirement to confirm, via penetration testing, the effectiveness of logical separation controls used to separate customer environments.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 |  | 
A1.2.3 | 
New requirement for the implementation of processes and mechanisms for reporting and addressing suspected or confirmed security incidents and vulnerabilities.
This requirement is a best practice until 31 March 2025. | 
Evolving requirement
 | 
A1.4 | 
A1.2.2 | 
Replaced “compromise” with “suspected or confirmed security incident” | 
Clarification or guidance
 | 
Appendix A2
 | 
The only changes made to Appendix A2 were to add the requirement description heading at A2.1 and to renumber the three requirements as A2.1.1, A2.1.2, and A2.1.3. | 
Clarification or guidance 
 | 
Appendix A3
 | 
Appendix A3 - General | 
Clarified that other PCI standards may reference completion of this Appendix.
Clarified that not all PCI DSS requirements apply to all entities that undergo a PCI DSS assessment, which is why some PCI DSS requirements are duplicated in this Appendix. Any questions about this Appendix should be addressed to acquirers or payment brands. | 
Clarification or guidance
 | 
A3.2.1 | 
A3.2.1 | 
Updated the elements included for PCI DSS scope documentation and confirmation to align with new PCI DSS Requirement 12.5.2. | 
Evolving requirement
 |  | 
A3.3.1 | 
New requirement bullet to detect, alert, and report failures of automated log review mechanisms.
New requirement bullet to detect, alert, and report failures of automated code review tools.
These bullets are best practices until 31 March 2025. | 
Evolving requirement
 | 
Appendix B: Compensating Controls | 
Appendix B: Compensating Controls | 
Clarified that compensating controls may be considered when an entity cannot meet a PCI DSS requirement explicitly as written, due to “legitimate and documented technical or business constraints.”
Updated item 2 to mention the Customized Approach Objective and its use to understand the intent of most PCI DSS requirements.
Clarified the intent of item 4 is to address the risk imposed by not adhering to the PCI DSS requirement.
Added item 6 to clarify that compensating controls are used to address requirements currently and in the future, and they cannot be used to address a requirement missed in the past. | 
Clarification or guidance
 | 
Appendix C: Compensating Controls Worksheet | 
Appendix C: Compensating Controls Worksheet | 
Clarified that the intent is for the entity to use the worksheet to define its compensating controls.
Updated item 1 to “Document the legitimate technical or business constraints precluding compliance with the original requirement.”
Reordered the worksheet items to move item 4 to item 2.
Updated item 3 to mention the Customized Approach Objective, and split item into two parts to “Define the objective of the original control” and to “Identify the objective met by the compensating control.”
Removed the Compensating Control Worksheet - Completed Example. An updated completed example will be included in a separate guidance document. | 
Clarification or guidance
 |  | 
Appendix D: Customized Approach | 
New Appendix to explain and provide instructions for the Customized Approach. | 
Clarification or guidance 
 |  | 
Appendix E: Sample Templates to Support Customized Approach | 
New Appendix for example templates for the controls matrix and targeted risk analysis, to be documented by the entity as part of the customized approach.
Clarified that entities are not required to follow the specific template formats, but must provide all information as defined in each template.
Includes two templates:
· E1 Sample Controls Matrix Template
· E2 Sample Targeted Risk Analysis Template. | 
Clarification or guidance
 |  | 
Appendix F: Leveraging the PCI Software Security Framework to Support Requirement 6 | 
New Appendix to describe how an entity can meet several requirements in Requirement 6 by use of bespoke or custom software that is developed and maintained in accordance with one of PCI SSC’s Secure Software Standards. | 
Clarification or guidance
 |  | 
Appendix G: PCI DSS Glossary of Terms, Abbreviations, and Acronyms | 
New Appendix for the PCI DSS v4.0 Glossary. General updates to the Glossary include:
· Added new terms based on updated requirements or based on feedback,
· Removed common terms that can be readily found with other sources,
· Removed terms not used in PCI DSS v4.0,
· Shortened acronym definitions. | 
Clarification or guidance
 | 
Appendix D: Segmentation and Sampling of Business Facilities/ System Components |  | 
Removed Appendix and moved former content to sections titled “Segmentation” and “For Assessors: Sampling for PCI DSS Assessments.” | 
Clarification or guidance

## Images

- none
