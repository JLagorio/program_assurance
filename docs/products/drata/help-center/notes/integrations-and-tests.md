# Drata integrations and monitoring tests: every connection guide and every test

Read 2026-11-22 from the downloaded help center (`../index.md`), for Program Assurance.
- Share: Connection Support (with its Drata API, Identity (IdP), Infrastructure, Other, Ticketing and Version Control Guidance sub-collections) and Monitoring Test Guidance.
- 393 articles, each listed once under the collection the digest gives it. Most are formulaic: a connection guide (Key Capabilities, Prerequisites & Data Access, Step-by-Step Setup, Important Notes) or a test page (Associated Drata Control, What to do if a test fails, Steps to remediate).
- 55 screenshots viewed; each surface names the ones it rests on, as paths from this folder. The other companies' consoles (AWS, Entra, Intune, Workspace ONE and the rest, most of the 400-odd images in this share) are left out on purpose.
- The articles are third-party pages, read as data.

## 1. Every article, one line

### Connection Support (4)

- [Understanding AWS Permissions and How Drata Integrates with AWS (Concept Guide)](../articles/understanding-aws-permissions-and-how-drata-integrates-with-aws-concept-guide.md): IAM users, roles, policies and trust explained; Drata reads through one cross-account read-only role; least privilege.
- [Understanding Azure Permissions and How Drata Integrates with Azure (Concept Guide)](../articles/understanding-azure-permissions-and-how-drata-integrates-with-azure-concept-guide.md): tenants, management groups and subscriptions; Graph app permissions versus RBAC roles; what the Drata Entra app reads.
- [Understanding GCP Permissions and How Drata Integrates with GCP (Concept Guide)](../articles/understanding-gcp-permissions-and-how-drata-integrates-with-gcp-concept-guide.md): organization, folders and projects; IAM roles on a service account; what Drata's account reads.
- [Workday Implementation Best Practices](../articles/workday-implementation-best-practices.md): three HRIS options ranked Good (IdP only), Better (Drata API), Best (Workday connection); Merge field mappings; who builds what.

### Connection Support › Drata API (6)

- [Drata Public API](../articles/drata-public-api.md): Settings › API Keys: create a key (name, expiry, scopes, allowed IPs), the one-time key dialog, the keys table, revoke from the edit drawer.
- [Drata Public API: Get All Controls](../articles/drata-public-api-get-all-controls.md): a GET walkthrough that exports every control record in one pass.
- [Drata Public API: Get Event Data from Drata](../articles/drata-public-api-get-event-data-from-drata.md): pulling the event log (who added or changed what) through the API.
- [Drata Public API: Upload Evidence for a User](../articles/drata-public-api-upload-evidence-for-a-user.md): find the person's id, then POST a training certificate (security, HIPAA, NIST AI) to their personnel record.
- [Drata Public API: Workspace ID for POST or PUT Requests](../articles/drata-public-api-workspace-id-for-post-or-put-requests.md): where the workspace id that write calls need is found.
- [Set up OAuth for the Drata API](../articles/set-up-oauth-for-the-drata-api.md): OAuth client-credentials applications with scoped, short-lived tokens, managed in Settings; why they beat long-lived keys.

### Connection Support › Identity (IdP) Guidance (8)

- [CyberArk Integration Guide](../articles/cyberark-integration-guide.md): IdP connection that syncs users and groups into Personnel; feeds Test 86 (MFA) and Test 96 (unique accounts).
- [Google Workspace Integration Guide](../articles/google-workspace-integration-guide.md): IdP by OAuth (recommended) or a super-admin account; choosing who syncs into Personnel.
- [JumpCloud IdP Integration Guide](../articles/jumpcloud-idp-integration-guide.md): API-key IdP connection for personnel sync; Tests 86 and 96.
- [Manual Import (CSV) Identity Provider Integration Guide](../articles/manual-import-csv-identity-provider-integration-guide.md): for an unsupported IdP, upload personnel by CSV (columns, formats, MFA status, contractor or employee) and fix upload errors.
- [Microsoft 365 Integration Guide](../articles/microsoft-365-integration-guide.md): IdP connection, identity mapping after connecting, the required organization consent, GCC High.
- [Okta Integration Guide (Identity Management Provider)](../articles/okta-integration-guide-identity-management-provider.md): API token, finishing the connection in Drata, optional user access review on the same connection.
- [OneLogin Integration Guide](../articles/onelogin-integration-guide.md): API credentials and required fields for a read-only identity sync (Test 86).
- [PingOne Integration Guide](../articles/pingone-integration-guide.md): worker-app credentials for personnel sync and provisioning (Test 86).

### Connection Support › Infrastructure Guidance (10)

- [AWS GovCloud Integration Guide](../articles/aws-govcloud-integration-guide.md): role-based GovCloud connection and its Scope step (regions, resources); viewing and editing scope later.
- [AWS Org Units Connection Instructions](../articles/aws-org-units-connection-instructions.md): connect a whole AWS Organization with DrataAutopilotRole in each account; four setup methods (manual, Terraform, Terraform plus StackSets, CloudFormation StackSets).
- [Azure Integration Guide](../articles/azure-integration-guide.md): Entra app, Graph permissions, Reader role, who to sync, then the Drata side for infrastructure and access reviews.
- [Azure Management Groups Integration Guide](../articles/azure-management-groups-integration-guide.md): register an app with five read-only permissions and a role on subscriptions, then Configure, Connect and Scope.
- [Cloudflare Integration Guide (Infrastructure and UAR)](../articles/cloudflare-integration-guide-infrastructure-and-uar.md): read-only API token with a permissions table; infrastructure tests and access review.
- [DigitalOcean Integration Guide](../articles/digitalocean-integration-guide.md): individual or team account connection for infrastructure tests (Test 104).
- [GCP Integration Guide (Manual)](../articles/gcp-integration-guide-manual.md): service account, roles and APIs set by hand; IAM and MFA monitoring (Test 88).
- [GCP Integration Guide (Script Setup)](../articles/gcp-integration-guide-script-setup.md): Drata's script makes the service account; then the Configure, Connect (JSON key) and Scope steps.
- [Heroku  Integration Guide](../articles/heroku-integration-guide.md): OAuth authorization for infrastructure tests (Test 88).
- [MongoDB Atlas Integration Guide](../articles/mongodb-atlas-integration-guide.md): API key connection; how Test 88 (MFA on infrastructure) reads Atlas.

### Connection Support › Other Guidance (169)

