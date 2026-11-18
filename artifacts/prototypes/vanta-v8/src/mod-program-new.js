// Program creation (pn-): a six-step wizard that creates a program from a real product configuration, and the page it lands on.
// Routes: program-new (how to start), program-new-details, -systems, -baseline, -team, -review (full window, PA.fullWindow),
// and program-start, the new program's Getting started page in the shell.
// DB is real, read from the local database with SELECT only by scratchpad/pn-gen.py: NIST SP 800-53 Rev 5.2.0's active controls and
// families, the four reference baselines, the published overlays and their decisions, the four products with their configurations,
// elements, library pins and claimed controls, what stands behind each control on X800 Missile version 2 (claims and the product
// assessment, as the Product delta reads them), the published library, the workspace's program codes and people.
// Version 8: step one also starts from an ITCSC (ITC below, an example file). The ITCSC reader's answers prefill the later steps,
// each marked "From the ITCSC" with a count per step, and the starter guide carries the ITCSC as a step. PA.pnITCSC exposes the file
// to the ITCSC import (mod-v8-boundary); PA.pnStartFrom = "itcsc" opens the walkthrough on it.
(function () {
  "use strict";
  const PA = window.PA;
  const { S, M, P, ROUTE_NAV, h } = PA;
  const AK = PA.AK;
  const esc = h.esc;
  const DB = {"cat":{"title":"NIST SP 800-53 Rev 5","v":"5.2.0","active":1014},"fam":[["AC","Access Control"],["AT","Awareness and Training"],["AU","Audit and Accountability"],["CA","Assessment, Authorization, and Monitoring"],["CM","Configuration Management"],["CP","Contingency Planning"],["IA","Identification and Authentication"],["IR","Incident Response"],["MA","Maintenance"],["MP","Media Protection"],["PE","Physical and Environmental Protection"],["PL","Planning"],["PM","Program Management"],["PS","Personnel Security"],["PT","Personally Identifiable Information Processing and Transparency"],["RA","Risk Assessment"],["SA","System and Services Acquisition"],["SC","System and Communications Protection"],["SI","System and Information Integrity"],["SR","Supply Chain Risk Management"]],"ctl":"AC-1|Policy and Procedures\nAC-2|Account Management\nAC-2(1)|Automated System Account Management\nAC-2(2)|Automated Temporary and Emergency Account Management\nAC-2(3)|Disable Accounts\nAC-2(4)|Automated Audit Actions\nAC-2(5)|Inactivity Logout\nAC-2(6)|Dynamic Privilege Management\nAC-2(7)|Privileged User Accounts\nAC-2(8)|Dynamic Account Management\nAC-2(9)|Restrictions on Use of Shared and Group Accounts\nAC-2(11)|Usage Conditions\nAC-2(12)|Account Monitoring for Atypical Usage\nAC-2(13)|Disable Accounts for High-risk Individuals\nAC-3|Access Enforcement\nAC-3(2)|Dual Authorization\nAC-3(3)|Mandatory Access Control\nAC-3(4)|Discretionary Access Control\nAC-3(5)|Security-relevant Information\nAC-3(7)|Role-based Access Control\nAC-3(8)|Revocation of Access Authorizations\nAC-3(9)|Controlled Release\nAC-3(10)|Audited Override of Access Control Mechanisms\nAC-3(11)|Restrict Access to Specific Information Types\nAC-3(12)|Assert and Enforce Application Access\nAC-3(13)|Attribute-based Access Control\nAC-3(14)|Individual Access\nAC-3(15)|Discretionary and Mandatory Access Control\nAC-4|Information Flow Enforcement\nAC-4(1)|Object Security and Privacy Attributes\nAC-4(2)|Processing Domains\nAC-4(3)|Dynamic Information Flow Control\nAC-4(4)|Flow Control of Encrypted Information\nAC-4(5)|Embedded Data Types\nAC-4(6)|Metadata\nAC-4(7)|One-way Flow Mechanisms\nAC-4(8)|Security and Privacy Policy Filters\nAC-4(9)|Human Reviews\nAC-4(10)|Enable and Disable Security or Privacy Policy Filters\nAC-4(11)|Configuration of Security or Privacy Policy Filters\nAC-4(12)|Data Type Identifiers\nAC-4(13)|Decomposition into Policy-relevant Subcomponents\nAC-4(14)|Security or Privacy Policy Filter Constraints\nAC-4(15)|Detection of Unsanctioned Information\nAC-4(17)|Domain Authentication\nAC-4(19)|Validation of Metadata\nAC-4(20)|Approved Solutions\nAC-4(21)|Physical or Logical Separation of Information Flows\nAC-4(22)|Access Only\nAC-4(23)|Modify Non-releasable Information\nAC-4(24)|Internal Normalized Format\nAC-4(25)|Data Sanitization\nAC-4(26)|Audit Filtering Actions\nAC-4(27)|Redundant/Independent Filtering Mechanisms\nAC-4(28)|Linear Filter Pipelines\nAC-4(29)|Filter Orchestration Engines\nAC-4(30)|Filter Mechanisms Using Multiple Processes\nAC-4(31)|Failed Content Transfer Prevention\nAC-4(32)|Process Requirements for Information Transfer\nAC-5|Separation of Duties\nAC-6|Least Privilege\nAC-6(1)|Authorize Access to Security Functions\nAC-6(2)|Non-privileged Access for Nonsecurity Functions\nAC-6(3)|Network Access to Privileged Commands\nAC-6(4)|Separate Processing Domains\nAC-6(5)|Privileged Accounts\nAC-6(6)|Privileged Access by Non-organizational Users\nAC-6(7)|Review of User Privileges\nAC-6(8)|Privilege Levels for Code Execution\nAC-6(9)|Log Use of Privileged Functions\nAC-6(10)|Prohibit Non-privileged Users from Executing Privileged Functions\nAC-7|Unsuccessful Logon Attempts\nAC-7(2)|Purge or Wipe Mobile Device\nAC-7(3)|Biometric Attempt Limiting\nAC-7(4)|Use of Alternate Authentication Factor\nAC-8|System Use Notification\nAC-9|Previous Logon Notification\nAC-9(1)|Unsuccessful Logons\nAC-9(2)|Successful and Unsuccessful Logons\nAC-9(3)|Notification of Account Changes\nAC-9(4)|Additional Logon Information\nAC-10|Concurrent Session Control\nAC-11|Device Lock\nAC-11(1)|Pattern-hiding Displays\nAC-12|Session Termination\nAC-12(1)|User-initiated Logouts\nAC-12(2)|Termination Message\nAC-12(3)|Timeout Warning Message\nAC-14|Permitted Actions Without Identification or Authentication\nAC-16|Security and Privacy Attributes\nAC-16(1)|Dynamic Attribute Association\nAC-16(2)|Attribute Value Changes by Authorized Individuals\nAC-16(3)|Maintenance of Attribute Associations by System\nAC-16(4)|Association of Attributes by Authorized Individuals\nAC-16(5)|Attribute Displays on Objects to Be Output\nAC-16(6)|Maintenance of Attribute Association\nAC-16(7)|Consistent Attribute Interpretation\nAC-16(8)|Association Techniques and Technologies\nAC-16(9)|Attribute Reassignment — Regrading Mechanisms\nAC-16(10)|Attribute Configuration by Authorized Individuals\nAC-17|Remote Access\nAC-17(1)|Monitoring and Control\nAC-17(2)|Protection of Confidentiality and Integrity Using Encryption\nAC-17(3)|Managed Access Control Points\nAC-17(4)|Privileged Commands and Access\nAC-17(6)|Protection of Mechanism Information\nAC-17(9)|Disconnect or Disable Access\nAC-17(10)|Authenticate Remote Commands\nAC-18|Wireless Access\nAC-18(1)|Authentication and Encryption\nAC-18(3)|Disable Wireless Networking\nAC-18(4)|Restrict Configurations by Users\nAC-18(5)|Antennas and Transmission Power Levels\nAC-19|Access Control for Mobile Devices\nAC-19(4)|Restrictions for Classified Information\nAC-19(5)|Full Device or Container-based Encryption\nAC-20|Use of External Systems\nAC-20(1)|Limits on Authorized Use\nAC-20(2)|Portable Storage Devices — Restricted Use\nAC-20(3)|Non-organizationally Owned Systems — Restricted Use\nAC-20(4)|Network Accessible Storage Devices — Prohibited Use\nAC-20(5)|Portable Storage Devices — Prohibited Use\nAC-21|Information Sharing\nAC-21(1)|Automated Decision Support\nAC-21(2)|Information Search and Retrieval\nAC-22|Publicly Accessible Content\nAC-23|Data Mining Protection\nAC-24|Access Control Decisions\nAC-24(1)|Transmit Access Authorization Information\nAC-24(2)|No User or Process Identity\nAC-25|Reference Monitor\nAT-1|Policy and Procedures\nAT-2|Literacy Training and Awareness\nAT-2(1)|Practical Exercises\nAT-2(2)|Insider Threat\nAT-2(3)|Social Engineering and Mining\nAT-2(4)|Suspicious Communications and Anomalous System Behavior\nAT-2(5)|Advanced Persistent Threat\nAT-2(6)|Cyber Threat Environment\nAT-3|Role-based Training\nAT-3(1)|Environmental Controls\nAT-3(2)|Physical Security Controls\nAT-3(3)|Practical Exercises\nAT-3(5)|Processing Personally Identifiable Information\nAT-4|Training Records\nAT-6|Training Feedback\nAU-1|Policy and Procedures\nAU-2|Event Logging\nAU-3|Content of Audit Records\nAU-3(1)|Additional Audit Information\nAU-3(3)|Limit Personally Identifiable Information Elements\nAU-4|Audit Log Storage Capacity\nAU-4(1)|Transfer to Alternate Storage\nAU-5|Response to Audit Logging Process Failures\nAU-5(1)|Storage Capacity Warning\nAU-5(2)|Real-time Alerts\nAU-5(3)|Configurable Traffic Volume Thresholds\nAU-5(4)|Shutdown on Failure\nAU-5(5)|Alternate Audit Logging Capability\nAU-6|Audit Record Review, Analysis, and Reporting\nAU-6(1)|Automated Process Integration\nAU-6(3)|Correlate Audit Record Repositories\nAU-6(4)|Central Review and Analysis\nAU-6(5)|Integrated Analysis of Audit Records\nAU-6(6)|Correlation with Physical Monitoring\nAU-6(7)|Permitted Actions\nAU-6(8)|Full Text Analysis of Privileged Commands\nAU-6(9)|Correlation with Information from Nontechnical Sources\nAU-7|Audit Record Reduction and Report Generation\nAU-7(1)|Automatic Processing\nAU-8|Time Stamps\nAU-9|Protection of Audit Information\nAU-9(1)|Hardware Write-once Media\nAU-9(2)|Store on Separate Physical Systems or Components\nAU-9(3)|Cryptographic Protection\nAU-9(4)|Access by Subset of Privileged Users\nAU-9(5)|Dual Authorization\nAU-9(6)|Read-only Access\nAU-9(7)|Store on Component with Different Operating System\nAU-10|Non-repudiation\nAU-10(1)|Association of Identities\nAU-10(2)|Validate Binding of Information Producer Identity\nAU-10(3)|Chain of Custody\nAU-10(4)|Validate Binding of Information Reviewer Identity\nAU-11|Audit Record Retention\nAU-11(1)|Long-term Retrieval Capability\nAU-12|Audit Record Generation\nAU-12(1)|System-wide and Time-correlated Audit Trail\nAU-12(2)|Standardized Formats\nAU-12(3)|Changes by Authorized Individuals\nAU-12(4)|Query Parameter Audits of Personally Identifiable Information\nAU-13|Monitoring for Information Disclosure\nAU-13(1)|Use of Automated Tools\nAU-13(2)|Review of Monitored Sites\nAU-13(3)|Unauthorized Replication of Information\nAU-14|Session Audit\nAU-14(1)|System Start-up\nAU-14(3)|Remote Viewing and Listening\nAU-16|Cross-organizational Audit Logging\nAU-16(1)|Identity Preservation\nAU-16(2)|Sharing of Audit Information\nAU-16(3)|Disassociability\nCA-1|Policy and Procedures\nCA-2|Control Assessments\nCA-2(1)|Independent Assessors\nCA-2(2)|Specialized Assessments\nCA-2(3)|Leveraging Results from External Organizations\nCA-3|Information Exchange\nCA-3(6)|Transfer Authorizations\nCA-3(7)|Transitive Information Exchanges\nCA-5|Plan of Action and Milestones\nCA-5(1)|Automation Support for Accuracy and Currency\nCA-6|Authorization\nCA-6(1)|Joint Authorization — Intra-organization\nCA-6(2)|Joint Authorization — Inter-organization\nCA-7|Continuous Monitoring\nCA-7(1)|Independent Assessment\nCA-7(3)|Trend Analyses\nCA-7(4)|Risk Monitoring\nCA-7(5)|Consistency Analysis\nCA-7(6)|Automation Support for Monitoring\nCA-8|Penetration Testing\nCA-8(1)|Independent Penetration Testing Agent or Team\nCA-8(2)|Red Team Exercises\nCA-8(3)|Facility Penetration Testing\nCA-9|Internal System Connections\nCA-9(1)|Compliance Checks\nCM-1|Policy and Procedures\nCM-2|Baseline Configuration\nCM-2(2)|Automation Support for Accuracy and Currency\nCM-2(3)|Retention of Previous Configurations\nCM-2(6)|Development and Test Environments\nCM-2(7)|Configure Systems and Components for High-risk Areas\nCM-3|Configuration Change Control\nCM-3(1)|Automated Documentation, Notification, and Prohibition of Changes\nCM-3(2)|Testing, Validation, and Documentation of Changes\nCM-3(3)|Automated Change Implementation\nCM-3(4)|Security and Privacy Representatives\nCM-3(5)|Automated Security Response\nCM-3(6)|Cryptography Management\nCM-3(7)|Review System Changes\nCM-3(8)|Prevent or Restrict Configuration Changes\nCM-4|Impact Analyses\nCM-4(1)|Separate Test Environments\nCM-4(2)|Verification of Controls\nCM-5|Access Restrictions for Change\nCM-5(1)|Automated Access Enforcement and Audit Records\nCM-5(4)|Dual Authorization\nCM-5(5)|Privilege Limitation for Production and Operation\nCM-5(6)|Limit Library Privileges\nCM-6|Configuration Settings\nCM-6(1)|Automated Management, Application, and Verification\nCM-6(2)|Respond to Unauthorized Changes\nCM-7|Least Functionality\nCM-7(1)|Periodic Review\nCM-7(2)|Prevent Program Execution\nCM-7(3)|Registration Compliance\nCM-7(4)|Unauthorized Software — Deny-by-exception\nCM-7(5)|Authorized Software — Allow-by-exception\nCM-7(6)|Confined Environments with Limited Privileges\nCM-7(7)|Code Execution in Protected Environments\nCM-7(8)|Binary or Machine Executable Code\nCM-7(9)|Prohibiting The Use of Unauthorized Hardware\nCM-8|System Component Inventory\nCM-8(1)|Updates During Installation and Removal\nCM-8(2)|Automated Maintenance\nCM-8(3)|Automated Unauthorized Component Detection\nCM-8(4)|Accountability Information\nCM-8(6)|Assessed Configurations and Approved Deviations\nCM-8(7)|Centralized Repository\nCM-8(8)|Automated Location Tracking\nCM-8(9)|Assignment of Components to Systems\nCM-9|Configuration Management Plan\nCM-9(1)|Assignment of Responsibility\nCM-10|Software Usage Restrictions\nCM-10(1)|Open-source Software\nCM-11|User-installed Software\nCM-11(2)|Software Installation with Privileged Status\nCM-11(3)|Automated Enforcement and Monitoring\nCM-12|Information Location\nCM-12(1)|Automated Tools to Support Information Location\nCM-13|Data Action Mapping\nCM-14|Signed Components\nCP-1|Policy and Procedures\nCP-2|Contingency Plan\nCP-2(1)|Coordinate with Related Plans\nCP-2(2)|Capacity Planning\nCP-2(3)|Resume Mission and Business Functions\nCP-2(5)|Continue Mission and Business Functions\nCP-2(6)|Alternate Processing and Storage Sites\nCP-2(7)|Coordinate with External Service Providers\nCP-2(8)|Identify Critical Assets\nCP-3|Contingency Training\nCP-3(1)|Simulated Events\nCP-3(2)|Mechanisms Used in Training Environments\nCP-4|Contingency Plan Testing\nCP-4(1)|Coordinate with Related Plans\nCP-4(2)|Alternate Processing Site\nCP-4(3)|Automated Testing\nCP-4(4)|Full Recovery and Reconstitution\nCP-4(5)|Self-challenge\nCP-6|Alternate Storage Site\nCP-6(1)|Separation from Primary Site\nCP-6(2)|Recovery Time and Recovery Point Objectives\nCP-6(3)|Accessibility\nCP-7|Alternate Processing Site\nCP-7(1)|Separation from Primary Site\nCP-7(2)|Accessibility\nCP-7(3)|Priority of Service\nCP-7(4)|Preparation for Use\nCP-7(6)|Inability to Return to Primary Site\nCP-8|Telecommunications Services\nCP-8(1)|Priority of Service Provisions\nCP-8(2)|Single Points of Failure\nCP-8(3)|Separation of Primary and Alternate Providers\nCP-8(4)|Provider Contingency Plan\nCP-8(5)|Alternate Telecommunication Service Testing\nCP-9|System Backup\nCP-9(1)|Testing for Reliability and Integrity\nCP-9(2)|Test Restoration Using Sampling\nCP-9(3)|Separate Storage for Critical Information\nCP-9(5)|Transfer to Alternate Storage Site\nCP-9(6)|Redundant Secondary System\nCP-9(7)|Dual Authorization for Deletion or Destruction\nCP-9(8)|Cryptographic Protection\nCP-10|System Recovery and Reconstitution\nCP-10(2)|Transaction Recovery\nCP-10(4)|Restore Within Time Period\nCP-10(6)|Component Protection\nCP-11|Alternate Communications Protocols\nCP-12|Safe Mode\nCP-13|Alternative Security Mechanisms\nIA-1|Policy and Procedures\nIA-2|Identification and Authentication (Organizational Users)\nIA-2(1)|Multi-factor Authentication to Privileged Accounts\nIA-2(2)|Multi-factor Authentication to Non-privileged Accounts\nIA-2(5)|Individual Authentication with Group Authentication\nIA-2(6)|Access to Accounts —separate Device\nIA-2(8)|Access to Accounts — Replay Resistant\nIA-2(10)|Single Sign-on\nIA-2(12)|Acceptance of PIV Credentials\nIA-2(13)|Out-of-band Authentication\nIA-3|Device Identification and Authentication\nIA-3(1)|Cryptographic Bidirectional Authentication\nIA-3(3)|Dynamic Address Allocation\nIA-3(4)|Device Attestation\nIA-4|Identifier Management\nIA-4(1)|Prohibit Account Identifiers as Public Identifiers\nIA-4(4)|Identify User Status\nIA-4(5)|Dynamic Management\nIA-4(6)|Cross-organization Management\nIA-4(8)|Pairwise Pseudonymous Identifiers\nIA-4(9)|Attribute Maintenance and Protection\nIA-5|Authenticator Management\nIA-5(1)|Password-based Authentication\nIA-5(2)|Public Key-based Authentication\nIA-5(5)|Change Authenticators Prior to Delivery\nIA-5(6)|Protection of Authenticators\nIA-5(7)|No Embedded Unencrypted Static Authenticators\nIA-5(8)|Multiple System Accounts\nIA-5(9)|Federated Credential Management\nIA-5(10)|Dynamic Credential Binding\nIA-5(12)|Biometric Authentication Performance\nIA-5(13)|Expiration of Cached Authenticators\nIA-5(14)|Managing Content of PKI Trust Stores\nIA-5(15)|GSA-approved Products and Services\nIA-5(16)|In-person or Trusted External Party Authenticator Issuance\nIA-5(17)|Presentation Attack Detection for Biometric Authenticators\nIA-5(18)|Password Managers\nIA-6|Authentication Feedback\nIA-7|Cryptographic Module Authentication\nIA-8|Identification and Authentication (Non-organizational Users)\nIA-8(1)|Acceptance of PIV Credentials from Other Agencies\nIA-8(2)|Acceptance of External Authenticators\nIA-8(4)|Use of Defined Profiles\nIA-8(5)|Acceptance of PIV-I Credentials\nIA-8(6)|Disassociability\nIA-9|Service Identification and Authentication\nIA-10|Adaptive Authentication\nIA-11|Re-authentication\nIA-12|Identity Proofing\nIA-12(1)|Supervisor Authorization\nIA-12(2)|Identity Evidence\nIA-12(3)|Identity Evidence Validation and Verification\nIA-12(4)|In-person Validation and Verification\nIA-12(5)|Address Confirmation\nIA-12(6)|Accept Externally-proofed Identities\nIA-13|Identity Providers and Authorization Servers\nIA-13(1)|Protection of Cryptographic Keys\nIA-13(2)|Verification of Identity Assertions and Access Tokens\nIA-13(3)|Token Management\nIR-1|Policy and Procedures\nIR-2|Incident Response Training\nIR-2(1)|Simulated Events\nIR-2(2)|Automated Training Environments\nIR-2(3)|Breach\nIR-3|Incident Response Testing\nIR-3(1)|Automated Testing\nIR-3(2)|Coordination with Related Plans\nIR-3(3)|Continuous Improvement\nIR-4|Incident Handling\nIR-4(1)|Automated Incident Handling Processes\nIR-4(2)|Dynamic Reconfiguration\nIR-4(3)|Continuity of Operations\nIR-4(4)|Information Correlation\nIR-4(5)|Automatic Disabling of System\nIR-4(6)|Insider Threats\nIR-4(7)|Insider Threats — Intra-organization Coordination\nIR-4(8)|Correlation with External Organizations\nIR-4(9)|Dynamic Response Capability\nIR-4(10)|Supply Chain Coordination\nIR-4(11)|Integrated Incident Response Team\nIR-4(12)|Malicious Code and Forensic Analysis\nIR-4(13)|Behavior Analysis\nIR-4(14)|Security Operations Center\nIR-4(15)|Public Relations and Reputation Repair\nIR-5|Incident Monitoring\nIR-5(1)|Automated Tracking, Data Collection, and Analysis\nIR-6|Incident Reporting\nIR-6(1)|Automated Reporting\nIR-6(2)|Vulnerabilities Related to Incidents\nIR-6(3)|Supply Chain Coordination\nIR-7|Incident Response Assistance\nIR-7(1)|Automation Support for Availability of Information and Support\nIR-7(2)|Coordination with External Providers\nIR-8|Incident Response Plan\nIR-8(1)|Breaches\nIR-9|Information Spillage Response\nIR-9(2)|Training\nIR-9(3)|Post-spill Operations\nIR-9(4)|Exposure to Unauthorized Personnel\nMA-1|Policy and Procedures\nMA-2|Controlled Maintenance\nMA-2(2)|Automated Maintenance Activities\nMA-3|Maintenance Tools\nMA-3(1)|Inspect Tools\nMA-3(2)|Inspect Media\nMA-3(3)|Prevent Unauthorized Removal\nMA-3(4)|Restricted Tool Use\nMA-3(5)|Execution with Privilege\nMA-3(6)|Software Updates and Patches\nMA-4|Nonlocal Maintenance\nMA-4(1)|Logging and Review\nMA-4(3)|Comparable Security and Sanitization\nMA-4(4)|Authentication and Separation of Maintenance Sessions\nMA-4(5)|Approvals and Notifications\nMA-4(6)|Cryptographic Protection\nMA-4(7)|Disconnect Verification\nMA-5|Maintenance Personnel\nMA-5(1)|Individuals Without Appropriate Access\nMA-5(2)|Security Clearances for Classified Systems\nMA-5(3)|Citizenship Requirements for Classified Systems\nMA-5(4)|Foreign Nationals\nMA-5(5)|Non-system Maintenance\nMA-6|Timely Maintenance\nMA-6(1)|Preventive Maintenance\nMA-6(2)|Predictive Maintenance\nMA-6(3)|Automated Support for Predictive Maintenance\nMA-7|Field Maintenance\nMP-1|Policy and Procedures\nMP-2|Media Access\nMP-3|Media Marking\nMP-4|Media Storage\nMP-4(2)|Automated Restricted Access\nMP-5|Media Transport\nMP-5(3)|Custodians\nMP-6|Media Sanitization\nMP-6(1)|Review, Approve, Track, Document, and Verify\nMP-6(2)|Equipment Testing\nMP-6(3)|Nondestructive Techniques\nMP-6(7)|Dual Authorization\nMP-6(8)|Remote Purging or Wiping of Information\nMP-7|Media Use\nMP-7(2)|Prohibit Use of Sanitization-resistant Media\nMP-8|Media Downgrading\nMP-8(1)|Documentation of Process\nMP-8(2)|Equipment Testing\nMP-8(3)|Controlled Unclassified Information\nMP-8(4)|Classified Information\nPE-1|Policy and Procedures\nPE-2|Physical Access Authorizations\nPE-2(1)|Access by Position or Role\nPE-2(2)|Two Forms of Identification\nPE-2(3)|Restrict Unescorted Access\nPE-3|Physical Access Control\nPE-3(1)|System Access\nPE-3(2)|Facility and Systems\nPE-3(3)|Continuous Guards\nPE-3(4)|Lockable Casings\nPE-3(5)|Tamper Protection\nPE-3(7)|Physical Barriers\nPE-3(8)|Access Control Vestibules\nPE-4|Access Control for Transmission\nPE-5|Access Control for Output Devices\nPE-5(2)|Link to Individual Identity\nPE-6|Monitoring Physical Access\nPE-6(1)|Intrusion Alarms and Surveillance Equipment\nPE-6(2)|Automated Intrusion Recognition and Responses\nPE-6(3)|Video Surveillance\nPE-6(4)|Monitoring Physical Access to Systems\nPE-8|Visitor Access Records\nPE-8(1)|Automated Records Maintenance and Review\nPE-8(3)|Limit Personally Identifiable Information Elements\nPE-9|Power Equipment and Cabling\nPE-9(1)|Redundant Cabling\nPE-9(2)|Automatic Voltage Controls\nPE-10|Emergency Shutoff\nPE-11|Emergency Power\nPE-11(1)|Alternate Power Supply — Minimal Operational Capability\nPE-11(2)|Alternate Power Supply — Self-contained\nPE-12|Emergency Lighting\nPE-12(1)|Essential Mission and Business Functions\nPE-13|Fire Protection\nPE-13(1)|Detection Systems — Automatic Activation and Notification\nPE-13(2)|Suppression Systems — Automatic Activation and Notification\nPE-13(4)|Inspections\nPE-14|Environmental Controls\nPE-14(1)|Automatic Controls\nPE-14(2)|Monitoring with Alarms and Notifications\nPE-15|Water Damage Protection\nPE-15(1)|Automation Support\nPE-16|Delivery and Removal\nPE-17|Alternate Work Site\nPE-18|Location of System Components\nPE-19|Information Leakage\nPE-19(1)|National Emissions Policies and Procedures\nPE-20|Asset Monitoring and Tracking\nPE-21|Electromagnetic Pulse Protection\nPE-22|Component Marking\nPE-23|Facility Location\nPL-1|Policy and Procedures\nPL-2|System Security and Privacy Plans\nPL-4|Rules of Behavior\nPL-4(1)|Social Media and External Site/Application Usage Restrictions\nPL-7|Concept of Operations\nPL-8|Security and Privacy Architectures\nPL-8(1)|Defense in Depth\nPL-8(2)|Supplier Diversity\nPL-9|Central Management\nPL-10|Baseline Selection\nPL-11|Baseline Tailoring\nPM-1|Information Security Program Plan\nPM-2|Information Security Program Leadership Role\nPM-3|Information Security and Privacy Resources\nPM-4|Plan of Action and Milestones Process\nPM-5|System Inventory\nPM-5(1)|Inventory of Personally Identifiable Information\nPM-6|Measures of Performance\nPM-7|Enterprise Architecture\nPM-7(1)|Offloading\nPM-8|Critical Infrastructure Plan\nPM-9|Risk Management Strategy\nPM-10|Authorization Process\nPM-11|Mission and Business Process Definition\nPM-12|Insider Threat Program\nPM-13|Security and Privacy Workforce\nPM-14|Testing, Training, and Monitoring\nPM-15|Security and Privacy Groups and Associations\nPM-16|Threat Awareness Program\nPM-16(1)|Automated Means for Sharing Threat Intelligence\nPM-17|Protecting Controlled Unclassified Information on External Systems\nPM-18|Privacy Program Plan\nPM-19|Privacy Program Leadership Role\nPM-20|Dissemination of Privacy Program Information\nPM-20(1)|Privacy Policies on Websites, Applications, and Digital Services\nPM-21|Accounting of Disclosures\nPM-22|Personally Identifiable Information Quality Management\nPM-23|Data Governance Body\nPM-24|Data Integrity Board\nPM-25|Minimization of Personally Identifiable Information Used in Testing, Training, and Research\nPM-26|Complaint Management\nPM-27|Privacy Reporting\nPM-28|Risk Framing\nPM-29|Risk Management Program Leadership Roles\nPM-30|Supply Chain Risk Management Strategy\nPM-30(1)|Suppliers of Critical or Mission-essential Items\nPM-31|Continuous Monitoring Strategy\nPM-32|Purposing\nPS-1|Policy and Procedures\nPS-2|Position Risk Designation\nPS-3|Personnel Screening\nPS-3(1)|Classified Information\nPS-3(2)|Formal Indoctrination\nPS-3(3)|Information Requiring Special Protective Measures\nPS-3(4)|Citizenship Requirements\nPS-4|Personnel Termination\nPS-4(1)|Post-employment Requirements\nPS-4(2)|Automated Actions\nPS-5|Personnel Transfer\nPS-6|Access Agreements\nPS-6(2)|Classified Information Requiring Special Protection\nPS-6(3)|Post-employment Requirements\nPS-7|External Personnel Security\nPS-8|Personnel Sanctions\nPS-9|Position Descriptions\nPT-1|Policy and Procedures\nPT-2|Authority to Process Personally Identifiable Information\nPT-2(1)|Data Tagging\nPT-2(2)|Automation\nPT-3|Personally Identifiable Information Processing Purposes\nPT-3(1)|Data Tagging\nPT-3(2)|Automation\nPT-4|Consent\nPT-4(1)|Tailored Consent\nPT-4(2)|Just-in-time Consent\nPT-4(3)|Revocation\nPT-5|Privacy Notice\nPT-5(1)|Just-in-time Notice\nPT-5(2)|Privacy Act Statements\nPT-6|System of Records Notice\nPT-6(1)|Routine Uses\nPT-6(2)|Exemption Rules\nPT-7|Specific Categories of Personally Identifiable Information\nPT-7(1)|Social Security Numbers\nPT-7(2)|First Amendment Information\nPT-8|Computer Matching Requirements\nRA-1|Policy and Procedures\nRA-2|Security Categorization\nRA-2(1)|Impact-level Prioritization\nRA-3|Risk Assessment\nRA-3(1)|Supply Chain Risk Assessment\nRA-3(2)|Use of All-source Intelligence\nRA-3(3)|Dynamic Threat Awareness\nRA-3(4)|Predictive Cyber Analytics\nRA-5|Vulnerability Monitoring and Scanning\nRA-5(2)|Update Vulnerabilities to Be Scanned\nRA-5(3)|Breadth and Depth of Coverage\nRA-5(4)|Discoverable Information\nRA-5(5)|Privileged Access\nRA-5(6)|Automated Trend Analyses\nRA-5(8)|Review Historic Audit Logs\nRA-5(10)|Correlate Scanning Information\nRA-5(11)|Public Disclosure Program\nRA-6|Technical Surveillance Countermeasures Survey\nRA-7|Risk Response\nRA-8|Privacy Impact Assessments\nRA-9|Criticality Analysis\nRA-10|Threat Hunting\nSA-1|Policy and Procedures\nSA-2|Allocation of Resources\nSA-3|System Development Life Cycle\nSA-3(1)|Manage Preproduction Environment\nSA-3(2)|Use of Live or Operational Data\nSA-3(3)|Technology Refresh\nSA-4|Acquisition Process\nSA-4(1)|Functional Properties of Controls\nSA-4(2)|Design and Implementation Information for Controls\nSA-4(3)|Development Methods, Techniques, and Practices\nSA-4(5)|System, Component, and Service Configurations\nSA-4(6)|Use of Information Assurance Products\nSA-4(7)|NIAP-approved Protection Profiles \nSA-4(8)|Continuous Monitoring Plan for Controls\nSA-4(9)|Functions, Ports, Protocols, and Services in Use\nSA-4(10)|Use of Approved PIV Products\nSA-4(11)|System of Records\nSA-4(12)|Data Ownership\nSA-5|System Documentation\nSA-8|Security and Privacy Engineering Principles\nSA-8(1)|Clear Abstractions\nSA-8(2)|Least Common Mechanism\nSA-8(3)|Modularity and Layering\nSA-8(4)|Partially Ordered Dependencies\nSA-8(5)|Efficiently Mediated Access\nSA-8(6)|Minimized Sharing\nSA-8(7)|Reduced Complexity\nSA-8(8)|Secure Evolvability\nSA-8(9)|Trusted Components\nSA-8(10)|Hierarchical Trust\nSA-8(11)|Inverse Modification Threshold\nSA-8(12)|Hierarchical Protection\nSA-8(13)|Minimized Security Elements\nSA-8(14)|Least Privilege\nSA-8(15)|Predicate Permission\nSA-8(16)|Self-reliant Trustworthiness\nSA-8(17)|Secure Distributed Composition\nSA-8(18)|Trusted Communications Channels\nSA-8(19)|Continuous Protection\nSA-8(20)|Secure Metadata Management\nSA-8(21)|Self-analysis\nSA-8(22)|Accountability and Traceability\nSA-8(23)|Secure Defaults\nSA-8(24)|Secure Failure and Recovery\nSA-8(25)|Economic Security\nSA-8(26)|Performance Security\nSA-8(27)|Human Factored Security\nSA-8(28)|Acceptable Security\nSA-8(29)|Repeatable and Documented Procedures\nSA-8(30)|Procedural Rigor\nSA-8(31)|Secure System Modification\nSA-8(32)|Sufficient Documentation\nSA-8(33)|Minimization\nSA-9|External System Services\nSA-9(1)|Risk Assessments and Organizational Approvals\nSA-9(2)|Identification of Functions, Ports, Protocols, and Services\nSA-9(3)|Establish and Maintain Trust Relationship with Providers\nSA-9(4)|Consistent Interests of Consumers and Providers\nSA-9(5)|Processing, Storage, and Service Location\nSA-9(6)|Organization-controlled Cryptographic Keys\nSA-9(7)|Organization-controlled Integrity Checking\nSA-9(8)|Processing and Storage Location — U.S. Jurisdiction\nSA-10|Developer Configuration Management\nSA-10(1)|Software and Firmware Integrity Verification\nSA-10(2)|Alternative Configuration Management Processes\nSA-10(3)|Hardware Integrity Verification\nSA-10(4)|Trusted Generation\nSA-10(5)|Mapping Integrity for Version Control\nSA-10(6)|Trusted Distribution\nSA-10(7)|Security and Privacy Representatives\nSA-11|Developer Testing and Evaluation\nSA-11(1)|Static Code Analysis\nSA-11(2)|Threat Modeling and Vulnerability Analyses\nSA-11(3)|Independent Verification of Assessment Plans and Evidence\nSA-11(4)|Manual Code Reviews\nSA-11(5)|Penetration Testing\nSA-11(6)|Attack Surface Reviews\nSA-11(7)|Verify Scope of Testing and Evaluation\nSA-11(8)|Dynamic Code Analysis\nSA-11(9)|Interactive Application Security Testing\nSA-15|Development Process, Standards, and Tools\nSA-15(1)|Quality Metrics\nSA-15(2)|Security and Privacy Tracking Tools\nSA-15(3)|Criticality Analysis\nSA-15(5)|Attack Surface Reduction\nSA-15(6)|Continuous Improvement\nSA-15(7)|Automated Vulnerability Analysis\nSA-15(8)|Reuse of Threat and Vulnerability Information\nSA-15(10)|Incident Response Plan\nSA-15(11)|Archive System or Component\nSA-15(12)|Minimize Personally Identifiable Information\nSA-15(13)|Logging Syntax\nSA-16|Developer-provided Training\nSA-17|Developer Security and Privacy Architecture and Design\nSA-17(1)|Formal Policy Model\nSA-17(2)|Security-relevant Components\nSA-17(3)|Formal Correspondence\nSA-17(4)|Informal Correspondence\nSA-17(5)|Conceptually Simple Design\nSA-17(6)|Structure for Testing\nSA-17(7)|Structure for Least Privilege\nSA-17(8)|Orchestration\nSA-17(9)|Design Diversity\nSA-20|Customized Development of Critical Components\nSA-21|Developer Screening\nSA-22|Unsupported System Components\nSA-23|Specialization\nSA-24|Design For Cyber Resiliency\nSC-1|Policy and Procedures\nSC-2|Separation of System and User Functionality\nSC-2(1)|Interfaces for Non-privileged Users\nSC-2(2)|Disassociability\nSC-3|Security Function Isolation\nSC-3(1)|Hardware Separation\nSC-3(2)|Access and Flow Control Functions\nSC-3(3)|Minimize Nonsecurity Functionality\nSC-3(4)|Module Coupling and Cohesiveness\nSC-3(5)|Layered Structures\nSC-4|Information in Shared System Resources\nSC-4(2)|Multilevel or Periods Processing\nSC-5|Denial-of-service Protection\nSC-5(1)|Restrict Ability to Attack Other Systems\nSC-5(2)|Capacity, Bandwidth, and Redundancy\nSC-5(3)|Detection and Monitoring\nSC-6|Resource Availability\nSC-7|Boundary Protection\nSC-7(3)|Access Points\nSC-7(4)|External Telecommunications Services\nSC-7(5)|Deny by Default — Allow by Exception\nSC-7(7)|Split Tunneling for Remote Devices\nSC-7(8)|Route Traffic to Authenticated Proxy Servers\nSC-7(9)|Restrict Threatening Outgoing Communications Traffic\nSC-7(10)|Prevent Exfiltration\nSC-7(11)|Restrict Incoming Communications Traffic\nSC-7(12)|Host-based Protection\nSC-7(13)|Isolation of Security Tools, Mechanisms, and Support Components\nSC-7(14)|Protect Against Unauthorized Physical Connections\nSC-7(15)|Networked Privileged Accesses\nSC-7(16)|Prevent Discovery of System Components\nSC-7(17)|Automated Enforcement of Protocol Formats\nSC-7(18)|Fail Secure\nSC-7(19)|Block Communication from Non-organizationally Configured Hosts\nSC-7(20)|Dynamic Isolation and Segregation\nSC-7(21)|Isolation of System Components\nSC-7(22)|Separate Subnets for Connecting to Different Security Domains\nSC-7(23)|Disable Sender Feedback on Protocol Validation Failure\nSC-7(24)|Personally Identifiable Information\nSC-7(25)|Unclassified National Security System Connections\nSC-7(26)|Classified National Security System Connections\nSC-7(27)|Unclassified Non-national Security System Connections\nSC-7(28)|Connections to Public Networks\nSC-7(29)|Separate Subnets to Isolate Functions\nSC-8|Transmission Confidentiality and Integrity\nSC-8(1)|Cryptographic Protection\nSC-8(2)|Pre- and Post-transmission Handling\nSC-8(3)|Cryptographic Protection for Message Externals\nSC-8(4)|Conceal or Randomize Communications\nSC-8(5)|Protected Distribution System\nSC-10|Network Disconnect\nSC-11|Trusted Path\nSC-11(1)|Irrefutable Communications Path\nSC-12|Cryptographic Key Establishment and Management\nSC-12(1)|Availability\nSC-12(2)|Symmetric Keys\nSC-12(3)|Asymmetric Keys\nSC-12(6)|Physical Control of Keys\nSC-13|Cryptographic Protection\nSC-15|Collaborative Computing Devices and Applications\nSC-15(1)|Physical or Logical Disconnect\nSC-15(3)|Disabling and Removal in Secure Work Areas\nSC-15(4)|Explicitly Indicate Current Participants\nSC-16|Transmission of Security and Privacy Attributes\nSC-16(1)|Integrity Verification\nSC-16(2)|Anti-spoofing Mechanisms\nSC-16(3)|Cryptographic Binding\nSC-17|Public Key Infrastructure Certificates\nSC-18|Mobile Code\nSC-18(1)|Identify Unacceptable Code and Take Corrective Actions\nSC-18(2)|Acquisition, Development, and Use\nSC-18(3)|Prevent Downloading and Execution\nSC-18(4)|Prevent Automatic Execution\nSC-18(5)|Allow Execution Only in Confined Environments\nSC-20|Secure Name/Address Resolution Service (Authoritative Source)\nSC-20(2)|Data Origin and Integrity\nSC-21|Secure Name/Address Resolution Service (Recursive or Caching Resolver)\nSC-22|Architecture and Provisioning for Name/Address Resolution Service\nSC-23|Session Authenticity\nSC-23(1)|Invalidate Session Identifiers at Logout\nSC-23(3)|Unique System-generated Session Identifiers\nSC-23(5)|Allowed Certificate Authorities\nSC-24|Fail in Known State\nSC-25|Thin Nodes\nSC-26|Decoys\nSC-27|Platform-independent Applications\nSC-28|Protection of Information at Rest\nSC-28(1)|Cryptographic Protection\nSC-28(2)|Offline Storage\nSC-28(3)|Cryptographic Keys\nSC-29|Heterogeneity\nSC-29(1)|Virtualization Techniques\nSC-30|Concealment and Misdirection\nSC-30(2)|Randomness\nSC-30(3)|Change Processing and Storage Locations\nSC-30(4)|Misleading Information\nSC-30(5)|Concealment of System Components\nSC-31|Covert Channel Analysis\nSC-31(1)|Test Covert Channels for Exploitability\nSC-31(2)|Maximum Bandwidth\nSC-31(3)|Measure Bandwidth in Operational Environments\nSC-32|System Partitioning\nSC-32(1)|Separate Physical Domains for Privileged Functions\nSC-34|Non-modifiable Executable Programs\nSC-34(1)|No Writable Storage\nSC-34(2)|Integrity Protection on Read-only Media\nSC-35|External Malicious Code Identification\nSC-36|Distributed Processing and Storage\nSC-36(1)|Polling Techniques\nSC-36(2)|Synchronization\nSC-37|Out-of-band Channels\nSC-37(1)|Ensure Delivery and Transmission\nSC-38|Operations Security\nSC-39|Process Isolation\nSC-39(1)|Hardware Separation\nSC-39(2)|Separate Execution Domain Per Thread\nSC-40|Wireless Link Protection\nSC-40(1)|Electromagnetic Interference\nSC-40(2)|Reduce Detection Potential\nSC-40(3)|Imitative or Manipulative Communications Deception\nSC-40(4)|Signal Parameter Identification\nSC-41|Port and I/O Device Access\nSC-42|Sensor Capability and Data\nSC-42(1)|Reporting to Authorized Individuals or Roles\nSC-42(2)|Authorized Use\nSC-42(4)|Notice of Collection\nSC-42(5)|Collection Minimization\nSC-43|Usage Restrictions\nSC-44|Detonation Chambers\nSC-45|System Time Synchronization\nSC-45(1)|Synchronization with Authoritative Time Source\nSC-45(2)|Secondary Authoritative Time Source\nSC-46|Cross Domain Policy Enforcement\nSC-47|Alternate Communications Paths\nSC-48|Sensor Relocation\nSC-48(1)|Dynamic Relocation of Sensors or Monitoring Capabilities\nSC-49|Hardware-enforced Separation and Policy Enforcement\nSC-50|Software-enforced Separation and Policy Enforcement\nSC-51|Hardware-based Protection\nSI-1|Policy and Procedures\nSI-2|Flaw Remediation\nSI-2(2)|Automated Flaw Remediation Status\nSI-2(3)|Time to Remediate Flaws and Benchmarks for Corrective Actions\nSI-2(4)|Automated Patch Management Tools\nSI-2(5)|Automatic Software and Firmware Updates\nSI-2(6)|Removal of Previous Versions of Software and Firmware\nSI-2(7)|Root Cause Analysis\nSI-3|Malicious Code Protection\nSI-3(4)|Updates Only by Privileged Users\nSI-3(6)|Testing and Verification\nSI-3(8)|Detect Unauthorized Commands\nSI-3(10)|Malicious Code Analysis\nSI-4|System Monitoring\nSI-4(1)|System-wide Intrusion Detection System\nSI-4(2)|Automated Tools and Mechanisms for Real-time Analysis\nSI-4(3)|Automated Tool and Mechanism Integration\nSI-4(4)|Inbound and Outbound Communications Traffic\nSI-4(5)|System-generated Alerts\nSI-4(7)|Automated Response to Suspicious Events\nSI-4(9)|Testing of Monitoring Tools and Mechanisms\nSI-4(10)|Visibility of Encrypted Communications\nSI-4(11)|Analyze Communications Traffic Anomalies\nSI-4(12)|Automated Organization-generated Alerts\nSI-4(13)|Analyze Traffic and Event Patterns\nSI-4(14)|Wireless Intrusion Detection\nSI-4(15)|Wireless to Wireline Communications\nSI-4(16)|Correlate Monitoring Information\nSI-4(17)|Integrated Situational Awareness\nSI-4(18)|Analyze Traffic and Covert Exfiltration\nSI-4(19)|Risk for Individuals\nSI-4(20)|Privileged Users\nSI-4(21)|Probationary Periods\nSI-4(22)|Unauthorized Network Services\nSI-4(23)|Host-based Devices\nSI-4(24)|Indicators of Compromise\nSI-4(25)|Optimize Network Traffic Analysis\nSI-5|Security Alerts, Advisories, and Directives\nSI-5(1)|Automated Alerts and Advisories\nSI-6|Security and Privacy Function Verification\nSI-6(2)|Automation Support for Distributed Testing\nSI-6(3)|Report Verification Results\nSI-7|Software, Firmware, and Information Integrity\nSI-7(1)|Integrity Checks\nSI-7(2)|Automated Notifications of Integrity Violations\nSI-7(3)|Centrally Managed Integrity Tools\nSI-7(5)|Automated Response to Integrity Violations\nSI-7(6)|Cryptographic Protection\nSI-7(7)|Integration of Detection and Response\nSI-7(8)|Auditing Capability for Significant Events\nSI-7(9)|Verify Boot Process\nSI-7(10)|Protection of Boot Firmware\nSI-7(12)|Integrity Verification\nSI-7(15)|Code Authentication\nSI-7(16)|Time Limit on Process Execution Without Supervision\nSI-7(17)|Runtime Application Self-protection\nSI-8|Spam Protection\nSI-8(2)|Automatic Updates\nSI-8(3)|Continuous Learning Capability\nSI-10|Information Input Validation\nSI-10(1)|Manual Override Capability\nSI-10(2)|Review and Resolve Errors\nSI-10(3)|Predictable Behavior\nSI-10(4)|Timing Interactions\nSI-10(5)|Restrict Inputs to Trusted Sources and Approved Formats\nSI-10(6)|Injection Prevention\nSI-11|Error Handling\nSI-12|Information Management and Retention\nSI-12(1)|Limit Personally Identifiable Information Elements\nSI-12(2)|Minimize Personally Identifiable Information in Testing, Training, and Research\nSI-12(3)|Information Disposal\nSI-13|Predictable Failure Prevention\nSI-13(1)|Transferring Component Responsibilities\nSI-13(3)|Manual Transfer Between Components\nSI-13(4)|Standby Component Installation and Notification\nSI-13(5)|Failover Capability\nSI-14|Non-persistence\nSI-14(1)|Refresh from Trusted Sources\nSI-14(2)|Non-persistent Information\nSI-14(3)|Non-persistent Connectivity\nSI-15|Information Output Filtering\nSI-16|Memory Protection\nSI-17|Fail-safe Procedures\nSI-18|Personally Identifiable Information Quality Operations\nSI-18(1)|Automation Support\nSI-18(2)|Data Tags\nSI-18(3)|Collection\nSI-18(4)|Individual Requests\nSI-18(5)|Notice of Correction or Deletion\nSI-19|De-identification\nSI-19(1)|Collection\nSI-19(2)|Archiving\nSI-19(3)|Release\nSI-19(4)|Removal, Masking, Encryption, Hashing, or Replacement of Direct Identifiers\nSI-19(5)|Statistical Disclosure Control\nSI-19(6)|Differential Privacy\nSI-19(7)|Validated Algorithms and Software\nSI-19(8)|Motivated Intruder\nSI-20|Tainting\nSI-21|Information Refresh\nSI-22|Information Diversity\nSI-23|Information Fragmentation\nSR-1|Policy and Procedures\nSR-2|Supply Chain Risk Management Plan\nSR-2(1)|Establish SCRM Team\nSR-3|Supply Chain Controls and Processes\nSR-3(1)|Diverse Supply Base\nSR-3(2)|Limitation of Harm\nSR-3(3)|Sub-tier Flow Down\nSR-4|Provenance\nSR-4(1)|Identity\nSR-4(2)|Track and Trace\nSR-4(3)|Validate as Genuine and Not Altered\nSR-4(4)|Supply Chain Integrity — Pedigree\nSR-5|Acquisition Strategies, Tools, and Methods\nSR-5(1)|Adequate Supply\nSR-5(2)|Assessments Prior to Selection, Acceptance, Modification, or Update\nSR-6|Supplier Assessments and Reviews\nSR-6(1)|Testing and Analysis\nSR-7|Supply Chain Operations Security\nSR-8|Notification Agreements\nSR-9|Tamper Resistance and Detection\nSR-9(1)|Multiple Stages of System Development Life Cycle\nSR-10|Inspection of Systems or Components\nSR-11|Component Authenticity\nSR-11(1)|Anti-counterfeit Training\nSR-11(2)|Configuration Control for Component Service and Repair\nSR-11(3)|Anti-counterfeit Scanning\nSR-12|Component Disposal","base":{"HIGH":"AC-1 AC-2 AC-2(1) AC-2(2) AC-2(3) AC-2(4) AC-2(5) AC-2(11) AC-2(12) AC-2(13) AC-3 AC-4 AC-4(4) AC-5 AC-6 AC-6(1) AC-6(2) AC-6(3) AC-6(5) AC-6(7) AC-6(9) AC-6(10) AC-7 AC-8 AC-10 AC-11 AC-11(1) AC-12 AC-14 AC-17 AC-17(1) AC-17(2) AC-17(3) AC-17(4) AC-18 AC-18(1) AC-18(3) AC-18(4) AC-18(5) AC-19 AC-19(5) AC-20 AC-20(1) AC-20(2) AC-21 AC-22 AT-1 AT-2 AT-2(2) AT-2(3) AT-3 AT-4 AU-1 AU-2 AU-3 AU-3(1) AU-4 AU-5 AU-5(1) AU-5(2) AU-6 AU-6(1) AU-6(3) AU-6(5) AU-6(6) AU-7 AU-7(1) AU-8 AU-9 AU-9(2) AU-9(3) AU-9(4) AU-10 AU-11 AU-12 AU-12(1) AU-12(3) CA-1 CA-2 CA-2(1) CA-2(2) CA-3 CA-3(6) CA-5 CA-6 CA-7 CA-7(1) CA-7(4) CA-8 CA-8(1) CA-9 CM-1 CM-2 CM-2(2) CM-2(3) CM-2(7) CM-3 CM-3(1) CM-3(2) CM-3(4) CM-3(6) CM-4 CM-4(1) CM-4(2) CM-5 CM-5(1) CM-6 CM-6(1) CM-6(2) CM-7 CM-7(1) CM-7(2) CM-7(5) CM-8 CM-8(1) CM-8(2) CM-8(3) CM-8(4) CM-9 CM-10 CM-11 CM-12 CM-12(1) CP-1 CP-2 CP-2(1) CP-2(2) CP-2(3) CP-2(5) CP-2(8) CP-3 CP-3(1) CP-4 CP-4(1) CP-4(2) CP-6 CP-6(1) CP-6(2) CP-6(3) CP-7 CP-7(1) CP-7(2) CP-7(3) CP-7(4) CP-8 CP-8(1) CP-8(2) CP-8(3) CP-8(4) CP-9 CP-9(1) CP-9(2) CP-9(3) CP-9(5) CP-9(8) CP-10 CP-10(2) CP-10(4) IA-1 IA-2 IA-2(1) IA-2(2) IA-2(5) IA-2(8) IA-2(12) IA-3 IA-4 IA-4(4) IA-5 IA-5(1) IA-5(2) IA-5(6) IA-6 IA-7 IA-8 IA-8(1) IA-8(2) IA-8(4) IA-11 IA-12 IA-12(2) IA-12(3) IA-12(4) IA-12(5) IR-1 IR-2 IR-2(1) IR-2(2) IR-3 IR-3(2) IR-4 IR-4(1) IR-4(4) IR-4(11) IR-5 IR-5(1) IR-6 IR-6(1) IR-6(3) IR-7 IR-7(1) IR-8 MA-1 MA-2 MA-2(2) MA-3 MA-3(1) MA-3(2) MA-3(3) MA-4 MA-4(3) MA-5 MA-5(1) MA-6 MP-1 MP-2 MP-3 MP-4 MP-5 MP-6 MP-6(1) MP-6(2) MP-6(3) MP-7 PE-1 PE-2 PE-3 PE-3(1) PE-4 PE-5 PE-6 PE-6(1) PE-6(4) PE-8 PE-8(1) PE-9 PE-10 PE-11 PE-11(1) PE-12 PE-13 PE-13(1) PE-13(2) PE-14 PE-15 PE-15(1) PE-16 PE-17 PE-18 PL-1 PL-2 PL-4 PL-4(1) PL-8 PL-10 PL-11 PS-1 PS-2 PS-3 PS-4 PS-4(2) PS-5 PS-6 PS-7 PS-8 PS-9 RA-1 RA-2 RA-3 RA-3(1) RA-5 RA-5(2) RA-5(4) RA-5(5) RA-5(11) RA-7 RA-9 SA-1 SA-2 SA-3 SA-4 SA-4(1) SA-4(2) SA-4(5) SA-4(9) SA-4(10) SA-5 SA-8 SA-9 SA-9(2) SA-10 SA-11 SA-15 SA-15(3) SA-16 SA-17 SA-21 SA-22 SC-1 SC-2 SC-3 SC-4 SC-5 SC-7 SC-7(3) SC-7(4) SC-7(5) SC-7(7) SC-7(8) SC-7(18) SC-7(21) SC-8 SC-8(1) SC-10 SC-12 SC-12(1) SC-13 SC-15 SC-17 SC-18 SC-20 SC-21 SC-22 SC-23 SC-24 SC-28 SC-28(1) SC-39 SI-1 SI-2 SI-2(2) SI-3 SI-4 SI-4(2) SI-4(4) SI-4(5) SI-4(10) SI-4(12) SI-4(14) SI-4(20) SI-4(22) SI-5 SI-5(1) SI-6 SI-7 SI-7(1) SI-7(2) SI-7(5) SI-7(7) SI-7(15) SI-8 SI-8(2) SI-10 SI-11 SI-12 SI-16 SR-1 SR-2 SR-2(1) SR-3 SR-5 SR-6 SR-8 SR-9 SR-9(1) SR-10 SR-11 SR-11(1) SR-11(2) SR-12","MODERATE":"AC-1 AC-2 AC-2(1) AC-2(2) AC-2(3) AC-2(4) AC-2(5) AC-2(13) AC-3 AC-4 AC-5 AC-6 AC-6(1) AC-6(2) AC-6(5) AC-6(7) AC-6(9) AC-6(10) AC-7 AC-8 AC-11 AC-11(1) AC-12 AC-14 AC-17 AC-17(1) AC-17(2) AC-17(3) AC-17(4) AC-18 AC-18(1) AC-18(3) AC-19 AC-19(5) AC-20 AC-20(1) AC-20(2) AC-21 AC-22 AT-1 AT-2 AT-2(2) AT-2(3) AT-3 AT-4 AU-1 AU-2 AU-3 AU-3(1) AU-4 AU-5 AU-6 AU-6(1) AU-6(3) AU-7 AU-7(1) AU-8 AU-9 AU-9(4) AU-11 AU-12 CA-1 CA-2 CA-2(1) CA-3 CA-5 CA-6 CA-7 CA-7(1) CA-7(4) CA-9 CM-1 CM-2 CM-2(2) CM-2(3) CM-2(7) CM-3 CM-3(2) CM-3(4) CM-4 CM-4(2) CM-5 CM-6 CM-7 CM-7(1) CM-7(2) CM-7(5) CM-8 CM-8(1) CM-8(3) CM-9 CM-10 CM-11 CM-12 CM-12(1) CP-1 CP-2 CP-2(1) CP-2(3) CP-2(8) CP-3 CP-4 CP-4(1) CP-6 CP-6(1) CP-6(3) CP-7 CP-7(1) CP-7(2) CP-7(3) CP-8 CP-8(1) CP-8(2) CP-9 CP-9(1) CP-9(8) CP-10 CP-10(2) IA-1 IA-2 IA-2(1) IA-2(2) IA-2(8) IA-2(12) IA-3 IA-4 IA-4(4) IA-5 IA-5(1) IA-5(2) IA-5(6) IA-6 IA-7 IA-8 IA-8(1) IA-8(2) IA-8(4) IA-11 IA-12 IA-12(2) IA-12(3) IA-12(5) IR-1 IR-2 IR-3 IR-3(2) IR-4 IR-4(1) IR-5 IR-6 IR-6(1) IR-6(3) IR-7 IR-7(1) IR-8 MA-1 MA-2 MA-3 MA-3(1) MA-3(2) MA-3(3) MA-4 MA-5 MA-6 MP-1 MP-2 MP-3 MP-4 MP-5 MP-6 MP-7 PE-1 PE-2 PE-3 PE-4 PE-5 PE-6 PE-6(1) PE-8 PE-9 PE-10 PE-11 PE-12 PE-13 PE-13(1) PE-14 PE-15 PE-16 PE-17 PL-1 PL-2 PL-4 PL-4(1) PL-8 PL-10 PL-11 PS-1 PS-2 PS-3 PS-4 PS-5 PS-6 PS-7 PS-8 PS-9 RA-1 RA-2 RA-3 RA-3(1) RA-5 RA-5(2) RA-5(5) RA-5(11) RA-7 RA-9 SA-1 SA-2 SA-3 SA-4 SA-4(1) SA-4(2) SA-4(9) SA-4(10) SA-5 SA-8 SA-9 SA-9(2) SA-10 SA-11 SA-15 SA-15(3) SA-22 SC-1 SC-2 SC-4 SC-5 SC-7 SC-7(3) SC-7(4) SC-7(5) SC-7(7) SC-7(8) SC-8 SC-8(1) SC-10 SC-12 SC-13 SC-15 SC-17 SC-18 SC-20 SC-21 SC-22 SC-23 SC-28 SC-28(1) SC-39 SI-1 SI-2 SI-2(2) SI-3 SI-4 SI-4(2) SI-4(4) SI-4(5) SI-5 SI-7 SI-7(1) SI-7(7) SI-8 SI-8(2) SI-10 SI-11 SI-12 SI-16 SR-1 SR-2 SR-2(1) SR-3 SR-5 SR-6 SR-8 SR-10 SR-11 SR-11(1) SR-11(2) SR-12","LOW":"AC-1 AC-2 AC-3 AC-7 AC-8 AC-14 AC-17 AC-18 AC-19 AC-20 AC-22 AT-1 AT-2 AT-2(2) AT-3 AT-4 AU-1 AU-2 AU-3 AU-4 AU-5 AU-6 AU-8 AU-9 AU-11 AU-12 CA-1 CA-2 CA-3 CA-5 CA-6 CA-7 CA-7(4) CA-9 CM-1 CM-2 CM-4 CM-5 CM-6 CM-7 CM-8 CM-10 CM-11 CP-1 CP-2 CP-3 CP-4 CP-9 CP-10 IA-1 IA-2 IA-2(1) IA-2(2) IA-2(8) IA-2(12) IA-4 IA-5 IA-5(1) IA-6 IA-7 IA-8 IA-8(1) IA-8(2) IA-8(4) IA-11 IR-1 IR-2 IR-4 IR-5 IR-6 IR-7 IR-8 MA-1 MA-2 MA-4 MA-5 MP-1 MP-2 MP-6 MP-7 PE-1 PE-2 PE-3 PE-6 PE-8 PE-12 PE-13 PE-14 PE-15 PE-16 PL-1 PL-2 PL-4 PL-4(1) PL-10 PL-11 PS-1 PS-2 PS-3 PS-4 PS-5 PS-6 PS-7 PS-8 PS-9 RA-1 RA-2 RA-3 RA-3(1) RA-5 RA-5(2) RA-5(11) RA-7 SA-1 SA-2 SA-3 SA-4 SA-4(10) SA-5 SA-8 SA-9 SA-22 SC-1 SC-5 SC-7 SC-12 SC-13 SC-15 SC-20 SC-21 SC-22 SC-39 SI-1 SI-2 SI-3 SI-4 SI-5 SI-12 SR-1 SR-2 SR-2(1) SR-3 SR-5 SR-8 SR-10 SR-11 SR-11(1) SR-11(2) SR-12","PRIVACY":"AC-1 AC-3(14) AT-1 AT-2 AT-3 AT-3(5) AT-4 AU-1 AU-2 AU-3(3) AU-11 CA-1 CA-2 CA-5 CA-6 CA-7 CA-7(4) CM-1 CM-4 IR-1 IR-2 IR-2(3) IR-3 IR-4 IR-5 IR-6 IR-7 IR-8 IR-8(1) MP-1 MP-6 PE-8(3) PL-1 PL-2 PL-4 PL-4(1) PL-8 PL-9 PM-3 PM-4 PM-5(1) PM-6 PM-7 PM-8 PM-9 PM-10 PM-11 PM-13 PM-14 PM-17 PM-18 PM-19 PM-20 PM-20(1) PM-21 PM-22 PM-24 PM-25 PM-26 PM-27 PM-28 PM-31 PS-6 PT-1 PT-2 PT-3 PT-4 PT-5 PT-5(2) PT-6 PT-6(1) PT-6(2) PT-7 PT-7(1) PT-7(2) PT-8 RA-1 RA-3 RA-7 RA-8 SA-1 SA-2 SA-3 SA-4 SA-8(33) SA-9 SA-11 SC-7(24) SI-1 SI-12 SI-12(1) SI-12(2) SI-12(3) SI-18 SI-18(4) SI-19"},"ovl":[{"code":"OVL-CNSSI-1253-ALLOCATION","title":"CNSSI 1253 National Security System Allocation","v":1,"desc":"CNSSI 1253 (2022) allocates controls against confidentiality, integrity and availability independently. At C=high, I=high, A=moderate it selects 554 controls, adding 201 the SP 800-53B High baseline does not carry and withdrawing 17 it does.","add":"AC-2(7) AC-2(9) AC-3(4) AC-6(8) AC-12(1) AC-12(2) AC-16 AC-16(6) AC-16(7) AC-17(6) AC-17(9) AC-17(10) AC-20(3) AC-23 AT-2(4) AT-2(5) AT-2(6) AT-3(1) AT-3(2) AT-6 AU-4(1) AU-6(4) AU-9(5) AU-9(6) AU-11(1) AU-14 AU-14(1) AU-14(3) AU-16 AU-16(1) AU-16(2) CA-7(3) CA-7(5) CA-7(6) CA-8(3) CM-3(5) CM-3(7) CM-3(8) CM-5(5) CM-5(6) CM-7(3) CM-7(8) CM-7(9) CM-10(1) CM-11(2) CM-14 IA-2(6) IA-3(1) IA-4(9) IA-5(7) IA-5(8) IA-5(13) IA-5(14) IA-5(16) IA-9 IA-10 IA-12(1) IR-4(3) IR-4(6) IR-4(7) IR-4(8) IR-4(10) IR-4(12) IR-4(13) IR-4(14) IR-6(2) IR-7(2) IR-9 IR-9(2) IR-9(3) IR-9(4) MA-3(4) MA-3(5) MA-3(6) MA-4(1) MA-4(4) MA-4(6) MA-4(7) MA-6(1) PE-8(3) PE-22 PE-23 PL-7 PL-8(1) PL-8(2) PL-9 PS-3(4) PS-4(1) PS-6(3) RA-3(2) RA-3(3) RA-5(10) RA-10 SA-3(1) SA-3(2) SA-3(3) SA-4(3) SA-4(7) SA-8(1) SA-8(2) SA-8(3) SA-8(4) SA-8(5) SA-8(6) SA-8(7) SA-8(8) SA-8(9) SA-8(10) SA-8(11) SA-8(12) SA-8(13) SA-8(14) SA-8(15) SA-8(16) SA-8(17) SA-8(18) SA-8(19) SA-8(20) SA-8(21) SA-8(22) SA-8(23) SA-8(24) SA-8(25) SA-8(26) SA-8(27) SA-8(28) SA-8(29) SA-8(30) SA-8(31) SA-8(32) SA-9(1) SA-9(3) SA-9(8) SA-10(1) SA-10(3) SA-10(7) SA-11(1) SA-11(2) SA-15(7) SC-5(1) SC-5(2) SC-5(3) SC-7(9) SC-7(10) SC-7(11) SC-7(12) SC-7(13) SC-7(14) SC-7(15) SC-7(25) SC-7(28) SC-7(29) SC-8(2) SC-16 SC-16(1) SC-16(2) SC-16(3) SC-18(1) SC-18(2) SC-18(3) SC-18(4) SC-23(1) SC-23(3) SC-23(5) SC-28(3) SC-38 SC-41 SC-45 SC-45(1) SC-47 SI-2(3) SI-2(4) SI-2(6) SI-3(10) SI-4(1) SI-4(11) SI-4(15) SI-4(16) SI-4(19) SI-4(23) SI-4(24) SI-4(25) SI-6(3) SI-7(8) SI-7(9) SI-7(10) SI-7(17) SI-10(3) SI-10(5) SI-10(6) SI-12(3) SI-15 SI-21 SR-3(1) SR-3(2) SR-3(3) SR-4 SR-5(1) SR-5(2) SR-6(1) SR-7","rem":"AU-5(2) CP-2(2) CP-2(5) CP-3(1) CP-4(2) CP-6(2) CP-7(4) CP-8(3) CP-8(4) CP-9(2) CP-9(3) CP-10(4) IA-12(5) PE-11(1) PE-15(1) PE-18 SC-12(1)"},{"code":"OVL-DEPLOYED-PLATFORM","title":"Deployed Platform Overlay","v":1,"desc":"Adds protections for deployed/fielded operation and controlled maintenance.","add":"CP-10 MA-5 PE-18","rem":""},{"code":"OVL-MISSION-ASSURANCE","title":"Mission Assurance Overlay","v":1,"desc":"Demo overlay emphasizing isolation, integrity, and supply-chain assurance; removes wireless-specific requirement from this configuration.","add":"SC-39 SI-16 SR-11","rem":"AC-18 AC-18(1) AC-18(3) AC-18(4) AC-18(5)"},{"code":"OVL-CUSTOMER-A","title":"Customer A Tailoring","v":1,"desc":"Adds penetration testing and vulnerability monitoring while excluding external-system use for this isolated configuration.","add":"CA-8 RA-5","rem":"AC-20 AC-20(1) AC-20(2) AC-20(3)"},{"code":"OVL-CUSA-SSRD","title":"Customer A rail integration","v":1,"desc":"What Customer A's system security requirements document (CUSA-SSRD Rev C) asks of the X800 on its rail launcher beyond the High baseline, and two controls that do not apply to a missile on a rail launcher.","add":"AC-4(21) CM-14 SC-12(2) SC-32 SI-7(6) SR-4","rem":"PE-17 SC-15"}],"products":[{"code":"X800","name":"X800 Missile","bl":"AD","v":2,"pub":"2026-11-13","configs":[["A","Lug & Rail Launch"],["B","Eject Launch"],["C","Palletized Launch"]],"els":[["GS","Guidance Section","subsystem","","",0,"A,B,C",""],["GS-MC","Mission Computer","hardware","GS","Mission Computer",1,"A,B,C","AC-2 AC-2(1) AC-2(3) AC-2(5) AC-2(11) AC-2(12) AC-3 AC-4 AC-4(4) AC-6(5) AC-6(9) AC-6(10) AC-7 AC-10 AC-12 AC-17(1) AC-17(2) AC-17(3) AC-17(4) AC-18 AC-18(3) AC-18(5) AC-20 AU-1 AU-2 AU-4 AU-5(1) AU-6 AU-8 AU-9(2) AU-10 AU-11 AU-12 AU-12(1) IA-2 IA-2(2) IA-2(8) IA-5 IA-5(1) IA-8 IA-12 SC-1 SC-3 SC-7(3) SC-7(7) SC-7(8) SC-7(18) SC-7(21) SC-12 SC-15 SC-18 SC-22 SC-23 SC-28(1) SC-39 SI-4(2) SI-4(20) SI-4(22) SI-7 SI-7(2) SI-8"],["GS-OFP","Operational Flight Program","software","GS","Operational Flight Program",1,"A,B,C","AC-1 AC-2(5) AC-6(10) AC-11 AC-17(4) AC-18(4) AC-19(5) AC-20(2) CM-2(2) CM-3 CM-3(1) CM-3(6) CM-4(1) CM-4(2) CM-5 CM-5(1) CM-6 CM-6(2) CM-7 CM-7(2) CM-8(4) CM-9 CM-12(1) SA-3 SA-4(1) SA-4(5) SA-9(2) SA-10 SC-15 SC-17 SC-28(1) SC-39 SI-2 SI-2(2) SI-4(2) SI-4(4) SI-4(5) SI-4(10) SI-4(12) SI-4(22) SI-5 SI-5(1) SI-7 SI-7(1) SI-7(5) SI-7(15) SI-8(2) SI-10 SI-11 SI-12 SI-16"],["GS-NAV","Navigation Unit","hardware","GS","Navigation Unit",1,"A,B,C","PE-4 PE-11 SC-10 SC-15 SC-28 SI-4(4) SI-4(10) SI-5 SI-6 SI-7(5) SI-8(2) SI-11 SI-16"],["GS-SKR","Seeker Interface Unit","hardware","GS","Seeker Interface Unit",1,"A,B,C","SC-7 SC-7(5) SC-8(1) SI-4(2) SI-7(1) SI-7(15) SI-11"],["CS","Communications Section","subsystem","","",0,"A,B,C",""],["CS-DL","Datalink Radio","hardware","CS","Datalink Radio",1,"A,B,C","AC-2 AC-2(3) AC-2(4) AC-2(5) AC-4 AC-5 AC-6(1) AC-8 AC-11 AC-18 IA-2(5) IA-4 IA-7 IA-12 SC-2 SC-7 SC-7(3) SC-7(7) SC-8 SC-10 SC-12 SC-12(1) SC-15 SC-18 SC-22 SC-24"],["CS-CRY","Cryptographic Module","hardware","CS","Cryptographic Module",1,"A,B,C","IA-2(5) IA-2(12) IA-3 IA-7 IA-11 IA-12(2) IA-12(5) MP-1 MP-6 MP-6(2) SC-2 SC-3 SC-7(5) SC-7(7) SC-7(8) SC-8 SC-8(1) SC-10 SC-12 SC-13 SC-15 SC-17 SC-18 SC-21 SC-22 SC-23 SC-28"],["CS-KL","Key Load Interface","hardware","CS","Key Load Interface",1,"A,B,C","AC-2(3) AC-2(4) AC-2(12) AC-10 AC-12 AC-18(4) AC-19(5) AC-22 IA-4 IA-5 IA-8(4) IA-11 IA-12 MA-3(1) MA-3(3) MP-3 SC-12"],["PS","Platform Services","subsystem","","",0,"A,B,C",""],["PS-BOOT","Secure Boot Firmware","software","PS","Secure Boot Firmware",1,"A,B,C","CM-2(7) CM-3(1) CM-3(4) CM-4 CM-6 CM-7(1) CM-9 CM-11 SC-5 SC-7(7) SC-7(8) SC-10 SC-12 SC-13 SC-20 SI-2(2) SI-3 SI-4(2) SI-4(4) SI-4(5) SI-4(10) SI-4(22) SI-5(1) SI-7 SI-7(1) SI-7(5) SI-7(15) SI-8(2) SI-12 SI-16"],["PS-TLM","Telemetry Unit","hardware","PS","Telemetry Unit",1,"A,B,C","AU-1 AU-2 AU-3 AU-5(1) AU-6(1) AU-7 AU-8 AU-9 AU-11 SC-7(5) SC-7(21) SC-10 SC-15 SC-28"],["PS-PWR","Power Conditioning Unit","hardware","PS","",0,"A,B,C",""],["PS-MX","Maintenance Port","hardware","PS","Maintenance Port",1,"A,B,C","AC-2(4) AC-2(12) AC-3 AC-6(3) AC-6(7) AC-7 AC-12 AC-17 AC-20(2) AC-21 IA-2(1) IA-2(5) IA-4(4) IA-8 IA-12(5) MA-1 MA-2 MA-3 MA-3(3) MA-4 MA-4(3) MA-5 MA-5(1) MA-6"],["SE","Support Equipment","subsystem","","",0,"A,B,C",""],["SE-TS","Field Test Set","hardware","SE","Field Test Set",1,"A,B,C","AU-3(1) AU-5(2) AU-8 AU-9(2) AU-9(3) AU-11 AU-12 AU-12(3) CM-2(2) CM-2(3) CM-2(7) CM-4 CM-4(1) CM-6(1) CM-7(2) CM-8(2) CM-9 CM-11 CM-12 IA-4 IA-5(2) IA-8 IA-8(1) IA-12(4) MA-1 MA-2 MA-3 MA-5"],["SE-MDL","Mission Data Loader","software","SE","Mission Data Loader",1,"A,B,C","CM-2 CM-3(1) CM-4 CM-4(1) CM-4(2) CM-7 CM-8(2) CM-9 CM-11 CM-12(1) IA-2(1) IA-2(5) IA-2(8) IA-5(2) IA-5(6) IA-8(2) MP-2 MP-4 MP-6 MP-6(2) MP-6(3) SI-1 SI-2(2) SI-12"],["LA","Rail Launch Interface","subsystem","","",0,"A",""],["LA-UMB","Rail Umbilical Interface Unit","hardware","LA","Rail Umbilical Interface Unit",1,"A","AC-3 AC-4 AC-6 AC-6(9) AC-7 AC-11 AC-12 AC-17(3) AC-17(4) AC-20(1) AC-20(2) AC-22 PE-3 PE-5 PE-9 PE-11 PE-11(1) PE-12 PE-13 PE-13(1) PE-15 PE-16 SC-7(3) SC-7(4) SC-7(21) SC-8(1) SC-21 SC-22 SC-23 SC-28"],["LB","Eject Launch Interface","subsystem","","",0,"B",""],["LB-EJ","Ejector Interface Unit","hardware","LB","Ejector Interface Unit",1,"B","PE-2 PE-4 PE-8(1) PE-9 PE-10 PE-11(1) PE-13 PE-14 PE-16 PE-17 SC-3 SC-7(7) SC-8 SC-24 SI-7(1)"],["LB-SEP","Separation Sensor","hardware","LB","Separation Sensor",1,"B","PE-3(1) PE-8(1) PE-15 SI-2 SI-4 SI-4(5) SI-4(12) SI-6 SI-7(7)"],["LC","Palletized Launch Interface","subsystem","","",0,"C",""],["LC-PC","Pallet Controller","hardware","LC","Pallet Controller",1,"C","AC-2 AC-2(2) AC-2(11) AC-2(13) AC-6 AC-11 AC-17(3) AC-17(4) AC-18 AC-18(1) AC-20 CP-2 CP-3(1) CP-4(1) CP-4(2) CP-6(2) CP-7(1) CP-9(8) CP-10(2) PE-5 PE-6 PE-8 PE-9 PE-12 PE-13(1) SC-7(7) SC-8(1) SC-13 SC-18 SC-21 SC-28(1)"],["LC-PDL","Pallet Datalink Node","hardware","LC","Pallet Datalink Node",1,"C","AC-2(1) AC-2(13) AC-3 AC-4 AC-6(10) AC-11 AC-21 IA-2 IA-2(8) IA-5(1) IA-6 IA-8(4) IA-11 IA-12 IA-12(2) IA-12(3) SC-2 SC-4 SC-7 SC-7(3) SC-7(8) SC-8 SC-8(1) SC-13 SC-21 SC-28 SC-28(1)"],["LC-PFW","Pallet Controller Firmware","software","LC","Pallet Controller Firmware",1,"C","AC-2(2) AC-2(4) AC-2(5) AC-2(11) AC-4 AC-6(1) AC-6(7) AC-10 AC-12 AC-14 AC-20 CM-1 CM-2(2) CM-2(3) CM-4 CM-4(2) CM-5(1) CM-6 CM-6(2) CM-7 CM-8(2) CM-9 CM-10 CM-12 SI-2 SI-2(2) SI-4(4) SI-4(5) SI-4(10) SI-4(14) SI-4(20) SI-4(22) SI-5(1) SI-7 SI-7(1) SI-7(2) SI-11 SI-12 SI-16"],["PS-HMU","Health Monitoring Unit","hardware","PS","",0,"A,B,C",""]]},{"code":"G25","name":"G25 Launch Control Station","bl":"MS","v":1,"pub":"2026-11-13","configs":[["SHL","Shelter"],["VEH","Vehicle-Mounted"]],"els":[["OC","Operator Console","subsystem","","",0,"SHL,VEH",""],["OC-WS","Console Workstation","hardware","OC","Console Workstation",1,"SHL,VEH","AC-2 AC-2(1) AC-2(13) AC-3 AC-4 AC-5 AC-6(1) AC-6(7) AC-6(9) AC-8 AC-17(1) AC-17(3) AC-20(2) AU-4 AU-6 AU-6(3) AU-8 AU-9 AU-12 IA-1 IA-2 IA-2(1) IA-2(2) IA-2(12) IA-4 IA-5(6) IA-7 IA-8(2) MP-4 SC-1 SC-7 SC-21 SC-28(1)"],["OC-SW","Launch Control Software","software","OC","Launch Control Software",1,"SHL,VEH","AC-2 AC-2(1) AC-2(13) AC-5 AC-6(2) AC-6(9) AC-8 AC-18(1) AC-18(3) AC-20(2) AU-4 AU-5 AU-6 CM-1 CM-2(2) CM-2(3) CM-3(2) CM-3(4) CM-7 CM-7(1) CM-8 CM-9 SA-5 SA-11 SI-1 SI-2 SI-3 SI-4 SI-4(2) SI-5 SI-7 SI-10 SI-11 SI-12"],["CN","Communications","subsystem","","",0,"SHL,VEH",""],["CN-RTR","Tactical Router","hardware","CN","Tactical Router",1,"SHL,VEH","AC-4 AC-8 AC-17(4) AC-18(1) AC-19(5) AC-20(2) IA-1 IA-2(8) IA-4(4) IA-6 IA-8(1) IA-12(2) SC-2 SC-5 SC-7 SC-7(5) SC-7(7) SC-12 SC-17 SC-21 SC-23 SC-28(1) SC-39"],["CN-ENC","Link Encryptor","hardware","CN","Link Encryptor",1,"SHL,VEH","IA-2(1) IA-4 IA-4(4) IA-5 IA-11 IA-12(5) MP-2 MP-7 SC-2 SC-7 SC-7(3) SC-7(5) SC-7(8) SC-8 SC-8(1) SC-10 SC-12 SC-13 SC-17 SC-18 SC-20 SC-22 SC-28(1)"],["SV","Site Services","subsystem","","",0,"SHL,VEH",""],["SV-TS","Time Server","hardware","SV","Time Server",1,"SHL,VEH","AU-1 AU-4 AU-8 SC-1 SC-7(8) SC-15 SC-21 SC-22"],["SV-LOG","Audit Log Collector","software","SV","Audit Log Collector",1,"SHL,VEH","AU-2 AU-4 AU-5 AU-6 AU-6(1) AU-6(3) AU-7 AU-7(1) AU-8 AU-9 AU-12 SI-2 SI-2(2) SI-4(2)"],["SH","Shelter Installation","subsystem","","",0,"SHL",""],["SH-PDU","Shelter Power Distribution Unit","hardware","SH","Shelter Power Distribution Unit",1,"SHL","CP-2(1) CP-2(8) CP-8(1) CP-10(2) PE-1 PE-5 PE-8 PE-13(1) PE-14 PE-16 PE-17"],["VM","Vehicle Installation","subsystem","","",0,"VEH",""],["VM-PWR","Vehicle Power Interface","hardware","VM","Vehicle Power Interface",1,"VEH","CP-1 CP-2 CP-6 CP-7 CP-8 CP-8(1) CP-10(2) PE-2 PE-5 PE-6(1) PE-8 PE-11 PE-12 PE-13(1)"]]},{"code":"R210","name":"R210 Launcher Electronics Unit","bl":"AD","v":2,"pub":"2026-11-13","configs":[["STD","Standard"]],"els":[["PSU","Power Supply","hardware","","Launcher Power Supply",1,"STD","CP-2(2) CP-3(1) CP-6(3) CP-8 PE-1 PE-6(4) PE-8 PE-8(1) PE-9 PE-11 PE-11(1) PE-15 PE-15(1) PE-18 SI-4(14) SI-10"],["CTL","Launch Controller","hardware","","Launch Controller",1,"STD","AC-2(1) AC-2(3) AC-2(4) AC-2(5) AC-2(12) AC-3 AC-4(4) AC-5 AC-6(2) AC-6(5) AC-8 AC-11(1) AC-17 AC-17(4) AC-19(5) AC-20 AC-20(1) AU-5 AU-5(2) AU-6(1) AU-6(5) AU-11 AU-12(3) IA-1 IA-2(2) IA-3 IA-4(4) IA-6 IA-8(4) IA-12(3) SC-7 SC-7(3) SC-7(5) SC-7(7) SC-7(8) SC-7(21) SC-8(1) SC-17 SC-21 SC-22 SC-24 SC-28 SC-28(1) SI-2 SI-3 SI-4(4) SI-7(2) SI-8(2) SI-10 SI-11 SI-12"],["FW","Launch Controller Firmware","software","CTL","Launch Controller Firmware",1,"STD","AC-2(4) AC-3 AC-4(4) AC-6(5) AC-6(7) AC-6(9) AC-22 CM-1 CM-2 CM-3(1) CM-3(6) CM-5 CM-5(1) CM-6 CM-6(1) CM-7 CM-7(2) CM-7(5) CM-8 CM-10 SC-1 SC-7(7) SC-10 SC-23 SI-1 SI-3 SI-4(20) SI-4(22) SI-5(1) SI-7 SI-7(1) SI-7(2) SI-7(5) SI-7(7) SI-8 SI-8(2) SI-11"]]},{"code":"G40","name":"G40 Ground Terminal","bl":"MS","v":1,"pub":"2026-11-13","configs":[["FIX","Fixed Site"],["TRN","Transportable"]],"els":[["WS","Planning Workstation","hardware","","Planning Workstation",1,"FIX,TRN","AC-1 AC-2 AC-2(1) AC-2(2) AC-2(4) AC-4 AC-11(1) AC-17 AC-17(1) AC-17(2) AC-17(4) AC-18 AC-19(5) AC-20 AC-20(1) AC-22 AU-3 AU-3(1) AU-4 AU-5 AU-7 AU-9 IA-1 IA-2 IA-2(1) IA-2(2) IA-5(2) IA-5(6) IA-7 IA-8(1) IA-8(4) IA-12(2) MP-2 SC-7(8) SC-8 SC-20 SC-28(1)"],["RLY","Datalink Relay","hardware","","Datalink Relay",1,"FIX,TRN","AC-2(13) AC-6(5) AC-14 AC-20 IA-1 IA-5 IA-5(6) IA-8 IA-11 SC-1 SC-2 SC-5 SC-7(3) SC-7(4) SC-7(8) SC-8 SC-13 SC-22 SC-23 SC-28 SC-28(1)"],["SW","Planning Software","software","WS","Planning Software",1,"FIX,TRN","AC-2 AC-2(1) AC-2(4) AC-3 AC-4 AC-6 AC-6(1) AC-6(2) AC-17(2) AC-20(2) AC-21 AC-22 AU-2 AU-5 AU-6(1) CM-4(2) CM-6 CM-7(5) CM-8(3) CM-12(1) SI-1 SI-3 SI-4 SI-4(2) SI-4(5) SI-7(7) SI-10"],["PWR","Shelter Power Unit","hardware","","Shelter Power Unit",1,"FIX,TRN","CP-2 CP-9 PE-2 PE-15 PE-17"]]}],"basis":{"product":"CA-2 CA-2(2) CA-3 CA-5 CA-7 CA-7(1) CA-8 CA-8(1) CM-2 CM-2(3) CM-2(7) CM-3(4) CM-4(2) CM-5(1) CM-7 CM-7(2) CM-7(5) CM-8(4) CM-10 CM-11 CM-12 PL-8 PL-10 RA-1 RA-2 RA-5(2) RA-5(4) RA-5(5) RA-5(11) RA-9 SA-1 SA-2 SA-3 SA-4(10) SA-5 SA-8 SA-9 SA-11 SA-15 SA-15(3) SA-16 SA-17 SA-22 SR-2 SR-2(1) SR-5 SR-9(1) SR-11(1)","els":{"PS-TLM":"AU-1 AU-2 AU-3* AU-5(1) AU-6(1) AU-7 AU-8 AU-9 AU-11* SC-7(5)* SC-7(21)* SC-10 SC-15 SC-28","LC-PFW":"AC-2(2) AC-2(4) AC-2(5) AC-2(11)* AC-4 AC-6(1) AC-6(7) AC-10 AC-12 AC-14 AC-20 CM-1* CM-2(2) CM-2(3) CM-4 CM-4(2) CM-5(1) CM-6 CM-6(2) CM-7 CM-8(2) CM-9 CM-10 CM-12 SI-2* SI-2(2) SI-4(4) SI-4(5) SI-4(10) SI-4(14) SI-4(20) SI-4(22) SI-5(1)* SI-7* SI-7(1)* SI-7(2) SI-11 SI-12 SI-16","LB-EJ":"PE-2 PE-4* PE-8(1) PE-9 PE-10 PE-11(1) PE-13 PE-14* PE-16* PE-17* SC-3 SC-7(7) SC-8 SC-24 SI-7(1)","CS-CRY":"IA-2(5) IA-2(12) IA-3 IA-7 IA-11* IA-12(2) IA-12(5) MP-1 MP-6 MP-6(2) SC-2 SC-3 SC-7(5) SC-7(7) SC-7(8)* SC-8 SC-8(1) SC-10 SC-12 SC-13 SC-15 SC-17* SC-18 SC-21* SC-22 SC-23 SC-28","GS-OFP":"AC-1 AC-2(5)* AC-6(10)* AC-11* AC-17(4) AC-18(4) AC-19(5) AC-20(2) CM-2(2) CM-3 CM-3(1)* CM-3(6) CM-4(1) CM-4(2) CM-5 CM-5(1)* CM-6 CM-6(2) CM-7 CM-7(2) CM-8(4) CM-9 CM-12(1) SA-3* SA-4(1) SA-4(5) SA-9(2) SA-10 SC-15 SC-17 SC-28(1)* SC-39* SI-2 SI-2(2) SI-4(2) SI-4(4)* SI-4(5) SI-4(10) SI-4(12) SI-4(22) SI-5* SI-5(1)* SI-7* SI-7(1) SI-7(5) SI-7(15) SI-8(2)* SI-10 SI-11 SI-12 SI-16","LC-PDL":"AC-2(1) AC-2(13) AC-3 AC-4 AC-6(10)* AC-11 AC-21 IA-2 IA-2(8) IA-5(1)* IA-6 IA-8(4) IA-11 IA-12* IA-12(2)* IA-12(3) SC-2 SC-4 SC-7 SC-7(3)* SC-7(8) SC-8 SC-8(1) SC-13 SC-21 SC-28 SC-28(1)","PS-MX":"AC-2(4) AC-2(12) AC-3 AC-6(3) AC-6(7) AC-7 AC-12 AC-17 AC-20(2) AC-21 IA-2(1) IA-2(5) IA-4(4) IA-8 IA-12(5) MA-1 MA-2 MA-3* MA-3(3) MA-4 MA-4(3) MA-5 MA-5(1) MA-6*","GS-MC":"AC-2 AC-2(1) AC-2(3) AC-2(5) AC-2(11) AC-2(12) AC-3 AC-4* AC-4(4) AC-6(5)* AC-6(9) AC-6(10) AC-7 AC-10 AC-12 AC-17(1) AC-17(2)* AC-17(3) AC-17(4) AC-18 AC-18(3) AC-18(5) AC-20 AU-1 AU-2* AU-4 AU-5(1) AU-6 AU-8* AU-9(2) AU-10 AU-11 AU-12 AU-12(1) IA-2* IA-2(2) IA-2(8) IA-5 IA-5(1) IA-8 IA-12 SC-1* SC-3 SC-7(3)* SC-7(7)* SC-7(8) SC-7(18) SC-7(21) SC-12 SC-15 SC-18 SC-22 SC-23 SC-28(1)* SC-39* SI-4(2) SI-4(20) SI-4(22) SI-7 SI-7(2) SI-8","PS-BOOT":"CM-2(7) CM-3(1) CM-3(4) CM-4 CM-6 CM-7(1) CM-9 CM-11* SC-5 SC-7(7)* SC-7(8) SC-10 SC-12 SC-13* SC-20 SI-2(2)* SI-3 SI-4(2) SI-4(4) SI-4(5)* SI-4(10) SI-4(22) SI-5(1) SI-7 SI-7(1) SI-7(5) SI-7(15)* SI-8(2)* SI-12 SI-16","CS-DL":"AC-2 AC-2(3) AC-2(4) AC-2(5) AC-4 AC-5 AC-6(1) AC-8* AC-11 AC-18 IA-2(5) IA-4 IA-7 IA-12* SC-2 SC-7 SC-7(3) SC-7(7) SC-8 SC-10 SC-12 SC-12(1) SC-15 SC-18 SC-22* SC-24*","GS-NAV":"PE-4 PE-11 SC-10 SC-15 SC-28* SI-4(4)* SI-4(10)* SI-5 SI-6 SI-7(5)* SI-8(2) SI-11 SI-16","LC-PC":"AC-2 AC-2(2) AC-2(11) AC-2(13) AC-6 AC-11 AC-17(3) AC-17(4) AC-18 AC-18(1) AC-20 CP-2 CP-3(1) CP-4(1)* CP-4(2) CP-6(2) CP-7(1) CP-9(8) CP-10(2)* PE-5 PE-6 PE-8 PE-9 PE-12 PE-13(1) SC-7(7) SC-8(1) SC-13 SC-18 SC-21 SC-28(1)","SE-TS":"AU-3(1) AU-5(2)* AU-8 AU-9(2) AU-9(3) AU-11 AU-12 AU-12(3)* CM-2(2) CM-2(3)* CM-2(7) CM-4 CM-4(1) CM-6(1) CM-7(2) CM-8(2) CM-9 CM-11 CM-12 IA-4 IA-5(2) IA-8 IA-8(1)* IA-12(4) MA-1 MA-2 MA-3 MA-5*","CS-KL":"AC-2(3) AC-2(4) AC-2(12) AC-10* AC-12 AC-18(4) AC-19(5) AC-22 IA-4* IA-5 IA-8(4) IA-11* IA-12 MA-3(1) MA-3(3) MP-3 SC-12*","LA-UMB":"AC-3 AC-4 AC-6* AC-6(9) AC-7 AC-11 AC-12 AC-17(3)* AC-17(4) AC-20(1) AC-20(2) AC-22 PE-3 PE-5 PE-9 PE-11 PE-11(1) PE-12 PE-13* PE-13(1)* PE-15 PE-16 SC-7(3) SC-7(4) SC-7(21)* SC-8(1) SC-21 SC-22* SC-23 SC-28","GS-SKR":"SC-7 SC-7(5) SC-8(1) SI-4(2) SI-7(1) SI-7(15) SI-11","LB-SEP":"PE-3(1) PE-8(1) PE-15 SI-2 SI-4 SI-4(5) SI-4(12) SI-6 SI-7(7)*","SE-MDL":"CM-2* CM-3(1) CM-4 CM-4(1) CM-4(2) CM-7 CM-8(2) CM-9 CM-11 CM-12(1) IA-2(1) IA-2(5) IA-2(8) IA-5(2) IA-5(6) IA-8(2) MP-2 MP-4 MP-6 MP-6(2)* MP-6(3) SI-1 SI-2(2) SI-12*","PS-HMU":"AU-1 AU-2 AU-3(1) AU-6(1) AU-6(3) AU-7 AU-9(2) AU-9(3) CM-3(1) CM-4(2) CM-5 CM-6 CM-7(2) PE-6 PE-15(1) SC-7 SC-7(4) SC-7(5) SC-18 SC-28(1) SI-3 SI-4(2) SI-4(12) SI-4(14) SI-4(22) SI-7(1) SI-7(2) SI-7(7) SI-7(15) SI-12"}},"pa":{"title":"X800 Missile version 2 product assessment","on":"2026-11-10","controls":370,"cfg":{"core":{"satisfied":161,"not_covered":147,"not_assessed":4,"partially_satisfied":34,"other_than_satisfied":24},"C":{"satisfied":168,"not_covered":125,"not_assessed":2,"partially_satisfied":40,"other_than_satisfied":35},"B":{"satisfied":170,"not_covered":135,"not_assessed":5,"partially_satisfied":35,"other_than_satisfied":25},"A":{"satisfied":169,"not_covered":136,"not_assessed":5,"partially_satisfied":36,"other_than_satisfied":24}}},"lib":[["X800 Missile component set","Cryptographic Module","hardware",2,"Priya Raghavan","IA-2(5) IA-2(12) IA-3 IA-7 IA-11 IA-12(2) IA-12(5) MP-1 MP-6 MP-6(2) SC-2 SC-3 SC-7(5) SC-7(7) SC-7(8) SC-8 SC-8(1) SC-10 SC-12 SC-13 SC-15 SC-17 SC-18 SC-21 SC-22 SC-23 SC-28"],["X800 Missile component set","Datalink Radio","hardware",2,"Priya Raghavan","AC-2 AC-2(3) AC-2(4) AC-2(5) AC-4 AC-5 AC-6(1) AC-8 AC-11 AC-18 IA-2(5) IA-4 IA-7 IA-12 SC-2 SC-7 SC-7(3) SC-7(7) SC-8 SC-10 SC-12 SC-12(1) SC-15 SC-18 SC-22 SC-24"],["X800 Missile component set","Ejector Interface Unit","hardware",2,"Priya Raghavan","PE-2 PE-4 PE-8(1) PE-9 PE-10 PE-11(1) PE-13 PE-14 PE-16 PE-17 SC-3 SC-7(7) SC-8 SC-24 SI-7(1)"],["X800 Missile component set","Field Test Set","hardware",2,"Priya Raghavan","AU-3(1) AU-5(2) AU-8 AU-9(2) AU-9(3) AU-11 AU-12 AU-12(3) CM-2(2) CM-2(3) CM-2(7) CM-4 CM-4(1) CM-6(1) CM-7(2) CM-8(2) CM-9 CM-11 CM-12 IA-4 IA-5(2) IA-8 IA-8(1) IA-12(4) MA-1 MA-2 MA-3 MA-5"],["X800 Missile component set","Key Load Interface","hardware",2,"Priya Raghavan","AC-2(3) AC-2(4) AC-2(12) AC-10 AC-12 AC-18(4) AC-19(5) AC-22 IA-4 IA-5 IA-8(4) IA-11 IA-12 MA-3(1) MA-3(3) MP-3 SC-12"],["X800 Missile component set","Maintenance Port","hardware",2,"Priya Raghavan","AC-2(4) AC-2(12) AC-3 AC-6(3) AC-6(7) AC-7 AC-12 AC-17 AC-20(2) AC-21 IA-2(1) IA-2(5) IA-4(4) IA-8 IA-12(5) MA-1 MA-2 MA-3 MA-3(3) MA-4 MA-4(3) MA-5 MA-5(1) MA-6"],["X800 Missile component set","Mission Computer","hardware",2,"Priya Raghavan","AC-2 AC-2(1) AC-2(3) AC-2(5) AC-2(11) AC-2(12) AC-3 AC-4 AC-4(4) AC-6(5) AC-6(9) AC-6(10) AC-7 AC-10 AC-12 AC-17(1) AC-17(2) AC-17(3) AC-17(4) AC-18 AC-18(3) AC-18(5) AC-20 AU-1 AU-2 AU-4 AU-5(1) AU-6 AU-8 AU-9(2) AU-10 AU-11 AU-12 AU-12(1) IA-2 IA-2(2) IA-2(8) IA-5 IA-5(1) IA-8 IA-12 SC-1 SC-3 SC-7(3) SC-7(7) SC-7(8) SC-7(18) SC-7(21) SC-12 SC-15 SC-18 SC-22 SC-23 SC-28(1) SC-39 SI-4(2) SI-4(20) SI-4(22) SI-7 SI-7(2) SI-8"],["X800 Missile component set","Mission Data Loader","software",2,"Priya Raghavan","CM-2 CM-3(1) CM-4 CM-4(1) CM-4(2) CM-7 CM-8(2) CM-9 CM-11 CM-12(1) IA-2(1) IA-2(5) IA-2(8) IA-5(2) IA-5(6) IA-8(2) MP-2 MP-4 MP-6 MP-6(2) MP-6(3) SI-1 SI-2(2) SI-12"],["X800 Missile component set","Navigation Unit","hardware",2,"Priya Raghavan","PE-4 PE-11 SC-10 SC-15 SC-28 SI-4(4) SI-4(10) SI-5 SI-6 SI-7(5) SI-8(2) SI-11 SI-16"],["X800 Missile component set","Operational Flight Program","software",2,"Priya Raghavan","AC-1 AC-2(5) AC-6(10) AC-11 AC-17(4) AC-18(4) AC-19(5) AC-20(2) CM-2(2) CM-3 CM-3(1) CM-3(6) CM-4(1) CM-4(2) CM-5 CM-5(1) CM-6 CM-6(2) CM-7 CM-7(2) CM-8(4) CM-9 CM-12(1) SA-3 SA-4(1) SA-4(5) SA-9(2) SA-10 SC-15 SC-17 SC-28(1) SC-39 SI-2 SI-2(2) SI-4(2) SI-4(4) SI-4(5) SI-4(10) SI-4(12) SI-4(22) SI-5 SI-5(1) SI-7 SI-7(1) SI-7(5) SI-7(15) SI-8(2) SI-10 SI-11 SI-12 SI-16"],["X800 Missile component set","Pallet Controller","hardware",2,"Priya Raghavan","AC-2 AC-2(2) AC-2(11) AC-2(13) AC-6 AC-11 AC-17(3) AC-17(4) AC-18 AC-18(1) AC-20 CP-2 CP-3(1) CP-4(1) CP-4(2) CP-6(2) CP-7(1) CP-9(8) CP-10(2) PE-5 PE-6 PE-8 PE-9 PE-12 PE-13(1) SC-7(7) SC-8(1) SC-13 SC-18 SC-21 SC-28(1)"],["X800 Missile component set","Pallet Controller Firmware","software",2,"Priya Raghavan","AC-2(2) AC-2(4) AC-2(5) AC-2(11) AC-4 AC-6(1) AC-6(7) AC-10 AC-12 AC-14 AC-20 CM-1 CM-2(2) CM-2(3) CM-4 CM-4(2) CM-5(1) CM-6 CM-6(2) CM-7 CM-8(2) CM-9 CM-10 CM-12 SI-2 SI-2(2) SI-4(4) SI-4(5) SI-4(10) SI-4(14) SI-4(20) SI-4(22) SI-5(1) SI-7 SI-7(1) SI-7(2) SI-11 SI-12 SI-16"],["X800 Missile component set","Pallet Datalink Node","hardware",2,"Priya Raghavan","AC-2(1) AC-2(13) AC-3 AC-4 AC-6(10) AC-11 AC-21 IA-2 IA-2(8) IA-5(1) IA-6 IA-8(4) IA-11 IA-12 IA-12(2) IA-12(3) SC-2 SC-4 SC-7 SC-7(3) SC-7(8) SC-8 SC-8(1) SC-13 SC-21 SC-28 SC-28(1)"],["X800 Missile component set","Rail Umbilical Interface Unit","hardware",2,"Priya Raghavan","AC-3 AC-4 AC-6 AC-6(9) AC-7 AC-11 AC-12 AC-17(3) AC-17(4) AC-20(1) AC-20(2) AC-22 PE-3 PE-5 PE-9 PE-11 PE-11(1) PE-12 PE-13 PE-13(1) PE-15 PE-16 SC-7(3) SC-7(4) SC-7(21) SC-8(1) SC-21 SC-22 SC-23 SC-28"],["X800 Missile component set","Secure Boot Firmware","software",2,"Priya Raghavan","CM-2(7) CM-3(1) CM-3(4) CM-4 CM-6 CM-7(1) CM-9 CM-11 SC-5 SC-7(7) SC-7(8) SC-10 SC-12 SC-13 SC-20 SI-2(2) SI-3 SI-4(2) SI-4(4) SI-4(5) SI-4(10) SI-4(22) SI-5(1) SI-7 SI-7(1) SI-7(5) SI-7(15) SI-8(2) SI-12 SI-16"],["X800 Missile component set","Seeker Interface Unit","hardware",2,"Priya Raghavan","SC-7 SC-7(5) SC-8(1) SI-4(2) SI-7(1) SI-7(15) SI-11"],["X800 Missile component set","Separation Sensor","hardware",2,"Priya Raghavan","PE-3(1) PE-8(1) PE-15 SI-2 SI-4 SI-4(5) SI-4(12) SI-6 SI-7(7)"],["X800 Missile component set","Telemetry Unit","hardware",2,"Priya Raghavan","AU-1 AU-2 AU-3 AU-5(1) AU-6(1) AU-7 AU-8 AU-9 AU-11 SC-7(5) SC-7(21) SC-10 SC-15 SC-28"],["G25 launch control component set","Audit Log Collector","software",1,"Marcus Ryde","AU-2 AU-4 AU-5 AU-6 AU-6(1) AU-6(3) AU-7 AU-7(1) AU-8 AU-9 AU-12 SI-2 SI-2(2) SI-4(2)"],["G25 launch control component set","Console Workstation","hardware",1,"Marcus Ryde","AC-2 AC-2(1) AC-2(13) AC-3 AC-4 AC-5 AC-6(1) AC-6(7) AC-6(9) AC-8 AC-17(1) AC-17(3) AC-20(2) AU-4 AU-6 AU-6(3) AU-8 AU-9 AU-12 IA-1 IA-2 IA-2(1) IA-2(2) IA-2(12) IA-4 IA-5(6) IA-7 IA-8(2) MP-4 SC-1 SC-7 SC-21 SC-28(1)"],["G25 launch control component set","Launch Control Software","software",1,"Marcus Ryde","AC-2 AC-2(1) AC-2(13) AC-5 AC-6(2) AC-6(9) AC-8 AC-18(1) AC-18(3) AC-20(2) AU-4 AU-5 AU-6 CM-1 CM-2(2) CM-2(3) CM-3(2) CM-3(4) CM-7 CM-7(1) CM-8 CM-9 SA-5 SA-11 SI-1 SI-2 SI-3 SI-4 SI-4(2) SI-5 SI-7 SI-10 SI-11 SI-12"],["G25 launch control component set","Link Encryptor","hardware",1,"Marcus Ryde","IA-2(1) IA-4 IA-4(4) IA-5 IA-11 IA-12(5) MP-2 MP-7 SC-2 SC-7 SC-7(3) SC-7(5) SC-7(8) SC-8 SC-8(1) SC-10 SC-12 SC-13 SC-17 SC-18 SC-20 SC-22 SC-28(1)"],["G25 launch control component set","Shelter Power Distribution Unit","hardware",1,"Marcus Ryde","CP-2(1) CP-2(8) CP-8(1) CP-10(2) PE-1 PE-5 PE-8 PE-13(1) PE-14 PE-16 PE-17"],["G25 launch control component set","Tactical Router","hardware",1,"Marcus Ryde","AC-4 AC-8 AC-17(4) AC-18(1) AC-19(5) AC-20(2) IA-1 IA-2(8) IA-4(4) IA-6 IA-8(1) IA-12(2) SC-2 SC-5 SC-7 SC-7(5) SC-7(7) SC-12 SC-17 SC-21 SC-23 SC-28(1) SC-39"],["G25 launch control component set","Time Server","hardware",1,"Marcus Ryde","AU-1 AU-4 AU-8 SC-1 SC-7(8) SC-15 SC-21 SC-22"],["G25 launch control component set","Vehicle Power Interface","hardware",1,"Marcus Ryde","CP-1 CP-2 CP-6 CP-7 CP-8 CP-8(1) CP-10(2) PE-2 PE-5 PE-6(1) PE-8 PE-11 PE-12 PE-13(1)"],["R210 launcher electronics component set","Launch Controller","hardware",1,"","AC-2(1) AC-2(3) AC-2(4) AC-2(5) AC-2(12) AC-3 AC-4(4) AC-5 AC-6(2) AC-6(5) AC-8 AC-11(1) AC-17 AC-17(4) AC-19(5) AC-20 AC-20(1) AU-5 AU-5(2) AU-6(1) AU-6(5) AU-11 AU-12(3) IA-1 IA-2(2) IA-3 IA-4(4) IA-6 IA-8(4) IA-12(3) SC-7 SC-7(3) SC-7(5) SC-7(7) SC-7(8) SC-7(21) SC-8(1) SC-17 SC-21 SC-22 SC-24 SC-28 SC-28(1) SI-2 SI-3 SI-4(4) SI-7(2) SI-8(2) SI-10 SI-11 SI-12"],["R210 launcher electronics component set","Launch Controller Firmware","software",1,"","AC-2(4) AC-3 AC-4(4) AC-6(5) AC-6(7) AC-6(9) AC-22 CM-1 CM-2 CM-3(1) CM-3(6) CM-5 CM-5(1) CM-6 CM-6(1) CM-7 CM-7(2) CM-7(5) CM-8 CM-10 SC-1 SC-7(7) SC-10 SC-23 SI-1 SI-3 SI-4(20) SI-4(22) SI-5(1) SI-7 SI-7(1) SI-7(2) SI-7(5) SI-7(7) SI-8 SI-8(2) SI-11"],["R210 launcher electronics component set","Launcher Power Supply","hardware",1,"","CP-2(2) CP-3(1) CP-6(3) CP-8 PE-1 PE-6(4) PE-8 PE-8(1) PE-9 PE-11 PE-11(1) PE-15 PE-15(1) PE-18 SI-4(14) SI-10"],["G40 ground terminal component set","Datalink Relay","hardware",1,"","AC-2(13) AC-6(5) AC-14 AC-20 IA-1 IA-5 IA-5(6) IA-8 IA-11 SC-1 SC-2 SC-5 SC-7(3) SC-7(4) SC-7(8) SC-8 SC-13 SC-22 SC-23 SC-28 SC-28(1)"],["G40 ground terminal component set","Planning Software","software",1,"","AC-2 AC-2(1) AC-2(4) AC-3 AC-4 AC-6 AC-6(1) AC-6(2) AC-17(2) AC-20(2) AC-21 AC-22 AU-2 AU-5 AU-6(1) CM-4(2) CM-6 CM-7(5) CM-8(3) CM-12(1) SI-1 SI-3 SI-4 SI-4(2) SI-4(5) SI-7(7) SI-10"],["G40 ground terminal component set","Planning Workstation","hardware",1,"","AC-1 AC-2 AC-2(1) AC-2(2) AC-2(4) AC-4 AC-11(1) AC-17 AC-17(1) AC-17(2) AC-17(4) AC-18 AC-19(5) AC-20 AC-20(1) AC-22 AU-3 AU-3(1) AU-4 AU-5 AU-7 AU-9 IA-1 IA-2 IA-2(1) IA-2(2) IA-5(2) IA-5(6) IA-7 IA-8(1) IA-8(4) IA-12(2) MP-2 SC-7(8) SC-8 SC-20 SC-28(1)"],["G40 ground terminal component set","Shelter Power Unit","hardware",1,"","CP-2 CP-9 PE-2 PE-15 PE-17"]],"programs":[["CMB-25V0","Combined baselines check 25V0"],["OVL-CHG-BFAX","Overlay change check"],["PRG-0994","Legacy billing gateway"],["PRG-1007","Field operations mobile"],["PRG-1013","Corporate identity provider"],["PRG-1028","Northwind data warehouse"],["PRG-1041","Atlas payments platform"],["PRG-1090","WS-X90 Sentinel Mission System"],["PRG-2101","Customer A · X800 Rail Integration"],["PRG-2102","Customer B · X800 Palletized Integration"],["PRG-2201","Customer C · G25 Battery Control Fielding"],["PRG-STACK","Overlay stack walkthrough"],["TEST","TEST"]],"used":{"R210:STD":["PRG-2101","Customer A · X800 Rail Integration"],"X800:A":["PRG-2101","Customer A · X800 Rail Integration"],"X800:C":["PRG-2102","Customer B · X800 Palletized Integration"],"G25:VEH":["PRG-2201","Customer C · G25 Battery Control Fielding"],"G40:TRN":["PRG-2201","Customer C · G25 Battery Control Fielding"]},"people":[["Amara Bell","Control owner, PRG-2102"],["D. Okafor","Lead assessor, PRG-1090"],["Dan Whitfield","System owner, PRG-2101"],["Elena Vasquez","Assessor, PRG-2201"],["Hana Lindqvist","System owner, PRG-2102"],["Ingrid Solberg","Control owner, PRG-2101"],["Joel Barrantes","ISSO, PRG-2201"],["Marcus Ryde","System owner, PRG-1028"],["Nadia Fournier","ISSO, PRG-2101"],["Priya Raghavan","ISSO, PRG-1090"],["R. Calloway","Authorizing official, PRG-1090"],["Ray Colston","Assessor, PRG-2102"],["Sarah Chen","Program manager, PRG-2101"],["Tom Okafor","Program manager, PRG-2102"],["Victor Amsel","Reviewer, PRG-2101"],["Wes Duarte","Program manager, PRG-2201"]]};

  const TODAY = PA.data.TODAY;
  const YOU = "Ingrid Solberg";
  const reduced = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const toast = (text, link) => (PA.SSP && PA.SSP.ui ? PA.SSP.ui.toast(text, link) : null);
  const n = (x) => h.fmt(x);
  const plural = (k, one, many) => `${n(k)} ${k === 1 ? one : many || one + "s"}`;
  const list = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dayOf = (iso) => new Date(iso + "T12:00:00");
  const addDays = (iso, k) => { const d = dayOf(iso); d.setDate(d.getDate() + k); return isoOf(d); };
  const TODAY_ISO = isoOf(TODAY);
  const dShort = (iso) => (iso ? dayOf(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const dLong = (iso) => dayOf(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const rel = (iso) => { const k = AK.days(iso); if (k === 0) return "today"; const a = Math.abs(k); const w = a > 75 ? plural(Math.round(a / 30.4), "month") : plural(a, "day"); return k > 0 ? "in " + w : w + " ago"; };
  const ERR_I = `<svg class="ak-i" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5M8 11h.01"/></svg>`;

  // ——— The real data, indexed ———
  const TITLE = new Map(), ORDER = new Map();
  DB.ctl.split("\n").forEach((line, i) => { const k = line.indexOf("|"); const c = line.slice(0, k); TITLE.set(c, line.slice(k + 1)); ORDER.set(c, i); });
  const W = (s) => (s ? String(s).split(" ").filter(Boolean) : []);
  const byOrder = (a, b) => (ORDER.has(a) ? ORDER.get(a) : 1e6) - (ORDER.has(b) ? ORDER.get(b) : 1e6);
  const famOf = (c) => String(c).split("-")[0];
  const FAMS = DB.fam;
  const BASES = {};
  Object.keys(DB.base).forEach((k) => (BASES[k] = W(DB.base[k])));
  const BASE_NAME = { LOW: "Low", MODERATE: "Moderate", HIGH: "High", PRIVACY: "Privacy" };
  const OVL = DB.ovl.map((o) => Object.assign({}, o, { adds: W(o.add), rems: W(o.rem) }));
  const ovl = (code) => OVL.find((o) => o.code === code);
  const CNSSI = "OVL-CNSSI-1253-ALLOCATION";
  const PRODUCTS = DB.products;
  const product = (code) => PRODUCTS.find((p) => p.code === code) || PRODUCTS[0];
  const cfgOf = (p, code) => p.configs.find((c) => c[0] === code) || p.configs[0];
  const cfgEls = (p, code) => p.els.filter((e) => e[6].split(",").indexOf(code) >= 0);
  const BL = { AD: "Air Defense", MS: "Mission Systems" };
  const CLAIMS = new Map();
  PRODUCTS.forEach((p) => p.els.forEach((e) => { if (e[4]) CLAIMS.set(p.code + ":" + e[0], W(e[7])); }));
  const LIB = DB.lib.map(([set, name, type, v, owner, claims], i) => ({ id: "lib" + i, set, name, type, v, owner, claims: W(claims) }));
  LIB.forEach((l) => CLAIMS.set(l.id, l.claims));
  const BASIS = new Map(Object.entries(DB.basis.els).map(([el, s]) => [el, new Map(W(s).map((c) => [c.replace("*", ""), c.endsWith("*")]))]));
  const PROD_LEVEL = new Set(W(DB.basis.product));
  const PEOPLE = DB.people.map(([nm, r]) => [nm, nm === YOU ? "Security engineer" : r]);
  const TYPE = { subsystem: "Subsystem", hardware: "Hardware", software: "Software", firmware: "Firmware", service: "Service", other: "Other", platform: "Platform", policy: "Policy", process: "Process" };

  // SP 800-60 information types with provisional levels (0 Low, 1 Moderate, 2 High): an example list.
  const LV = ["Low", "Moderate", "High"];
  const DIM = ["Confidentiality", "Integrity", "Availability"];
  const INFO = [
    ["fire", "Fire control and targeting data", 2, 2, 1],
    ["keys", "Cryptographic key material", 2, 2, 1],
    ["guidance", "Guidance and navigation data", 1, 2, 1],
    ["commands", "Datalink and launch commands", 2, 2, 2],
    ["mission", "Mission data loads", 1, 2, 1],
    ["ops", "Operations and scheduling data", 1, 1, 1],
    ["telemetry", "Flight test telemetry", 1, 1, 0],
    ["audit", "Security audit records", 1, 2, 0],
    ["maint", "Maintenance and fault records", 0, 1, 0],
    ["supply", "Supply chain and provenance records", 0, 1, 0],
  ];
  const ROLES = [
    ["ao", "Authorizing official", "Only the AO signs authorization decisions.", true],
    ["issm", "ISSM", "Information system security manager. Submits the authorization package.", true],
    ["isso", "ISSO", "Information system security officer. Runs the system's security day to day.", true],
    ["owner", "System owner", "", true],
    ["lead", "Lead assessor (SCA)", "Only the lead assessor publishes assessment results.", true],
    ["assessors", "Assessors", "Usually named with the assessment plan.", false],
  ];
  // A completed AF ITCSC v2.0 for Customer D's variant: an example file. The sections and questions are the public form's.
  const DEPLOYED = "OVL-DEPLOYED-PLATFORM";
  const MISSION0 = "Integrate X800 Missile's Eject Launch configuration with Customer D's launcher, and field it under Customer D's authorization to operate.";
  const ITC = {
    file: "CustomerD_X800-EL_ITCSC.pdf", size: "1.2 MB", form: "AF ITCSC v2.0", read: 37, of: 41,
    name: "X800 Missile · Eject Launch · Customer D", acronym: "X800-EL-CUSD", version: "Block 1", emass: "4502",
    mission: "Field X800 Missile's Eject Launch configuration on Customer D's launcher: the missile, its launcher interface and the ground equipment that loads and tests it, under Customer D's authorization to operate.",
    boundary: "Weapons", status: "Under development", it: "PIT system", nss: ["7C", "7D"], mission6F: "Deployed platform",
    interfaces: [["Launcher umbilical", "Ethernet", "Fire control commands in, missile status out"], ["Mission data loads", "Removable media", "Mission data in"], ["Weapon datalink", "RF", "In-flight updates in, status out"], ["Depot test set", "Maintenance port", "Test commands in, fault logs out"]],
    cia: ["High", "High", "Moderate"], info: ["fire", "keys", "guidance", "mission"],
    rationale: "From the ITCSC's section 10: fire control and targeting data and cryptographic key material set confidentiality and integrity High. Availability is Moderate: the launcher holds a ready spare.",
    team: { ao: "R. Calloway", issm: "Joel Barrantes", isso: "Nadia Fournier", owner: "Sarah Chen", lead: "D. Okafor" },
    notRead: ["ITIPS number (blank)", "DITPR number (blank)", "§9G examples of harm (handwritten)", "§11 user representative (blank)"],
    signed: [["Sarah Chen", "Program manager", "2026-11-06"], ["R. Calloway", "Authorizing official", "2026-11-12"]],
  };
  PA.pnITCSC = ITC;
  const itcOn = () => D.start === "itcsc" && !!D.file;
  const itcMark = (on, where) => (on && itcOn() ? ` ${AK.chip("From the ITCSC" + (where ? " " + where : ""), { tone: "info" })}` : "");
  const sameSet = (a, b) => a.length === b.length && a.every((x) => b.indexOf(x) >= 0);
  // What each later step took from the ITCSC and still holds: [kept, of].
  function itcFields(i) {
    if (!itcOn()) return null;
    const s = D.systems[0];
    const L = i === 1 ? [D.name === ITC.name, D.mission === ITC.mission]
      : i === 2 ? [s.name === ITC.name, s.code === ITC.acronym, s.type === "Platform", s.cia[0] === ITC.cia[0], s.cia[1] === ITC.cia[1], s.cia[2] === ITC.cia[2], sameSet(s.info, ITC.info), s.rationale === ITC.rationale, s.owner === ITC.team.owner]
      : i === 3 ? [!D.base && suggest(s).key === "HIGH", D.overlays.indexOf(CNSSI) >= 0, D.overlays.indexOf(DEPLOYED) >= 0]
      : i === 4 ? ["ao", "issm", "isso", "owner", "lead"].map((k) => holderOf(D, k) === ITC.team[k]) : null;
    return L ? [L.filter(Boolean).length, L.length] : null;
  }
  const itcTotal = () => [1, 2, 3, 4].reduce((a, i) => a + (itcFields(i) || [0])[0], 0);
  function itcLine(i) {
    const f = itcFields(i); if (!f) return "";
    const [k, of] = f;
    return `<p class="pn-say ok v8b-pn-from">${AK.i("upload")}<span class="x"><b>${k} of ${plural(of, "field")}</b> on this step came from the ITCSC${k < of ? ` · ${plural(of - k, "field")} changed since` : ""} · ${esc(ITC.file)}</span></p>`;
  }
  function applyItcsc() {
    D.file = ITC.file; D.name = ITC.name; D.mission = ITC.mission;
    D.systems = [makeSystem("itcsc")];
    D.base = ""; D.combine = ""; D.overlays = [CNSSI, DEPLOYED];
    Object.assign(D.roles, { ao: ITC.team.ao, issm: ITC.team.issm, isso: ITC.team.isso, owner: "=sys", lead: ITC.team.lead });
  }
  function leaveItcsc() {
    if (D.name === ITC.name) D.name = autoName(D.product, D.config);
    if (D.mission === ITC.mission) D.mission = MISSION0;
    if (sameSet(D.overlays, [CNSSI, DEPLOYED])) D.overlays = [];
    if (D.roles.isso === ITC.team.isso) D.roles.isso = "Priya Raghavan";
  }
  const STEPS = [
    ["program-new", "Start", "How do you want to start?", "Choose where the program's systems, baseline and team come from. Every later step stays editable."],
    ["program-new-details", "Program", "Program", "Name the program and say what it is for."],
    ["program-new-systems", "Systems", "Systems and categorization", "Categorize before you select: the levels set here suggest the control baseline in the next step."],
    ["program-new-baseline", "Baseline", "Control baseline", "Start from the baseline the categorization suggests, then stack overlays and tailor it for this program."],
    ["program-new-team", "Team", "Team", "Name who holds each RMF role. The app holds the roles to their acts."],
    ["program-new-review", "Review", "Review and create", "Check each step, then create everything in one save."],
  ];

  // ——— The draft: one object, so values survive moving between steps ———
  let seq = 0;
  const el = (o) => Object.assign({ k: "e" + ++seq, parent: "", pin: "", pinV: 0, claims: "", state: "kept", why: "", kinds: [], cascade: false }, o);
  const prodEls = (pc, cc) => cfgEls(product(pc), cc).map((e) => el({ code: e[0], name: e[1], type: e[2], parent: e[3], pin: e[4], pinV: e[5], claims: e[4] ? pc + ":" + e[0] : "", from: "product" }));
  function wsEls(from) {
    const E = (PA.SSP && PA.SSP.elements) || [];
    const root = E.find((e) => !e[3]);
    return E.filter((e) => e !== root).map((e) => el({ code: e[0], name: e[1], type: e[2], parent: root && e[3] === root[0] ? "" : e[3] || "", from }));
  }
  const autoName = (pc, cc) => `Customer D · ${pc} ${cfgOf(product(pc), cc)[1]} Integration`;
  function makeSystem(start, pc, cc) {
    const s = { id: "s" + ++seq, type: "Platform", owner: "Hana Lindqvist", cia: ["High", "High", "Moderate"], info: ["fire", "keys", "guidance"], rationale: "", ai: false, open: true, prefix: "CD-", els: [] };
    if (start === "product") {
      const p = product(pc), c = cfgOf(p, cc);
      s.name = `${p.name} · ${c[1]} · Customer D`;
      s.code = `${p.code}-${c[0]}-CUSD`;
      s.rationale = "Categorized as the product is, for the customer's mission.";
      if (p.code === "G25" || p.code === "G40") { s.cia = ["Moderate", "Moderate", "Moderate"]; s.info = ["ops", "telemetry", "maint"]; }
      s.els = prodEls(pc, c[0]);
    } else if (start === "copy") {
      s.name = "Customer D mission system"; s.code = "SYS-2301"; s.owner = "Ray Colston";
      s.rationale = "Copied from WS-X90 Sentinel Mission System, categorized High, High, Moderate for the same kind of mission.";
      s.els = wsEls("copy");
    } else if (start === "import") {
      s.name = "Customer D mission system"; s.code = "SYS-2301";
      s.rationale = "Read from the imported SSP's categorization section.";
      s.els = wsEls("import");
    } else if (start === "itcsc") {
      s.name = ITC.name; s.code = ITC.acronym; s.owner = ITC.team.owner; s.cia = ITC.cia.slice(); s.info = ITC.info.slice(); s.rationale = ITC.rationale;
    } else {
      s.name = "Customer D mission system"; s.code = "SYS-2301"; s.owner = ""; s.info = [];
    }
    return s;
  }
  let MADE = []; // programs created in this session, newest first
  const PROGRAMS = DB.programs;
  function nextCode() {
    const taken = new Set(PROGRAMS.map((p) => p[0]).concat(MADE.map((m) => m.code)));
    for (let b = 3; b < 10; b++) for (let k = 1; k < 100; k++) { const c = `PRG-2${b}${String(k).padStart(2, "0")}`; if (!taken.has(c)) return c; }
    return "PRG-2999";
  }
  function freshDraft() {
    return {
      start: "product", product: "X800", config: "B", file: "", copyFrom: "PRG-1090",
      name: autoName("X800", "B"), code: nextCode(),
      mission: MISSION0,
      bl: "AD", sponsor: "Tom Okafor", startOn: "2026-12-01", targetOn: "2027-09-30",
      systems: [makeSystem("product", "X800", "B")],
      base: "", combine: "", choose: false, overlays: [], view: "grid",
      tailoring: [
        { code: "PE-17", act: "remove", why: "No alternate work site: the variant is integrated and maintained only at Customer D's depot." },
        { code: "SR-4", act: "add", why: "Customer D asks for provenance records for the ejector's components." },
      ],
      roles: { ao: "R. Calloway", issm: "Joel Barrantes", isso: "Priya Raghavan", owner: "=sys", lead: "D. Okafor", assessors: [] },
      invited: [], reached: 0, tried: {}, saved: null,
    };
  }
  let D = freshDraft();
  let cur = 0, pop = null, pendingFocus = null, creating = null, typing = null, quiet = false, fresh = false, arrived = false, reviewErr = [];
  let GUIDE = new Set(["baseline", "roles"]);
  let IW = null, RW = null, MW = null, AW = null, LW = null, TW = null, VW = null, UW = null;

  // ——— Derived: the baseline stack, counts, the product delta ———
  function suggest(s) {
    const top = Math.max(...s.cia.map((l) => LV.indexOf(l)));
    const dims = DIM.filter((_, k) => LV.indexOf(s.cia[k]) === top);
    return { key: ["LOW", "MODERATE", "HIGH"][top], why: `${list(dims)} ${dims.length > 1 ? "are" : "is"} ${LV[top]}` };
  }
  const baseKey = (d) => d.base || suggest(d.systems[0]).key;
  function resolveStack(d, o = {}) {
    const key = baseKey(d), ref = new Set(BASES[key]);
    let set = new Set(ref);
    const removed = new Set();
    const layers = [{ kind: "base", name: `NIST SP 800-53 Rev 5 ${BASE_NAME[key]} baseline`, tag: "Reference", add: set.size, rem: 0, total: set.size }];
    if (d.combine && BASES[d.combine]) {
      const a = BASES[d.combine].filter((c) => !set.has(c));
      a.forEach((c) => { set.add(c); ref.add(c); });
      layers.push({ kind: "combine", name: `${BASE_NAME[d.combine]} baseline`, tag: "Combined", add: a.length, rem: 0, total: set.size });
    }
    const apply = (adds, rems) => {
      const a = adds.filter((c) => !set.has(c)), r = rems.filter((c) => set.has(c));
      a.forEach((c) => { set.add(c); removed.delete(c); });
      r.forEach((c) => { set.delete(c); removed.add(c); });
      return [a, r];
    };
    d.overlays.forEach((code) => { const ov = ovl(code); const [a, r] = apply(ov.adds, ov.rems); layers.push({ kind: "overlay", code, name: ov.title, tag: `Overlay v${ov.v}`, add: a.length, rem: r.length, total: set.size }); });
    const before = new Set(set);
    if (!o.noTailoring && d.tailoring.length) {
      const [a, r] = apply(d.tailoring.filter((t) => t.act === "add").map((t) => t.code), d.tailoring.filter((t) => t.act === "remove").map((t) => t.code));
      const idle = d.tailoring.filter((t) => (t.act === "add" ? a.indexOf(t.code) < 0 : r.indexOf(t.code) < 0)).map((t) => t.code);
      layers.push({ kind: "tailoring", name: "Program tailoring", tag: "Tailoring", add: a.length, rem: r.length, total: set.size, idle });
    }
    return { key, ref, set, removed, layers, before, total: set.size };
  }
  const live = (s) => s.els.filter((e) => e.state !== "removed");
  const elCount = (d) => d.systems.reduce((k, s) => k + live(s).length, 0);
  const pinCount = (d) => d.systems.reduce((k, s) => k + live(s).filter((e) => e.pin).length, 0);
  function holderOf(d, k) { const v = d.roles[k]; if (k === "owner" && v === "=sys") return d.systems[0].owner || null; return v || null; }
  const holders = (d, k) => (k === "assessors" ? d.roles.assessors.slice() : holderOf(d, k) ? [holderOf(d, k)] : []);
  const rolesFilled = (d) => ROLES.filter(([k]) => holders(d, k).length).length;
  function seeds(e, set) { const cl = CLAIMS.get(e.claims) || []; let w = 0; cl.forEach((c) => { if (set.has(c)) w++; }); return [w, cl.length - w, cl.length]; }
  function seeded(d, set) { let w = 0, out = 0; d.systems.forEach((s) => live(s).forEach((e) => { if (e.pin) { const [a, b] = seeds(e, set); w += a; out += b; } })); return { w, out }; }
  function infoSuggest(s) { const t = INFO.filter((x) => s.info.indexOf(x[0]) >= 0); return t.length ? [0, 1, 2].map((i) => Math.max(...t.map((x) => x[2 + i]))) : null; }
  // The Product delta's rule (variant_control_delta), run on the draft: a control the variant's kept elements and the product give
  // nothing for is Program only; one behind a removed or modified element is Changed here; one an inherited element claims in part is Shared.
  function delta(d, set) {
    if (d.start !== "product" || d.product !== "X800") return null;
    const els = d.systems[0].els.filter((e) => e.from === "product");
    const t = { inherited: 0, shared: 0, changed: 0, only: 0 };
    set.forEach((c) => {
      let kept = PROD_LEVEL.has(c) ? 1 : 0, mod = 0, rem = 0, sh = false;
      els.forEach((e) => { const m = BASIS.get(e.code); if (!m || !m.has(c)) return; if (e.state === "removed") rem++; else { kept++; if (e.state === "modified") mod++; else if (m.get(c)) sh = true; } });
      t[kept === 0 ? "only" : mod || rem ? "changed" : sh ? "shared" : "inherited"]++;
    });
    return t;
  }
  function codeCheck(code) {
    const c = String(code || "").trim().toUpperCase();
    if (!c) return { err: "Enter a program code." };
    if (!/^[A-Z][A-Z0-9]*(-[A-Z0-9]+)+$/.test(c)) return { err: "Use capital letters, digits and hyphens, as in PRG-2301." };
    const taken = PROGRAMS.find((p) => p[0] === c) || MADE.filter((m) => m.code === c).map((m) => [m.code, m.name])[0];
    if (taken) return { err: `${c} is taken by ${taken[1]}. ${nextCode()} is free.` };
    return { ok: `${c} is free` };
  }

  // ——— Validation ———
  function problems(i, d = D) {
    const out = [];
    const need = (id, ok, msg) => { if (!ok) out.push([id, msg]); };
    if (i === 0 && d.start === "import") need("pn-drop", d.file, "Choose a file to import, or start another way.");
    if (i === 0 && d.start === "itcsc") need("pn-drop", d.file, "Choose a completed ITCSC to read, or start another way.");
    if (i === 1) {
      need("pn-name", d.name.trim(), "Enter the program's name.");
      const c = codeCheck(d.code);
      if (c.err) out.push(["pn-code", c.err]);
      need("pn-mission", d.mission.trim(), "Enter the program's mission.");
      need("pn-target", !d.startOn || !d.targetOn || d.targetOn > d.startOn, "Choose a target authorization date after the start date.");
    }
    if (i === 2) d.systems.forEach((s, k) => {
      const who = k ? `system ${k + 1}` : "the authorization boundary system";
      need(`pn-s${k}-name`, s.name.trim(), `Enter the name of ${who}.`);
      need(`pn-s${k}-code`, s.code.trim(), `Enter the code of ${who}.`);
      need(`pn-s${k}-why`, s.rationale.trim(), `Enter the categorization rationale of ${who}. eMASS asks for it.`);
    });
    if (i === 4) ROLES.filter((r) => r[3]).forEach(([k, label]) => need(`pn-role-${k}`, holders(d, k).length, `Choose the ${/^IS/.test(label) ? label : label.replace(/\s\(.*\)$/, "").toLowerCase()}.`));
    return out;
  }
  const allProblems = () => [0, 1, 2, 3, 4].map((i) => [i, problems(i)]).filter(([, p]) => p.length);

  // ——— Small renderers ———
  const iconBtn = (icon, label, act, v, o = {}) => `<button type="button" class="pn-ib${o.cls ? " " + o.cls : ""}" data-pn="${act}" data-v="${esc(v)}" data-k="${esc(o.k || act + "-" + v)}" aria-label="${esc(label)}"${o.menu !== undefined ? ` aria-haspopup="menu" aria-expanded="${o.menu}"` : ""}${o.dis ? ' aria-disabled="true"' : ""}>${AK.i(icon, o.icls || "")}</button>`;
  function field(id, label, control, o = {}) {
    const lab = o.group ? `<span class="pn-label" id="${id}-l">` : `<label class="pn-label" for="${id}">`;
    return `<div class="pn-field${o.cls ? " " + o.cls : ""}">${lab}${esc(label)}${o.req ? ' <span class="req">Required</span>' : ""}${o.opt ? ' <span class="opt">Optional</span>' : ""}${o.ex ? ' <span class="ex">Example</span>' : ""}${o.mark || ""}${o.group ? "</span>" : "</label>"}
      ${o.hint ? `<span class="pn-hint" id="${id}-hint">${o.hint}</span>` : ""}${control}
      <span class="pn-err" id="${id}-err" data-err-for="${id}"${o.err ? "" : " hidden"}>${o.err ? ERR_I + esc(o.err) : ""}</span>${o.after || ""}</div>`;
  }
  const input = (id, path, value, E, o = {}) => `<input class="pn-input${o.cls ? " " + o.cls : ""}" id="${id}" data-pf="${path}" data-k="${id}" value="${esc(value)}"${o.type ? ` type="${o.type}"` : ""}${o.ph ? ` placeholder="${esc(o.ph)}"` : ""} aria-describedby="${id}-hint ${id}-err"${E && E[id] ? ' aria-invalid="true"' : ""} autocomplete="off" spellcheck="false">`;
  const select = (id, path, opts, value) => `<select class="pn-input" id="${id}" data-pf="${path}" data-k="${id}">${opts.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${v === value ? " selected" : ""}>${esc(t)}</option>`; }).join("")}</select>`;
  function seg(path, options, value, o = {}) {
    return `<div class="pn-seg${o.cls ? " " + o.cls : ""}" role="radiogroup" ${o.labelledby ? `aria-labelledby="${o.labelledby}"` : `aria-label="${esc(o.label || "")}"`}>${options.map(([v, t]) => `<button type="button" role="radio" aria-checked="${v === value}" tabindex="${v === value ? 0 : -1}" data-pn="set" data-f="${path}" data-v="${esc(v)}" data-k="${esc(path + "=" + v)}">${esc(t)}</button>`).join("")}</div>`;
  }
  const radio = (group, value, checked, inner, cls) => `<button type="button" role="radio" aria-checked="${checked}" tabindex="${checked ? 0 : -1}" class="${cls}" data-pn="${group}" data-v="${esc(value)}" data-k="${esc(group + "-" + value)}">${inner}</button>`;
  const chk = (on) => AK.check(on);
  const ownerName = (nm) => (nm && D.invited.indexOf(nm) >= 0 ? `${AK.owner(nm)}${AK.chip("Invited", { tone: "warn" })}` : AK.owner(nm));

  // People picker: the kit's owner picker look (ak-pop), with a working search and real buttons.
  function personPicker(id, value, path, o = {}) {
    const open = pop && pop.id === id;
    const face = o.add ? `<span class="pn-addp">${AK.i("plus")}${esc(o.add)}</span>` : `<span id="${id}-val">${ownerName(value)}</span>`;
    return `<div class="pn-pick"><button type="button" class="pn-trig${o.add ? " add" : ""}" id="${o.domId || "pn-pick-" + id}" data-pn="pop" data-v="${id}" data-k="pop-${id}" aria-haspopup="dialog" aria-expanded="${open}"${o.labelledby && !o.add ? ` aria-labelledby="${o.labelledby} ${id}-val"` : ""}${o.invalid ? ' aria-invalid="true"' : ""}>${face}${o.add ? "" : AK.i("down")}</button>${open ? peoplePop(id, path, value, o) : ""}</div>`;
  }
  function peoplePop(id, path, value, o) {
    pop.path = path; pop.value = value; pop.exclude = o.exclude || []; pop.title = o.title || "Choose a person";
    return `<div class="ak-pop pn-pop" role="dialog" aria-label="${esc(pop.title)}"><div class="ak-pop-s">${AK.i("user")}<input class="pn-pq" data-pq="1" data-k="pq" value="${esc(pop.q || "")}" placeholder="Search people" aria-label="Search people"></div>
      <div class="pn-plist" data-slot="pop-list" role="listbox" aria-label="People">${peopleList()}</div>
      ${o.add ? "" : `<button type="button" class="ak-pop-f" data-pn="pick" data-f="${path}" data-v="">${AK.i("x")}Unassign</button>`}</div>`;
  }
  function peopleList() {
    const q = (pop.q || "").toLowerCase();
    const rows = [[YOU, "Security engineer"]].concat(PEOPLE.filter((p) => p[0] !== YOU)).filter(([nm, r]) => !q || (nm + " " + r).toLowerCase().indexOf(q) >= 0).filter(([nm]) => pop.exclude.indexOf(nm) < 0);
    if (!rows.length) return `<p class="pn-none">No one matches “${esc(pop.q)}”. Invite them by email instead.</p>`;
    return rows.map(([nm, r]) => `<button type="button" class="ak-pop-r" role="option" aria-selected="${nm === pop.value}" data-pn="pick" data-f="${pop.path}" data-v="${esc(nm)}">${AK.avatar(nm, 22)}<span>${esc(nm === YOU ? nm + " (You)" : nm)}</span><span class="r">${esc(r)}</span></button>`).join("");
  }
  function menu(label, items, cls = "") {
    return `<div class="ak-pop pn-pop pn-menu${cls ? " " + cls : ""}" role="menu" aria-label="${esc(label)}">${items.map(([attrs, t, s]) => `<button type="button" role="menuitem" class="pn-mi" ${attrs}><span class="t">${esc(t)}</span>${s ? `<span class="s">${s}</span>` : ""}</button>`).join("")}</div>`;
  }

  // ——— The wizard frame ———
  function rail(i) {
    let html = AK.steps(STEPS.map((s) => s[1]), i);
    STEPS.forEach(([route, label], k) => {
      if (k < i) html = html.replace(`<li class="done"><span class="ak-step-n"></span><span>${esc(label)}</span></li>`, `<li class="done"><span class="ak-step-n"></span><button type="button" class="pn-steplink" data-go="${route}">${esc(label)}</button></li>`);
    });
    return html.replace('<li class="now">', '<li class="now" aria-current="step">');
  }
  function cardInner() {
    const r = resolveStack(D), s0 = D.systems[0], p = product(D.product), c = cfgOf(p, D.config);
    const seen = D.reached >= 3 || cur >= 3;
    const sys = D.systems.length;
    const startLine = D.start === "product" ? `Variant of ${p.name} v${p.v} · ${c[0]} ${c[1]}` : D.start === "copy" ? "Copy of WS-X90's setup" : D.start === "import" ? (D.file ? `Read from ${D.file}` : "Import an SSP") : D.start === "itcsc" ? (D.file ? `Read from ${D.file}` : "Start from an ITCSC") : "Blank program";
    const line = (done, title, sub, id) => `<li class="pn-li"><span class="ak-ring sm${done ? " done" : ""}" aria-hidden="true"></span><span><b${id ? ` id="${id}"` : ""}>${title}</b>${sub ? `<span class="s">${sub}</span>` : ""}</span></li>`;
    const filled = rolesFilled(D);
    return `<h2 class="pn-card-t">What you're creating</h2><ul class="pn-lis">
      ${line(cur > 1, esc(D.name.trim() || "Untitled program"), `${esc(D.code || "No code")} · ${BL[D.bl]}`)}
      ${line(cur > 0, esc(startLine), D.start === "product" ? `${p.name} is published, ${dShort(p.pub)}` : "")}
      ${line(cur > 2, `${plural(sys, "system")} · ${plural(elCount(D), "element")}`, `${plural(pinCount(D), "library pin")} · ${s0.cia.map((l) => l[0]).join(" / ")}`)}
      ${seen ? line(cur > 3, `${n(r.total)} controls`, `${BASE_NAME[r.key]} baseline${D.combine ? " + Privacy" : ""}${D.overlays.length ? ` · ${plural(D.overlays.length, "overlay")}` : ""}${D.tailoring.length ? " · tailored" : ""}`) : line(false, "Control baseline", `Chosen in step 3 · ${BASE_NAME[suggest(s0).key]} suggested`)}
      ${line(cur > 4, `${filled} of 6 roles filled`, holderOf(D, "ao") ? `AO ${esc(holderOf(D, "ao"))}` : "No AO yet")}
      ${line(false, seen ? `${sys === 1 ? "1 draft SSP" : sys + " draft SSPs"} with ${n(r.total * sys)} planned implementations` : `${sys === 1 ? "1 draft SSP" : sys + " draft SSPs"}`, "Written at creation, one a system")}
    </ul>`;
  }
  const msum = () => `${plural(elCount(D), "element")}${D.reached >= 3 || cur >= 3 ? ` · ${n(resolveStack(D).total)} controls` : ""}`;
  function summary(errs) {
    return `<div class="pn-sum" role="alert" tabindex="-1" id="pn-sum"><b>${errs.length === 1 ? "Fix 1 problem to continue" : `Fix ${errs.length} problems to continue`}</b><ul>${errs.map(([id, msg]) => `<li><button type="button" class="pn-sum-a" data-pn="focus" data-v="${id}">${esc(msg)}</button></li>`).join("")}</ul></div>`;
  }
  function foot(i) {
    const busy = !!(creating && !creating.failed);
    const dis = busy ? ' aria-disabled="true"' : "";
    const back = i ? `<button type="button" class="btn" data-pn="back" data-k="back"${dis}>Back</button>` : `<button type="button" class="btn" data-modal="pn-leave" data-k="cancel">Cancel</button>`;
    const toReview = i > 0 && i < 5 && D.reached >= 5 ? `<button type="button" class="btn" data-pn="to-review" data-k="to-review">Back to review</button>` : "";
    const primary = i === 5 ? `<button type="button" class="btn ink" data-pn="create" data-k="create"${dis}>${busy ? "Creating…" : "Create program"}</button>` : `<button type="button" class="btn ink" data-pn="next" data-k="next">Continue</button>`;
    return `<footer class="pn-foot">${back}<span class="sp"></span>${i < 5 ? `<span class="pn-foot-n">Next: ${STEPS[i + 1][1]}</span>` : ""}${toReview}${primary}</footer>`;
  }
  const BODIES = [];
  function wizard(i) {
    const errs = D.tried[i] ? problems(i) : [];
    const E = Object.fromEntries(errs);
    const [, label, title, lead] = STEPS[i];
    const body = BODIES[i](E);
    return `<div class="pn-wiz">
      <header class="pn-head"><button type="button" class="pn-x" data-modal="pn-leave" data-k="leave" aria-label="Close: save the draft or leave">${AK.i("x")}</button><h1 class="pn-ht">Create program</h1><span class="pn-count">Step ${i + 1} of 6</span></header>
      <div class="pn-scroll" id="pn-scroll">
        <div class="pn-mbar"><span class="t"><b>Step ${i + 1} of 6</b> · ${esc(label)}</span><span class="pn-line" aria-hidden="true"><i style="width:${((i + 1) / 6) * 100}%"></i></span></div>
        <div class="pn-grid">
          <nav class="pn-rail" aria-label="Steps">${rail(i)}</nav>
          <div class="pn-form">
            ${errs.length ? summary(errs) : ""}
            <div class="pn-titles"><h2 class="pn-h" id="pn-h" tabindex="-1">${esc(title)}</h2><p class="pn-lead">${lead}</p></div>
            ${itcLine(i)}${body}
          </div>
          <aside class="pn-side" aria-label="What you're creating"><div class="pn-card" data-slot="card">${cardInner()}</div></aside>
          <details class="pn-mcard"><summary><span>What you're creating</span><span class="s" data-slot="msum">${msum()}</span></summary><div class="pn-card" data-slot="card">${cardInner()}</div></details>
        </div>
      </div>
      ${foot(i)}
    </div>`;
  }

  // ——— Step 0: how do you want to start? ———
  BODIES[0] = (E) => {
    const opts = [
      ["product", "From a product", "Its configuration's elements arrive with their library pins and claimed controls.", "products", "Recommended"],
      ["itcsc", "From an ITCSC", "Read a completed AF ITCSC: its categorization, overlays, boundary and team fill the steps.", "itcsc"],
      ["blank", "Blank program", "Name the program, then add its systems and elements yourself.", "my-work"],
      ["import", "Import an SSP", "Read an OSCAL SSP JSON or an eMASS export into the steps.", "ssps"],
      ["copy", "Copy a program's setup", "Copy another program's categorization, baseline, roles and tree.", "composition"],
    ];
    const cards = `<div class="pn-choices" role="radiogroup" aria-label="How to start">${opts.map(([v, t, s, ic, badge]) => radio("start", v, D.start === v, `<span class="ic" aria-hidden="true">${h.icon(ic)}</span><span class="tt"><b>${t}</b>${badge ? AK.chip(badge, { tone: "info" }) : ""}</span><span class="pn-radio" aria-hidden="true"></span><span class="s">${s}</span>`, "pn-choice")).join("")}</div>`;
    let more = "";
    if (D.start === "product") {
      const p = product(D.product);
      more = `<div class="pn-sub"><h3 class="pn-h3" id="pn-prod-l">Product</h3><div class="pn-prods" role="radiogroup" aria-labelledby="pn-prod-l">${PRODUCTS.map((x) => radio("product", x.code, D.product === x.code, `<span class="pn-radio" aria-hidden="true"></span><span class="tt"><b>${esc(x.name)}</b><span class="s">Version ${x.v} · published ${dShort(x.pub)}</span></span><span class="pn-meta">${AK.chip(BL[x.bl] || x.bl)}<span class="s">${plural(x.configs.length, "configuration")}</span></span>`, "pn-prod")).join("")}</div></div>
        <div class="pn-sub"><h3 class="pn-h3" id="pn-cfg-l">Configuration</h3><div class="pn-cfgs" role="radiogroup" aria-labelledby="pn-cfg-l">${p.configs.map(([code, name]) => { const u = DB.used[p.code + ":" + code]; return radio("config", code, D.config === code, `<span class="pn-radio" aria-hidden="true"></span><span class="pn-cfg-c">${esc(code)}</span><span class="tt"><b>${esc(name)}</b><span class="s">${plural(cfgEls(p, code).length, "element")}</span></span><span class="pn-meta">${u ? `<span class="s">Used by ${esc(u[0])} · ${esc(u[1].split(" · ")[0])}</span>` : AK.chip("No program uses it yet", { tone: "ok" })}</span>`, "pn-cfg"); }).join("")}</div></div>`;
    } else if (D.start === "itcsc") {
      const [pm, ao] = ITC.signed;
      more = `<div class="pn-sub">${field("pn-drop", "Completed ITCSC", D.file ? `<div class="pn-file" id="pn-drop" tabindex="-1">${AK.i("upload")}<span class="t"><b>${esc(D.file)}</b><span class="s">${ITC.size} · ${ITC.form} · read by the ITCSC reader just now</span></span><button type="button" class="btn sm" data-pn="itcsc-clear" data-k="itcsc-clear">Remove</button></div>
          <div class="v8b-pn-read"><p class="pn-say ok">${h.gl("check")}<span class="x"><b>${ITC.read} of ${ITC.of} fields read</b> · signed by ${esc(pm[0])} (PM) on ${dShort(pm[2])} and ${esc(ao[0])} (AO) on ${dShort(ao[2])}</span></p>
          <ul class="pn-reads"><li>§1 ${esc(ITC.name)} · ${esc(ITC.acronym)}</li><li>§5 ${esc(ITC.it)} · ${plural(ITC.interfaces.length, "external interface")}, each a draft interconnection</li><li>§6 and §7: an NSS (${ITC.nss.join(", ")}) with the ${esc(ITC.mission6F.toLowerCase())} overlay</li><li>§10 ${ITC.cia.join(" / ")} from ${plural(ITC.info.length, "information type")}</li><li>§11 ${plural(Object.keys(ITC.team).length, "RMF role")}, each held by someone in the workspace</li></ul>
          <p class="pn-hint">Not read: ${esc(list(ITC.notRead))}. The program's ITCSC record keeps them to fill.</p></div>` : `<button type="button" class="pn-dropzone" id="pn-drop" data-pn="itcsc-pick" data-k="itcsc-pick"${E["pn-drop"] ? ' aria-invalid="true"' : ""} aria-describedby="pn-drop-err">${AK.i("upload")}<b>Drop a completed AF ITCSC here</b><span class="s">PDF or Word · the ITCSC reader reads its 11 sections and the summary</span></button>`, { ex: true, err: E["pn-drop"], group: true })}</div>`;
    } else if (D.start === "blank") {
      more = `<p class="pn-say">${h.gl("info")}<span class="x">You will name the system, categorize it and add its elements in step 2, by hand or from the library.</span></p>`;
    } else if (D.start === "import") {
      more = `<div class="pn-sub">${field("pn-drop", "File", D.file ? `<div class="pn-file" id="pn-drop" tabindex="-1">${AK.i("upload")}<span class="t"><b>${esc(D.file)}</b><span class="s">412 KB · OSCAL SSP 1.1.2 · read just now</span></span><button type="button" class="btn sm" data-pn="file-clear" data-k="file-clear">Remove</button></div>
          <ul class="pn-reads"><li>1 system, ${plural(wsEls("x").length, "element")}</li><li>Categorization High / High / Moderate</li><li>370 control implementations, matched to the catalog</li><li>6 roles, as people to invite</li></ul>` : `<button type="button" class="pn-dropzone" id="pn-drop" data-pn="file-pick" data-k="file-pick"${E["pn-drop"] ? ' aria-invalid="true"' : ""} aria-describedby="pn-drop-err">${AK.i("upload")}<b>Drop an OSCAL SSP JSON or an eMASS export here</b><span class="s">or choose a file · up to 50 MB</span></button>`, { ex: true, err: E["pn-drop"], group: true })}</div>`;
    } else {
      more = `<div class="pn-sub">${field("pn-copy", "Copy from", select("pn-copy", "copyFrom", PROGRAMS.filter((x) => /^PRG-(1090|21|22)/.test(x[0])).map((x) => [x[0], `${x[1]} · ${x[0]}`]), D.copyFrom))}
        <ul class="pn-reads"><li>Categorization High / High / Moderate</li><li>The system tree: ${plural(wsEls("x").length, "element")}</li><li>The six RMF roles and their holders</li></ul>${D.copyFrom !== "PRG-1090" ? `<p class="pn-hint"><span class="ex">Example</span> The walkthrough copies WS-X90's tree whichever program you choose.</p>` : ""}</div>`;
    }
    const resume = D.saved ? `<div class="pn-say ok">${AK.i("history")}<span class="x">You saved this draft at ${STEPS[D.saved][1]}.</span><button type="button" class="btn sm" data-go="${STEPS[D.saved][0]}">Continue where you left off</button></div>` : "";
    return resume + cards + more + AK.note("The order (systems and categorization before the baseline) and the Team step differ from today's app, which asks for the catalog and profiles second and records roles after creation. The import files and what they read, the ITCSC among them, are examples.");
  };

  // ——— Step 1: program ———
  const codeStatus = () => { const c = codeCheck(D.code); return c.ok ? `<span class="pn-ok">${h.gl("check")}${esc(c.ok)}${D.code === nextCode() ? " · the next free code" : ""}</span>` : ""; };
  const dateRead = (iso, target) => (iso ? `${dLong(iso)} · ${rel(iso)}${target && D.startOn && iso > D.startOn ? ` · ${Math.round(AK.days(iso) - AK.days(D.startOn))} days after the start` : ""}` : "No date");
  BODIES[1] = (E) => {
    const p = product(D.product);
    return `<div class="pn-fields">
      ${field("pn-name", "Name", input("pn-name", "name", D.name, E), { req: true, ex: true, err: E["pn-name"], mark: itcMark(D.name === ITC.name, "§1") })}
      ${field("pn-code", "Code", input("pn-code", "code", D.code, E, { cls: "upper" }), { req: true, err: E["pn-code"], hint: "Stable, unique in the workspace. Checked against every program's code.", after: `<span class="pn-status" data-slot="code-status" aria-live="polite">${codeStatus()}</span>` })}
      ${field("pn-mission", "Mission", `<textarea class="pn-input" id="pn-mission" data-pf="mission" data-k="pn-mission" rows="3" aria-describedby="pn-mission-hint pn-mission-err"${E["pn-mission"] ? ' aria-invalid="true"' : ""}>${esc(D.mission)}</textarea>`, { req: true, ex: true, err: E["pn-mission"], hint: "What the program delivers, and for whom. The SSP's Mission and purpose section starts from it.", mark: itcMark(D.mission === ITC.mission, "§2") })}
      ${field("pn-bl", "Business line", seg("bl", [["AD", "Air Defense"], ["MS", "Mission Systems"]], D.bl, { labelledby: "pn-bl-l" }), { group: true, hint: D.start === "product" ? `${esc(p.name)} belongs to ${BL[p.bl]}.` : "" })}
      ${field("pn-sponsor", "Sponsor", personPicker("sponsor", D.sponsor, "sponsor", { domId: "pn-sponsor", labelledby: "pn-sponsor-l" }), { group: true, opt: true, ex: true, hint: "The person who answers for the program to the customer." })}
      <div class="pn-two">
        ${field("pn-start", "Start date", input("pn-start", "startOn", D.startOn, E, { type: "date" }), { opt: true, after: `<span class="pn-hint" data-slot="date-startOn">${dateRead(D.startOn)}</span>` })}
        ${field("pn-target", "Target authorization date", input("pn-target", "targetOn", D.targetOn, E, { type: "date" }), { opt: true, err: E["pn-target"], after: `<span class="pn-hint" data-slot="date-targetOn">${dateRead(D.targetOn, true)}</span>` })}
      </div></div>` + AK.note("Customer D, its mission, sponsor and dates are examples; the code is checked against the workspace's real program codes, and the business lines are the workspace's.");
  };

  // ——— Step 2: systems and categorization ———
  const disp = (s, e) => (e.from === "product" ? s.prefix + e.code : e.code);
  function ordered(s) {
    const codes = new Set(s.els.map((e) => e.code)), kids = new Map();
    s.els.forEach((e) => { const p = e.parent && codes.has(e.parent) ? e.parent : ""; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(e); });
    const out = [], walk = (p, lvl) => (kids.get(p) || []).forEach((e) => { out.push([e, lvl]); walk(e.code, lvl + 1); });
    walk("", 0);
    return out;
  }
  const desc = (s, code) => { const out = []; const walk = (c) => s.els.filter((e) => e.parent === c).forEach((e) => { out.push(e); walk(e.code); }); walk(code); return out; };
  function findEl(ref) { const [k, ek] = String(ref).split("|"); const s = D.systems[+k]; return [s, s ? s.els.find((e) => e.k === ek) : null, +k]; }
  function elMenu(s, k, e) {
    const ref = `${k}|${e.k}`, items = [];
    if (e.from === "product") {
      if (e.type !== "subsystem") items.push(e.state === "modified" ? [`data-pn="el-inherit" data-v="${ref}"`, "Mark as inherited", "Withdraw the change"] : [`data-pn="menu-dlg" data-modal="pn-modify" data-id="${ref}" data-v="pop-el-${e.k}"`, "Mark as modified", "Software, firmware, hardware or data"]);
      items.push([`data-pn="menu-dlg" data-modal="pn-remove" data-id="${ref}" data-v="pop-el-${e.k}"`, "Remove from this variant", "With a reason; the product keeps it"]);
    } else items.push([`data-pn="el-delete" data-v="${ref}"`, "Remove element", e.from === "library" ? "Unpins the library component" : ""]);
    return menu(`Actions for ${disp(s, e)}`, items, "end");
  }
  function row(s, k, e, lvl, set) {
    const off = e.state === "removed", code = disp(s, e);
    const tags = [`<span class="tag">${esc(TYPE[e.type] || e.type)}</span>`];
    if (e.from === "product") tags.push(AK.chip("Product"));
    if (e.from === "added" || e.from === "library") tags.push(AK.chip("Program's own", { tone: "ok" }));
    if (e.from === "copy") tags.push(AK.chip("Copied"));
    if (e.from === "import") tags.push(AK.chip("From the file"));
    if (e.pin) tags.push(AK.chip(`Library · v${e.pinV}`, { tone: "info" }));
    let fact = "";
    if (off) fact = `Removed · ${esc(e.why)}`;
    else if (e.state === "modified") fact = AK.chip("Modified · " + e.kinds.join(", "), { tone: "warn" });
    else if (e.pin) { const [w, out, all] = seeds(e, set); fact = `<span title="${w} of ${all} claimed controls are in the baseline${out ? `; ${out} are not` : ""}">will seed ${plural(w, "control")}</span>`; }
    const open = pop && pop.id === "el-" + e.k;
    const act = off ? (e.cascade ? "" : `<button type="button" class="btn sm" data-pn="el-restore" data-v="${k}|${e.k}" data-k="el-${e.k}">Restore</button>`) : `<div class="pn-pick">${iconBtn("dots", `More actions for ${code} ${e.name}`, "pop", "el-" + e.k, { k: "pop-el-" + e.k, menu: open })}${open ? elMenu(s, k, e) : ""}</div>`;
    return `<div class="pn-row${off ? " off" : ""}${e.state === "modified" ? " mod" : ""}" role="listitem" style="--lvl:${lvl}"><span class="nm"><code>${esc(code)}</code><span class="t">${esc(e.name)}</span></span><span class="pn-tags">${tags.join("")}</span><span class="pn-fact${off ? " bad" : ""}">${fact}</span><span class="pn-act">${act}</span></div>`;
  }
  function sysCard(s, k, E, set) {
    const id = (f) => `pn-s${k}-${f}`;
    const ctl = k ? `<div class="btns"><button type="button" class="btn sm" data-pn="sys-toggle" data-v="${k}" data-k="sys-toggle-${k}" aria-expanded="${s.open}">${s.open ? "Collapse" : "Expand"}</button><button type="button" class="btn sm" data-pn="sys-remove" data-v="${k}" data-k="sys-remove-${k}">Remove system</button></div>` : "";
    const head = `<div class="pn-sys-h"><div class="pn-sys-t"><span class="pn-kick">${k ? `System ${k + 1} <span class="ex">Example</span>` : "Authorization boundary"}</span><h3 class="pn-h3" id="${id("t")}">${esc(s.name || "Untitled system")}</h3></div>${ctl}</div>`;
    if (!s.open) return `<section class="pn-sys" aria-labelledby="${id("t")}">${head}<p class="pn-hint">${esc(s.code)} · ${s.cia.join(" / ")} · ${plural(live(s).length, "element")}</p></section>`;
    const ident = `<div class="pn-two">
      ${field(id("name"), "Name", input(id("name"), `systems.${k}.name`, s.name, E), { req: true, err: E[id("name")], mark: itcMark(k === 0 && s.name === ITC.name, "§1") })}
      ${field(id("code"), "Code", input(id("code"), `systems.${k}.code`, s.code, E, { cls: "upper" }), { req: true, err: E[id("code")], mark: itcMark(k === 0 && s.code === ITC.acronym, "§1") })}
      ${field(id("type"), "Type", select(id("type"), `systems.${k}.type`, ["Platform", "Enclave", "Major application", "Subsystem"], s.type), { mark: itcMark(k === 0 && s.type === "Platform", "§5") })}
      ${field(id("owner"), "Owner", personPicker(`sys${k}owner`, s.owner, `systems.${k}.owner`, { domId: id("owner"), labelledby: id("owner") + "-l", title: "Choose the system's owner" }), { group: true, mark: itcMark(k === 0 && s.owner === ITC.team.owner, "§11") })}
    </div>`;
    const itcIf = k === 0 && itcOn() ? `<div class="pn-sub"><h4 class="pn-h4">External interfaces <span class="ct num">${ITC.interfaces.length}</span>${itcMark(true, "§5")}</h4><ul class="pn-decs">${ITC.interfaces.map(([nm, ty, fl]) => `<li>${AK.chip(ty)}<span class="t"><b>${esc(nm)}</b></span><span class="s">${esc(fl)} · becomes a draft interconnection</span></li>`).join("")}</ul></div>` : "";
    const sug = infoSuggest(s), types = INFO.filter((t) => s.info.indexOf(t[0]) >= 0);
    const same = sug && sug.every((l, i) => l === LV.indexOf(s.cia[i]));
    const sugLine = sug ? `<div class="pn-sugline${same ? " ok" : ""}">${same ? h.gl("check") : AK.i("sparkle")}<span class="x">Suggested from ${plural(types.length, "information type")}: <b>${sug.map((l) => LV[l]).join(" / ")}</b>${same ? " · matches the levels below" : ""}</span>${same ? "" : `<button type="button" class="btn sm" data-pn="cia-use" data-v="${k}" data-k="cia-use-${k}">Use suggestion</button>`}</div>` : "";
    const aiMark = s.ai ? AK.chip(typing === k ? "Assist is drafting…" : "AI draft · review before you continue", { tone: "info", icon: "sparkle" }) : "";
    const cat = `<div class="pn-sub"><h4 class="pn-h4">Categorization${itcMark(k === 0 && s.cia.every((l, i) => l === ITC.cia[i]), "§10")}</h4>
      <div class="pn-field"><span class="pn-label" id="${id("info")}-l">Information types <span class="opt">Optional</span> <span class="ex">Example</span>${itcMark(k === 0 && sameSet(s.info, ITC.info), "§10")}</span>
        <div class="pn-chips">${types.map((t) => AK.chip(t[1])).join("")}<button type="button" class="pn-link" data-modal="pn-info" data-id="${k}" data-k="info-${k}">${AK.i(types.length ? "pen" : "plus")}${types.length ? "Change information types" : "Choose information types"}</button></div></div>
      ${sugLine}
      <div class="pn-cia">${DIM.map((dname, i) => `<div class="pn-field"><span class="pn-label" id="${id("c" + i)}">${dname}</span>${seg(`systems.${k}.cia.${i}`, LV.map((l) => [l, l]), s.cia[i], { labelledby: id("c" + i) })}</div>`).join("")}</div>
      ${field(id("why"), "Rationale", `<textarea class="pn-input${s.ai ? " ai" : ""}" id="${id("why")}" data-pf="systems.${k}.rationale" data-k="why-${k}" rows="4" aria-describedby="${id("why")}-hint ${id("why")}-err"${E[id("why")] ? ' aria-invalid="true"' : ""}${typing === k ? " readonly" : ""}>${esc(s.rationale)}</textarea>`, { req: true, err: E[id("why")], hint: "eMASS asks for it beside the levels. The categorization suggests a baseline; it never chooses one.", mark: `${itcMark(k === 0 && s.rationale === ITC.rationale, "§10")}<span class="pn-mark" data-slot="ai-${k}">${aiMark}</span>`, after: `<div class="pn-assist"><button type="button" class="btn sm" data-pn="assist" data-v="${k}" data-k="assist-${k}"${typing === k ? ' aria-disabled="true"' : ""}>${AK.i("sparkle")}${typing === k ? "Drafting…" : "Draft with Assist"}</button></div>` })}
    </div>`;
    const p = product(D.product), c = cfgOf(p, D.config), lv = live(s);
    const lineage = D.start === "product" && k === 0 ? `<p class="pn-hint">From ${esc(p.name)} version ${p.v}, configuration ${esc(c[0])} ${esc(c[1])}: ${plural(cfgEls(p, c[0]).length, "element")}, ${plural(cfgEls(p, c[0]).filter((e) => e[4]).length, "library pin")}. Remove what this variant leaves out; mark what it changes.</p>` : D.start === "copy" && k === 0 ? `<p class="pn-hint">Copied from WS-X90 Sentinel Mission System's tree.</p>` : D.start === "import" && k === 0 ? `<p class="pn-hint"><span class="ex">Example</span> Read from ${esc(D.file || "the file")}.</p>` : D.start === "itcsc" && k === 0 ? `<p class="pn-hint">The ITCSC describes the boundary, not the elements inside it: add them by hand or from the library.</p>` : "";
    const rowsHtml = ordered(s);
    const els = `<div class="pn-sub"><div class="pn-elh"><h4 class="pn-h4">Elements <span class="ct num">${lv.length}</span></h4><div class="btns"><button type="button" class="btn sm" data-modal="pn-add-el" data-id="${k}" data-k="add-el-${k}">${AK.i("plus")}Add element</button><button type="button" class="btn sm" data-modal="pn-library" data-id="${k}" data-k="lib-${k}">${AK.i("plus")}Add from library</button></div></div>${lineage}
      ${rowsHtml.length ? `<div class="pn-tree" role="list" aria-label="Elements of ${esc(s.name || "the system")}">${rowsHtml.map(([e, l]) => row(s, k, e, l, set)).join("")}</div>` : AK.empty({ title: "No elements yet", line: "Add the system's elements, or pull published components in from the library." })}</div>`;
    return `<section class="pn-sys" aria-labelledby="${id("t")}">${head}${ident}${cat}${itcIf}${els}</section>`;
  }
  BODIES[2] = (E) => {
    const set = resolveStack(D).set;
    return D.systems.map((s, k) => sysCard(s, k, E, set)).join("") + `<button type="button" class="pn-addsys" data-pn="sys-add" data-k="sys-add">${AK.i("plus")}Add another system <span class="opt">Optional</span></button>`
      + AK.note("The information types, their levels and the Assist draft are examples; the elements, library pins and claimed controls are the product's, and \"will seed\" counts claims in the baseline the categorization suggests.");
  };

  // ——— Step 3: control baseline ———
  function stackTable(r) {
    return `<div class="pn-tbl"><table class="pn-stack"><thead><tr><th scope="col">Layer</th><th scope="col" class="n">Added</th><th scope="col" class="n">Removed</th><th scope="col" class="n">Controls</th></tr></thead><tbody>
      ${r.layers.map((l) => `<tr><td><span class="pn-ly"><span class="t">${esc(l.name)}</span><span class="tag">${esc(l.tag)}</span>${l.kind === "overlay" && !l.add && !l.rem ? AK.chip("Changes nothing here", { tone: "warn" }) : ""}</span></td><td class="n">${l.add ? "+" + n(l.add) : "—"}</td><td class="n">${l.rem ? "−" + n(l.rem) : "—"}</td><td class="n">${n(l.total)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Resulting baseline</td><td class="n"></td><td class="n"></td><td class="n">${n(r.total)}</td></tr></tfoot></table></div>`;
  }
  function familyRows(r) {
    const by = new Map(FAMS.map(([f]) => [f, []]));
    r.set.forEach((c) => { const b = by.get(famOf(c)); if (b) b.push([c, r.ref.has(c) ? "base" : "add"]); });
    r.removed.forEach((c) => { const b = by.get(famOf(c)); if (b) b.push([c, "rem"]); });
    return FAMS.map(([f, t]) => [f, t, (by.get(f) || []).sort((a, b) => byOrder(a[0], b[0]))]).filter((x) => x[2].length);
  }
  function mapKey(r) {
    const add = [...r.set].filter((c) => !r.ref.has(c)).length;
    return `<div class="pn-key"><span><i class="base"></i>From the baseline <b class="num">${n(r.total - add)}</b></span><span><i class="add"></i>Added <b class="num">${n(add)}</b></span><span><i class="rem"></i>Removed <b class="num">${n(r.removed.size)}</b></span></div>`;
  }
  function mapGrid(r) {
    const W2 = { base: "from the baseline", add: "added", rem: "removed" };
    return `<div class="pn-map">${familyRows(r).map(([f, t, cs]) => { const a = cs.filter((x) => x[1] === "add").length, rm = cs.filter((x) => x[1] === "rem").length, inB = cs.length - rm; return `<div class="pn-fam" role="img" aria-label="${esc(t)}: ${inB} controls${a ? `, ${a} added` : ""}${rm ? `, ${rm} removed` : ""}"><span class="pn-fam-h"><b>${f}</b><span class="num">${inB}</span></span><span class="pn-sq">${cs.map(([c, k]) => `<i class="${k}" title="${esc(c)} ${esc(TITLE.get(c) || "")} · ${W2[k]}"></i>`).join("")}</span></div>`; }).join("")}</div>`;
  }
  function mapList(r) {
    return `<div class="pn-tbl"><table class="pn-stack pn-fams"><thead><tr><th scope="col">Family</th><th scope="col" class="n">Controls</th><th scope="col" class="n">Added</th><th scope="col" class="n">Removed</th></tr></thead><tbody>${familyRows(r).map(([f, t, cs]) => { const a = cs.filter((x) => x[1] === "add").length, rm = cs.filter((x) => x[1] === "rem").length; return `<tr><td><span class="pn-ly"><b class="pn-code">${f}</b><span class="t">${esc(t)}</span></span></td><td class="n">${n(cs.length - rm)}</td><td class="n">${a ? "+" + a : "—"}</td><td class="n">${rm ? "−" + rm : "—"}</td></tr>`; }).join("")}</tbody></table></div>`;
  }
  BODIES[3] = () => {
    const s0 = D.systems[0], sug = suggest(s0), key = baseKey(D), r = resolveStack(D);
    const using = key === sug.key;
    const chooser = D.choose ? `<div class="pn-chooser"><div class="pn-bases" role="radiogroup" aria-label="Reference baseline">${["LOW", "MODERATE", "HIGH"].map((b) => radio("base-set", b, key === b, `<span class="pn-radio" aria-hidden="true"></span><span class="tt"><b>${BASE_NAME[b]}</b><span class="s">${n(BASES[b].length)} controls${b === sug.key ? " · suggested" : ""}</span></span>`, "pn-base")).join("")}</div>
      ${field("pn-combine", "Combine with", select("pn-combine", "combine", [["", "No second baseline"], ["PRIVACY", `Privacy baseline · ${n(BASES.PRIVACY.length)} controls`]], D.combine), { opt: true, hint: "The program starts from the union of the two." })}</div>` : "";
    const sugCard = `<div class="pn-sug"><div class="pn-sug-t">${AK.i("sparkle")}<span><b>Suggested: ${BASE_NAME[sug.key]} baseline · ${n(BASES[sug.key].length)} controls</b><span class="s">Because ${sug.why} in step 2.${itcMark(!D.base && sug.key === "HIGH", "§10")}</span></span></div>
      <div class="btns">${using ? `<span class="pn-ok">${h.gl("check")}Using the suggestion</span>` : `<span class="pn-hint">Using ${BASE_NAME[key]} · ${n(BASES[key].length)} controls</span><button type="button" class="btn sm" data-pn="base-use" data-k="base-use">Use suggestion</button>`}<button type="button" class="btn sm" data-pn="base-choose" data-k="base-choose" aria-expanded="${D.choose}">${D.choose ? "Done choosing" : "Choose another"}</button></div>${chooser}</div>`;
    const full = D.overlays.length >= 6, left = OVL.filter((o) => D.overlays.indexOf(o.code) < 0);
    const ovRows = D.overlays.map((code, i) => { const o = ovl(code), L = r.layers.find((l) => l.code === code); return `<li class="pn-ovl"><span class="pn-ovl-n num">${i + 1}</span><span class="nm"><b>${esc(o.title)}</b>${itcMark(code === CNSSI || code === DEPLOYED, code === CNSSI ? "§7" : "§6F")}<span class="s">Version ${o.v} · ${L.add || L.rem ? `+${n(L.add)} −${n(L.rem)} here` : "changes nothing here"}</span></span><span class="btns">${iconBtn("down", `Move ${o.title} up`, "ovl-up", code, { icls: "pn-up", dis: i === 0 })}${iconBtn("down", `Move ${o.title} down`, "ovl-down", code, { dis: i === D.overlays.length - 1 })}${iconBtn("x", `Remove ${o.title}`, "ovl-remove", code)}</span></li>`; }).join("");
    const openOv = pop && pop.id === "ovl";
    const addOv = `<div class="pn-pick"><button type="button" class="btn sm" data-pn="${full || !left.length ? "say" : "pop"}" data-v="${full ? "A program profile takes at most six overlays." : !left.length ? "Every published overlay is in the stack." : "ovl"}" data-k="pop-ovl" aria-haspopup="menu" aria-expanded="${openOv}"${full || !left.length ? ' aria-disabled="true"' : ""}>${AK.i("plus")}Add overlay</button>${openOv ? menu("Published overlays", left.map((o) => [`data-pn="ovl-add" data-v="${o.code}"`, o.title, `Version ${o.v} · +${n(o.adds.length)} −${n(o.rems.length)} · ${esc(o.desc.split(/[.;:]/)[0])}`])) : ""}</div>`;
    let hint = "";
    if (D.overlays.indexOf(CNSSI) < 0) { const t = resolveStack(Object.assign({}, D, { overlays: D.overlays.concat([CNSSI]) })).layers.find((l) => l.code === CNSSI); hint = `<p class="pn-say">${h.gl("info")}<span class="x">A national security system usually adds CNSSI 1253 National Security System Allocation: <b>+${n(t.add)} −${n(t.rem)}</b> on this stack.</span><button type="button" class="pn-link" data-pn="ovl-add" data-v="${CNSSI}">Add it</button></p>`; }
    const tl = r.layers.find((l) => l.kind === "tailoring");
    const idle = tl && tl.idle.length ? `<p class="pn-say warn">${h.gl("clock")}<span class="x">${list(tl.idle)} no longer change${tl.idle.length === 1 ? "s" : ""} anything: the stack under the tailoring already ${tl.idle.length === 1 ? "decides it" : "decides them"}.</span></p>` : "";
    const tail = `<div class="pn-sub"><div class="pn-subh"><h3 class="pn-h3">Program tailoring <span class="ex">Example</span></h3><button type="button" class="btn sm" data-modal="pn-tailor" data-k="tailor">${AK.i("pen")}Tailor for this program</button></div>
      ${D.tailoring.length ? `<ul class="pn-decs">${D.tailoring.map((t) => `<li>${AK.chip(t.act === "add" ? "Adds" : "Removes", { tone: t.act === "add" ? "info" : "warn" })}<span class="t"><b class="pn-code">${esc(t.code)}</b> ${esc(TITLE.get(t.code) || "")}</span><span class="s">${esc(t.why)}</span></li>`).join("")}</ul>` : `<p class="pn-hint">No program decisions: the baseline stands as the stack forms it.</p>`}${idle}</div>`;
    return `<div class="pn-sub"><h3 class="pn-h3">Catalog edition</h3><div class="pn-fixed"><b>${esc(DB.cat.title)} · ${esc(DB.cat.v)}</b><span class="pn-hint">${n(DB.cat.active)} active controls · the workspace's only published edition</span></div></div>
      ${sugCard}
      <div class="pn-sub"><div class="pn-subh"><h3 class="pn-h3">Overlays <span class="ct num">${D.overlays.length}</span></h3>${addOv}</div><p class="pn-hint">Published overlays stack on the baseline in order, up to six. Each row says what it changes where it sits.</p>
        ${D.overlays.length ? `<ol class="pn-ovls">${ovRows}</ol>` : ""}${hint}</div>
      ${tail}
      <div class="pn-sub"><h3 class="pn-h3">Stack</h3>${stackTable(r)}</div>
      <div class="pn-sub"><div class="pn-subh"><h3 class="pn-h3" id="pn-res-l">Resulting baseline · ${n(r.total)} controls</h3>${seg("view", [["grid", "Grid"], ["list", "List"]], D.view, { label: "Show as" })}</div>${mapKey(r)}${D.view === "grid" ? mapGrid(r) : mapList(r)}</div>`
      + AK.note("The program tailoring is an example; the catalog, the reference baselines, the overlays and their decisions are the workspace's, and every count is computed from them.");
  };

  // ——— Step 4: team ———
  BODIES[4] = (E) => {
    const s0 = D.systems[0];
    const rows = ROLES.map(([k, label, line, req]) => {
      const id = `pn-role-${k}`;
      const sub = k === "owner" ? (D.roles.owner === "=sys" ? `Owner of ${s0.code}, carried from step 2.` : `Answers for ${s0.code}.`) : line;
      const ctl = k === "assessors"
        ? `<div class="pn-multi">${D.roles.assessors.map((nm) => `<span class="pn-pchip">${ownerName(nm)}${iconBtn("x", `Remove ${nm}`, "assessor-del", nm, { cls: "sm" })}</span>`).join("")}${D.roles.assessors.length ? "" : AK.owner(null)}${personPicker("assessors", null, "roles.assessors", { domId: id, add: "Add assessor", exclude: D.roles.assessors, title: "Add an assessor" })}</div>`
        : personPicker("role-" + k, holderOf(D, k), "roles." + k, { domId: id, labelledby: id + "-l", invalid: !!E[id], title: `Choose the ${label}` });
      return `<div class="pn-role"><div class="pn-role-t"><span class="pn-label" id="${id}-l">${esc(label)}${req ? "" : ' <span class="opt">Optional</span>'}${itcMark(!!ITC.team[k] && holderOf(D, k) === ITC.team[k], "§11")}</span><span class="pn-hint">${esc(sub)}</span></div><div class="pn-role-v">${ctl}<span class="pn-err" id="${id}-err" data-err-for="${id}"${E[id] ? "" : " hidden"}>${E[id] ? ERR_I + esc(E[id]) : ""}</span></div></div>`;
    }).join("");
    return `<div class="pn-roles">${rows}</div><div class="pn-invite"><button type="button" class="btn sm" data-modal="pn-invite" data-id="wizard" data-k="invite">${AK.i("mail")}Invite by email</button><span class="pn-hint">For someone not yet in the workspace <span class="ex">Example</span></span></div>`
      + AK.note("The invitation is an example; the people and the roles they hold elsewhere are the workspace's.");
  };

  // ——— Step 5: review and create ———
  function createLines(r) {
    const sys = D.systems.length, sd = seeded(D, r.set);
    return [
      `Writing the program ${D.code} and its ${rolesFilled(D)} roles`,
      `Writing the program profile: ${BASE_NAME[r.key]} baseline${D.overlays.length ? `, ${plural(D.overlays.length, "overlay")}` : ""}${D.tailoring.length ? ", tailoring" : ""}`,
      `Writing ${sys === 1 ? "the system" : sys + " systems"} and ${plural(elCount(D), "element")}`,
      `Writing ${sys === 1 ? "the draft SSP" : sys + " draft SSPs"} with ${n(r.total * sys)} planned implementations`,
    ].concat(sd.w ? [`Seeding ${n(sd.w)} library claims where the control is in the baseline`] : []).concat(itcOn() ? [`Writing the ITCSC record and ${plural(ITC.interfaces.length, "draft interconnection")}`] : []);
  }
  function progressHtml() {
    if (!creating) return "";
    if (creating.failed) return `<div class="pn-alert" role="alert" tabindex="-1" id="pn-fail"><b>${h.gl("diamond")}Nothing was created</b><p>The save is all or nothing: no program, profile, system or SSP was written. Your draft is kept, and retrying will not create anything twice.</p><div class="btns"><button type="button" class="btn sm" data-pn="create" data-k="retry">Retry</button></div></div>`;
    return `<div class="pn-progress" role="status" aria-live="polite" tabindex="-1" id="pn-progress"><b>Creating ${esc(D.name)}</b><ol>${creating.lines.map((t, i) => `<li data-i="${i}" class="${i < creating.at ? "done" : i === creating.at ? "now" : ""}">${i < creating.at ? '<span class="ak-ring sm done"></span>' : i === creating.at ? '<span class="pn-spin" aria-hidden="true"></span>' : '<span class="ak-ring sm"></span>'}<span>${esc(t)}</span></li>`).join("")}</ol></div>`;
  }
  BODIES[5] = () => {
    const r = resolveStack(D), s0 = D.systems[0], p = product(D.product), c = cfgOf(p, D.config), sd = seeded(D, r.set);
    const rm = D.systems.reduce((k, s) => k + s.els.filter((e) => e.state === "removed").length, 0), md = D.systems.reduce((k, s) => k + s.els.filter((e) => e.state === "modified").length, 0), own = D.systems.reduce((k, s) => k + s.els.filter((e) => e.from === "added" || e.from === "library").length, 0);
    const tl = r.layers.find((l) => l.kind === "tailoring");
    const cards = [
      [0, "Start", [D.start === "product" ? `From a product: ${p.name} version ${p.v}` : D.start === "copy" ? "Copy of WS-X90 Sentinel Mission System's setup" : D.start === "import" ? `Import of ${D.file}` : D.start === "itcsc" ? `From an ITCSC: ${D.file}` : "Blank program", D.start === "product" ? `Configuration ${c[0]} ${c[1]} · ${plural(cfgEls(p, c[0]).length, "element")}` : itcOn() ? `${ITC.read} of ${ITC.of} fields read · ${plural(itcTotal(), "field")} in these steps came from it · signed by the PM and the AO` : ""]],
      [1, "Program", [`${D.name} · ${D.code}`, `${BL[D.bl]}${D.sponsor ? ` · sponsor ${D.sponsor}` : ""}`, D.startOn && D.targetOn ? `${dShort(D.startOn)} start · authorization by ${dShort(D.targetOn)}` : ""]],
      [2, "Systems", D.systems.map((s) => `${s.code} · ${s.cia.join(" / ")} · ${plural(live(s).length, "element")}`).concat([`${plural(pinCount(D), "library pin")}${rm ? ` · ${n(rm)} removed` : ""}${md ? ` · ${n(md)} modified` : ""}${own ? ` · ${n(own)} the program's own` : ""}`])],
      [3, "Baseline", [`${BASE_NAME[r.key]} baseline${D.combine ? " with Privacy" : ""} · ${DB.cat.title} ${DB.cat.v}`, D.overlays.length ? D.overlays.map((o) => ovl(o).title).join(", ") : "No overlays", `${tl ? `Tailoring +${tl.add} −${tl.rem} · ` : ""}${n(r.total)} controls`]],
      [4, "Team", [`AO ${holderOf(D, "ao") || "none"} · ISSM ${holderOf(D, "issm") || "none"} · ISSO ${holderOf(D, "isso") || "none"}`, `System owner ${holderOf(D, "owner") || "none"} · Lead assessor ${holderOf(D, "lead") || "none"}`, `${rolesFilled(D)} of 6 roles filled${D.roles.assessors.length ? "" : " · no assessors yet"}`]],
    ];
    const writes = [
      `The program ${D.code} and its ${rolesFilled(D)} roles, held from ${dShort(D.startOn || TODAY_ISO)}`,
      `The program profile: ${BASE_NAME[r.key]} baseline${D.overlays.length ? ` with ${plural(D.overlays.length, "overlay")}` : ""}${D.tailoring.length ? ` and ${plural(D.tailoring.length, "tailoring decision")}, each with its rationale` : ""}, published so systems adopt it`,
      `${D.systems.length === 1 ? `The system ${s0.code}` : plural(D.systems.length, "system")} and ${plural(elCount(D), "element")}, with ${plural(pinCount(D), "library pin")}${D.start === "product" ? ` and ${p.name} version ${p.v} as the product` : ""}`,
      `${D.systems.length === 1 ? "A draft SSP" : plural(D.systems.length, "draft SSP")} with ${n(r.total * D.systems.length)} planned implementations, one for every selected control`,
      `${n(sd.w)} library claims seeded where the control is in the baseline; ${n(sd.out)} claims outside it are not`,
    ].concat(itcOn() ? [`The ITCSC as the program's record, version 1, approved by its signatures, with ${plural(ITC.interfaces.length, "draft interconnection")} from its section 5`] : []);
    const errs = reviewErr.length ? `<div class="pn-sum" role="alert" tabindex="-1" id="pn-sum"><b>Fix these before you create</b><ul>${reviewErr.map(([i, ps]) => `<li><button type="button" class="pn-sum-a" data-go="${STEPS[i][0]}">${esc(STEPS[i][1])}: ${esc(ps[0][1])}</button></li>`).join("")}</ul></div>` : "";
    return `${errs}<div data-slot="progress">${progressHtml()}</div>
      <div class="pn-rcards">${cards.map(([i, t, lines]) => `<section class="pn-rcard"><div class="pn-rcard-h"><h3 class="pn-h3">${t}</h3><button type="button" class="btn sm" data-go="${STEPS[i][0]}" aria-label="Edit ${t}">Edit</button></div><ul>${lines.filter(Boolean).map((l) => `<li>${esc(l)}</li>`).join("")}</ul></section>`).join("")}</div>
      <section class="pn-writes"><h3 class="pn-h3">What creating writes</h3><ul>${writes.map((w) => `<li>${h.gl("check")}<span>${esc(w)}</span></li>`).join("")}</ul><p class="pn-hint">One save writes all of it, or none of it.</p></section>
      <p class="pn-aid"><span class="tag">Walkthrough aid</span><button type="button" class="pn-link" data-pn="create-fail" data-k="create-fail">Simulate a failed save</button></p>`
      + AK.note("Nothing is written: the progress and the failed save walk through what the app does when it saves.");
  };

  // ——— Routes ———
  STEPS.forEach(([route], i) => {
    S[route] = () => {
      if (!quiet) {
        if (i === 0 && fresh) { D = freshDraft(); fresh = false; }
        if (i === 0 && PA.pnStartFrom === "itcsc") { PA.pnStartFrom = null; D = freshDraft(); D.start = "itcsc"; applyItcsc(); }
        pop = null; reviewErr = [];
        if (creating && creating.failed) creating = null;
        queueMicrotask(() => { const t = document.getElementById("pn-h"); if (t) t.focus({ preventScroll: true }); });
      }
      cur = i;
      D.reached = Math.max(D.reached, i);
      return wizard(i);
    };
  });
  PA.fullWindow("program-new");
  ROUTE_NAV["program-start"] = "overview";

  // ——— Getting started: where the new program lands ———
  function madeNow() {
    if (MADE[0]) return MADE[0];
    const d = freshDraft(); d.demo = true; return d;
  }
  function guideTasks(d) {
    const r = resolveStack(d), dl = delta(d, r.set), hold = (k) => holderOf(d, k);
    const missing = ROLES.filter(([k]) => !holders(d, k).length).map((x) => x[1]);
    return [
      ["Set up", "The program's ITCSC, its baseline and the people who act for it.", "gear", [
        d.start === "itcsc"
          ? { id: "itcsc", title: "ITCSC: approved", sub: `Read from ${ITC.file} · signed by ${ITC.signed[0][0]} (PM) and ${ITC.signed[1][0]} (AO)`, owner: hold("issm"), due: TODAY_ISO, act: ["View", { panel: "pn-itcsc" }] }
          : { id: "itcsc", title: "Sign the ITCSC", sub: `Categorize and select, then the PM and ${hold("ao") || "the AO"} sign · or import a completed one`, owner: hold("issm"), due: addDays(TODAY_ISO, 14), act: ["Import", { modal: "pn-itcsc" }] },
        { id: "baseline", title: "Choose the control baseline", sub: `${BASE_NAME[r.key]} baseline · ${n(r.total)} controls${d.tailoring.length ? " · tailored" : ""}`, owner: YOU, due: TODAY_ISO, act: ["View", { panel: "pn-baseline" }] },
        { id: "roles", title: "Assign roles", sub: `${rolesFilled(d)} of 6 roles${missing.length ? ` · ${list(missing)} to name with the assessment plan` : ""}`, owner: YOU, due: TODAY_ISO, act: ["View", { panel: "pn-roles" }] },
      ]],
      ["Requirements and evidence", "What the customer asks for, and what shows the program meets it.", "task", [
        { id: "reqs", title: "Import the customer's requirements document", sub: "Customer D's requirements, as CSV, Excel or ReqIF", owner: hold("isso"), due: addDays(TODAY_ISO, 7), act: ["Import", { modal: "pn-reqs" }] },
        { id: "map", title: "Map requirements to controls", sub: `Each requirement to the controls it meets, across ${n(r.total)} controls`, owner: hold("isso"), due: addDays(TODAY_ISO, 21), act: ["Open requirements", { go: "requirements" }] },
        { id: "sources", title: "Connect evidence sources", sub: "ACAS scans, STIG checklists and the product's evidence", owner: hold("issm"), due: addDays(TODAY_ISO, 14), act: ["Connect", { go: "sources" }] },
      ]],
      ["Document, assess and authorize", "The SSP and its diagram, the assessment, then the package.", "flag", [
        { id: "ssp", title: "Draft the SSP", sub: `${n(r.total * d.systems.length)} planned implementations to describe · Assist can draft from the product's narratives`, owner: YOU, due: addDays(TODAY_ISO, 59), act: ["Open the SSP", { go: "ssp" }] },
        { id: "diagram", title: "Upload the architecture diagram", sub: "The boundary and data flows the SSP shows in section 6", owner: hold("owner"), due: addDays(TODAY_ISO, 28), act: ["Upload", { modal: "pn-diagram" }] },
        { id: "assess", title: "Plan an assessment", sub: dl ? `Plan delta assessment over the ${n(dl.only + dl.changed)} controls the program owes` : "Plan a campaign over the baseline's controls", owner: hold("lead"), due: addDays(TODAY_ISO, 76), act: ["Open assessments", { go: "assessments" }] },
        { id: "authorize", title: "Submit for authorization", sub: `The package goes to ${hold("ao") || "the AO"}, the authorizing official`, owner: hold("issm"), due: addDays(d.targetOn || addDays(TODAY_ISO, 300), -30), act: ["Open authorization", { go: "authorization" }] },
      ]],
    ];
  }
  function taskRow(t, first) {
    const done = GUIDE.has(t.id);
    const ring = `<span class="ak-ring sm${done ? " done" : ""}"></span>`;
    const row = AK.task({ title: t.title, source: t.sub, owner: t.owner || null, due: t.due, done }).replace(ring, `<button type="button" class="pn-tick" data-pn="tick" data-v="${t.id}" data-k="tick-${t.id}" aria-pressed="${done}" aria-label="${esc(t.title)}: ${done ? "done, mark as not done" : "mark as done"}">${ring}</button>`);
    const [label, a] = t.act;
    const attrs = a.go ? `data-go="${a.go}"` : a.modal ? `data-modal="${a.modal}"` : `data-panel="${a.panel}" data-id="${t.id}"`;
    return `<div class="pn-trow${done ? " done" : ""}">${row}<button type="button" class="btn sm${first ? " ink" : ""}" ${attrs} data-k="go-${t.id}">${esc(label)}</button></div>`;
  }
  S["program-start"] = () => {
    const d = madeNow(), r = resolveStack(d), p = product(d.product), c = cfgOf(p, d.config), dl = delta(d, r.set);
    if (arrived && !quiet) { arrived = false; setTimeout(() => toast(`Program created · ${d.code}`), 60); }
    const groups = guideTasks(d), all = groups.reduce((a, g) => a.concat(g[3]), []);
    const doneN = all.filter((t) => GUIDE.has(t.id)).length;
    const firstOpen = (all.find((t) => !GUIDE.has(t.id)) || {}).id;
    const chips = `<span class="pn-chiprow">${[AK.chip(d.code), AK.chip(BL[d.bl]), d.start === "product" ? AK.chip(`Variant of ${p.name} v${p.v} · ${c[1]}`, { icon: "link" }) : d.start === "copy" ? AK.chip("Copied from WS-X90's setup") : d.start === "import" ? AK.chip("Imported SSP") : d.start === "itcsc" ? AK.chip("From an ITCSC", { icon: "upload" }) : ""].join("")}</span>`;
    const head = AK.recordHead({
      crumbs: [["Portfolio", "portfolio"], [d.name]], title: d.name, chip: '<span class="ex">Example</span>', desc: chips,
      facts: [["Systems", n(d.systems.length)], ["Elements", n(elCount(d))], ["Controls", n(r.total)], ["Roles", `${rolesFilled(d)} of 6`], ["Created", d.demo ? "Not created in this session" : `Just now · ${YOU}`]],
      actions: `<button type="button" class="btn sm" data-modal="pn-invite" data-id="start" data-k="invite-start">${AK.i("mail")}Invite people</button>`,
    });
    const guide = `<section class="pn-guide" aria-labelledby="pn-guide-t"><div class="pn-guide-h"><div><h3 id="pn-guide-t">Starter guide <span class="ex">Example</span></h3><p class="pn-hint">${n(all.length)} steps from a new program to its authorization package.</p></div>${AK.progress(doneN, all.length, "done")}</div>
      ${groups.map(([t, line, icon, items]) => { const dn = items.filter((x) => GUIDE.has(x.id)).length; return `<section class="pn-grp"><div class="pn-grp-h"><span class="pn-grp-i" aria-hidden="true">${AK.i(icon)}</span><span class="tt"><b>${esc(t)}</b><span class="s">${esc(line)}</span></span><span class="pn-grp-n num">${dn} of ${items.length} complete<span class="ak-ring sm${dn === items.length ? " done" : ""}" aria-hidden="true"></span></span></div>${items.map((x) => taskRow(x, x.id === firstOpen)).join("")}</section>`; }).join("")}</section>`;
    const tot = dl ? dl.inherited + dl.shared + dl.changed + dl.only : 0;
    const inherits = dl ? `<section class="pn-card"><h3 class="pn-card-t">What the program inherits from ${esc(p.name)} version ${p.v}</h3>
        <div class="stack" role="img" aria-label="${dl.inherited} inherited, ${dl.shared} shared, ${dl.changed + dl.only} to assess, of ${tot}"><i style="flex:${dl.inherited};background:var(--ok)"></i><i style="flex:${dl.shared};background:var(--info)"></i><i style="flex:${dl.changed + dl.only};background:var(--line-strong)"></i></div>
        <dl class="pn-big"><div><dt><i style="--c:var(--ok)"></i>Inherited</dt><dd class="num">${n(dl.inherited)}</dd></div><div><dt><i style="--c:var(--info)"></i>Shared</dt><dd class="num">${n(dl.shared)}</dd></div><div><dt><i style="--c:var(--line-strong)"></i>To assess</dt><dd class="num">${n(dl.changed + dl.only)}</dd></div></dl>
        <p class="pn-hint">${n(dl.only)} the product gives nothing for${dl.changed ? `, ${n(dl.changed)} changed here` : ""}. Counted as the Product delta counts them, from the published claims and the ${esc(DB.pa.title)} of ${dShort(DB.pa.on)}, in which configuration ${esc(c[0])} satisfies ${n((DB.pa.cfg[c[0]] || {}).satisfied || 0)} of ${n(DB.pa.controls)} High controls.</p>
        <div class="btns"><button type="button" class="btn sm" data-pn="say" data-v="Plan delta assessment waits for a published SSP: ${esc(d.systems[0].code)}'s SSP is a draft." data-k="plan-delta">Plan delta assessment</button></div></section>`
      : `<section class="pn-card"><h3 class="pn-card-t">What the program inherits</h3><p class="pn-hint">${d.start === "product" ? `The Product delta reads once ${esc(p.name)}'s claims are counted.` : "Nothing: the program does not start from a product."}</p></section>`;
    const ssp = `<section class="pn-card"><h3 class="pn-card-t">Draft SSP${d.systems.length > 1 ? "s" : ""}</h3><dl class="ak-kv"><dt>Revision</dt><dd>1 · ${h.pill("none", "Draft")}</dd><dt>Planned</dt><dd class="num">${n(r.total * d.systems.length)} implementations</dd><dt>Described</dt><dd class="num">0 of ${n(r.total * d.systems.length)}</dd></dl><div class="btns"><button type="button" class="btn sm" data-go="ssp" data-k="open-ssp">Open the SSP</button></div></section>`;
    const team = `<section class="pn-card"><h3 class="pn-card-t">Team</h3><ul class="pn-team">${ROLES.map(([k, label]) => `<li><span class="k">${esc(label.replace(" (SCA)", ""))}</span>${holders(d, k).length ? holders(d, k).map((x) => AK.owner(x)).join("") : AK.owner(null)}</li>`).join("")}</ul></section>`;
    return h.page(head, `<div class="pn-start"><div class="pn-start-b">${guide}</div><aside class="pn-start-s">${inherits}${ssp}${team}</aside></div>`,
      AK.note(`The starter guide, its owners and due dates are examples, and so is the program; the inherited, shared and to-assess counts are computed from ${p.name} version ${p.v}'s published claims and product assessment by the Product delta's rule.`));
  };
  P["pn-baseline"] = () => { const d = madeNow(), r = resolveStack(d); return { label: "Control baseline preview", body: `<h4>${BASE_NAME[r.key]} baseline · ${n(r.total)} controls</h4><p class="pn-hint">${esc(d.name)} · ${esc(DB.cat.title)} ${esc(DB.cat.v)}</p>${stackTable(r)}${mapKey(r)}${mapGrid(r)}` }; };
  P["pn-roles"] = () => { const d = madeNow(); return { label: "Roles preview", body: `<h4>${rolesFilled(d)} of 6 roles held</h4><dl class="ak-kv">${ROLES.map(([k, label, line]) => `<dt>${esc(label)}</dt><dd>${holders(d, k).length ? holders(d, k).map((x) => AK.owner(x)).join(" ") : AK.owner(null)}</dd>`).join("")}</dl><p class="pn-hint">Only today's holder of the AO role signs authorization decisions, and only the lead assessor publishes assessment results.</p>` }; };

  // ——— Dialogs ———
  const dlg = (body) => `<div class="pn-dlg">${body}</div>`;
  const closeDlg = () => { const x = document.querySelector("#modal .dlg-h [data-close-modal]"); if (x) x.click(); };
  const refreshDlg = (body, footer, k) => { const b = document.querySelector("#modal .dlg-b"), f = document.querySelector("#modal .dlg-f"); if (b && body != null) b.innerHTML = body; if (f && footer != null) f.innerHTML = footer; if (k) focusKey(k); };
  const dlgErr = (id, msg) => { const e = document.getElementById(id + "-err"), c = document.getElementById(id); if (e) { e.hidden = !msg; e.innerHTML = msg ? ERR_I + esc(msg) : ""; } if (c) { if (msg) c.setAttribute("aria-invalid", "true"); else c.removeAttribute("aria-invalid"); } };
  const val = (id) => { const e = document.getElementById(id); return e ? e.value.trim() : ""; };

  M["pn-leave"] = () => ({ title: "Save the draft and leave?", body: dlg(`<p class="ak-desc">The draft keeps every step you have filled in${D.name ? `, as ${esc(D.name)}` : ""}. Pick it up from Home with Create program.</p>`),
    footer: `<button type="button" class="btn" data-close-modal>Keep editing</button><button type="button" class="btn" data-pn="leave-discard">Discard</button><button type="button" class="btn ink" data-pn="leave-save">Save draft</button>` });

  function infoBody() {
    const s = D.systems[IW.k];
    const sug = infoSuggest({ info: IW.picked });
    return dlg(`<p class="ak-desc">The SP 800-60 information types ${esc(s.name || "the system")} stores, processes or sends. Each carries provisional levels; together they suggest the system's levels. <span class="ex">Example</span></p>
      <div class="pn-checks" role="group" aria-label="Information types">${INFO.map((t) => { const on = IW.picked.indexOf(t[0]) >= 0; return `<button type="button" role="checkbox" aria-checked="${on}" class="pn-check" data-pn="info-toggle" data-v="${t[0]}" data-k="info-${t[0]}">${chk(on)}<span class="t">${esc(t[1])}</span><span class="pn-lv">${[0, 1, 2].map((i) => `<span>${"CIA"[i]} ${LV[t[2 + i]]}</span>`).join("")}</span></button>`; }).join("")}</div>
      <p class="pn-hint">${sug ? `Suggests <b>${sug.map((l) => LV[l]).join(" / ")}</b>, the highest level of each.` : "No types chosen: no suggestion."}</p>`);
  }
  const infoFoot = () => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-pn="info-ok">${IW.picked.length ? `Use ${plural(IW.picked.length, "type")}` : "Use no types"}</button>`;
  M["pn-info"] = (id) => { IW = { k: +id || 0, picked: D.systems[+id || 0].info.slice() }; return { title: "Information types", body: infoBody(), footer: infoFoot() }; };

  M["pn-remove"] = (ref) => {
    const [s, e] = findEl(ref); if (!e) return null;
    const kids = desc(s, e.code).filter((x) => x.state !== "removed");
    RW = { ref };
    return { title: "Remove from this variant", body: dlg(`<p class="ak-desc"><b>${esc(disp(s, e))} ${esc(e.name)}</b>${kids.length ? ` and the ${plural(kids.length, "element")} inside it leave` : " leaves"} this variant. The product keeps ${kids.length ? "them" : "it"}; the Product delta counts the controls behind ${kids.length ? "them" : "it"} as Changed here.</p>${field("pn-rm-why", "Reason", `<textarea class="pn-input" id="pn-rm-why" rows="3" data-k="rm-why" aria-describedby="pn-rm-why-err"></textarea>`, { req: true })}`),
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-pn="rm-ok">Remove from variant</button>` };
  };
  const KINDS = ["Software", "Firmware", "Hardware", "Data"];
  function modBody() { const [s, e] = findEl(MW.ref); return dlg(`<p class="ak-desc">What Customer D changed in <b>${esc(disp(s, e))} ${esc(e.name)}</b>. The controls behind it become Changed here, and the program owes their assessment.</p>
      <div class="pn-field"><span class="pn-label" id="pn-md-k-l">What changed <span class="req">Required</span></span><div class="pn-kinds" role="group" aria-labelledby="pn-md-k-l" id="pn-md-k">${KINDS.map((x) => { const on = MW.kinds.indexOf(x) >= 0; return `<button type="button" role="checkbox" aria-checked="${on}" class="pn-check sm" data-pn="md-kind" data-v="${x}" data-k="md-${x}">${chk(on)}<span class="t">${x}</span></button>`; }).join("")}</div><span class="pn-err" id="pn-md-k-err" hidden></span></div>
      ${field("pn-md-why", "Why", `<textarea class="pn-input" id="pn-md-why" rows="3" data-k="md-why" aria-describedby="pn-md-why-err">${esc(MW.why)}</textarea>`, { req: true })}`); }
  M["pn-modify"] = (ref) => { const [, e] = findEl(ref); if (!e) return null; MW = { ref, kinds: e.kinds.length ? e.kinds.slice() : [e.type === "software" ? "Software" : "Hardware"], why: e.why || "" }; return { title: "Mark as modified", body: modBody(), footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-pn="md-ok">Mark as modified</button>` }; };

  M["pn-add-el"] = (id) => {
    const k = +id || 0, s = D.systems[k]; AW = { k };
    const parents = [["", "The system itself"]].concat(live(s).filter((e) => e.type === "subsystem").map((e) => [e.code, `${disp(s, e)} ${e.name}`]));
    return { title: "Add element", body: dlg(`<p class="ak-desc">An element the program adds itself: it is the program's own, not the product's.</p><div class="pn-two">${field("pn-ae-name", "Name", `<input class="pn-input" id="pn-ae-name" data-k="ae-name" aria-describedby="pn-ae-name-err">`, { req: true })}${field("pn-ae-code", "Code", `<input class="pn-input upper" id="pn-ae-code" data-k="ae-code" value="${esc(s.prefix)}" aria-describedby="pn-ae-code-err" spellcheck="false">`, { req: true })}${field("pn-ae-type", "Type", `<select class="pn-input" id="pn-ae-type">${["hardware", "software", "firmware", "subsystem", "service", "other"].map((x) => `<option value="${x}">${TYPE[x]}</option>`).join("")}</select>`)}${field("pn-ae-in", "Inside", `<select class="pn-input" id="pn-ae-in">${parents.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("")}</select>`)}</div>`),
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-pn="ae-ok">Add element</button>` };
  };

  function libList() {
    const s = D.systems[LW.k], set = resolveStack(D).set, q = LW.q.toLowerCase();
    const pinned = new Map(live(s).filter((e) => e.pin).map((e) => [e.pin, disp(s, e)]));
    const sets = [...new Set(LIB.map((l) => l.set))];
    const rows = sets.map((st) => { const items = LIB.filter((l) => l.set === st && (!q || (l.name + " " + l.set + " " + l.type).toLowerCase().indexOf(q) >= 0)); if (!items.length) return ""; return `<div class="pn-libset"><span class="pn-libset-h">${esc(st)}</span>${items.map((l) => { const w = l.claims.filter((c) => set.has(c)).length, have = pinned.get(l.name) && l.set.indexOf("X800") === 0, on = LW.picked.indexOf(l.id) >= 0; return `<button type="button" role="checkbox" aria-checked="${on}" class="pn-lib${have ? " off" : ""}" data-pn="${have ? "say" : "lib-toggle"}" data-v="${have ? `${esc(l.name)} is already pinned on ${esc(pinned.get(l.name))}.` : l.id}" data-k="lib-${l.id}"${have ? ' aria-disabled="true"' : ""}>${chk(on)}<span class="t"><b>${esc(l.name)}</b><span class="s">${esc(TYPE[l.type] || l.type)} · version ${l.v}${l.owner ? ` · ${esc(l.owner)}` : ""}</span></span><span class="pn-libn">${have ? AK.chip(`Pinned on ${pinned.get(l.name)}`) : `<span class="num">${l.claims.length} claimed</span><span class="s">${w} will seed · ${l.claims.length - w} not in baseline</span>`}</span></button>`; }).join("")}</div>`; }).join("");
    return rows || `<p class="pn-none">No published component matches “${esc(LW.q)}”.</p>`;
  }
  const libFoot = () => `<span class="pn-hint num" style="margin-inline-end:auto">${LW.picked.length} selected</span><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-pn="lib-ok">${LW.picked.length ? `Add ${plural(LW.picked.length, "element")}` : "Add elements"}</button>`;
  M["pn-library"] = (id) => {
    const k = +id || 0, s = D.systems[k]; LW = { k, picked: [], q: "" };
    const parents = [["", "The system itself"]].concat(live(s).filter((e) => e.type === "subsystem").map((e) => [e.code, `${disp(s, e)} ${e.name}`]));
    return { title: "Add from library", body: dlg(`<p class="ak-desc">Published components, each with the controls it claims: those in the baseline seed the system's SSP, the rest wait.</p>
      <div class="pn-two">${field("pn-lq", "Search", `<input class="pn-input" id="pn-lq" data-lq="1" data-k="lq" placeholder="Component, set or type" autocomplete="off">`)}${field("pn-lin", "Inside", `<select class="pn-input" id="pn-lin">${parents.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("")}</select>`)}</div>
      <div class="pn-libs" role="group" aria-label="Published components" data-slot="lib-list">${libList()}</div><span class="pn-err" id="pn-lib-err" hidden></span>`), footer: libFoot() };
  };

  function tailorBody() {
    const pre = resolveStack(D, { noTailoring: true }).set;
    const options = TW.act === "add" ? [...TITLE.keys()].filter((c) => !pre.has(c)) : [...pre].sort(byOrder);
    return dlg(`<p class="ak-desc">Add or remove single controls for this program, on top of the baseline and its overlays. Each decision needs a rationale; it is recorded on the program profile. <span class="ex">Example</span></p>
      ${TW.list.length ? `<ol class="pn-tdecs">${TW.list.map((t, i) => `<li class="pn-tdec"><div class="pn-tdec-h"><label class="pn-label" for="pn-tw-${i}">${AK.chip(t.act === "add" ? "Adds" : "Removes", { tone: t.act === "add" ? "info" : "warn" })}<b class="pn-code">${esc(t.code)}</b><span>${esc(TITLE.get(t.code) || "")}</span><span class="req">Required</span></label>${iconBtn("x", `Delete the decision on ${t.code}`, "tw-del", i, { cls: "sm" })}</div><textarea class="pn-input" id="pn-tw-${i}" data-tw="${i}" data-k="tw-${i}" rows="2" placeholder="Why this program ${t.act === "add" ? "adds" : "removes"} it" aria-describedby="pn-tw-${i}-err"${TW.errs[i] ? ' aria-invalid="true"' : ""}>${esc(t.why)}</textarea><span class="pn-err" id="pn-tw-${i}-err"${TW.errs[i] ? "" : " hidden"}>${TW.errs[i] ? ERR_I + esc(TW.errs[i]) : ""}</span></li>`).join("")}</ol>` : `<p class="pn-hint">No decisions yet.</p>`}
      <div class="pn-tadd"><span class="pn-label" id="pn-tw-new-l">New decision</span><div class="pn-tadd-r">${seg("tw.act", [["add", "Add"], ["remove", "Remove"]], TW.act, { labelledby: "pn-tw-new-l" })}<input class="pn-input upper" id="pn-tw-q" data-twq="1" data-k="tw-q" list="pn-ctl-list" value="${esc(TW.q)}" placeholder="${TW.act === "add" ? "Control to add, as SR-4" : "Control to remove, as PE-17"}" aria-labelledby="pn-tw-new-l" aria-describedby="pn-tw-q-err" autocomplete="off" spellcheck="false"><button type="button" class="btn sm" data-pn="tw-add" data-k="tw-add">Add decision</button></div><span class="pn-err" id="pn-tw-q-err"${TW.qerr ? "" : " hidden"}>${TW.qerr ? ERR_I + esc(TW.qerr) : ""}</span>
      <datalist id="pn-ctl-list">${options.map((c) => `<option value="${esc(c)}">${esc(TITLE.get(c) || "")}</option>`).join("")}</datalist></div>`);
  }
  M["pn-tailor"] = () => { TW = { list: clone(D.tailoring), act: "add", q: "", qerr: "", errs: {} }; return { title: "Tailor for this program", body: tailorBody(), footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-pn="tw-save">Save tailoring</button>` }; };

  M["pn-invite"] = (where) => {
    VW = { where };
    return { title: "Invite by email", body: dlg(`<p class="ak-desc">Someone not yet in the workspace. They get an email, and hold the role once they accept. <span class="ex">Example</span></p><div class="pn-two">${field("pn-iv-mail", "Email", `<input class="pn-input" id="pn-iv-mail" type="email" data-k="iv-mail" placeholder="name@customer-d.mil" aria-describedby="pn-iv-mail-err" autocomplete="off">`, { req: true })}${field("pn-iv-role", "Role", `<select class="pn-input" id="pn-iv-role">${ROLES.map(([k, label]) => `<option value="${k}"${k === "assessors" ? " selected" : ""}>${esc(label)}</option>`).join("")}</select>`)}</div>`),
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-pn="iv-ok">Send invitation</button>` };
  };
  const uploadDlg = (title, line, act) => ({ title, body: dlg(`<p class="ak-desc">${line} <span class="ex">Example</span></p><button type="button" class="pn-dropzone" data-pn="${act}" data-k="${act}">${AK.i("upload")}<b>Drop a file here</b><span class="s">or choose one</span></button>`), footer: `<button type="button" class="btn" data-close-modal>Cancel</button>` });
  M["pn-reqs"] = () => uploadDlg("Import requirements", "Customer D's requirements document, as CSV, the first sheet of an Excel workbook, or ReqIF. Each row becomes a requirement with its reference.", "up-reqs");
  M["pn-diagram"] = () => uploadDlg("Upload the architecture diagram", "The boundary and data flow diagram, as SVG, PNG or PDF. The SSP's section 6 shows it.", "up-diagram");
  M["pn-itcsc"] = () => uploadDlg("Import the ITCSC", "A completed AF ITCSC, PDF or Word. The ITCSC reader reads it into the program's ITCSC record, where the PM and the AO sign it.", "up-itcsc");
  P["pn-itcsc"] = () => {
    const d = madeNow();
    return { label: "ITCSC preview", body: `<h4>${esc(ITC.file)} <span class="ex">Example</span></h4><p class="pn-hint">${ITC.form} · ${ITC.read} of ${ITC.of} fields read by the ITCSC reader · version 1 of ${esc(d.name)}'s ITCSC</p>
      <dl class="ak-kv"><dt>System</dt><dd>${esc(ITC.name)}</dd><dt>Categorization</dt><dd>${ITC.cia.map((l, i) => DIM[i][0] + " " + l).join(" · ")}</dd><dt>Proposed IT</dt><dd>${esc(ITC.it)}</dd><dt>NSS</dt><dd>Yes · ${ITC.nss.join(", ")}</dd><dt>Overlays</dt><dd>CNSSI 1253 (§7) · Deployed Platform (§6F)</dd><dt>Interfaces</dt><dd>${plural(ITC.interfaces.length, "draft interconnection")}</dd></dl>
      ${AK.approval({ title: "Approval", sub: "Both signatures were on the imported file", steps: [{ label: "Program manager", approvers: [{ who: ITC.signed[0][0], role: "PM", state: "approved", when: dShort(ITC.signed[0][2]) }] }, { label: "Authorizing official", approvers: [{ who: ITC.signed[1][0], role: "AO", state: "approved", when: dShort(ITC.signed[1][2]) }] }] })}
      <p class="pn-hint">Not read: ${esc(list(ITC.notRead))}.</p>` };
  };

  // ——— Actions ———
  function rerender(k) {
    const main = document.getElementById("main"); if (!main) return;
    const route = (location.hash || "#home").slice(1), fn = S[route];
    if (!fn || !(route === "program-start" || route.indexOf("program-new") === 0)) return;
    const sc = document.getElementById("pn-scroll"), top = sc ? sc.scrollTop : 0, mtop = main.scrollTop;
    quiet = true; try { main.innerHTML = fn(); } finally { quiet = false; }
    const sc2 = document.getElementById("pn-scroll"); if (sc2) sc2.scrollTop = top;
    main.scrollTop = mtop;
    if (k) focusKey(k);
  }
  function focusKey(k) { const e = document.querySelector(`[data-k="${CSS.escape(k)}"]`); if (e) { e.focus(); return true; } return false; }
  function focusId(id) { const e = document.getElementById(id); if (e) { e.focus(); if (e.scrollIntoView) e.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" }); } }
  function focusPop() { const p = document.querySelector(".pn-pop"); const f = p && (p.querySelector("input") || p.querySelector("button")); if (f) f.focus(); }
  const slot = (name, html) => document.querySelectorAll(`[data-slot="${name}"]`).forEach((e) => (e.innerHTML = html));
  function soft(f) {
    slot("card", cardInner());
    slot("msum", msum());
    if (f === "code") slot("code-status", codeStatus());
    if (f === "startOn" || f === "targetOn") { slot("date-startOn", dateRead(D.startOn)); slot("date-targetOn", dateRead(D.targetOn, true)); }
    const m = f.match(/^systems\.(\d+)\.name$/);
    if (m) { const t = document.getElementById(`pn-s${m[1]}-t`); if (t) t.textContent = D.systems[+m[1]].name || "Untitled system"; }
    if (D.tried[cur]) {
      const map = Object.fromEntries(problems(cur));
      document.querySelectorAll("#main [data-err-for]").forEach((e) => { const id = e.dataset.errFor, msg = map[id]; e.hidden = !msg; e.innerHTML = msg ? ERR_I + esc(msg) : ""; const c = document.getElementById(id); if (c) { if (msg) c.setAttribute("aria-invalid", "true"); else c.removeAttribute("aria-invalid"); } });
    }
  }
  function setPath(path, v) { const ks = path.split("."); let o = ks[0] === "tw" ? TW : D; const start = ks[0] === "tw" ? 1 : 0; for (let i = start; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
  function rebuildStart() {
    D.systems[0] = makeSystem(D.start === "itcsc" && !D.file ? "blank" : D.start, D.product, D.config);
    const p = product(D.product);
    if (D.start === "product") D.bl = p.bl || D.bl;
    if (D.start === "copy") Object.assign(D.roles, { ao: "R. Calloway", issm: "Joel Barrantes", isso: "Priya Raghavan", owner: "=sys", lead: "D. Okafor", assessors: ["Nadia Fournier"] });
  }
  function go(i) { location.hash = STEPS[i][0]; }
  function next(i, to) {
    const errs = problems(i);
    if (errs.length) {
      D.tried[i] = true;
      errs.forEach(([id]) => { const m = id.match(/^pn-s(\d+)-/); if (m) D.systems[+m[1]].open = true; });
      rerender();
      focusId(errs.length === 1 ? errs[0][0] : "pn-sum");
      return;
    }
    go(to == null ? i + 1 : to);
  }
  function assist(k) {
    const s = D.systems[k]; if (typing !== null) return;
    const picked = INFO.filter((t) => s.info.indexOf(t[0]) >= 0), p = product(D.product);
    const text = DIM.map((dim, i) => { const lvl = s.cia[i], li = LV.indexOf(lvl); const by = picked.filter((t) => t[2 + i] === li).map((t) => t[1].toLowerCase()); const top = picked.length ? Math.max(...picked.map((t) => t[2 + i])) : -1; return by.length ? `${dim} is ${lvl}: ${list(by.slice(0, 2))} ${by.length > 1 ? "carry" : "carries"} that level.` : `${dim} is ${lvl}${top >= 0 && top < li ? `, above the information types' ${LV[top]}` : ""}, as the customer requires.`; }).join(" ")
      + (D.start === "product" ? ` The levels match ${p.name}'s own categorization, so the variant inherits the product's assessment where nothing changed.` : "");
    s.ai = true;
    if (reduced()) { s.rationale = text; rerender("why-" + k); return; }
    typing = k; s.rationale = ""; rerender("assist-" + k);
    let at = 0;
    const tick = () => {
      at = Math.min(text.length, at + 5); s.rationale = text.slice(0, at);
      const t = document.getElementById(`pn-s${k}-why`); if (t) t.value = s.rationale;
      if (at < text.length) setTimeout(tick, 14); else { typing = null; if (document.getElementById(`pn-s${k}-why`)) rerender("why-" + k); }
    };
    setTimeout(tick, 120);
  }
  function paintProgress() {
    const box = document.getElementById("pn-progress"); if (!box || !creating) return;
    box.querySelectorAll("li").forEach((li) => { const i = +li.dataset.i, st = i < creating.at ? "done" : i === creating.at ? "now" : ""; if (li.className === st) return; li.className = st; li.firstElementChild.outerHTML = st === "done" ? '<span class="ak-ring sm done"></span>' : st === "now" ? '<span class="pn-spin" aria-hidden="true"></span>' : '<span class="ak-ring sm"></span>'; });
  }
  function runCreate(fail) {
    if (creating && !creating.failed) return;
    reviewErr = allProblems();
    if (reviewErr.length) { rerender(); focusId("pn-sum"); return; }
    const r = resolveStack(D);
    creating = { at: 0, fail, failed: false, lines: createLines(r) };
    const failAt = 2;
    const finish = () => {
      const made = clone(D); made.total = r.total; made.at = PA.SSP && PA.SSP.now ? PA.SSP.now() : TODAY_ISO;
      MADE.unshift(made); creating = null; fresh = true; arrived = true; GUIDE = new Set(["baseline", "roles"].concat(D.start === "itcsc" && D.file ? ["itcsc"] : []));
      location.hash = "program-start";
    };
    const failNow = () => { creating.failed = true; creating.at = failAt; rerender(); focusId("pn-fail"); };
    if (reduced()) { if (fail) { rerender(); failNow(); } else finish(); return; }
    rerender(); focusId("pn-progress");
    const tick = () => {
      if (!creating || creating.failed) return;
      if (fail && creating.at === failAt) { failNow(); return; }
      creating.at++; paintProgress();
      if (creating.at >= creating.lines.length) setTimeout(finish, 300); else setTimeout(tick, 420);
    };
    setTimeout(tick, 420);
  }

  const ACT = {
    start: (t) => { if (D.start === t.dataset.v) return; if (D.start === "itcsc") leaveItcsc(); D.start = t.dataset.v; D.file = ""; rebuildStart(); rerender(t.dataset.k); },
    product: (t) => { const before = autoName(D.product, D.config); const p = product(t.dataset.v); D.product = p.code; D.config = p.code === "X800" ? "B" : (p.configs.find((c) => !DB.used[p.code + ":" + c[0]]) || p.configs[0])[0]; if (D.name === before) D.name = autoName(D.product, D.config); rebuildStart(); rerender(t.dataset.k); },
    config: (t) => { const before = autoName(D.product, D.config); D.config = t.dataset.v; if (D.name === before) D.name = autoName(D.product, D.config); rebuildStart(); rerender(t.dataset.k); },
    "file-pick": () => { D.file = "customer-d-ssp.oscal.json"; D.systems[0] = makeSystem("import"); rerender("file-clear"); toast("Read customer-d-ssp.oscal.json"); },
    "file-clear": () => { D.file = ""; rerender("file-pick"); },
    next: () => next(cur),
    back: () => { if (cur > 0) go(cur - 1); },
    "to-review": () => next(cur, 5),
    set: (t) => {
      const f = t.dataset.f, v = t.dataset.v;
      if (f === "tw.act") { TW.act = v; TW.qerr = ""; refreshDlg(tailorBody(), null, t.dataset.k); return; }
      setPath(f, v); rerender(t.dataset.k);
    },
    focus: (t) => { const id = t.dataset.v; const m = id.match(/^pn-s(\d+)-/); if (m && !D.systems[+m[1]].open) { D.systems[+m[1]].open = true; rerender(); } focusId(id); },
    pop: (t) => { const id = t.dataset.v; pop = pop && pop.id === id ? null : { id, q: "" }; rerender(pop ? null : "pop-" + id); if (pop) focusPop(); },
    pick: (t) => {
      const f = t.dataset.f, v = t.dataset.v, id = pop ? pop.id : "";
      if (f === "roles.assessors") { if (v && D.roles.assessors.indexOf(v) < 0) D.roles.assessors.push(v); }
      else setPath(f, v || (f === "roles.owner" ? null : ""));
      pop = null; rerender("pop-" + id);
    },
    "assessor-del": (t) => { D.roles.assessors = D.roles.assessors.filter((x) => x !== t.dataset.v); rerender("pop-assessors"); },
    "cia-use": (t) => { const k = +t.dataset.v, s = D.systems[k], sug = infoSuggest(s); if (sug) s.cia = sug.map((l) => LV[l]); rerender(`systems.${k}.cia.0=${s.cia[0]}`); toast(`Levels set to ${s.cia.join(" / ")}`); },
    assist: (t) => assist(+t.dataset.v),
    "sys-add": () => { const s = makeSystem("blank"); s.name = "Customer D launcher integration kit"; s.code = `SYS-${D.code.replace(/\D/g, "").slice(-4) || "2301"}-2`; s.cia = ["Moderate", "Moderate", "Moderate"]; s.info = ["ops", "maint"]; s.owner = "Dan Whitfield"; s.rationale = "The launcher kit carries no targeting data; its interface commands and maintenance records are Moderate."; s.open = false; D.systems.push(s); rerender(`sys-toggle-${D.systems.length - 1}`); toast("System 2 added, collapsed"); },
    "sys-toggle": (t) => { const k = +t.dataset.v; D.systems[k].open = !D.systems[k].open; rerender(`sys-toggle-${k}`); },
    "sys-remove": (t) => { D.systems.splice(+t.dataset.v, 1); rerender("sys-add"); toast("System removed from the draft"); },
    "menu-dlg": (t) => { pendingFocus = t.dataset.v; pop = null; rerender(); },
    "el-restore": (t) => { const [s, e] = findEl(t.dataset.v); e.state = "kept"; e.why = ""; desc(s, e.code).forEach((x) => { if (x.cascade) { x.state = "kept"; x.why = ""; x.cascade = false; } }); rerender("pop-el-" + e.k); toast(`${disp(s, e)} is back in the variant`); },
    "el-inherit": (t) => { const [s, e] = findEl(t.dataset.v); e.state = "kept"; e.kinds = []; e.why = ""; pop = null; rerender("pop-el-" + e.k); toast(`${disp(s, e)} marked as inherited`); },
    "el-delete": (t) => { const [s, e] = findEl(t.dataset.v); const gone = [e.code].concat(desc(s, e.code).map((x) => x.code)); s.els = s.els.filter((x) => gone.indexOf(x.code) < 0); pop = null; rerender(`add-el-${D.systems.indexOf(s)}`); toast(`${e.name} removed from the draft`); },
    "base-use": () => { D.base = ""; rerender("base-choose"); },
    "base-choose": () => { D.choose = !D.choose; rerender("base-choose"); },
    "base-set": (t) => { D.base = t.dataset.v === suggest(D.systems[0]).key ? "" : t.dataset.v; rerender(t.dataset.k); },
    "ovl-add": (t) => { if (D.overlays.length >= 6) return; D.overlays.push(t.dataset.v); pop = null; rerender("pop-ovl"); toast(`${ovl(t.dataset.v).title} added to the stack`); },
    "ovl-up": (t) => { const i = D.overlays.indexOf(t.dataset.v); if (i > 0) { D.overlays.splice(i, 1); D.overlays.splice(i - 1, 0, t.dataset.v); } rerender(t.dataset.k); },
    "ovl-down": (t) => { const i = D.overlays.indexOf(t.dataset.v); if (i >= 0 && i < D.overlays.length - 1) { D.overlays.splice(i, 1); D.overlays.splice(i + 1, 0, t.dataset.v); } rerender(t.dataset.k); },
    "ovl-remove": (t) => { D.overlays = D.overlays.filter((x) => x !== t.dataset.v); rerender("pop-ovl"); toast(`${ovl(t.dataset.v).title} removed from the stack`); },
    say: (t) => toast(t.dataset.v),
    create: () => runCreate(false),
    "create-fail": () => runCreate(true),
    tick: (t) => { const id = t.dataset.v; if (GUIDE.has(id)) GUIDE.delete(id); else GUIDE.add(id); rerender("tick-" + id); },
    // dialogs
    "leave-save": () => { D.saved = cur; toast(`Draft saved · ${D.name || "Untitled program"}`); location.hash = "home"; },
    "leave-discard": () => { D = freshDraft(); toast("Draft discarded"); location.hash = "home"; },
    "info-toggle": (t) => { const v = t.dataset.v, i = IW.picked.indexOf(v); if (i >= 0) IW.picked.splice(i, 1); else IW.picked.push(v); refreshDlg(infoBody(), infoFoot(), t.dataset.k); },
    "info-ok": () => { D.systems[IW.k].info = INFO.map((x) => x[0]).filter((x) => IW.picked.indexOf(x) >= 0); pendingFocus = "info-" + IW.k; rerender(); closeDlg(); },
    "rm-ok": () => {
      const why = val("pn-rm-why"); if (!why) { dlgErr("pn-rm-why", "Say why the variant leaves it out."); focusId("pn-rm-why"); return; }
      const [s, e] = findEl(RW.ref);
      e.state = "removed"; e.why = why; e.cascade = false;
      desc(s, e.code).forEach((x) => { if (x.state !== "removed") { x.state = "removed"; x.why = `With ${disp(s, e)}`; x.cascade = true; } });
      pendingFocus = "el-" + e.k; rerender(); closeDlg(); toast(`${disp(s, e)} removed from the variant`);
    },
    "md-kind": (t) => { MW.why = val("pn-md-why"); const i = MW.kinds.indexOf(t.dataset.v); if (i >= 0) MW.kinds.splice(i, 1); else MW.kinds.push(t.dataset.v); refreshDlg(modBody(), null, t.dataset.k); },
    "md-ok": () => {
      MW.why = val("pn-md-why");
      dlgErr("pn-md-k", MW.kinds.length ? "" : "Choose what changed."); dlgErr("pn-md-why", MW.why ? "" : "Say why it changed.");
      if (!MW.kinds.length || !MW.why) { if (!MW.kinds.length) focusKey("md-" + KINDS[0]); else focusId("pn-md-why"); return; }
      const [s, e] = findEl(MW.ref); e.state = "modified"; e.kinds = KINDS.filter((x) => MW.kinds.indexOf(x) >= 0); e.why = MW.why;
      pendingFocus = "pop-el-" + e.k; rerender(); closeDlg(); toast(`${disp(s, e)} marked as modified`);
    },
    "ae-ok": () => {
      const s = D.systems[AW.k], name = val("pn-ae-name"), code = val("pn-ae-code").toUpperCase();
      const clash = s.els.some((x) => disp(s, x) === code || x.code === code);
      dlgErr("pn-ae-name", name ? "" : "Enter the element's name.");
      dlgErr("pn-ae-code", !code || code === s.prefix ? "Enter the element's code." : clash ? `${code} is already in the tree.` : "");
      if (!name) return focusId("pn-ae-name");
      if (!code || code === s.prefix || clash) return focusId("pn-ae-code");
      const e = el({ code, name, type: val("pn-ae-type"), parent: val("pn-ae-in"), from: "added" }); s.els.push(e);
      pendingFocus = "pop-el-" + e.k; rerender(); closeDlg(); toast(`${code} added`);
    },
    "lib-toggle": (t) => { const v = t.dataset.v, i = LW.picked.indexOf(v); if (i >= 0) LW.picked.splice(i, 1); else LW.picked.push(v); const lb = document.querySelector('[data-slot="lib-list"]'); if (lb) lb.innerHTML = libList(); refreshDlg(null, libFoot(), t.dataset.k); dlgErr("pn-lib", ""); },
    "lib-ok": () => {
      if (!LW.picked.length) { dlgErr("pn-lib", "Choose at least one component."); return; }
      const s = D.systems[LW.k], parent = val("pn-lin"); let last = null;
      LW.picked.forEach((id) => { const l = LIB.find((x) => x.id === id); const base = s.prefix + l.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase(); let code = base, k = 2; while (s.els.some((x) => disp(s, x) === code || x.code === code)) code = base + k++; last = el({ code, name: l.name, type: l.type, parent, pin: l.name, pinV: l.v, claims: l.id, from: "library" }); s.els.push(last); });
      pendingFocus = "lib-" + LW.k; rerender(); closeDlg(); toast(`${plural(LW.picked.length, "element")} added from the library`);
    },
    "tw-del": (t) => { TW.list.splice(+t.dataset.v, 1); TW.errs = {}; refreshDlg(tailorBody(), null, "tw-q"); },
    "tw-add": () => {
      const c = TW.q.trim().toUpperCase(), pre = resolveStack(D, { noTailoring: true }).set;
      const err = !c ? "Enter a control, as SR-4." : !TITLE.has(c) ? `${c} is not an active control of ${DB.cat.title} ${DB.cat.v}.` : TW.list.some((x) => x.code === c) ? `${c} already has a decision.` : TW.act === "add" && pre.has(c) ? `${c} is already in the baseline.` : TW.act === "remove" && !pre.has(c) ? `${c} is not in the baseline.` : "";
      if (err) { TW.qerr = err; refreshDlg(tailorBody(), null, "tw-q"); return; }
      TW.list.push({ code: c, act: TW.act, why: "" }); TW.q = ""; TW.qerr = ""; refreshDlg(tailorBody(), null, "tw-" + (TW.list.length - 1));
    },
    "tw-save": () => {
      TW.errs = {}; TW.list.forEach((t, i) => { if (!t.why.trim()) TW.errs[i] = `Give the rationale for ${t.act === "add" ? "adding" : "removing"} ${t.code}.`; });
      const bad = Object.keys(TW.errs);
      if (bad.length) { refreshDlg(tailorBody(), null, "tw-" + bad[0]); return; }
      D.tailoring = TW.list; pendingFocus = "tailor"; rerender(); closeDlg(); toast(`Tailoring saved · ${plural(D.tailoring.length, "decision")}`);
    },
    "iv-ok": () => {
      const mail = val("pn-iv-mail"), role = val("pn-iv-role");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { dlgErr("pn-iv-mail", "Enter an email address, as name@customer-d.mil."); return focusId("pn-iv-mail"); }
      const label = (ROLES.find((r) => r[0] === role) || ROLES[5])[1];
      if (VW.where === "wizard") {
        if (role === "assessors") { if (D.roles.assessors.indexOf(mail) < 0) D.roles.assessors.push(mail); } else D.roles[role] = mail;
        if (D.invited.indexOf(mail) < 0) D.invited.push(mail);
        pendingFocus = role === "assessors" ? "pop-assessors" : "pop-role-" + role; rerender();
      }
      closeDlg(); toast(`Invitation sent to ${mail} · ${label}`);
    },
    "up-reqs": () => { GUIDE.add("reqs"); pendingFocus = "tick-reqs"; rerender(); closeDlg(); toast("Requirements document imported"); },
    "up-diagram": () => { GUIDE.add("diagram"); pendingFocus = "tick-diagram"; rerender(); closeDlg(); toast("Architecture diagram uploaded"); },
    "up-itcsc": () => { GUIDE.add("itcsc"); pendingFocus = "tick-itcsc"; rerender(); closeDlg(); toast(`ITCSC reader read ${ITC.read} of ${ITC.of} fields · ready for the PM and the AO to sign`); },
    "itcsc-pick": () => { applyItcsc(); rerender("itcsc-clear"); toast(`ITCSC reader read ${ITC.read} of ${ITC.of} fields from ${ITC.file}`); },
    "itcsc-clear": () => { leaveItcsc(); D.file = ""; D.systems = [makeSystem("blank")]; rerender("itcsc-pick"); },
  };

  // ——— Listeners ———
  document.addEventListener("click", (e) => {
    const t = e.target.closest ? e.target.closest("[data-pn]") : null;
    if (pop && !e.target.closest(".pn-pop") && !(t && t.dataset.pn === "pop" && t.dataset.v === pop.id)) {
      const id = pop.id; pop = null;
      if (!t) { rerender(e.target.closest("[data-modal],[data-go],[data-panel]") ? null : "pop-" + id); return; }
    }
    if (!t) return;
    if (t.getAttribute("aria-disabled") === "true") {
      if (t.dataset.pn === "say") toast(t.dataset.v);
      e.preventDefault(); e.stopPropagation(); return;
    }
    const fn = ACT[t.dataset.pn];
    if (fn) fn(t, e);
  }, true);
  document.addEventListener("input", (e) => {
    const t = e.target; if (!t || !t.dataset) return;
    if (t.dataset.pq) { if (pop) { pop.q = t.value; slot("pop-list", peopleList()); } return; }
    if (t.dataset.lq) { if (LW) { LW.q = t.value; slot("lib-list", libList()); } return; }
    if (t.dataset.tw !== undefined && TW) { const i = +t.dataset.tw; if (TW.list[i]) TW.list[i].why = t.value; return; }
    if (t.dataset.twq && TW) { TW.q = t.value; return; }
    const f = t.dataset.pf; if (!f || t.tagName === "SELECT") return;
    const v = /(^|\.)code$/.test(f) ? t.value.toUpperCase() : t.value;
    setPath(f, v);
    const m = f.match(/^systems\.(\d+)\.rationale$/);
    if (m && typing === null) { const s = D.systems[+m[1]]; if (s.ai) { s.ai = false; slot("ai-" + m[1], ""); t.classList.remove("ai"); } }
    soft(f);
  });
  document.addEventListener("change", (e) => {
    const t = e.target; if (!t || !t.dataset || !t.dataset.pf || t.tagName !== "SELECT") return;
    setPath(t.dataset.pf, t.value);
    rerender(t.dataset.k);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (pop) { const id = pop.id; pop = null; rerender("pop-" + id); e.preventDefault(); e.stopPropagation(); return; }
      const m = document.getElementById("modal");
      if (m && !m.hidden && m.querySelector(".pn-dlg")) { closeDlg(); e.preventDefault(); }
      return;
    }
    if (e.key === "Enter" && e.target && e.target.dataset && (e.target.dataset.twq || e.target.dataset.pq)) {
      e.preventDefault();
      if (e.target.dataset.twq) ACT["tw-add"]();
      else { const first = document.querySelector('[data-slot="pop-list"] [data-pn="pick"]'); if (first) first.click(); }
      return;
    }
    const arrows = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in arrows) || !e.target || !e.target.matches) return;
    if (e.target.matches('[role="radio"][data-pn]')) {
      const g = e.target.closest('[role="radiogroup"]'); if (!g) return;
      const rs = [...g.querySelectorAll('[role="radio"][data-pn]')], i = rs.indexOf(e.target);
      e.preventDefault(); rs[(i + arrows[e.key] + rs.length) % rs.length].click();
    } else if (e.target.matches('.pn-menu [role="menuitem"], .pn-pop [role="option"], .pn-pop input')) {
      const box = e.target.closest(".pn-pop"), items = [...box.querySelectorAll('[role="menuitem"], [role="option"]')];
      if (!items.length || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
      const i = items.indexOf(e.target); e.preventDefault();
      items[i < 0 ? 0 : (i + arrows[e.key] + items.length) % items.length].focus();
    }
  });
  window.addEventListener("hashchange", () => { pop = null; });
  const modalEl = document.getElementById("modal");
  if (modalEl) new MutationObserver(() => { if (modalEl.hidden && pendingFocus) { const k = pendingFocus; pendingFocus = null; setTimeout(() => focusKey(k), 0); } }).observe(modalEl, { attributes: true, attributeFilter: ["hidden"] });
})();