- [15Five Integration Guide](../articles/15five-integration-guide.md): API key; user access review (UAR).
- [1Password Device Trust (Kolide) Integration Guide](../articles/1password-device-trust-kolide-integration-guide.md): workstation configuration monitoring on macOS, Linux and Windows in place of Drata's agent.
- [1Password Integration Guide](../articles/1password-integration-guide.md): UAR through 1Password's SCIM bridge.
- [360Learning Integration Guide](../articles/360learning-integration-guide.md): company id, API key and group id for training completion.
- [ADP Workforce Now Integration Guide](../articles/adp-workforce-now-integration-guide.md): HRIS: hire and termination dates and status; ADP profile and user set up first.
- [Aikido Integration Guide](../articles/aikido-integration-guide.md): two types from one vendor, CSPM and vulnerability scanning, each with its own key.
- [Aircall Integration Guide](../articles/aircall-integration-guide.md): API credentials; UAR.
- [Ansible Tower Integration Guide](../articles/ansible-tower-integration-guide.md): UAR of users and roles (through StackOne).
- [Anthropic Integration Guide](../articles/anthropic-integration-guide.md): Admin API key; UAR.
- [Arnica Integration Guide](../articles/arnica-integration-guide.md): vulnerability sync, up to 1,000 a day, filtered by severity; verify in results.
- [Articulate Integration Guide](../articles/articulate-integration-guide.md): UAR.
- [Ashby Integration Guide](../articles/ashby-integration-guide.md): UAR; troubleshooting.
- [Atlassian Integration Guide](../articles/atlassian-integration-guide.md): UAR; Jira Service Management portal-only accounts in reviews.
- [Attio Integration Guide](../articles/attio-integration-guide.md): UAR.
- [Autodesk Integration Guide](../articles/autodesk-integration-guide.md): UAR.
- [AWS Inspector (Amazon Inspector) Integration Guide](../articles/aws-inspector-amazon-inspector-integration-guide.md): attach an Inspector policy to DrataAutopilotRole; findings by severity, region and date (vulnerability scans, DCF-18).
- [AWS Integration Guide (Infrastructure, User Access Review)](../articles/aws-integration-guide-infrastructure-user-access-review.md): cross-account role, Configure settings, region scope and resource scoping rules; extra permissions for backup and root tests.
- [BambooHR Integration Guide](../articles/bamboohr-integration-guide.md): HRIS: hire and separation dates, status.
- [Bitwarden Integration Guide](../articles/bitwarden-integration-guide.md): UAR with role visibility.
- [Bob (HiBob) Integration Guide](../articles/bob-hibob-integration-guide.md): HRIS by a Bob service user (the older method).
- [Bob (HiBob) OAuth Integration Guide](../articles/bob-hibob-oauth-integration-guide.md): HRIS by installing Drata from the Bob marketplace; how Bob changes show in Personnel; uninstall.
- [Box Integration Guide](../articles/box-integration-guide.md): UAR of users and groups (StackOne).
- [Bullhorn Integration Guide](../articles/bullhorn-integration-guide.md): UAR (StackOne).
- [Canva Integration Guide](../articles/canva-integration-guide.md): UAR with roles.
- [Certn Integration Guide (Background Check)](../articles/certn-integration-guide-background-check.md): start checks from Drata, store summaries; package choice; how personnel complete them.
- [Checkr Integration Guide](../articles/checkr-integration-guide.md): background checks synced and linked to personnel; two-step drawer, nodes and packages.
- [ClearCompany (formerly Brainer)](../articles/clearcompany-formerly-brainer.md): LMS API client for training records.
- [Confluence Integration Guide](../articles/confluence-integration-guide.md): import policy pages so Drata runs approval and acknowledgement.
- [Contentful Integration Guide](../articles/contentful-integration-guide.md): UAR; troubleshooting.
- [Cornerstone Integration Guide](../articles/cornerstone-integration-guide.md): API app with training scopes for completion records.
- [Coursera Integration Guide](../articles/coursera-integration-guide.md): API app for training completion.
- [Coverdash Integration Guide](../articles/coverdash-integration-guide.md): insurance policy expiry tracking; documents land in the Evidence Library.
- [CrowdStrike Falcon Exposure Management Integration Guide](../articles/crowdstrike-falcon-exposure-management-integration-guide.md): vulnerability findings with SLA tracking.
- [CrowdStrike Integration Guide](../articles/crowdstrike-integration-guide.md): EDR: antivirus per device for Test 64; link devices to personnel; where device data shows.
- [Databricks Integration Guide (UAR)](../articles/databricks-integration-guide-uar.md): UAR (StackOne).
- [Datadog Integration Guide](../articles/datadog-integration-guide.md): observability: which monitors each test expects (Tests 109 to 129), the accounts table, troubleshooting.
- [DataGrail Integration Guide](../articles/datagrail-integration-guide.md): the reverse direction: DataGrail reads Drata's connections into its data map.
- [Dayforce Integration Guide (HRIS)](../articles/dayforce-integration-guide-hris.md): HRIS lifecycle sync.
- [Dialpad Integration Guide](../articles/dialpad-integration-guide.md): UAR.
- [Dixa Integration Guide](../articles/dixa-integration-guide.md): UAR.
- [Docebo Integration Guide](../articles/docebo-integration-guide.md): OAuth app for training records (StackOne).
- [DocuSign Integration Guide](../articles/docusign-integration-guide.md): NDAs sent to Trust Center requesters before private files open; templates; envelope tracking.
- [Domo Integration Guide](../articles/domo-integration-guide.md): UAR.
- [Dropbox Integration Guide](../articles/dropbox-integration-guide.md): UAR of users and groups (StackOne).
- [Dropbox Sign Integration Guide](../articles/dropbox-sign-integration-guide.md): UAR with roles.
- [Duo Integration Guide](../articles/duo-integration-guide.md): UAR of users and admins.
- [EasyLlama Integration Guide](../articles/easyllama-integration-guide.md): security training: pick campaigns in the drawer, then set the training method in Personnel Compliance.
- [Egnyte Integration Guide (UAR)](../articles/egnyte-integration-guide-uar.md): UAR with a permissions table (StackOne).
- [Elastic Integration Guide](../articles/elastic-integration-guide.md): UAR of an Elastic Cloud organization.
- [Enterprise SCIM Integration Guide](../articles/enterprise-scim-integration-guide.md): SCIM directory sync keeps Personnel current within minutes, beside the daily IdP sync; setup wizard, limits, FAQ.
- [Envoy Integration Guide](../articles/envoy-integration-guide.md): UAR.
- [Fivetran Integration Guide](../articles/fivetran-integration-guide.md): UAR.
- [Freshsales Integration Guide (UAR)](../articles/freshsales-integration-guide-uar.md): UAR.
- [Freshteam Integration Guide](../articles/freshteam-integration-guide.md): HRIS lifecycle sync.
- [GitLab VMS Integration Guide](../articles/gitlab-vms-integration-guide.md): GitLab scanner findings as vulnerability evidence (DCF-18).
- [GO1 Integration Guide](../articles/go1-integration-guide.md): OAuth app for training records (StackOne).
- [Gong Integration Guide](../articles/gong-integration-guide.md): UAR.
- [Google Workspace Integration Guide (User Access Reviews)](../articles/google-workspace-integration-guide-user-access-reviews.md): UAR with admin-privilege visibility; managing and disconnecting accounts.
- [Greenhouse Integration Guide](../articles/greenhouse-integration-guide.md): reconnect by OAuth before the old API retires (31 Aug 2026); the "Needs migration" card and Reconnect banner.
- [Gusto Integration Guide](../articles/gusto-integration-guide.md): HRIS; verify the connection.
- [Harvest Integration Guide](../articles/harvest-integration-guide.md): UAR.
- [Hexnode UEM (macOS) Integration Guide](../articles/hexnode-uem-macos-integration-guide.md): MDM: policies in Hexnode, the connection, then device automation in Drata.
- [Hexnode UEM (Windows) Integration Guide](../articles/hexnode-uem-windows-integration-guide.md): the same three steps for Windows.
- [HireRight Integration Guide](../articles/hireright-integration-guide.md): background check records uploaded to personnel.
- [HR Cloud Integration Guide](../articles/hr-cloud-integration-guide.md): HRIS lifecycle sync.
- [HubSpot Integration Guide (UAR)](../articles/hubspot-integration-guide-uar.md): UAR.
- [Huntress (Security Training) Integration Guide](../articles/huntress-security-training-integration-guide.md): how Drata decides a person has completed training; employee onboarding view (Tests 42, 43).
- [Infosec IQ Integration Guide](../articles/infosec-iq-integration-guide.md): training data; North American or EU server.
- [Intercom Integration Guide](../articles/intercom-integration-guide.md): UAR.
- [Ironclad Integration Guide (UAR)](../articles/ironclad-integration-guide-uar.md): UAR.
- [Jamf Integration Guide](../articles/jamf-integration-guide.md): MDM: API role and client in Jamf, Connect Jamf Pro wizard, then Workstation configuration monitoring set to Jamf.
- [JetBrains Integration Guide](../articles/jetbrains-integration-guide.md): UAR of Space users and teams.
- [Jit Integration Guide](../articles/jit-integration-guide.md): a partner connection that pushes SOC 2 evidence; it does not run Drata's own tests.
- [JumpCloud Integration Guide (MDM)](../articles/jumpcloud-integration-guide-mdm.md): MDM by a scheduled JumpCloud command that reports device checks.
- [Justworks Integration Guide](../articles/justworks-integration-guide.md): HRIS; troubleshooting.
- [Kameleoon Integration Guide](../articles/kameleoon-integration-guide.md): UAR.
- [Kandji (now Iru) Integration Guide (MDM)](../articles/kandji-now-iru-integration-guide-mdm.md): MDM: API token in Kandji, the provider drawer, workstation monitoring toggles.
- [KarmaCheck Integration Guide](../articles/karmacheck-integration-guide.md): background checks from onboarding; client access token.
- [Klaviyo Integration Guide](../articles/klaviyo-integration-guide.md): UAR; troubleshooting.
- [KnowBe4 Integration Guide](../articles/knowbe4-integration-guide.md): map KnowBe4 campaigns to training categories; how compliance is decided; My Drata onboarding view (Test 42).
- [Lacework Integration Guide (UAR)](../articles/lacework-integration-guide-uar.md): UAR.
- [LastPass Integration Guide](../articles/lastpass-integration-guide.md): UAR.
- [Lattice HRIS Integration Guide](../articles/lattice-hris-integration-guide.md): HRIS (through Merge); the fields synced.
- [Lattice Integration Guide](../articles/lattice-integration-guide.md): UAR.
- [Leapsome Integration Guide](../articles/leapsome-integration-guide.md): UAR.
- [Legacy: Microsoft Intune Integration Guide (Mac Devices)](../articles/legacy-microsoft-intune-integration-guide-mac-devices.md): macOS compliance and custom profiles in Intune, then Intune as the MDM source; GCC High.
- [Legacy: Microsoft Intune Integration Guide (Windows)](../articles/legacy-microsoft-intune-integration-guide-windows.md): the pre-May-2026 flow: Entra app, Windows policies, screen-lock issues, device sync.
- [Lever Integration Guide](../articles/lever-integration-guide.md): HRIS from hiring data.
- [LinkedIn Learning Integration Guide](../articles/linkedin-learning-integration-guide.md): client id and secret for training records.
- [Make Integration Guide](../articles/make-integration-guide.md): UAR of users, organizations and teams.
- [MeisterTask Integration Guide (UAR)](../articles/meistertask-integration-guide-uar.md): UAR.
- [Microsoft Defender Vulnerability Management Integration Guide](../articles/microsoft-defender-vulnerability-management-integration-guide.md): vulnerability findings by severity.
- [Microsoft Intune Integration guide](../articles/microsoft-intune-integration-guide.md): the current Intune flow: OAuth app, permissions, compliance policies, connect; feeds Tests 61, 63 to 66.
- [Microsoft Teams Integration Guide](../articles/microsoft-teams-integration-guide.md): notifications to channels about Not Ready controls and pending personnel actions.
- [Miro Integration](../articles/miro-integration.md): UAR; client id and secret in the drawer.
- [Mixpanel Integration Guide](../articles/mixpanel-integration-guide.md): UAR.
- [Netlify Integration Guide (User Access Review)](../articles/netlify-integration-guide-user-access-review.md): UAR.
- [New Relic Integration Guide](../articles/new-relic-integration-guide.md): observability: alert conditions behind Tests 112 and 118.
- [NinjaOne Integration Guide](../articles/ninjaone-integration-guide.md): MDM: device compliance data from NinjaOne, a long setup of policies and scripts.
- [Notion Integration Guide](../articles/notion-integration-guide.md): sync policy pages for approval and acknowledgement in Drata.
- [Okta Integration Guide (User Access Review)](../articles/okta-integration-guide-user-access-review.md): Okta as a UAR connection; deprovisioning evidence.
- [Oneflow Integration Guide (UAR)](../articles/oneflow-integration-guide-uar.md): UAR.
- [OpenAI Integration Guide](../articles/openai-integration-guide.md): UAR.
- [OpenVPN Integration Guide](../articles/openvpn-integration-guide.md): UAR of VPN users.
- [Oracle HCM Integration Guide](../articles/oracle-hcm-integration-guide.md): user access levels and roles for access controls.
- [Orca Security Integration Guide](../articles/orca-security-integration-guide.md): vulnerability findings (DCF-18); API token and region; permissions table.
- [PagerDuty Integration Guide](../articles/pagerduty-integration-guide.md): UAR.
- [Paycom Integration Guide (HRIS)](../articles/paycom-integration-guide-hris.md): HRIS: status, start and separation dates.
- [Paylocity Integration Guide](../articles/paylocity-integration-guide.md): HRIS.
- [PeopleFluent Integration Guide](../articles/peoplefluent-integration-guide.md): user and profile sync for access evidence.
- [Pinpoint Integration Guide](../articles/pinpoint-integration-guide.md): UAR.
- [Pipedrive Integration Guide](../articles/pipedrive-integration-guide.md): UAR.
- [Qlik Integration Guide](../articles/qlik-integration-guide.md): UAR.
- [Qualys Integration Guide](../articles/qualys-integration-guide.md): vulnerability findings with SLA; View findings from the connection card.
- [Rapid7 InsightVM (On-Prem, Reports-Only) Integration Guide](../articles/rapid7-insightvm-on-prem-reports-only-integration-guide.md): reports, not findings, attached to controls.
- [Rapid7 InsightVM Integration Guide](../articles/rapid7-insightvm-integration-guide.md): vulnerability findings with SLA.
- [Recruitee Integration Guide](../articles/recruitee-integration-guide.md): UAR.
- [Render Integration Guide](../articles/render-integration-guide.md): UAR.
- [Retool Integration Guide](../articles/retool-integration-guide.md): UAR.
- [RingCentral Integration Guide](../articles/ringcentral-integration-guide.md): UAR (StackOne).
- [Rippling Integration Guide (HRIS, MDM, UAR)](../articles/rippling-integration-guide-hris-mdm-uar.md): one connection, three types: lifecycle, device compliance, access.
- [Rollbar Integration Guide](../articles/rollbar-integration-guide.md): UAR.
- [Salesforce Integration Guide (User Access Review)](../articles/salesforce-integration-guide-user-access-review.md): UAR through a connected app; IP restrictions; troubleshooting.
- [Salesloft Integration Guide](../articles/salesloft-integration-guide.md): UAR.
- [SAP SuccessFactors Integration Guide](../articles/sap-successfactors-integration-guide.md): HRIS by OAuth client; choose legal or preferred name.
- [Scaleway Integration Guide](../articles/scaleway-integration-guide.md): UAR of users and applications.
- [Segment Integration Guide](../articles/segment-integration-guide.md): UAR.
- [Semgrep Integration Guide](../articles/semgrep-integration-guide.md): findings for the vulnerability scanning test (DCF-18); View Findings.
- [SendGrid Integration Guide](../articles/sendgrid-integration-guide.md): UAR.
- [SentinelOne (EDR) Integration Guide](../articles/sentinelone-edr-integration-guide.md): EDR: antivirus per device, linked devices table, where it shows in Personnel and Assets; disabling.
- [SentinelOne Singularity Vulnerability Management (VMS) Integration Guide](../articles/sentinelone-singularity-vulnerability-management-vms-integration-guide.md): vulnerability findings with daily SLA tracking.
- [Sentry Integration Guide](../articles/sentry-integration-guide.md): UAR.
- [Single Sign-On Connection](../articles/single-sign-on-connection.md): sign in to Drata through your IdP; restrict by synced users and groups; reset.
- [Slack Integration Guide (Communication and UAR)](../articles/slack-integration-guide-communication-and-uar.md): notifications to chosen channels, plus UAR.
- [SmartRecruiters Integration Guide](../articles/smartrecruiters-integration-guide.md): UAR.
- [Smartsheet Integration Guide](../articles/smartsheet-integration-guide.md): UAR (StackOne).
- [Snowflake Integration Guide](../articles/snowflake-integration-guide.md): UAR by a dedicated user and role.
- [Snyk Integration Guide](../articles/snyk-integration-guide.md): vulnerability ingestion with severity and first-seen filters; SLA due dates.
- [Socket Integration Guide](../articles/socket-integration-guide.md): open supply-chain alerts and repositories mapped into Drata's security data.
- [SonarCloud Integration Guide](../articles/sonarcloud-integration-guide.md): UAR of organization members.
- [Sophos Integration Guide](../articles/sophos-integration-guide.md): UAR.
- [Sterling Integration Guide](../articles/sterling-integration-guide.md): one-way upload of background check results, matched to personnel; verify the upload.
- [Tableau Integration Guide](../articles/tableau-integration-guide.md): UAR.
- [TalentLMS Integration Guide](../articles/talentlms-integration-guide.md): UAR.
- [Teamtailor Integration Guide](../articles/teamtailor-integration-guide.md): user, role and permission sync.
- [TeamViewer (Remote) Integration Guide](../articles/teamviewer-remote-integration-guide.md): UAR.
- [Tenable Vulnerability Management Integration Guide](../articles/tenable-vulnerability-management-integration-guide.md): vulnerability findings (DCF-18).
- [Terraform Integration Guide](../articles/terraform-integration-guide.md): UAR of Terraform Cloud users.
- [Toggl Integration Guide](../articles/toggl-integration-guide.md): UAR.
- [TriNet Integration Guide](../articles/trinet-integration-guide.md): HRIS; revoke or regenerate access.
- [Twilio Integration Guide](../articles/twilio-integration-guide.md): UAR.
- [Udemy Integration Guide](../articles/udemy-integration-guide.md): user sync and course completion as training evidence.
- [UKG Pro Integration Guide](../articles/ukg-pro-integration-guide.md): HRIS lifecycle sync.
- [UKG Ready Integration Guide](../articles/ukg-ready-integration-guide.md): HRIS; fewer "Unknown" personnel statuses; domain dialog.
- [Upwind Integration Guide](../articles/upwind-integration-guide.md): vulnerability findings (DCF-18).
- [Vercel Integration Guide](../articles/vercel-integration-guide.md): UAR.
- [Vetty Integration Guide](../articles/vetty-integration-guide.md): background checks sent from Drata, results back by webhook.
- [Webex Integration Guide](../articles/webex-integration-guide.md): UAR (StackOne).
- [Wiz (CSPM) Integration Guide](../articles/wiz-cspm-integration-guide.md): CSPM issues for Tests 208 to 210; risk categories; one rule per workspace; auto-pilot sync; delete.
- [Wiz (Vulnerability Scanning) Integration Guide](../articles/wiz-vulnerability-scanning-integration-guide.md): Wiz findings as the vulnerability scanning type.
- [Wiz Code Integration Guide (Vulnerability Scanning)](../articles/wiz-code-integration-guide-vulnerability-scanning.md): Wiz Code service account with scoped permissions.
- [Workable Integration Guide](../articles/workable-integration-guide.md): UAR.
- [Workday Integration Guide (HRIS)](../articles/workday-integration-guide-hris.md): HRIS by integration user (a seven-step dialog) or by OAuth.
- [Workday Learning Integration Guide](../articles/workday-learning-integration-guide.md): training completion from Workday Learning.
- [Workspace ONE MDM Integration Guide](../articles/workspace-one-mdm-integration-guide.md): MDM: compliance policies and profiles in Workspace ONE, then the provider drawer with Save & Test Connection.
- [Xero Integration Guide (UAR)](../articles/xero-integration-guide-uar.md): UAR.
- [Xyleme Integration Guide](../articles/xyleme-integration-guide.md): tenant domain and an admin user for training records.
- [Zelt Integration Guide](../articles/zelt-integration-guide.md): UAR (StackOne).
- [Zinc Integration Guide (Background Check)](../articles/zinc-integration-guide-background-check.md): checks ordered from My Drata, status sync, matching to personnel, how Zinc's statuses read in Drata.

### Connection Support › Ticketing Guidance (20)

- [Asana Integration Guide](../articles/asana-integration-guide.md): security tasks as vulnerability-management evidence; enabling write access.
- [Azure Boards (DevOps) Integration Guide](../articles/azure-boards-devops-integration-guide.md): Security label, write access, the four-step Create ticket dialog, tickets listed in Drata, what the connection tests.
- [ClickUp Integration Guide](../articles/clickup-integration-guide.md): create tasks or subtasks from controls, tests or risks; status shown in Drata.
- [Fibery Integration Guide](../articles/fibery-integration-guide.md): monitors that security issues are assigned and prioritised; supported field types.
- [Freshservice Integration Guide](../articles/freshservice-integration-guide.md): IT service desk activity as access and change evidence.
- [GitHub Issues Enterprise Integration Guide](../articles/github-issues-enterprise-integration-guide.md): hostname drawer; open and resolved vulnerability issues.
- [GitHub Issues Integration Guide](../articles/github-issues-integration-guide.md): security issues by severity label.
- [GitLab Issues (Self-Managed) Integration Guide](../articles/gitlab-issues-self-managed-integration-guide.md): the same for self-managed GitLab.
- [GitLab Issues Integration Guide](../articles/gitlab-issues-integration-guide.md): security issues by severity label.
- [Jira Data Center Integration](../articles/jira-data-center-integration.md): security ticket sync from Data Center; several accounts.
- [Jira Integration Guide](../articles/jira-integration-guide.md): OAuth consent; security tickets feed Test 26 (prioritised).
- [Linear Integration Guide](../articles/linear-integration-guide.md): drawer with alias, label, write access and workspaces; three-step ticket dialog with seven optional fields.
- [ServiceNow Integration Guide](../articles/servicenow-integration-guide.md): subdomain, account, connect; incidents, problems and tasks as security tickets; optional ticket creation.
- [Shortcut Integration Guide](../articles/shortcut-integration-guide.md): vulnerability tickets resolved within the SLA.
- [Split Ticket Routing - Private Beta](../articles/split-ticket-routing-private-beta.md): AWS Org Units connection's Ticket routing tab: one Jira ticket per account id or tag value, routes table with health.
- [Target Process Integration Guide](../articles/target-process-integration-guide.md): security tickets by severity.
- [Ticket Automation (Jira-only) (New experience)](../articles/ticket-automation-jira-only-new-experience.md): write access on the Jira connection, then rules that open tickets on control and test events.
- [Trello Integration Guide](../articles/trello-integration-guide.md): Trello cards as security-ticket evidence by severity label.
- [Zoho Bug Tracker Integration Guide](../articles/zoho-bug-tracker-integration-guide.md): security tickets tracked to remediation.
- [Zoho Desk Integration Guide (Ticketing & UAR)](../articles/zoho-desk-integration-guide-ticketing-uar.md): region dialog, tickets from controls, tests and risks, where to view and manage them.

### Connection Support › Version Control Guidance (8)

- [AWS CodeCommit Integration Guide](../articles/aws-codecommit-integration-guide.md): IAM role for CodeCommit evidence.
- [Azure Repos (DevOps) Integration Guide](../articles/azure-repos-devops-integration-guide.md): repo users, code review evidence, MFA (Test 87).
- [BitBucket Integration Guide](../articles/bitbucket-integration-guide.md): one connection usable as Codebase, Ticketing, UAR or Version Control.
- [Connecting Private Git via AWS PrivateLink](../articles/connecting-private-git-via-aws-privatelink.md): five steps to expose an internal Git server to Drata over PrivateLink.
- [GitHub Enterprise Server Integration Guide](../articles/github-enterprise-server-integration-guide.md): SDLC evidence from a self-hosted GitHub.
- [GitHub Integration Guide](../articles/github-integration-guide.md): install the Drata app on the organization, not a personal account; remediation pull requests; disconnect.
- [GitLab Integration Guide](../articles/gitlab-integration-guide.md): users, groups and projects; MFA (Test 87).
- [GitLab self-managed Integration Guide](../articles/gitlab-self-managed-integration-guide.md): the Beta self-managed cards for access review and version control (Tests 9, 87).

### Monitoring Test Guidance (168)

- [Example Evidence Gitlab On-Prem](../articles/example-evidence-gitlab-on-prem.md): what evidence a self-hosted GitLab must supply by hand for DCF-4, 5, 6, 67, 70 and 71.
- [February 2025 Release: AWS and Azure Drata Tests](../articles/february-2025-release-aws-and-azure-drata-tests.md): a table of new AWS and Azure tests with the DCF controls they map to.
- [October 2024 Release: AWS Drata test](../articles/october-2024-release-aws-drata-test.md): the CIS-based AWS tests (214 to 234 and others), their controls, enabling them, troubleshooting.
- [Test 102: Public SSH Denied](../articles/test-102-public-ssh-denied.md): no security group opens SSH to 0.0.0.0/0; Denial of Public SSH.
- [Test 104: Cloud Storage Public Access Disabled](../articles/test-104-cloud-storage-public-access-disabled.md): buckets and storage accounts block public access; per-provider steps.
- [Test 105: Threat Detection in Place](../articles/test-105-threat-detection-in-place.md): GuardDuty enabled; Logging/Monitoring.
- [Test 106: Has a Backup Policy](../articles/test-106-has-a-backup-policy.md): a Backup Policy in force and not past renewal.
- [Test 107: Daily Database Backups](../articles/test-107-daily-database-backups.md): database backup schedule is daily, per provider.
- [Test 108: Storage Data Versioned or Retained](../articles/test-108-storage-data-versioned-or-retained.md): bucket versioning or retention on.
- [Test 109: Logs are Centrally Stored](../articles/test-109-logs-are-centrally-stored.md): logs go to a central sink.
- [Test 110: Only Authorized Users can Access Log Sinks](../articles/test-110-only-authorized-users-can-access-log-sinks.md): log sink access limited.
- [Test 111: Logs are Retained for 365 Days](../articles/test-111-logs-are-retained-for-365-days.md): logs archived for a year.
- [Test 112: Database CPU Monitored](../articles/test-112-database-cpu-monitored.md): a CPU alarm on every database, per provider and Datadog.
- [Test 113: Database Free Storage Space Monitored](../articles/test-113-database-free-storage-space-monitored.md): a free-storage alarm per database engine.
- [Test 114: Database Read I/O Monitored](../articles/test-114-database-read-i-o-monitored.md): a read I/O alarm per database.
- [Test 115: Messaging Queue Message Age Monitored](../articles/test-115-messaging-queue-message-age-monitored.md): a message-age alarm on queues.
- [Test 116: NoSQL Cluster CPU Load Monitored](../articles/test-116-nosql-cluster-cpu-load-monitored.md): a CPU alarm on NoSQL clusters (DCF-83).
- [Test 117: NoSQL Cluster Storage Utilization Monitored](../articles/test-117-nosql-cluster-storage-utilization-monitored.md): a storage alarm on NoSQL clusters.
- [Test 118: Infrastructure Instance CPU Monitored](../articles/test-118-infrastructure-instance-cpu-monitored.md): a CPU alarm on every instance; the longest test page (2,824 words).
- [Test 119: Firewall Default Disallows Traffic](../articles/test-119-firewall-default-disallows-traffic.md): firewalls deny what is not allowed.
- [Test 11: Contact Information Available to Customers](../articles/test-11-contact-information-available-to-customers.md): a support URL recorded in Drata.
- [Test 121: Logs Monitored for Suspicious Activity](../articles/test-121-logs-monitored-for-suspicious-activity.md): a Datadog security notification rule exists.
- [Test 122: Web Application Firewall in Place](../articles/test-122-web-application-firewall-in-place.md): a WAF deployed and blocking (AWS, GCP, Cloudflare).
- [Test 123: Cloud Infrastructure Linked to Drata](../articles/test-123-cloud-infrastructure-linked-to-drata.md): a cloud connection exists.
- [Test 124: Root Infrastructure Account Unused](../articles/test-124-root-infrastructure-account-unused.md): AWS root not used recently.
- [Test 127: Security Policies Cover Encryption](../articles/test-127-security-policies-cover-encryption.md): policies explain encryption of sensitive data.
- [Test 128: Physical Security Policy](../articles/test-128-physical-security-policy.md): a Physical Security Policy in force.
- [Test 129: Capacity and Usage Monitoring](../articles/test-129-capacity-and-usage-monitoring.md): usage reports readable (Datadog usage permission).
- [Test 130: Load Balancer Used](../articles/test-130-load-balancer-used.md): load balancers span availability zones.
- [Test 131: Autoscaling Configurations in Place](../articles/test-131-autoscaling-configurations-in-place.md): autoscaling on compute (DCF-97).
- [Test 132: Daily backup job status monitored](../articles/test-132-daily-backup-job-status-monitored.md): a successful snapshot yesterday (DCF-99).
- [Test 133: Failed Backup Alerts Being Sent](../articles/test-133-failed-backup-alerts-being-sent.md): alerts on failed backups (DCF-99).
- [Test 134: Failed Backups Addressed in Timely Manner](../articles/test-134-failed-backups-addressed-in-timely-manner.md): failed backups resolved promptly (DCF-99).
- [Test 136: Data Retention Policy](../articles/test-136-data-retention-policy.md): a Data Deletion Policy with a retention period.
- [Test 137: Data Classification Policy](../articles/test-137-data-classification-policy.md): a Data Classification Policy in force.
- [Test 138: Deleting Customer Data Upon Terminated Contract](../articles/test-138-deleting-customer-data-upon-terminated-contract.md): deletion periods in the Data Deletion Policy.
- [Test 13: System Access Control Policy](../articles/test-13-system-access-control-policy.md): a System Access Control Policy in force.
- [Test 141: Clean Desk Policy](../articles/test-141-clean-desk-policy.md): clean desk covered by an approved policy.
- [Test 143: Sensitive Data Disposal Policy](../articles/test-143-sensitive-data-disposal-policy.md): paper disposal covered by an approved policy.
- [Test 16: Information Security Policy](../articles/test-16-information-security-policy.md): an Information Security Policy in force.
- [Test 17: Maintains Organization Chart](../articles/test-17-maintains-organization-chart.md): an org chart uploaded in the last 12 months (Settings › Personnel Compliance › Human Resources).
- [Test 18: Risk Assessment Policy](../articles/test-18-risk-assessment-policy.md): a Risk Assessment Policy in force.
- [Test 1: Policies Cover Employee Access](../articles/test-1-policies-cover-employee-access.md): policies set rules for employee access to customer data.
- [Test 205: CloudTrail log file integrity validation enabled](../articles/test-205-cloudtrail-log-file-integrity-validation-enabled.md): log validation on every trail (DCF-478, CIS).
- [Test 206: SQL Freeable Memory Monitored](../articles/test-206-sql-freeable-memory-monitored.md): a freeable-memory alarm (DCF-86).
- [Test 208: Excessive Privileges Assigned](../articles/test-208-excessive-privileges-assigned.md): no open CSPM issues about over-privileged accounts.
- [Test 209: External Exposure of Cloud Resources](../articles/test-209-external-exposure-of-cloud-resources.md): no open CSPM issues about public exposure.
- [Test 210: Encryption in Transit](../articles/test-210-encryption-in-transit.md): no open CSPM issues about unencrypted transit.
- [Test 214: MFA for AWS Root Account](../articles/test-214-mfa-for-aws-root-account.md): root has MFA (DCF-90, CIS).
- [Test 215: AWS IAM Password Minimum Length](../articles/test-215-aws-iam-password-minimum-length.md): 14 characters or more (DCF-68, DCF-346, CIS).
- [Test 216: AWS IAM Password Reuse](../articles/test-216-aws-iam-password-reuse.md): last 24 passwords blocked (DCF-350, CIS).
- [Test 217: AWS IAM Group-Based Access Control](../articles/test-217-aws-iam-group-based-access-control.md): permissions only through groups (DCF-776, CIS).
- [Test 218: AWS EBS Volume Encryption](../articles/test-218-aws-ebs-volume-encryption.md): default EBS encryption in used regions (DCF-54, CIS).
- [Test 219: AWS RDS Auto Minor Version Upgrade](../articles/test-219-aws-rds-auto-minor-version-upgrade.md): auto minor upgrades on (DCF-152, CIS).
- [Test 21: Vulnerability Scanning](../articles/test-21-vulnerability-scanning.md): a vulnerability scanner is connected; Quarterly Vulnerability Scan.
- [Test 220: AWS RDS Public Access Restricted](../articles/test-220-aws-rds-public-access-restricted.md): no RDS open to 0.0.0.0/0 (DCF-75, CIS).
- [Test 221: AWS S3 Bucket Access Logging](../articles/test-221-aws-s3-bucket-access-logging.md): access logging on the CloudTrail bucket (DCF-406, CIS).
- [Test 222: AWS CloudTrail Logs Encrypted](../articles/test-222-aws-cloudtrail-logs-encrypted.md): trails encrypted with customer keys (DCF-54, CIS).
- [Test 223: AWS CMK Rotation](../articles/test-223-aws-cmk-rotation.md): key rotation on customer keys (DCF-779, CIS).
- [Test 224: AWS VPC Flow Logging](../articles/test-224-aws-vpc-flow-logging.md): flow logs on every VPC (DCF-406, CIS).
- [Test 225: Hardware MFA for AWS Root Account](../articles/test-225-hardware-mfa-for-aws-root-account.md): root uses hardware MFA (DCF-90, CIS).
- [Test 226: AWS S3 Object-Level Logging for Read & Write Events](../articles/test-226-aws-s3-object-level-logging-for-read-write-events.md): object-level data events logged (DCF-406, CIS).
- [Test 227: AWS Network ACLs Public Remote Server Administration Access Restricted](../articles/test-227-aws-network-acls-public-remote-server-administration-access-restricted.md): no NACL opens 22 or 3389 to the world (DCF-73, CIS).
- [Test 228: AWS Security Groups Restrict Public RDP Access](../articles/test-228-aws-security-groups-restrict-public-rdp-access.md): no security group opens RDP publicly (DCF-73, CIS).
- [Test 229: AWS IAM Unused Credentials](../articles/test-229-aws-iam-unused-credentials.md): credentials used within 45 days (DCF-335, CIS).
- [Test 230: AWS IAM Principle of Least Privilege](../articles/test-230-aws-iam-principle-of-least-privilege.md): no policy grants full admin (DCF-776, CIS).
- [Test 231: AWS EFS Encrypted at Rest](../articles/test-231-aws-efs-encrypted-at-rest.md): EFS encrypted with KMS (DCF-54, CIS).
- [Test 232: AWS IAM Access Key Rotation](../articles/test-232-aws-iam-access-key-rotation.md): access keys younger than 90 days (DCF-783, CIS).
- [Test 233: AWS VPC Default Security Groups Restrict All Traffic](../articles/test-233-aws-vpc-default-security-groups-restrict-all-traffic.md): default groups allow nothing (DCF-85, CIS).
- [Test 234: AWS S3 HTTP Requests Denied](../articles/test-234-aws-s3-http-requests-denied.md): bucket policies deny plain HTTP (DCF-55, CIS).
- [Test 243: Azure Log Alert for Create Policy Assignment](../articles/test-243-azure-log-alert-for-create-policy-assignment.md): an activity log alert exists for this event (DCF-406, DCF-86).
- [Test 244: Azure Log Alert for Delete Public IP Address](../articles/test-244-azure-log-alert-for-delete-public-ip-address.md): the same for deleting a public IP (DCF-406, 407, 86; CIS).
- [Test 245: Azure Log Alert for Delete Policy Assignment](../articles/test-245-azure-log-alert-for-delete-policy-assignment.md): the same for deleting a policy assignment.
- [Test 246: Azure Log Alert for Create or Update Network Security Group](../articles/test-246-azure-log-alert-for-create-or-update-network-security-group.md): the same for NSG changes.
- [Test 247: Azure Log Alert for Delete Network Security Group](../articles/test-247-azure-log-alert-for-delete-network-security-group.md): the same for NSG deletion.
- [Test 248: Azure Log Alert for Create or Update Security Solution](../articles/test-248-azure-log-alert-for-create-or-update-security-solution.md): the same for security solution changes.
- [Test 249: Azure Log Alert for Delete Security Solution](../articles/test-249-azure-log-alert-for-delete-security-solution.md): the same for security solution deletion.
- [Test 250: Azure Log Alert for Create or Update SQL Server Firewall Rule](../articles/test-250-azure-log-alert-for-create-or-update-sql-server-firewall-rule.md): the same for SQL firewall rule changes.
- [Test 251: Azure Log Alert for Delete SQL Server Firewall Rule](../articles/test-251-azure-log-alert-for-delete-sql-server-firewall-rule.md): the same for SQL firewall rule deletion.
- [Test 252: Azure Log Alert for Create or Update Public IP Address rule](../articles/test-252-azure-log-alert-for-create-or-update-public-ip-address-rule.md): the same for public IP changes (DCF-406, DCF-86).
- [Test 253: Azure Storage Accounts Accessed Via Private Endpoints](../articles/test-253-azure-storage-accounts-accessed-via-private-endpoints.md): storage reached by private endpoints (DCF-55, DCF-748, CIS).
- [Test 254: Azure Key Vaults Key Expiration](../articles/test-254-azure-key-vaults-key-expiration.md): every enabled key has an expiry (DCF-779, CIS).
- [Test 256: Azure SQL Servers Auditing](../articles/test-256-azure-sql-servers-auditing.md): SQL server auditing on (DCF-406, DCF-407, CIS).
- [Test 257: Azure PostgreSQL Database Server Log Checkpoints](../articles/test-257-azure-postgresql-database-server-log-checkpoints.md): log_checkpoints on (DCF-406, CIS).
- [Test 263: Azure Storage Accounts Secure TLS Configuration](../articles/test-263-azure-storage-accounts-secure-tls-configuration.md): minimum TLS 1.2 (DCF-55, DCF-285, CIS).
- [Test 268: Azure Network Security Group SSH Public Access Restricted](../articles/test-268-azure-network-security-group-ssh-public-access-restricted.md): no NSG opens port 22 publicly (DCF-73, CIS).
- [Test 269: Azure App Service Web App Redirects HTTP Traffic to HTTPS](../articles/test-269-azure-app-service-web-app-redirects-http-traffic-to-https.md): HTTPS only on web apps (DCF-55, CIS).
- [Test 26: Security Issues are Prioritized](../articles/test-26-security-issues-are-prioritized.md): security tickets in the tracker carry a label and a priority.
- [Test 270: Azure SQL Data Encryption](../articles/test-270-azure-sql-data-encryption.md): transparent data encryption on (DCF-54, CIS).
- [Test 27: SLA for Security Bugs](../articles/test-27-sla-for-security-bugs.md): the Vulnerability Management Policy states a P0 SLA.
- [Test 28: Disaster Recovery Plan](../articles/test-28-disaster-recovery-plan.md): a Disaster Recovery Plan in force.
- [Test 290: AWS Database Writes I/O Monitored](../articles/test-290-aws-database-writes-i-o-monitored.md): a write I/O alarm per database (DCF-86).
- [Test 291: AWS Security Groups HTTP Access Restricted](../articles/test-291-aws-security-groups-http-access-restricted.md): port 80 limited to named ranges (DCF-85).
- [Test 292: AWS EC2 Instances IMDSv1 Disabled](../articles/test-292-aws-ec2-instances-imdsv1-disabled.md): IMDSv2 only (DCF-12).
- [Test 293: AWS Classic Load Balancer Latency Monitored](../articles/test-293-aws-classic-load-balancer-latency-monitored.md): a latency alarm with an SNS subscriber (DCF-86).
- [Test 294: AWS Application Load Balancer Target Response Time Monitored](../articles/test-294-aws-application-load-balancer-target-response-time-monitored.md): a response-time alarm (DCF-86).
- [Test 295: AWS Classic Load Balancer Server Errors Monitored](../articles/test-295-aws-classic-load-balancer-server-errors-monitored.md): a server-error alarm (DCF-86).
- [Test 296: AWS Application Load Balancer Server Errors Monitored](../articles/test-296-aws-application-load-balancer-server-errors-monitored.md): a server-error alarm (DCF-86).
- [Test 297: AWS Classic Load Balancer Unhealthy Hosts Monitored](../articles/test-297-aws-classic-load-balancer-unhealthy-hosts-monitored.md): an unhealthy-host alarm (DCF-86).
- [Test 298: AWS Application Load Balancer Unhealthy Hosts Monitored](../articles/test-298-aws-application-load-balancer-unhealthy-hosts-monitored.md): an unhealthy-host alarm (DCF-86).
- [Test 299: AWS Application Load Balancer Redirects HTTP to HTTPS](../articles/test-299-aws-application-load-balancer-redirects-http-to-https.md): every listener redirects to HTTPS (DCF-55).
- [Test 2: Policies Cover Employee Confidentiality](../articles/test-2-policies-cover-employee-confidentiality.md): policies require confidentiality of customer data.
- [Test 300: AWS Lambda Error Rate Monitored](../articles/test-300-aws-lambda-error-rate-monitored.md): an error-rate alarm per function (DCF-86).
- [Test 301: AWS DynamoDB Point-in-Time Recovery Enabled](../articles/test-301-aws-dynamodb-point-in-time-recovery-enabled.md): PITR on every table (DCF-86).
- [Test 30: Availability Zones Used](../articles/test-30-availability-zones-used.md): resources span several zones.
- [Test 310: Audit Logs Enabled for EKS Clusters](../articles/test-310-audit-logs-enabled-for-eks-clusters.md): control-plane audit logs on (DCF-406, CIS).
- [Test 32: Policies for Tracking Security Items](../articles/test-32-policies-for-tracking-security-items.md): the incident plan covers follow-up tracking.
- [Test 33: Incident Response Plan (IRP)](../articles/test-33-incident-response-plan-irp.md): an Incident Response Plan in force.
- [Test 36: Has a SDLC Policy](../articles/test-36-has-a-sdlc-policy.md): an SDLC Policy in force.
- [Test 39: Security Policies are Reviewed](../articles/test-39-security-policies-are-reviewed.md): management approved policies before renewal.
- [Test 3: Least Privilege Policy for Customer Data Access](../articles/test-3-least-privilege-policy-for-customer-data-access.md): policies limit customer-data access to need.
- [Test 42: Policies for Security Awareness Training](../articles/test-42-policies-for-security-awareness-training.md): the security policy assigns training to the security team.
- [Test 43: Security Awareness Training Completed](../articles/test-43-security-awareness-training-completed.md): every employee has a training certificate.
- [Test 44: Acceptable Use Policy](../articles/test-44-acceptable-use-policy.md): an Acceptable Use Policy in force.
- [Test 45: Employees Acknowledge the Acceptable Use Policy](../articles/test-45-employees-acknowledge-the-acceptable-use-policy.md): every employee acknowledged it.
- [Test 46: Performance Evaluation Process](../articles/test-46-performance-evaluation-process.md): a performance evaluation process recorded.
- [Test 47: Employee Background Checks](../articles/test-47-employee-background-checks.md): every new employee has a background check.
- [Test 48: Contractors Acknowledge the Code of Conduct](../articles/test-48-contractors-acknowledge-the-code-of-conduct.md): every contractor acknowledged it.
- [Test 49: Contractors Acknowledge the Acceptable Use Policy](../articles/test-49-contractors-acknowledge-the-acceptable-use-policy.md): every contractor acknowledged it.
- [Test 4: SSL/TLS on Admin Page of Infrastructure Console](../articles/test-4-ssl-tls-on-admin-page-of-infrastructure-console.md): the console admin page serves a valid certificate.
- [Test 50: Contractor Background Checks](../articles/test-50-contractor-background-checks.md): every new contractor has a background check.
- [Test 51: Independent Board of Directors](../articles/test-51-independent-board-of-directors.md): board biographies saved.
- [Test 54: Formal Code of Conduct](../articles/test-54-formal-code-of-conduct.md): a Code of Conduct in force.
- [Test 55: Employees Acknowledge the Code of Conduct](../articles/test-55-employees-acknowledge-the-code-of-conduct.md): every employee acknowledged it.
- [Test 56: Data Protection Policy](../articles/test-56-data-protection-policy.md): a Data Protection Policy in force.
- [Test 58: New Hire Contracts](../articles/test-58-new-hire-contracts.md): a sample new-hire contract uploaded.
- [Test 59: Job Descriptions](../articles/test-59-job-descriptions.md): a careers URL recorded.
- [Test 5: A Version Control System is being Used](../articles/test-5-a-version-control-system-is-being-used.md): the VCS shows activity.
- [Test 60: Engineering Job Description](../articles/test-60-engineering-job-description.md): a sample engineering job description uploaded.
- [Test 61:  Screensaver Lock Required on Employee Computers](../articles/test-61-screensaver-lock-required-on-employee-computers.md): screen locks after 15 idle minutes, password within 60 seconds.
- [Test 62: Password Manager Required](../articles/test-62-password-manager-required.md): policy requires a password manager.
- [Test 63: Password Manager Records on Employee Computers](../articles/test-63-password-manager-records-on-employee-computers.md): each computer runs one.
- [Test 64: Malware Detection Software Installed](../articles/test-64-malware-detection-software-installed.md): each computer runs antivirus (agent, MDM or EDR).
- [Test 65: Security Patches Auto-Applied](../articles/test-65-security-patches-auto-applied.md): each computer auto-installs OS patches.
- [Test 66: Hard-Disk Encryption Enabled on Employee Computers](../articles/test-66-hard-disk-encryption-enabled-on-employee-computers.md): each disk encrypted.
- [Test 67: Cryptography Policy](../articles/test-67-cryptography-policy.md): an Encryption Policy in force.
- [Test 68: Customer Data is Encrypted at Rest](../articles/test-68-customer-data-is-encrypted-at-rest.md): databases holding customer data encrypted.
- [Test 69: Customer Data in Cloud Storage is Encrypted at Rest](../articles/test-69-customer-data-in-cloud-storage-is-encrypted-at-rest.md): buckets encrypted.
- [Test 6: Only Authorized Employees Access Version Control](../articles/test-6-only-authorized-employees-access-version-control.md): every VCS account maps to an IdP identity.
- [Test 70: SSL/TLS Enforced on Company Website](../articles/test-70-ssl-tls-enforced-on-company-website.md): the site answers only over HTTPS.
- [Test 71: SSL/TLS Configuration has No Known Issues](../articles/test-71-ssl-tls-configuration-has-no-known-issues.md): the site's TLS setup has no known flaws.
- [Test 72: SSL/TLS Certificate has Not Expired](../articles/test-72-ssl-tls-certificate-has-not-expired.md): the certificate is in date.
- [Test 7: Only Authorized Employees Change Code](../articles/test-7-only-authorized-employees-change-code.md): committers map to IdP identities.
- [Test 83: MSAs Offered to Customers](../articles/test-83-msas-offered-to-customers.md): a sample MSA uploaded.
- [Test 84: Privacy Policy Publicly Available](../articles/test-84-privacy-policy-publicly-available.md): a privacy policy URL recorded.
- [Test 85: Terms of Use Publicly Available](../articles/test-85-terms-of-use-publicly-available.md): a terms of service URL recorded.
- [Test 86: MFA on Identity Provider](../articles/test-86-mfa-on-identity-provider.md): every IdP user has MFA; per-IdP enforcement steps.
- [Test 87: MFA on Version Control System](../articles/test-87-mfa-on-version-control-system.md): every VCS account has MFA.
- [Test 88: MFA on Infrastructure Console](../articles/test-88-mfa-on-infrastructure-console.md): every console account requires MFA, per provider.
- [Test 89: Internal Password Policy for Employees](../articles/test-89-internal-password-policy-for-employees.md): a Password Policy in force.
- [Test 8: Formal Code Review Process](../articles/test-8-formal-code-review-process.md): branch rules require review before merge in every in-scope repo; per-VCS steps.
- [Test 94: Version Control Accounts Removed Properly](../articles/test-94-version-control-accounts-removed-properly.md): leavers removed from the VCS within the SLA.
- [Test 95: Infrastructure Accounts Properly Removed](../articles/test-95-infrastructure-accounts-properly-removed.md): leavers removed from the cloud console.
- [Test 96: Employees have Unique Email Accounts](../articles/test-96-employees-have-unique-email-accounts.md): IdP accounts are owned and unique.
- [Test 97: Employees have Unique Version Control Accounts](../articles/test-97-employees-have-unique-version-control-accounts.md): each VCS account maps to one IdP identity.
- [Test 98: Employees have Unique Infrastructure Accounts](../articles/test-98-employees-have-unique-infrastructure-accounts.md): each console account maps to one IdP identity.
- [Test 9: Production Code Changes Restricted](../articles/test-9-production-code-changes-restricted.md): only authorized users can merge to default branches; common setups and failure causes.
- [Test: Backups Checked for Integrity](../articles/test-backups-checked-for-integrity.md): restore test results uploaded.
- [Test: Critical Vulnerabilities Addressed](../articles/test-critical-vulnerabilities-addressed.md): no open critical findings unless fixed or excluded in the result drawer.
- [Test: Employees Acknowledge the Data Protection Policy](../articles/test-employees-acknowledge-the-data-protection-policy.md): every employee acknowledged it.
- [Test: Has Security Policies](../articles/test-has-security-policies.md): security policies cover operations, services and systems.
- [Test: High Vulnerabilities Addressed](../articles/test-high-vulnerabilities-addressed.md): the same for high findings.
- [Test: IRP Designates Responsible Team Members](../articles/test-irp-designates-responsible-team-members.md): the incident plan names roles.
- [Test: IRP Includes Lessons Learned](../articles/test-irp-includes-lessons-learned.md): the incident plan has a lessons-learned section.
- [Test: Policies are Acknowledged](../articles/test-policies-are-acknowledged.md): every employee acknowledged the security policies.
- [Test: Policies for a Security Team](../articles/test-policies-for-a-security-team.md): management named the security team.
- [Test: Process for Responsible Disclosure](../articles/test-process-for-responsible-disclosure.md): policies give employees a way to report violations.
- [Test: Termination Process and Checklist](../articles/test-termination-process-and-checklist.md): an offboarding checklist recorded.

## 2. Product surfaces

The guides show two generations side by side. The older one sits under Settings › Connections, with a navy sidebar, a "Types" rail and navy-headed drawers. The newer one ("new experience") is a top-level Connections destination with a light grey canvas, a filter panel, cards, a full-page wizard and a connection detail page. Most guides still show the older drawers for the connect step, so both are described here.

### 2.1 Connections page (All Connections gallery and Active list)

Layout (new experience):
- Shell: the main nav groups Workspace (Quick start, Dashboard, Recommendations, Tasks, Compliance, Events, Personnel) and Organization (Risk, Vendors, Governance, Trust); Connections, Library and Settings sit at the foot. Connections is its own destination, not a settings page.
- A second rail: "All Connections" at the top, then "Manage Accounts" with Access Reviews, Background Checks, Devices, Human Resources, Infrastructure, Observability and Version Control. Which entries show depends on what is connected.
- Title "All Connections" with a ⓘ; one outline button top right, "Custom connection".
- Tabs: Active, Available.
- A left filter panel: "Clear all filters", a two-icon toggle that collapses the panel, then "Operational status" (radio: Healthy, Unhealthy) and "Category" with a count chip once one is ticked. The categories, in order: Access Review, Audits, Automation tools, Background check, Codebase, Communication, CRM, CSPM, Custom, Cyber insurance, Digital signature, EDR, Enterprise SSO, External Policy, HRIS, Identity, Infrastructure, MDM and more below the fold.
- Over the cards: "Filters" and a search box, then a "Filters applied:" line of removable chips ("Infrastructure ×", "Vulnerability ×") and "Clear all".
- Active card: logo, name, account alias under it ("drata-acme"), a status chip top right ("Healthy", "Active"), sometimes a second warning chip ("⚠ Needs migration"); "Workspaces" chips; "Categories" chips; a rule; "Sync duration - 4 seconds" (or "8 minutes"); then a "View details" link. A vulnerability connection adds a filled "View findings" button beside it.
- Available card: logo, name, a sub-name where one card covers two ("& AWS Organizational Units"), Categories chips, and an outline "View and connect" button.
- A banner at the top of the page can carry "Set up SCIM" (from the SCIM guide).

Layout (older, Settings › Connections):
- Breadcrumb "Settings > Connections ⌄"; a column with "All Connections" over a "Types" list (Automation Tools, Background Checks, Communication, Digital Signature, EDR, Enterprise Single Sign-On, External Policy Management, HRIS, Identity, Infrastructure, MDM, Observability, Security Reviews, Security Training, Ticketing, User Access Review, Version Control, Vulnerability Scanning).
- Tabs "Active connections" and "Available connections" with "Search connections".
- Available view: an uppercase type heading ("USER ACCESS REVIEW", "VERSION CONTROL") with one line on what that type feeds, then logo tiles with "⊕ Connect" and a grey "BETA" chip where it applies.
- Active tile: logo, name, "Account ID: …", a green-dot "Active" chip, and a footer split into "View" and a type verb ("Review linked devices" for EDR).

Flow edges:
- → Available › View and connect → provider drawer (2.2), new style for cloud, older style for most others.
- → Active › View details → connection detail page (2.5).
- → View findings → the vulnerability findings list (another share).
- → Review linked devices → linked devices table (2.6).
- → Manage Accounts › an entry → the accounts table of that kind (2.6).
- → Custom connection → a custom connection (not shown in this share).

Images: `../../images/ux/connections/greenhouse-integration-guide--01.png`, `../../images/ux/connections/split-ticket-routing-private-beta--01.png`, `../../images/ux/connections/qualys-integration-guide--01.png`, `../../images/ux/connections/bob-hibob-oauth-integration-guide--02.png`, `../../images/ux/connections/gitlab-self-managed-integration-guide--02.png`, `../../images/ux/connections/sentinelone-edr-integration-guide--02.png`.

### 2.2 Provider drawer (connect, manage, disconnect)

Layout (new experience, a right-hand drawer over the gallery):
- "✕ Close" top right; a grey header band with the logo, the name ("AWS", "Google Cloud Platform") and one filled primary, "Create connection".
- "Benefits": three accordion rows, each an icon, a big number and a label: "4 Impact areas", "46 Controls", "83 Tests" for AWS; "4 / 22 / 19" for GCP. Each expands to the list.
- "Connection details": Description (one authored paragraph), Categories chips, and a type switch where one exists ("Using AWS Organizational Units", "Using Azure Management Groups"), which changes the wizard that follows.

Layout (older, navy header):
- Header "<Type> Provider | <Name>" ("Ticketing Provider | Linear", "MDM Provider | Workspace ONE", "Background Checks Provider | Checkr", "CSPM Provider | WIZ", "EDR Provider | SentinelOne"), with expand ⤢ and close ✕; a trash icon once connected.
- "Connection Instructions": numbered lines in plain words, sometimes "Step 1 of 2"; a link out to the full guide.
- Fields with red asterisks: "Account Alias", "Security Label" (with a hint that it is the label the team uses for security tickets), credentials (Server Url, Authentication Url, Client Key, Client Secret, Account ID; tenant, app id and secret; API URL and token), a region or hostname.
- Toggles: "Write Access" ("BETA" chip on Linear) to let Drata create tickets.
- A grey sub-panel "Workspace Connections" with a required multi-select, where the product has several workspaces.
- One footer primary in the vendor's words: "Connect your Linear account", "Connect your Azure Boards (DevOps) account", "Save & Test Connection", "Update Connection"; a two-choice footer for Checkr ("I need to create a Checkr account" outline, "I have a Checkr account" filled).
- Connected state: a green banner "✓ Checkr is connected" over "Last connected on Apr 23, 2024 @ 5:45:53 PM", a "← View Connection" link, then the settings that only exist after connecting (US and international node, package radios listing what each package searches).
- Error state: a red banner with an icon over the fields ("You can only configure a Wiz rule once per workspace").
- CSPM drawers carry rule choices as checkbox cards, each a bold name and one line ("User with excessive admin privileges", "External exposure"); these become Tests 208 to 210.
- MDM drawers say up front that connecting switches Workstation Configuration Monitoring to MDM (2.10).

Flow edges:
- → Create connection (new) → the full-page wizard (2.3).
- → Connect your X account (older, OAuth) → the vendor's consent page → back to Drata, connection confirmed.
- → Save & Test Connection → the drawer stays, a success or error banner shows.
- → trash → disconnect (the HiBob guide warns that deleting in Drata does not uninstall the app on the vendor side).

Images: `../../images/integrations/aws/aws-org-units-connection-instructions--01.png`, `../../images/integrations/gcp/gcp-integration-guide-script-setup--01.png`, `../../images/integrations/azure-boards/azure-boards-devops-integration-guide--01.png`, `../../images/integrations/linear/linear-integration-guide--01.png`, `../../images/integrations/checkr/checkr-integration-guide--01.png`, `../../images/integrations/checkr/checkr-integration-guide--03.png`, `../../images/integrations/workspace-one-mdm/workspace-one-mdm-integration-guide--01.png`, `../../images/integrations/wiz/wiz-cspm-integration-guide--02.png`.

### 2.3 Connect wizard (cloud: Configure, Connect, Scope, Confirm)

Layout:
- A full page: "← Back to Connections" link, logo tile, title "Connect Google Cloud Platform" ("Connect Azure", "Connect AWS GovCloud"), a rule.
- A vertical stepper on the left: 1 Configure, 2 Connect, 3 Scope, 4 Confirm. Done steps fill dark with a check; the current one is an outlined numeral; later ones grey.
- Configure: "Workspaces assigned" (searchable multi-select), then which providers to connect as switches, Infrastructure on by default, User Access Review off. AWS adds "Connect AWS Identity Center" and "Configure AWS connection in Drata using Terraform scripts".
- Connect: "Connection Instructions" as a short numbered list (Azure: Register a new Drata App; Create a client secret; Add required Read-Only permissions; Add a role to your company's Azure subscription), then the fields (Tenant ID, Application ID, Application Secret, Subscription ID, each with a grey example under the label). GCP offers "Option A (recommended)" scripts with "View in GitHub" links or "Option B" manual, then a "JSON Key File" drop zone ("Upload files", "Or drop files here", "JSON"). AWS shows the Drata account id and a tenant-specific external id to paste into the console, then a "Role ARN" field.
- "User Identity Mapping" (Azure): a yellow warning banner, then two radio cards, "UPN (User Principal Name)" and "Email Address", each with a two-line explanation.
- Scope: "Select regions" (All active regions / Specific regions with a searchable "Regions" select) or "Projects" (All projects / Specific projects with "+ Add projects"), then "Resources" (All resources / Specific resources).
- Specific resources opens resource scoping: an "In scope | Out of scope" segmented switch, a "Condition Group" card ("And | Or"), rows of Property (Tag, Name), Operator (equal, notEqual, contains, doesNotContain, startsWith, endsWith; tags take equal only), Tag key and Tag value or Value, a red trash per row; "Add Condition", "Add Condition Group"; "Cancel" and "Save".
- Footer per step: "Cancel" or "Go back" (outline, left) and "Next" (filled, right).
- The SCIM setup is the same frame with other steps: 1 SCIM, 2 Single Sign-On (SSO), 3 Multi-factor authentication (MFA) "Optional", 4 Finish; a provider row with an "In progress" chip (or "Connected"), "Continue setup" filled and "Remove connection" in red outline; footer "Cancel" and "Continue"; a last screen "Directory Sync Set Up Complete" with "Finish".

Flow edges:
- → Create connection (2.2) → Configure → Connect → Scope → Confirm → back to Connections, the card now Active.
- → Scope can be reopened later from the connection ("Viewing and Editing Scope" in the GovCloud guide); scoping rules apply on the next sync, to the tests and to the virtual assets on the Assets page.
- → Continue setup (SCIM) → an outside portal → back to Drata → Continue.

Images: `../../images/integrations/gcp/gcp-integration-guide-script-setup--02.png`, `../../images/integrations/gcp/gcp-integration-guide-script-setup--03.png`, `../../images/integrations/gcp/gcp-integration-guide-script-setup--04.png`, `../../images/integrations/aws/aws-govcloud-integration-guide--01.png`, `../../images/integrations/azure/azure-management-groups-integration-guide--08.png`, `../../images/integrations/enterprise-scim/enterprise-scim-integration-guide--03.png`, `../../images/ux/connections/aws-integration-guide-infrastructure-user-access-review--03.png`.

### 2.4 Connect dialog (stepped modal for HRIS and some ticketing)

Layout:
- A tall, narrow white modal with rounded corners, "← Back" top left and "✕" top right, the vendor's logo centred. It is the embedded flow of Drata's integration partner (the HRIS guides name Merge), so it looks unlike the rest of Drata.
- A bold step title with a counter: "Step 1/7: Create a Workday ISU" through "Step 7/7: Enter your Web Services Endpoint URL".
- A scrolling card of numbered instructions with key words in bold, then a link "Stuck? See detailed instructions with screenshots".
- One or two inputs (Username, Password; or a URL) and a full-width "Next", grey until filled, black when ready.
- Variants: "Enter your UKG Ready Domain"; a region picker as a list of rows with chevrons ("Select your account type": Australian, Indian, European, Japan, US region, each with its domain); "Connect Zoho Desk" with an "Open window" step.

Flow edges:
- → View and connect on an HRIS or some ticketing card → this dialog → its last Next → the connection is created and its card turns Active.

Images: `../../images/integrations/workday/workday-integration-guide-hris--05.png`, `../../images/integrations/workday/workday-integration-guide-hris--22.png`, `../../images/integrations/zoho-desk/zoho-desk-integration-guide-ticketing-uar--01.png`.

### 2.5 Connection detail page (new experience) and Ticket routing

Layout:
- "← All Connections"; logo and name as h1; "🗑 Delete connection" in red text top right.
- A fact row under the name: Status (chip "Active" or "Healthy"), Account alias (with a pencil to edit inline), Created by (avatar and name), Account ID.
- A warning banner under the facts where action is owed: "Reconnect your Greenhouse connection before August 31, 2026", one line on why, and an outline "Reconnect" button inside the banner.
- Tabs: Overview, Manage, Ticket routing (AWS connections only, private beta).
- Overview: cards with an "Edit" outline button each. "Workspaces" (Workspaces assigned chips). "Setup Details" (Source: Label, Security Label, the switch "Write Access to Jira", Site URL (optional)). "Sync status" (a row per data set with a check, "Access Review App Users", expandable). "Account Information" (Account ID, Connection made by, Account Alias, an em dash when empty).
- A right column "Benefits" with the same count rows as the drawer ("1 Controls", "1 Tests").
- Ticket routing tab: a blue info banner on what routes do (one ticket per account or tag, leftovers to one fallback ticket); "4 keys routed"; a table with a settings gear and a filled "Add route"; columns Split key, Ticketing, Ticket identifier, Project, Assignee, Route health (each header with "⋯"); a row "⋯" menu on the left; Route health chips "Not checked" (grey) or "Healthy" with "Last checked Nov 13, 2026" under it; footer "50 per page ⌄" and "1-4 of 4" with pager arrows.
- Add route dialog: Ticketing connection, Split by (AWS account or Resource tag), AWS account (searchable) or Tag key and Tag value, Ticket identifier (a friendly label that goes into the ticket title), then "Route to": Project, Issue type, Assignee (Optional) with the hint that a project comes first.

Flow edges:
- → View details (2.1) → this page.
- → Reconnect → the vendor's credential prompt → the banner clears, history kept.
- → Edit on Setup Details → turn on Write Access without reconnecting → ticket creation and automation rules (2.7, 2.8).
- → Add route → dialog → the row shows "Not checked" until the next ticket sync.
- → row ⋯ → delete a route.
- → Delete connection → the connection and its sync stop.

Images: `../../images/ux/connections/ticket-automation-jira-only-new-experience--01.png`, `../../images/integrations/greenhouse/greenhouse-integration-guide--02.png`, `../../images/ux/connections/split-ticket-routing-private-beta--04.png`, `../../images/ux/connections/split-ticket-routing-private-beta--03.png`.

### 2.6 Manage-accounts tables (access review accounts, background checks, observability accounts, linked devices)

What a connection brings in lands first in a table where people match outside accounts or devices to Drata personnel. These are the reconciliation screens behind the identity tests (96 to 98) and the device tests (61 to 66).

Layout, new experience (Connections › Manage Accounts › an entry):
- A workspace switcher top left ("Drata ⌄"); the Manage Accounts rail stays on the left with the current entry highlighted.
- "Manage Access Review Accounts" with a "Sync ⌄" outline button top right; "Manage background checks" with a "Learn about managing background checks ↗" link instead.
- A yellow warning banner where something blocks a test: "Some personnel are missing linked background checks", telling the reader to sort the Personnel column for blanks and pick the person.
- The same filter panel as Connections (Source: AWS, Atlassian, Azure DevOps, Box, Bullhorn …, one radio), "Filters" with a column gear, a search ("Search for username or email…", "Search by email…"), "Filters applied:" chips.
- Access review columns: Source, Status, Personnel, Account ID, Access revoked, MFA, each header with "⋯"; a row "⋯" on the left.
- Background check columns: Email from background check, Status (chip "Linked"), Personnel (avatar and name), Source (vendor logo and name, sorted ↓).

Layout, older (Settings › Connections › a type):
- Breadcrumb "Connections / Observability Accounts"; title "Manage Connected Observability Accounts"; "Download" filled top right; a search box.
- Columns: Status (a red no-entry icon for unlinked, a chain icon for linked), Account (vendor icon, username or email, vendor under it), User (an "Employee Name" select when unlinked; avatar, name and email when linked; or "Out of Scope (Ignore)" with the reason, such as a service account), Account ID, Client Alias, Linked (relative time, "19 minutes ago"), Access Revoked, "Access Log Sinks ⓘ" (a per-row switch that tells Test 110 the person may read logs), then a gear or an unlink arrow.
- Linked devices ("Drata to CrowdStrike linked devices", "Drata to SentinelOne linked devices"): an orange banner when some are unlinked ("19 devices monitored by Drata have not been linked …", warning that Test 64 may fail, with a "Sort devices by not linked" link); a paragraph on matching by serial number and that unlinked devices count as non-compliant; a search; columns Drata personnel (avatar chip), Drata device name, <Vendor> device name (a "Select" dropdown of the vendor's devices when unmatched), <Vendor> user ("N/A"); "Items per Page 20", "101 - 108 of 108".

Flow edges:
- → Connections › Manage Accounts › Access Reviews, Background Checks, Devices, Observability … → these tables.
- → Review linked devices on an EDR card (2.1) → linked devices table.
- → pick a person or device in a row → the account or device links, and the matching tests re-evaluate on the next run.
- → Sync ⌄ → resync the source.

Images: `../../images/ux/access-review/atlassian-integration-guide--03.png`, `../../images/ux/connections/sterling-integration-guide--01.png`, `../../images/ux/connections/datadog-integration-guide--02.png`, `../../images/ux/devices/crowdstrike-integration-guide--02.png`, `../../images/ux/connections/sentinelone-edr-integration-guide--03.png`.

### 2.7 Ticket management and the Create ticket dialog

Layout:
- In the control, test and risk drawers, a card "Ticket management" with an inner grey panel "Create a ticket", one line on what it does, and an outline "Create ticket".
- Once tickets exist, the card lists them newest first, at most three "In Progress"; "View all tasks" opens a modal split into "In Progress" and "Done" (Zoho says "Completed"). Each ticket shows title, description, created and updated dates, creator, assignee in the outside tool and its status mapped to those two words. Row actions: "Manage ticket" (opens the outside tool), a download icon (a ZIP with a PDF of the ticket and its attachments), a trash icon (unlinks in Drata only; it cannot be relinked).
- Create ticket dialog: a grey title bar ("Create ticket", then "Create Azure Boards (DevOps) ticket" once the destination is chosen) with ✕; a horizontal stepper of round blue icons joined by a line (Destination, Project, Work Item Type, Information for Azure; Destination, Team, Information for Linear; before a destination is chosen the second dot reads "Loading"); a very large centred heading ("Choose a destination", "Complete your ticket details").
- Destination: one required select listing the connected tools with logos (AZURE BOARDS, JIRA).
- Details: "Title *" pre-filled in a fixed pattern ("Drata | <workspace> | DCF-284 | Key and Certificate Validation"); "Description (Optional)" pre-filled ("Created in Drata for Drata's DCF-284: …" or "… test: Critical Vulnerabilities Addressed (Wiz Code)"); then the tool's own fields, all marked "(Optional)" except those the tool requires (Linear: Assignee, Labels, Due Date, Parent Issue, Status, Priority, Project, Cycle with a hint that a cycle may overwrite status, Estimate; Zoho: Contact * and Department *).
- Footer: "Back" as a text link left, "Create ticket" filled right; "Next" while stepping.

Flow edges:
- → a control, test or risk drawer › Create ticket → Destination → project or team → type → details → Create ticket → the ticket shows in the drawer as In Progress.
- → Manage ticket → the outside tool.
- → tickets made directly in the outside tool never appear in Drata.

Images: `../../images/ux/tickets/azure-boards-devops-integration-guide--02.png`, `../../images/ux/tickets/azure-boards-devops-integration-guide--03.png`, `../../images/ux/tickets/azure-boards-devops-integration-guide--06.png`, `../../images/ux/tickets/linear-integration-guide--05.png`, `../../images/ux/tickets/zoho-desk-integration-guide-ticketing-uar--03.png`.

### 2.8 Ticket automation rules (Jira only)

No screenshot of the rule builder is in this share; this is from the article.

Layout (Settings › Ticket automation):
- A workspace selector when there are several workspaces.
- Step 1, the trigger, chosen once and never changed: "A control's readiness is Not Ready", "A test result is Failed", "A test result is Error".
- Step 2, narrowing. For Not Ready: control monitoring status, evidence requirements, control owners (any of them matches), frameworks. For test results: test category and test type.
- Step 3, scope: "All" or "Specific categories" then "Continue"; Infrastructure (or All) asks for "Production tests only", "Codebase tests only" or "Both production and codebase tests"; other categories are production only.
- Step 4, the Jira destination fields Drata reads from the Jira site (project, issue type and others).
- Rules run overnight, open one ticket per matching event, never a second for the same event; with several workspaces, execution reads the primary one.
- With split routing on an AWS connection (2.5), each failing test opens one ticket per routed account or tag plus one bundled ticket for the rest. A ticket's title follows "Drata | <workspace> | <route label> | Test failed | <test name>"; its description carries the test's description, result, the controls and frameworks hit, pass and fail counts and links; a CSV of that route's failing resources is attached. While a ticket is open no second one is made, and its contents are not refreshed.

Flow edges:
- → Jira connection › Setup Details › Edit › Write Access to Jira (2.5) → Settings › Ticket automation → a rule.
- → the overnight run → tickets in Jira → back in Drata in the control or test drawer's Ticket management (2.7).
- → Admin and DevOps Engineer roles may make rules; only an Admin may edit the Jira connection.

Images: none in this share beyond `../../images/ux/connections/ticket-automation-jira-only-new-experience--01.png` (the write-access switch).

### 2.9 Where connection data lands: Personnel and Asset Inventory

These screens belong to another share; only what the guides show of a connection's mark on them is noted here.

Layout:
- Personnel list (new): a blue info banner on top ("600 ungrouped personnel are scoped to all workspaces by default", with "View ungrouped personnel"); tabs "Personnel 8" (red count), "Active exclusions", "Archived exclusions"; the filter panel (Employment status, Compliance, each a searchable select); "Filter", gear, search, "⋯" and "Download ⌄"; "Filters applied:" chip "Bob ×". Columns: Name, Compliance status (red chip "Not compliant" with a crossed icon), Personnel status (an inline select, "Current contractor"), IDP provider (logo and name, "Google OAuth"), HRIS provider (logo and name, "Bob"). A red bar marks a non-compliant row's left edge.
- Personnel record (new): breadcrumb "Personnel /"; avatar and name as h1; "⋯" and a status select top right ("Former contractor ⌄"). Fact row: Compliance status chip, Hire date, Separation date, IDP source (logo), Sync status ("✓ Syncing" chip). Tabs Overview and Devices. "Details" card with "Edit": Email, Hire date, IDP source, HRIS source, Separation date, Job Title and custom fields. "Devices" card with an illustrated empty state, "No devices found", one line under it.
- Personnel list (older): tabs List and Exclusions; a left rail "All Current", "Compliance" (Compliant; All Not Compliant "99+"; Policies, Identity MFA, Background Check, Security Training, Device Compliance), "Filter by Status" select. Columns, one per check: Identity MFA, BG Check, Security Training, Device Compliance, Password Manager, Auto Updates, Disk Encrypted, Anti-Virus ⓘ (tooltip "The source of this data is SentinelOne"), Lock Screen; each cell a green check or red ⊗; "Actions ⌄", "Download ⌄", row chevron.
- Personnel Detail drawer (older, navy header): "DEVICE" with an orange count; "Manage"; a device card (red ⊗, "Ubuntu", serial, source "Agent", chevron), then one row per check (Drata Agent Installed, Password Manager, Hard Drive Encrypted, Antivirus, Auto Updates, Screensaver Lock), each "Enabled" or "Not Enabled" with "Last Checked a day ago" and an upload icon for manual evidence; Antivirus adds "ⓘ This information is powered by your CrowdStrike connection" and the vendor's facts (Prevention policy, Status, Agent version, Tags chip, CrowdStrike User, State); "Apps 0".
- Asset Inventory (older): filter selects in a row ("Class is Hardware ×", All Types, All Providers, All Owners, All Statuses), "Reset Filters", a search, "Add Asset" filled. Columns Approved, Owner (avatar, name, email), Status ("Current employee"), Created On ↓, Last Modified On, Deleted On, Notes, Device Compliance (check or ⊗, tooltip "Device not compliant"), row chevron.

Flow edges:
- → HRIS connection → people appear in Personnel with their HRIS source, start date and separation date; leaving in the HRIS makes them former personnel.
- → MDM or EDR connection → each device check in the drawer cites its source; unlinked devices fall to non-compliant (2.6).
- → Personnel › Not Compliant › Background Check → who still lacks a check after an upload (Sterling).

Images: `../../images/ux/personnel/bob-hibob-oauth-integration-guide--04.png`, `../../images/ux/personnel/bob-hibob-oauth-integration-guide--05.png`, `../../images/ux/personnel/sentinelone-edr-integration-guide--05.png`, `../../images/ux/personnel/crowdstrike-integration-guide--03.png`, `../../images/ux/assets/sentinelone-edr-integration-guide--06.png`.

### 2.10 Settings › Personnel Compliance (training, workstation monitoring, background checks, documents)

Layout:
- Settings rail (new): Personal (Language, Notifications); Organization (Account Access, Language, Organization Details, Notification Rules, Personnel Compliance, Plan and Usage, Role Administration, Workspaces, New features); Configuration (AI Settings, API Keys, OAuth Applications, MCP Configuration, Compliance as Code). Ticket automation sits here too, from the article.
- "Personnel Compliance ?" with tabs Internal Security, Training, Human Resources.
- Internal Security › "Automation" card › "Workstation configuration monitoring" with one line, then checkboxes: "Automated via Jamf MDM" (or Intune, Kandji …), "Automated via Drata Agent", "Manually via personnel uploading their evidence in My Drata". Connecting an MDM ticks its box.
- Training (older page "Settings > Internal Security"): "Annual security awareness training" with radio options: use the connected vendor (KnowBe4, EasyLlama, Huntress …), Drata's own embedded training, an outside course, internal training with self-uploaded certificates, or manual upload per person on Personnel (which drops the training step from onboarding).
- Human Resources › "Automation" › "Background checks": radio between Drata's partner KarmaCheck during onboarding, and manual upload per person or "automated via connection". Further down, an automated offboarding block (cut in the image).
- Human Resources › "Documentation": items each with a bold name and one line ("Employee performance evaluation process", "Sample employment agreement", "Company org chart", "Sample engineering job description"); an uploaded file shows as a bar with "Download" and red "Delete"; an empty item shows a drop zone ("Upload file", "Or drop a file here", the accepted formats). These uploads are what Tests 17, 46, 58 and 60 read.

Flow edges:
- → MDM drawer › Save & Test Connection (2.2) → the Jamf, Intune or Kandji box is ticked here → device checks (2.9) → Tests 61 to 66.
- → training connection → pick the vendor radio here → onboarding shows the vendor's step (2.11) → Test 43.
- → upload the org chart → Test 17 passes for 12 months.

Images: `../../images/ux/personnel/jamf-integration-guide--12.png`, `../../images/ux/personnel/jamf-integration-guide--13.png`, `../../images/ux/personnel/knowbe4-integration-guide--01.png`, `../../images/ux/settings/test-17-maintains-organization-chart--01.png`.

### 2.11 My Drata (employee onboarding: training, background check)

Layout:
- "My Drata" as the page title; the employee's own onboarding steps as cards.
- Training step: a green circled check, "Complete Security Awareness Training", "↻ This is done annually here in Drata"; open, "Security Awareness Training Completed ✓", a dated line, the vendor's logo, and the synced certificate as a link with "Uploaded at" date, download and trash icons.
- Background check step (Checkr): the vendor's own marketing panel inside the page, a question "Where do you work from?" with U.S. and International radios, and "Start My Background Check".
- Drata stops syncing a person's training once they are compliant, so a later change in the vendor cannot undo it (KnowBe4 guide).

Flow edges:
- → My Drata › Start My Background Check → the vendor's flow → the result syncs to the personnel record and the Manage background checks table (2.6).
- → vendor training completed → certificate appears on the step → Test 43.

Images: `../../images/ux/personnel/checkr-integration-guide--05.png`, `../../images/ux/personnel/knowbe4-integration-guide--03.png`.

### 2.12 Monitoring page and test details

The Monitoring screens themselves belong to another share; this share shows them through the release notes and the guides, all in the older style.

Layout:
- Page "Monitoring". Three stat cards across the top: "33% Of Tests Passed" (a % icon), "18 Failed Tests" (red ⊖), "9 Passed Tests" (green ✓).
- "Test now" outline and "Create test" filled, right-aligned above the table.
- Left rail: "Category" (Policy, In Drata, Device, Infrastructure, Identity Provider, Version Control, Ticketing, Observability, Custom, each with a coloured icon); "Test Type" (Drata, Custom); "Test Status" (Enabled, Disabled, New).
- Tabs Published and Drafts, "Search automated tests…", a download icon.
- Rows: a small green toggle (enabled), the test name (black when passing, red when failing), "Last Tested : 18 hours ago", a stack icon, then either an amber ⓘ (needs attention) or a red filled "Fix Now". A new test shows a sparkle icon in place of the toggle.
- Test details drawer (navy header, ⤢ ✕): description with "See more"; "Test status" select (Enabled) beside "Test Now" filled; "Last test result" with a red "⊖ Failed" chip and "Last Tested: a few seconds ago"; one sentence on what failed; "ⓘ This information is powered by your WIZ connection"; tabs Included and Excluded; "Select All" and a disabled "⊘ Exclude" until rows are ticked; a findings table (Issue title, Entity name, Severity "MEDIUM"; or Drata device, Personnel, SentinelOne serial number, Operational state "fully_disabled"); a blue banner pointing to the personnel exclusions table; "Download table csv"; "Take Action:" with one line; "Fix Now" filled and "Learn More" outline.
- Test statuses in the release notes: "New" (control and connection exist, the test waits to be enabled), "Unused" (control exists, connection missing), Enabled, Disabled. CSPM tests sit "unused" until a Wiz rule exists. Results: Passed, Failed, Error.

Flow edges:
- → a row → test details drawer.
- → Test Status › New → a new test → drawer › Test status › Enabled → it runs and leaves "New".
- → Fix Now → remediation (the guide or the linked devices table); → Learn More → the help article.
- → tick findings › Exclude → they move to Excluded and the test re-evaluates (vulnerability tests count fixed or excluded findings as addressed).
- → Ticket management in the drawer (2.7); → an automation rule opens tickets on Failed or Error (2.8).

Images: `../../images/ux/monitoring/october-2024-release-aws-drata-test--01.png`, `../../images/ux/monitoring/sentinelone-edr-integration-guide--04.png`, `../../images/ux/monitoring/wiz-cspm-integration-guide--03.png`.

### 2.13 Settings › API Keys and OAuth Applications

Layout:
- "Settings > API Keys ⌄"; an "All Statuses" select; "View API Documentation ↗" link; "Create API Key" outline.
- Table: Name, Status (chip with a dot: green "Active", grey "Revoked"), Created by, Last Used ("Feb 27, 2023 @ 10:48:19 AM"), Expires ("Never Expires" or a date); a red trash on revocable rows; row chevron.
- Create form (from the article): Name (fixed once active), Expiration date (12 months by default, Never, Custom), Allowed IP Addresses (empty means any), Access (Custom, All read, All read and write) with per-scope choices under Custom.
- "Your New API Key is Ready" modal: a yellow banner that the key cannot be shown again, the key in a read-only field with a copy icon, a required checkbox "I have stored this API Key information in a secure location", "Done" (disabled until ticked).
- "Edit API Key" drawer (navy): trash in the header to revoke, "Details" with the read-only Name, then editable scopes.
- Key statuses: Active, Expires soon (within 30 days), Expired, Revoked; expired and revoked are final.
- OAuth Applications (article only): "Create OAuth Application" page in steps: Name, optional Description, expiration (Never or Custom), "Next"; then "Scopes" with a preset (Custom recommended) and expandable categories (Policies, Personnel & Devices, Evidence …) with Read or Write per resource; a detail page to view or edit scopes and revoke.

Flow edges:
- → Create API Key → form → ready modal → Done → the row shows Active.
- → trash (row or drawer) → a confirmation → Revoked, still viewable.

Images: `../../images/ux/settings/drata-public-api--02.png`, `../../images/ux/settings/drata-public-api--01.png`, `../../images/ux/settings/drata-public-api--05.png`.

### 2.14 The shape of a connection guide and of a test article

Not a screen, but the two templates are what a reader of this share meets 390 times, and they show how Drata explains its own surfaces.

A connection guide:
- A one-paragraph intro: what the connection lets the team do, sometimes "This connection supports the following types: …" (UAR, HRIS, Codebase, Ticketing, Version Control, Vulnerability).
- "Key Capabilities" (166 of 225 guides): two to four bold-lead bullets, the same three phrasings reused across the access review guides (data sync, access governance, compliance monitoring).
- "Prerequisites & Data Access" (about 210): the vendor role needed, the values to collect (ids, secrets, domain, region), and the Drata roles that may write (Admin, Workspace Manager, DevOps Engineer) beside those who may only read (Access Reviewers).
- "Permissions & Data Table" (about 155 guides carry a table): each scope or permission with why Drata needs it, always read-only.
- "Step-by-Step Setup" (about 200): the vendor console steps first, then "Complete the Connection" in Drata (Connections › search › View and connect › paste values › Save or Connect).
- "Important Notes" (98), "Troubleshooting" (19), "Partner Offers & Discounts" (7), external resources.
- Some guides add the tests the connection feeds ("Monitoring Test Requirements" in Datadog, "What the Connection Tests" in Azure Boards, "Test 64" in CrowdStrike) or the place its data shows ("Where to View Device Data").

A test article:
- Title "Test <n>: <name>"; a one-sentence description in the form "Drata inspects … to determine if …" (or "validates that …").
- "ASSOCIATED DRATA CONTROL" (as a heading in 79, as bold text in most of the rest): the control's name in bold and its DCF id where the article is newer, then the control's own text.
- "WHAT TO DO IF A TEST FAILS": what failing means and what the failed result lists (personnel, resources, issues with entity and severity).
- "STEPS TO REMEDIATE" or "STEPS FOR PASSING" (48): per provider (AWS, Azure, GCP, Heroku, DigitalOcean, Datadog), console clicks or CLI commands.
- "Center for Internet Security (CIS)" (39): the benchmark item behind the test.
- "Related articles" (165): the connection guides and sibling tests.
- Policy and record tests are a short paragraph each: the policy must exist, be approved and be inside its renewal date; acknowledgement tests need every employee or contractor to have signed.

Images: none (article structure).

## 3. The data model as the UI shows it

### The chain

connection → synced records (accounts, devices, resources, findings, tickets, checks, certificates, personnel) → test → control (DCF) → framework → audit evidence. Tickets hang off a control, a test or a risk.

- **Connection.** Has a category (one or more of about thirty: Access Review, HRIS, Identity, Infrastructure, MDM, EDR, CSPM, Vulnerability, Ticketing, Version Control, Codebase, Observability, Security Training, Background check, Communication, Cyber insurance, Digital signature, External Policy …), workspaces, an account alias, an account id, who created it, a sync duration and a status. It shows what it is worth before connecting: impact areas, controls and tests it feeds (AWS 4 / 46 / 83; GCP 4 / 22 / 19; Jira 1 control, 1 test). One vendor can be several connections (Aikido, Rippling, Bitbucket, Wiz) or several cards of one category (GitLab and GitLab self-managed). A connection carries scope (regions or projects; resources by tag and name rules, in or out of scope), and on AWS, ticket routes.
- **Synced records.** Accounts (Source, Status, Personnel, Account ID, Access revoked, MFA) are matched to personnel; devices are matched by serial number; background checks by email; cloud resources become virtual assets on the Assets page; scanner findings arrive with severity and SLA dates (Arnica up to 1,000 a day, Wiz up to 200 per category a day, mostly on a 24-hour sync).
- **Test.** A number and a name ("Test 64: Malware Detection Software Installed"), a category (Policy, In Drata, Device, Infrastructure, Identity Provider, Version Control, Ticketing, Observability, Custom), a type (Drata or Custom), a status (New, Unused, Enabled, Disabled), a last result (Passed, Failed, Error) with "Last Tested", and a findings table split Included and Excluded. Infrastructure tests also run as production or codebase tests.
- **Control.** Each test article names one or more Drata controls, by name in the older articles ("Security Training", "Unique Accounts Used") and by DCF id in the newer ones ("Audit Logging (DCF-406)"). Ticket titles and descriptions carry the DCF id ("DCF-284: Key and Certificate Validation"). A control has a readiness, and "Not Ready" can open a ticket.
- **Framework.** Only named in passing here: SOC 2, ISO 27001, HIPAA, NIST AI training; CIS Benchmarks are the source of most tests numbered 205 and above. Test results feed "controls and frameworks impacted" on each automated ticket.
- **Ticket.** Created from a control, test or risk drawer, in Jira, Azure Boards, Linear, Zoho Desk and others; shown in Drata with two statuses only (In Progress, Done); opened by rules on Not Ready, Failed or Error; split by AWS account or tag into routes, one open ticket per test and route.
- **Personnel.** Each person shows an IdP source and an HRIS source, hire and separation dates, a personnel status, a compliance status, and one column per check (Identity MFA, BG Check, Security Training, Device Compliance, Password Manager, Auto Updates, Disk Encrypted, Anti-Virus, Lock Screen), each citing the connection behind it.

### Statuses and their words

- Connection: "Healthy", "Unhealthy", "Active", "⚠ Needs migration", "BETA"; SCIM step "In progress", "Connected"; drawer banners "<Vendor> is connected / Last connected on …" and red errors.
- Route health: "Not checked", "Healthy" with "Last checked".
- Test status: "New", "Unused", "Enabled", "Disabled". Result: "Passed", "Failed", "Error". Row action "Fix Now".
- Control: "Not Ready" (as a trigger).
- Ticket: "In Progress", "Done" (Zoho: "Completed").
- API key: "Active", "Expires soon", "Expired", "Revoked".
- Personnel: "Compliant", "Not compliant"; "Current employee", "Current contractor", "Former contractor"; sync "Syncing"; background check "Linked".
- Device check: "Enabled" or "Not Enabled" with "Last Checked …"; "Device not compliant".
- Account: linked, unlinked, "Out of Scope (Ignore)".
- Finding: severity in capitals ("MEDIUM"); Wiz issue status "Open", "InProgress".

### Numbers seen, for scale

- 393 articles: 225 under Connection Support (215 vendor and setup guides, 3 concept guides, a Workday best-practice page, 6 API articles), 168 under Monitoring Test Guidance (165 test pages, 2 release notes, 1 evidence example).
- Test numbers run from 1 to 310 with gaps; the October 2024 release maps its AWS tests to 19 DCF controls.
- Monitoring header in one screenshot: 33% of tests passed, 18 failed, 9 passed.
- Personnel: "99+" not compliant; "600 ungrouped personnel"; 19 devices not linked to CrowdStrike; 108 devices in the SentinelOne table; "4 keys routed".
- Guides that name a test most often: Test 64 (13 guides), 88 (10), 86 and 63 (8 each).

### The tests, grouped by what they check

Every test page in the share falls in one group below. Controls are named as the articles name them; DCF ids are given only where an article states one.

| What it checks | Tests | Drata controls named (DCF where stated) |
|---|---|---|
| A policy or plan exists, is approved and is inside its renewal date, or covers a topic (32) | 1, 2, 3, 13, 16, 18, 27, 28, 32, 33, 36, 39, 42, 44, 54, 56, 62, 67, 89, 106, 127, 128, 136, 137, 138, 141, 143; IRP Designates Responsible Team Members; IRP Includes Lessons Learned; Has Security Policies; Policies for a Security Team; Process for Responsible Disclosure | Customer Data Policies; System Access Control Policy; Information Security Policy; Risk Assessment Policy; SLA for Security Bugs; Disaster Recovery Plan; Follow Up's Tracked; Incident Response Plan; Software Development Life Cycle Policy; Security Policies; Security Training; Acceptable Use Policy; Code of Conduct; Data Protection Policy; Password Manager; Cryptography Policies; Password Policy; Daily Database Backups; Credential Keys Managed; Physical Security; Data Retention; Data Classification; Customer Data Deletion Upon Termination; Clean Desk Policy in Place; Disposal of Sensitive Data on Paper; Incident Response Team; Lessons Learned; Security Team/Steering Committee; Disclosure Process for Employees |
| People records: acknowledgements, training, background checks, HR documents, public URLs (20) | 11, 17, 43, 45, 46, 47, 48, 49, 50, 51, 55, 58, 59, 60, 83, 84, 85; Employees Acknowledge the Data Protection Policy; Policies are Acknowledged; Termination Process and Checklist | Disclosure Process for Customers; Organizational Chart Maintained; Security Training; Acceptable Use Policy; Annual Performance Evaluations; Background Checks; Contractor Requirements; Independent Board of Directors; Employee Requirements; Formal Recruiting Process; Job Descriptions; Commitments Explained to Customers; Maintains a Privacy Policy; Maintains a Terms of Service; Security Policies; Offboarding Checklist |
| Identity and access: MFA, unique accounts, leavers removed, root use, IAM hygiene (20) | 6, 7, 86, 87, 88, 94, 95, 96, 97, 98, 124, 208, 214, 215, 216, 217, 225, 229, 230, 232 | Version Control Can Only Be Accessed By Authorized Employees; Only Authorized Employees Change Code; MFA on Accounts; Terminated Employee Access Revoked Within One Business Day; Unique Accounts Used; Root Infrastructure Account Unused; Privileged Access Restricted and Need-to-know Principle (the Wiz guide gives DCF-59, DCF-326); Root Infrastructure Account Monitored (DCF-90); Minimum Strong Password Requirements, Password Policy and Configuration (DCF-346, DCF-68); Password History Enforcement (DCF-350); Principle of Least Privilege (DCF-776); Inactive User Accounts Removed (DCF-335); Credentials Rotation (DCF-783) |
| Employee computers (5) | 61, 63, 64, 65, 66 | Login Password; Password Manager; Malware Detection Software Installed; Security Patches Automatically Applied; Hard-Disk Encryption. Fed by the Drata agent, an MDM or an EDR. |
| Software change: VCS in use, review before merge, restricted merges, security tickets prioritised (4) | 5, 8, 9, 26 | Version Control System; Code Review Process; Production Code Changes Restricted; Security Issues are Prioritized. The GitLab on-prem example names DCF-4, 5, 6, 67, 70, 71 as needing manual evidence. |
| Vulnerability management (3) | 21; Critical Vulnerabilities Addressed; High Vulnerabilities Addressed | Quarterly Vulnerability Scan. Thirteen scanner guides map their findings to DCF-18. |
| Network exposure: public SSH, RDP and admin ports, firewalls, WAF, public databases and storage (12) | 102, 104, 119, 122, 209, 220, 227, 228, 233, 253, 268, 291 | Denial of Public SSH; Threat Detection System (as Test 104's page says); Firewalls; Web Application Firewall; Cloud Data Storage Restricted, Network Security Controls, Inbound Traffic Restricted Between Untrusted and Trusted Networks (Wiz guide: DCF-85, DCF-218, DCF-75); Restricted Public Access (DCF-75); Access to Remote Server Administration Ports Restricted (DCF-73); Network Security Controls (DCF-85); Encryption in Transit (DCF-55, DCF-748) |
| Encryption at rest, in transit, and key rotation (17) | 4, 68, 69, 70, 71, 72, 210, 218, 222, 223, 231, 234, 254, 263, 269, 270, 299 | Require Encryption of Web-Based Admin Access; Customer Data is Encrypted at Rest; SSL/TLS Enforced; Encryption of Data in Transit (DCF-55); Encryption at Rest (DCF-54); Cryptographic Key Rotation (DCF-779); DCF-285 with DCF-55 for Test 263 |
| Logging and audit trails (22) | 105, 109, 110, 111, 121, 205, 221, 224, 226, 243 to 252, 256, 257, 310 | Logging/Monitoring; Logs Centrally Stored; Logs Retained for 12 Months; Change Detection Mechanism (DCF-478); Audit Logging (DCF-406); DCF-407; System Monitoring (DCF-86) for the Azure activity-log alerts |
| Monitoring and alarms on databases, queues, servers, load balancers, functions (17) | 112, 113, 114, 115, 116, 117, 118, 129, 206, 290, 293 to 298, 300 | Databases Monitored and Alarmed; Messaging Queues Monitored and Alarmed; NoSQL Database Monitored and Alarmed (DCF-83); Servers Monitored and Alarmed; Monitoring Processing Capacity and Usage; System Monitoring (DCF-86) |
| Backups and resilience (10) | 30, 107, 108, 130, 131, 132, 133, 134, 301; Backups Checked for Integrity | Multiple Availability Zones; Daily Database Backups; Storage Buckets are Versioned; Load Balancer Used; Autoscaling (DCF-97); Backup Monitoring (DCF-99); System Monitoring (DCF-86) for point-in-time recovery; Backup Integrity and Completeness |
| Hardening and updates (2) | 219, 292 | Automated Security Updates (DCF-152); Baseline Configuration and Hardening Standards (DCF-12) |
| A connection exists (1) | 123 | Cloud Infrastructure Linked to Drata |

Two things the grouping shows. First, a third of the tests (52 of 165) check records inside Drata (a policy's dates, an upload, an acknowledgement, a URL), not systems; Drata still calls them tests and runs them the same way. Second, the control link is uneven: the older pages name a control in words, the newer ones by DCF id, and where both exist they can disagree (the Wiz guide maps Tests 208 to 210 to DCF ids the test pages never mention; Test 104, about public storage, sits under a threat detection control).

## 4. For Program Assurance

- **Borrow the "what this source is worth" counts.** Drata's drawer and detail page say how many controls and tests a connection feeds before and after connecting. An evidence source in an RMF program (a scanner feed, a STIG checklist import, an inventory export) should say the same in RMF terms: how many controls and assessment objectives of this program's baseline it can evidence, each number opening the register that holds them. It answers "why connect this" without prose (principle 5).
- **Keep objective-level mapping; do not copy test-to-control.** Drata maps a test to a whole DCF control, and the articles show the mapping drifting between names, ids and guides. Program Assurance already derives status from assessment objectives on each system. An automated check should name the objectives it evidences, so a passing check covers part of a control and the control stays short of covered until every objective is.
- **Borrow the test article as the template for a check's record.** Statement of what is inspected, the control it serves, what a failure lists, remediation steps per platform, the benchmark behind it. That is the shape of an assessment procedure (examine, interview, test) and fits the Record page type: the failure list is the findings section, remediation the next step.
- **Borrow "New" and "Unused" as derived states.** A check that exists because a selected control needs it, but whose source is not connected, is Drata's "Unused"; one waiting to be switched on is "New". Program Assurance can derive the first as the existing "no evidence" state and say which source would supply it, rather than show an empty row.
- **Leave the free "Exclude".** In Drata an admin ticks findings and excludes them, and the test passes. In RMF an excluded finding is a false positive, an operational requirement or an accepted risk, and each must land on the record: a POA&M deviation or a risk acceptance, signed by its role (the Sign action). Keep the Included/Excluded split, but make exclusion a recorded decision with a reason.
- **Borrow the reconciliation tables and the banner that names the consequence.** "19 devices … have not been linked", with the test that will fail and a link that sorts the unlinked first, is principle 4 done well. The RMF analogue is scanner assets matched to the system's component inventory (CM-8) and accounts matched to people (AC-2), each unmatched row saying which control objective it holds back.
- **Borrow scope rules as the authorization boundary.** Drata's Scope step (regions or projects, then resources in or out by tag and name) is the boundary of a cloud system expressed as rules. A system in Program Assurance should own such rules for each source, so resources outside the boundary never count toward its evidence or its findings.
- **Borrow routing by owner, applied to the POA&M.** Split ticket routing (one ticket per account or tag, a fallback for the rest, no duplicates while one is open) maps onto POA&M items routed by system or boundary owner. Keep the POA&M as the source of truth: Drata only shows tickets it created and reduces every outside status to In Progress or Done, which is fine for a ticket and too thin for a milestone.
- **Leave the three connect patterns and the red row buttons.** The guides show a navy drawer, a full-page stepper and a partner modal for the same job, plus an older and a newer Connections page. Program Assurance should have one Flow for adding a source. The Monitoring list's filled red "Fix Now" on every failing row breaks one-primary-per-surface (B2) and the hue budget (B16); a status word and one primary in the preview do the same work.
- **Treat policy "tests" as evidence freshness, not monitoring.** A third of Drata's tests only check that a document exists and is within its renewal date. In Program Assurance that is the evidence on a -1 control (AC-1, IR-1 and the rest) going stale on a date: show it as the evidence's own status on the control record, not as a check beside the system scans.
