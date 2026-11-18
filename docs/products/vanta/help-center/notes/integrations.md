# Vanta help center: Integrations collection

Sources: the Integrations collection in `../index.md`, its 247 articles under `../articles/` and their images under `../images/`. These are third-party pages, read as data. Images looked at: 41, all listed under section 2. "(inferred)" marks anything the articles do not say outright.

## 1. Every article, by sub-collection

Each article sits in exactly one leaf sub-collection. Vanta lists all 247 again under the bare "Integrations" heading, so that list is not repeated here.

### Getting Started with Integrations (6)

- [Before You Connect: Integration Prerequisites Checklist](../articles/before-you-connect-integration-prerequisites-checklist.md): 9-point checklist before Connect: admin in both tools, org (not personal) account, right tenant/site, shared service account, IP allowlist, license tier, revoke old grants, decide scoping first, have OAuth / API key / service-account credentials ready; GCC High variants only in Vanta Gov.
- [Determining Resource Access for Your Integrations](../articles/determining-resource-access-for-your-integrations.md): resource scope (what Vanta monitors) vs framework scope vs test applicability; Configure resource scope modal (per account, filter, Mark all in/out, per-resource exemptions) and the wizard's scope step; connect clouds at org level; changes take up to 1 h; every scope change is logged for auditors.
- [How to Work with System Owners to Connect Integrations](../articles/how-to-work-with-system-owners-to-connect-integrations.md): assign an integration to its system owner from the directory card (dashed-person icon) so they get a notification; email/Slack ask templates filled by the Vanta Agent; manual evidence upload while blocked.
- [Integration Journey: What to Connect First in Vanta](../articles/integration-journey-what-to-connect-first-in-vanta.md): 4 phases: 1 cloud + IdP, 2 MDM + VCS + vulnerability scanner, 3 HRIS + task tracker, 4 specialised (training, background checks, CASB); a test is a 24/7 check; Access page = IdP 'who' x apps 'what'; hold Slack/Teams and Jira until scoping is done.
- [Integrations Page](../articles/integrations-page.md): Integrations page with Connected / Errors tabs; Add integration opens the directory (curated collections, job-to-be-done categories, cards with capabilities, connected state, FedRAMP badge); card -> detail -> Connect; Manage and Configure scope on connected rows.
- [Vanta EU and AUS regions: Sign-In, Integrations, and Data Residency](../articles/vanta-eu-and-aus-regions-sign-in-integrations-and-data-residency.md): US / EU / AUS tenants by sign-in URL; the region sets the scanner IP shown on the Integrations page for allowlists; region migration prerequisites and blockers; reconnect only integrations that show errors afterwards.

### Other Integrations & Connections (7)

- [Configure and Use Webhooks in Vanta](../articles/configure-and-use-webhooks-in-vanta.md): Settings > Webhooks (admins): HTTPS endpoint, event-type subscriptions with payload schemas, Testing tab 'Send Example', Svix delivery, 2xx within 15 s, exponential retries for about 5 days, delivery log, manual or bulk retry.
- [Connecting to Vanta MCP](../articles/connecting-to-vanta-mcp.md): connect Vanta's remote MCP server (beta) to Claude Code, Cowork, Cursor or Perplexity over OAuth; US/EU/AUS endpoints.
- [Vanta CLI Overview](../articles/vanta-cli-overview.md): open-source CLI (public preview) over the Vanta API for admins; needs an OAuth client from the developer console; usable from coding agents.
- [Vanta MCP Capabilities](../articles/vanta-mcp-capabilities.md): use-case table: failing tests ranked by audit impact, remediate a test and open a Jira ticket, audit readiness by framework, vendor risk, vulnerabilities; some rows need features enabled.
- [Vanta MCP Overview](../articles/vanta-mcp-overview.md): what the MCP server gives an AI tool: compliance status, failing controls, vendor risk and vulnerabilities in plain language, under the user's own Vanta permissions.
- [Vanta MCP Prompt Library](../articles/vanta-mcp-prompt-library.md): copy-paste prompts by role and task; an empty answer means that area is not set up in Vanta.
- [Vanta MCP: Troubleshooting and FAQ](../articles/vanta-mcp-troubleshooting-and-faq.md): supported clients, OAuth sign-in, regional endpoint, causes of empty answers, permission-limited results.

### Integrations by Type › Access and Additional Integrations (100)

- [Access Integrations](../articles/access-integrations.md): what the Access capability tag means (accounts synced for access reviews and offboarding evidence); filter by Capability on the Integrations page.
- [Ask Vanta Questions in Slack](../articles/ask-vanta-questions-in-slack.md): Customer Trust feature: employees ask the Vanta Slack app and get answers drawn only from the approved knowledge base.
- [Configure JumpCloud - Antivirus](../articles/configure-jumpcloud-antivirus.md): how Vanta detects a supported antivirus app or browser extension from JumpCloud's Programs list for the antivirus device test.
- [Connecting AWS Identity Store](../articles/connecting-aws-identity-store.md): option to monitor AWS IAM Identity Center (Identity Store) users; where to find the store in the AWS console.
- [Connecting Vanta & 1Password](../articles/connecting-vanta-1password.md): read-only SCIM API through a self-hosted SCIM Bridge (Business plan); 1Password accounts on the Access page; not via Google Workspace.
- [Connecting Vanta & 1Password Device Trust (Kolide)](../articles/connecting-vanta-1password-device-trust-kolide.md): API key; device posture (OS version, encryption) for Windows/macOS/Linux into Computers and Inventory for device tests.
- [Connecting Vanta & Aikido](../articles/connecting-vanta-aikido.md): code and infrastructure vulnerability scanner; 'automates 16 tests and helps pass 5 controls'; Configure scope after connecting.
- [Connecting Vanta & Anthropic's Claude Console](../articles/connecting-vanta-anthropic-s-claude-console.md): Claude Console Admin API key (no scopes); org users for account tests, access reviews and access requests.
- [Connecting Vanta & Apollo](../articles/connecting-vanta-apollo.md): API key; Apollo users and activity on the Access page.
- [Connecting Vanta & Auth0](../articles/connecting-vanta-auth0.md): create a machine-to-machine app for the Auth0 Management API; client ID/secret; users for access review.
- [Connecting Vanta & Box](../articles/connecting-vanta-box.md): OAuth as the connecting user; Box users on the Access page; Configure scope to leave accounts out.
- [Connecting Vanta & Breezy HR](../articles/connecting-vanta-breezy-hr.md): via Merge; employees and groups for onboarding/offboarding and access reviews.
- [Connecting Vanta & CATS](../articles/connecting-vanta-cats.md): Merge + API key; user accounts for account-linking and deprovisioning tests, reviews and requests.
- [Connecting Vanta & Calendly](../articles/connecting-vanta-calendly.md): user access sync for tests, reviews and access requests; available in Vanta Gov.
- [Connecting Vanta & Capsule](../articles/connecting-vanta-capsule.md): Merge + API token; user accounts for access tests and reviews.
- [Connecting Vanta & Checkr](../articles/connecting-vanta-checkr.md): two separate connections: background-check verification (OAuth) and access management (SCIM bearer token); Vanta Gov.
- [Connecting Vanta & Clockwork](../articles/connecting-vanta-clockwork.md): Merge + API key; employees and groups for onboarding/offboarding.
- [Connecting Vanta & Close](../articles/connecting-vanta-close.md): Merge + API key; user accounts for access tests and reviews.
- [Connecting Vanta & Cloudflare](../articles/connecting-vanta-cloudflare.md): read-only user-owned API token ('Read all resources' template); network and security resources into Vanta.
- [Connecting Vanta & Cloudflare for Government](../articles/connecting-vanta-cloudflare-for-government.md): the same read-only token flow for Cloudflare's government (FedRAMP) environment.
- [Connecting Vanta & Comeet](../articles/connecting-vanta-comeet.md): Merge + API key; user accounts for access tests and reviews.
- [Connecting Vanta & Confluence](../articles/connecting-vanta-confluence.md): OAuth; syncs policies and documents (not the Confluence Access Control integration).
- [Connecting Vanta & Confluence Access Control](../articles/connecting-vanta-confluence-access-control.md): OAuth; accounts from Confluence groups for access governance and account tests; Vanta Gov.
- [Connecting Vanta & Copper](../articles/connecting-vanta-copper.md): Merge + API key; account data for onboarding/offboarding.
- [Connecting Vanta & Cybeready](../articles/connecting-vanta-cybeready.md): stub: contact Vanta to integrate the CybeReady training platform.
- [Connecting Vanta & Dashlane](../articles/connecting-vanta-dashlane.md): read-only SCIM token (Business admin); Dashlane users on the Access page; Configure scope.
- [Connecting Vanta & Duo](../articles/connecting-vanta-duo.md): users, admins, groups and roles on a schedule; linking and terminated-account tests; optional deactivation of Duo accounts at offboarding.
- [Connecting Vanta & Envoy](../articles/connecting-vanta-envoy.md): OAuth; employees on the Access page; US and EU Envoy; several Envoy companies per Vanta domain.
- [Connecting Vanta & Fieldguide](../articles/connecting-vanta-fieldguide.md): audit-firm platform: auditors sync customer evidence and metadata from Vanta into a Fieldguide engagement (one-way, or the IRL experience on higher plans).
- [Connecting Vanta & GitLab Self-Managed instance](../articles/connecting-vanta-gitlab-self-managed-instance.md): GitLab 14-18 self-managed over API v4 with an OAuth app; group owner required; fetches every 6 h.
- [Connecting Vanta & Gong](../articles/connecting-vanta-gong.md): OAuth as the connecting user; Gong users on the Access page.
- [Connecting Vanta & Google Drive](../articles/connecting-vanta-google-drive.md): OAuth; syncs policies and documents only from shared drives named exactly 'Vanta Documents' and 'Vanta policies'.
- [Connecting Vanta & Grafana](../articles/connecting-vanta-grafana.md): Cloud Account (users on Access, offboarding reminders) and/or Stack via service account (alerts as monitoring evidence); no self-hosted.
- [Connecting Vanta & Heroku](../articles/connecting-vanta-heroku.md): OAuth; Heroku as a cloud provider; app instances monitored.
- [Connecting Vanta & HubSpot](../articles/connecting-vanta-hubspot.md): OAuth2; HubSpot users on the Access page; Vanta Gov.
- [Connecting Vanta & Insightly](../articles/connecting-vanta-insightly.md): Merge + API key; user accounts for access tests and reviews.
- [Connecting Vanta & Intercom](../articles/connecting-vanta-intercom.md): OAuth; admin and teammate accounts; 'Intercom accounts associated with users' test; Vanta Gov.
- [Connecting Vanta & Iru](../articles/connecting-vanta-iru.md): Iru (formerly Kandji) read-only API token; managed macOS/Windows computers, apps and Library Item status into Computers and endpoint tests; Blueprint sync filter.
- [Connecting Vanta & JobAdder](../articles/connecting-vanta-jobadder.md): via Merge; user accounts for access tests and reviews.
- [Connecting Vanta & Jobvite](../articles/connecting-vanta-jobvite.md): Merge + API key; user accounts for access tests and reviews.
- [Connecting Vanta & LaunchDarkly](../articles/connecting-vanta-launchdarkly.md): API key; users on the Access page; Configure scope.
- [Connecting Vanta & Microsoft Endpoint Manager / Intune MDM](../articles/connecting-vanta-microsoft-endpoint-manager-intune-mdm.md): Intune device and app data for Windows/macOS into Computers; continuous device configuration tests; read-only.
- [Connecting Vanta & Microsoft SharePoint](../articles/connecting-vanta-microsoft-sharepoint.md): tenant-wide admin consent (Global or Application Administrator); syncs policies and documents from a 'Vanta policies' folder.
- [Connecting Vanta & MongoDB Atlas for Government](../articles/connecting-vanta-mongodb-atlas-for-government.md): FedRAMP Moderate Atlas; read-only API key; database clusters and users against compliance tests.
- [Connecting Vanta & New Relic](../articles/connecting-vanta-new-relic.md): User-type API key; New Relic users for access tests.
- [Connecting Vanta & Notion](../articles/connecting-vanta-notion.md): OAuth; users on the Access page; pulls tasks and creates Notion tasks from tests.
- [Connecting Vanta & Omnissa Workspace One](../articles/connecting-vanta-omnissa-workspace-one.md): OAuth client; Workspace ONE MDM device data into Computers.
- [Connecting Vanta & OpenAI](../articles/connecting-vanta-openai.md): admin API key; users and roles for access tests, reviews and requests; Vanta Gov.
- [Connecting Vanta & PagerDuty](../articles/connecting-vanta-pagerduty.md): OAuth 2.0; recurring user sync; optional removal of PagerDuty accounts at offboarding.
- [Connecting Vanta & Pipedrive](../articles/connecting-vanta-pipedrive.md): OAuth; users on the Access page; Configure scope.
- [Connecting Vanta & Render](../articles/connecting-vanta-render.md): API token; users on the Access page; Configure scope.
- [Connecting Vanta & Rockset](../articles/connecting-vanta-rockset.md): create a role and API key in Rockset; users on the Access page.
- [Connecting Vanta & Rollbar](../articles/connecting-vanta-rollbar.md): access token; account sync; linking and terminated-account tests; read-only (no deactivation).
- [Connecting Vanta & Salesforce (Access)](../articles/connecting-vanta-salesforce-access.md): OAuth; user sync, account tests, access reviews and optional deactivation at offboarding (Access Management add-on).
- [Connecting Vanta & Slack (Access)](../articles/connecting-vanta-slack-access.md): OAuth; member/admin/owner accounts, role and 2FA feed 'MFA on Slack' and 'Slack accounts associated with users'; bots and single-channel guests excluded; Vanta Gov.
- [Connecting Vanta & Smart Recruiters](../articles/connecting-vanta-smart-recruiters.md): Merge + API key; user accounts for access tests and reviews.
- [Connecting Vanta & Smartsheet](../articles/connecting-vanta-smartsheet.md): OAuth; users on the Access page; Configure scope.
- [Connecting Vanta & Snyk](../articles/connecting-vanta-snyk.md): API token (Snyk Enterprise); projects and vulnerabilities on a Snyk tab of the Vulnerabilities page; alerts for new findings and near-SLA ones.
- [Connecting Vanta & Splunk](../articles/connecting-vanta-splunk.md): Splunk Cloud user access sync through a service account; access tests and reviews.
- [Connecting Vanta & Splunk Enterprise](../articles/connecting-vanta-splunk-enterprise.md): self-hosted Splunk over its REST API (allowlist Vanta's IP); user accounts for access governance.
- [Connecting Vanta & Sumo Logic](../articles/connecting-vanta-sumo-logic.md): API token; users on the Access page; Configure scope.
- [Connecting Vanta & Tailscale](../articles/connecting-vanta-tailscale.md): OAuth client; user accounts on a schedule for access reviews and deprovisioning checks.
- [Connecting Vanta & Teamtailor](../articles/connecting-vanta-teamtailor.md): Merge + API key; user accounts for access tests and reviews.
- [Connecting Vanta & Torii](../articles/connecting-vanta-torii.md): API key; SaaS-management accounts for access governance; 'Torii accounts associated with users' test.
- [Connecting Vanta & Twilio](../articles/connecting-vanta-twilio.md): OAuth app from the Twilio Admin Center; active users; unlinked accounts on Personnel > Access fixed by manual linking or matching email.
- [Connecting Vanta & Webex](../articles/connecting-vanta-webex.md): OAuth; Webex users on the Access page; Configure scope.
- [Connecting Vanta & Xero](../articles/connecting-vanta-xero.md): user access sync for access tests and reviews.
- [Connecting Vanta & Zoom](../articles/connecting-vanta-zoom.md): OAuth; users and roles for tests, reviews, requests and optional deprovisioning.
- [Connecting Vanta & ZoomInfo](../articles/connecting-vanta-zoominfo.md): read-only SCIM token; users only (no roles).
- [Connecting Vanta & monday.com](../articles/connecting-vanta-monday-com.md): install the Vanta app in monday.com; write scope now optional for creating tasks.
- [Connecting Vanta and Certn](../articles/connecting-vanta-and-certn.md): API key; completed background checks auto-linked to Vanta people by email, or linked by hand.
- [Connecting Vanta and DocuSign](../articles/connecting-vanta-and-docusign.md): OAuth2 as a DocuSign Administrator, who must keep that role or the integration fails.
- [Connecting Vanta and Ramp](../articles/connecting-vanta-and-ramp.md): OAuth; Admin or Owner in Ramp.
- [Error Connecting KnowBe4](../articles/error-connecting-knowbe4.md): fix: Save Changes after enabling the Reporting API token; Platinum plan minimum.
- [Google Compliance Reports Manager: Downloading Reports for Vendors Page in Vanta](../articles/google-compliance-reports-manager-downloading-reports-for-vendors-page-in-vanta.md): download Google's SOC 2 / ISO 27001 reports for the Vendors page (no connection).
- [How Does Vanta Use Merge?](../articles/how-does-vanta-use-merge.md): Merge.dev aggregates some HRIS, task-tracker and access integrations; read-only except task creation; list of Merge-backed tools.
- [Integrating Vanta & CrowdStrike](../articles/integrating-vanta-crowdstrike.md): OAuth client; account access plus Falcon Spotlight vulnerabilities on the Vulnerabilities page; Vanta Gov.
- [Integrating Vanta & Datadog](../articles/integrating-vanta-datadog.md): API + Application key; users to Access, monitors as monitoring evidence; optional Cloud Security (vulnerabilities, alerts) and Cloud SIEM.
- [Integrating Vanta & JumpCloud MDM](../articles/integrating-vanta-jumpcloud-mdm.md): API key with System Insights on; device information for MDM evidence.
- [Manually Sync Policies: Google Drive / Microsoft SharePoint / Confluence](../articles/manually-sync-policies-google-drive-microsoft-sharepoint-confluence.md): policy sync from Drive/SharePoint/Confluence runs hourly; manual Sync from the policy's page.
- [Microsoft Endpoint Manager (Intune) - Configuration for Vanta](../articles/microsoft-endpoint-manager-intune-configuration-for-vanta.md): Vanta reads Intune compliance policies only (not configuration profiles); required screen-lock and other settings.
- [Missing Px security issues resolved test](../articles/missing-px-security-issues-resolved-test.md): P0-P3 'security issues resolved' tests switch on once a tracker task carrying that priority tag is seen.
- [Personal Slack Notifications in Vanta](../articles/personal-slack-notifications-in-vanta.md): per-person Slack DMs for assignments, questions and due items; an admin connects Slack first.
- [Setting Up Microsoft Teams Notifications](../articles/setting-up-microsoft-teams-notifications.md): add the Vanta bot to a team, then enable Teams notifications in Vanta; Vanta Gov.
- [Setting Up and Using the Vanta Slack App](../articles/setting-up-and-using-the-vanta-slack-app.md): Vanta Agent and notifications in Slack (@Vanta, channels, DMs); Slack permissions IT approves.
- [Sunsetting Google Drive Shared Background Checks](../articles/sunsetting-google-drive-shared-background-checks.md): Drive-shared background checks ended 2 May 2025; use manually linked checks.
- [Syncing Policies from Confluence](../articles/syncing-policies-from-confluence.md): label pages 'policy' in Confluence, then Sync from the Vanta policy editor.
- [Syncing Policies from Google Drive](../articles/syncing-policies-from-google-drive.md): Google Docs only from the shared drive 'Vanta policies' (case-sensitive); allowlist Vanta in Workspace.
- [Syncing Policies from Microsoft SharePoint](../articles/syncing-policies-from-microsoft-sharepoint.md): 'Vanta policies' folder in a document library; Sync from the policy editor.
- [Tracking External Security Tasks in Vanta](../articles/tracking-external-security-tasks-in-vanta.md): tracker tasks labelled 'security' feed security-task tests (Items to Remediate / Remediation History); fields read; per-tool 'closed' rule; labels set in Manage > Task tracking labels.
- [Troubleshooting Google Drive File Download Issues](../articles/troubleshooting-google-drive-file-download-issues.md): DLP policies can stop Vanta downloading Drive files; causes and workarounds.
- [Vanta & A-SCEND Integration](../articles/vanta-a-scend-integration.md): for A-LIGN audits: Vanta pushes audit evidence and metadata into A-SCEND during the audit window.
- [Vanta & Basecamp Integration](../articles/vanta-basecamp-integration.md): OAuth2 via Merge; user access and ticket creation from Vanta.
- [Vanta & Brex Integration](../articles/vanta-brex-integration.md): API token; Brex users list for access.
- [Vanta & Lever Integration](../articles/vanta-lever-integration.md): OAuth, read-only; inherits the connecting user's permissions.
- [Vanta & Sentry Integration](../articles/vanta-sentry-integration.md): organization token / OAuth client credentials; read-only users.
- [Vanta & Vouch Cyber Insurance](../articles/vanta-vouch-cyber-insurance.md): buy Vouch cyber insurance inside Vanta; the policy is linked back as document evidence.
- [Vanta Background Checks Powered by Certn](../articles/vanta-background-checks-powered-by-certn.md): order US background checks from inside Vanta (Certn-powered).
- [Vanta and Gorgias](../articles/vanta-and-gorgias.md): API token via Merge; people and onboarding/offboarding dates.
- [What You Can Do with Vanta + Slack (for CTM Customers)](../articles/what-you-can-do-with-vanta-slack-for-ctm-customers.md): 3 Customer Trust workflows in Slack: approve Trust Center access requests, answer security questions, collaborate on questionnaires.

### Integrations by Type › Cloud Providers (35)

- [Azure Alerts](../articles/azure-alerts.md): Vanta reads Azure alert rules (Activity Log, Resource Health) for the 'Azure integration has active Activity Log Alerts' test.
- [Azure Kubernetes Guide](../articles/azure-kubernetes-guide.md): AKS clusters land in Inventory unasked; listing and testing nodes needs control-plane API access from Vanta's scanner IP, toggled as a product.
- [Azure VM showing "No actionable vulnerabilities" message on Vulnerabilities Page](../articles/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page.md): why a VM reads 'No actionable vulnerabilities' on Findings by asset; check Defender for Cloud; MDVM findings unsupported there.
- [Azure: Integration Guide](../articles/azure-integration-guide.md): full Azure + Entra ID guide: Graph and ARM data, Cloud Shell or Portal setup, subscription vs tenant, products (AKS, Defender for Cloud, Key Vault), SCIM silently overriding scope, Azure Government, MFA and account tests, secret expiry.
- [Azure: Quickstart](../articles/azure-quickstart.md): Cloud Shell path: connection type, products, IDs, run the script (2-4 min), paste App ID + Tenant ID, Vanta validates access.
- [Bulk Tagging for AWS Resources in Vanta](../articles/bulk-tagging-for-aws-resources-in-vanta.md): AWS tags set owner, description, scope and data-classification flags on each sync; custom-tag mapping; Terraform/CloudFormation examples.
- [Bulk Tags](../articles/bulk-tags.md): Vanta tags (VantaOwner, VantaNonProd, VantaDescription, VantaContainsUserData, VantaContainsEPHI, VantaUserDataStored, VantaNoAlert) and custom-tag mapping per cloud; tags persist where manual edits do not.
- [CIS GCP Foundations Benchmark](../articles/cis-gcp-foundations-benchmark.md): CIS GCP Foundations controls mapped to automated tests and manual checks by section (IAM, logging, networking, VMs...), with remediation steps and audit exports.
- [Configuring CSPM Alerts](../articles/configuring-cspm-alerts.md): Assets > CSPM alerts (Open / Deactivated; Source, Severity, SLA status), alert drawer with remediation and impacted asset, SLA settings per severity, deactivate monitoring until a date.
- [Connecting AWS with CloudFormation](../articles/connecting-aws-with-cloudformation.md): CloudFormation path: standard or GovCloud, products, download the .yaml stack, deploy, return the role ARN.
- [Connecting GCP Container Registry to Vanta](../articles/connecting-gcp-container-registry-to-vanta.md): enable the Container Analysis and Container Scanning APIs so Vanta pulls GCR image vulnerabilities.
- [Connecting Vanta  to an AWS Organization](../articles/connecting-vanta-to-an-aws-organization.md): org-level AWS connection (CloudFormation or console) that discovers member accounts; cannot mix with account-level; scope accounts afterwards.
- [Connecting Vanta &  Azure DevOps](../articles/connecting-vanta-azure-devops.md): Microsoft Entra ID auth (legacy OAuth retired); read-only or read+write (work items); relink existing credentials.
- [Connecting Vanta & AWS Accounts](../articles/connecting-vanta-aws-accounts.md): console wizard: account type, products (AWS, CodeCommit, Identity Center, Inspector), policy JSON, vanta-auditor role, role ARN, regions, Configure scope; Inspector severity threshold; more accounts via Manage > Edit.
- [Connecting Vanta & Akamai](../articles/connecting-vanta-akamai.md): domains with DDoS/WAF/bot protection status into Inventory; users and groups via SCIM for access.
- [Connecting Vanta & Digital Ocean](../articles/connecting-vanta-digital-ocean.md): OAuth; droplets, load balancers and more on Inventory; Configure scope.
- [Connecting Vanta & Netlify](../articles/connecting-vanta-netlify.md): OAuth; users on the Access page; reconnect to get newer automation.
- [Connecting Vanta & OVHcloud](../articles/connecting-vanta-ovhcloud.md): choose the region, generate keys from a region-specific link, paste them.
- [Connecting Vanta & Oracle Cloud](../articles/connecting-vanta-oracle-cloud.md): API key; users, groups, policies, buckets and databases; connect by compartment or whole tenancy.
- [Connecting Vanta & Oracle Cloud HCM](../articles/connecting-vanta-oracle-cloud-hcm.md): via Merge; Oracle HCM employees for onboarding/offboarding.
- [Connecting Vanta & Scaleway](../articles/connecting-vanta-scaleway.md): API token; users on the Access page; Configure scope.
- [Connecting Vanta & Supabase](../articles/connecting-vanta-supabase.md): OAuth; users on Access and projects on Inventory; reconnect for new features.
- [Connecting Vanta & Vercel](../articles/connecting-vanta-vercel.md): access token; team members for access reviews and projects into Inventory.
- [Connecting Wiz with Vanta](../articles/connecting-wiz-with-vanta.md): service-account client ID/secret; vulnerability findings and open security issues mapped to controls; users.
- [Google Cloud Platform: Integration Guide](../articles/google-cloud-platform-integration-guide.md): full GCP guide: resource types by category, per-project API and permission gating (silent skips), org credential expansion, 4 setup methods (Cloud Shell/Terraform x org/project), autopass tests, CIS, GKE, limitations.
- [Google Cloud Platform: Quickstart](../articles/google-cloud-platform-quickstart.md): org-level Cloud Shell path: domain, products (GCP, Container Analysis, CIS benchmarks), run the idempotent script, paste the project number, validation.
- [How to Connect Multiple Azure Subscriptions to Vanta](../articles/how-to-connect-multiple-azure-subscriptions-to-vanta.md): add another subscription (same or another tenant) to an existing Azure connection.
- [How to Troubleshoot Azure Resources Not Appearing in Inventory](../articles/how-to-troubleshoot-azure-resources-not-appearing-in-inventory.md): ordered checks: subscription connected and in scope, resource type supported, permissions, tags, sync timing.
- [How to troubleshoot AWS resources not Appearing in Inventory](../articles/how-to-troubleshoot-aws-resources-not-appearing-in-inventory.md): check manual out-of-scope marks, bulk tags, regions and permissions.
- [Integrating Vanta & Snowflake](../articles/integrating-vanta-snowflake.md): account URL + warehouse; users on Access, databases on Inventory; Configure scope.
- [Modifying the VantaAdditionalPermission Policy for Individual AWS Accounts](../articles/modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts.md): update VantaAdditionalPermissions when products change; SecurityAudit plus that policy on the VantaAuditor role.
- [Porting AWS Integrations Across Regions](../articles/porting-aws-integrations-across-regions.md): update the IAM role's trusted Vanta account after a Vanta region move, or data and tests go wrong.
- [ServiceNow Integration - Instance Setup Guide](../articles/servicenow-integration-instance-setup-guide.md): one ServiceNow instance per Vanta account; REST/OAuth auth-scope setup for users and tasks.
- [Updating your AWS integration to utilize Identity Store](../articles/updating-your-aws-integration-to-utilize-identity-store.md): add identitystore read actions to VantaAdditionalPermissions.
- [Which resources does Vanta fetch from AWS?](../articles/which-resources-does-vanta-fetch-from-aws.md): the list of 44 AWS resource types Vanta fetches (Access Analyzer to WAF).

### Integrations by Type › Endpoint and Device Management (MDM) (8)

- [Connecting Vanta & Addigy](../articles/connecting-vanta-addigy.md): API token; managed macOS fleet into Computers for disk encryption, antivirus and password-manager tests; scope devices out.
- [Connecting Vanta & Jamf Pro](../articles/connecting-vanta-jamf-pro.md): OAuth client; computers (hardware, OS, encryption, apps, profiles, local accounts) and Jamf accounts; Configure scope.
- [Connecting Vanta & ManageEngine](../articles/connecting-vanta-manageengine.md): device posture sync (choose provider region); read-only.
- [Connecting Vanta & Microsoft Intune (GCC High)](../articles/connecting-vanta-microsoft-intune-gcc-high.md): Intune in Azure Government (GCC High): Windows/macOS devices and apps, continuous device tests; Vanta Gov.
- [Connecting Vanta & Miradore](../articles/connecting-vanta-miradore.md): API key; device compliance data for device tests.
- [Connecting Vanta & NinjaOne](../articles/connecting-vanta-ninjaone.md): global OAuth; give your NinjaOne region (case-sensitive), Vanta handles the client.
- [Control Scope with Jamf for Workspace](../articles/control-scope-with-jamf-for-workspace.md): Configure scope > 'Control scope with Jamf': chosen Jamf groups decide computers and accounts in scope; per-item toggles disabled.
- [Scoping MDM Managed Computers via Iru Blueprints](../articles/scoping-mdm-managed-computers-via-iru-blueprints.md): exclude Iru Blueprints in the 'Set sync filters' step (new) or scope (older connections).

### Integrations by Type › HR Systems (HRIS) (26)

- [Connecting Vanta & 7Shifts Merge](../articles/connecting-vanta-7shifts-merge.md): Merge + API key; employees and groups.
- [Connecting Vanta & ADP Workforce Now](../articles/connecting-vanta-adp-workforce-now.md): via Merge; start/termination dates and status into People for employment-based tests.
- [Connecting Vanta & Bamboo HR](../articles/connecting-vanta-bamboo-hr.md): OAuth as a chosen BambooHR user (employee or dedicated non-employee); via Merge.
- [Connecting Vanta & Employment Hero](../articles/connecting-vanta-employment-hero.md): OAuth; provisions and deprovisions people in Vanta.
- [Connecting Vanta & Gusto](../articles/connecting-vanta-gusto.md): OAuth with Admin Full Access; read-only name, email and employment dates.
- [Connecting Vanta & HiBob](../articles/connecting-vanta-hibob.md): API token for a service user; employee data; Configure scope.
- [Connecting Vanta & Humaans](../articles/connecting-vanta-humaans.md): API key; people and dates; Configure scope.
- [Connecting Vanta & Justworks](../articles/connecting-vanta-justworks.md): OAuth linking flow (Merge); Administrator role.
- [Connecting Vanta & Kenjo](../articles/connecting-vanta-kenjo.md): Merge + API key; employees and groups.
- [Connecting Vanta & KnowBe4](../articles/connecting-vanta-knowbe4.md): read-only Reporting API key; completed training from chosen campaigns updates people's security tasks; Vanta Gov.
- [Connecting Vanta & Leapsome](../articles/connecting-vanta-leapsome.md): SCIM 2.0; accounts and groups; 'accounts associated with users' and 'deprovisioned when personnel leave' tests.
- [Connecting Vanta & NetSuite](../articles/connecting-vanta-netsuite.md): OAuth client credentials; both access (users) and HRIS (employees) data.
- [Connecting Vanta & PayFit](../articles/connecting-vanta-payfit.md): OAuth; employee data for provisioning and access.
- [Connecting Vanta & Rippling](../articles/connecting-vanta-rippling.md): OAuth; employees, managed devices and background-check status; a cutoff date picks which employees import (Manage > Edit Cutoff Date).
- [Connecting Vanta & Square Payroll](../articles/connecting-vanta-square-payroll.md): via Merge; employees for onboarding/offboarding.
- [Connecting Vanta & TriNet](../articles/connecting-vanta-trinet.md): OAuth client credentials, basic-read scope; TriNet Integration Administrator.
- [Connecting Vanta & iSolved](../articles/connecting-vanta-isolved.md): via Merge with client credentials; employees and groups.
- [Integrating Vanta & Deel](../articles/integrating-vanta-deel.md): SCIM (beta) with an organization token.
- [Integrating Vanta & Workday](../articles/integrating-vanta-workday.md): via Merge; the minimal Workday domain security permissions to grant.
- [Migrating HRIS Connection Type in Vanta](../articles/migrating-hris-connection-type-in-vanta.md): Manage > Reconnect (never delete, data is lost) to move to a new connection type; clean up old service users.
- [Migrating your HRIS System](../articles/migrating-your-hris-system.md): switching HRIS: confirm support, match emails to the IdP, connect the new one before disconnecting the old to avoid duplicate people.
- [Vanta & AlexisHR Integration](../articles/vanta-alexishr-integration.md): Merge + API token; people and onboarding/offboarding dates.
- [Vanta & Personio Integration](../articles/vanta-personio-integration.md): API client ID/secret; names, emails, titles, departments, status.
- [Vanta & Proliant Integration](../articles/vanta-proliant-integration.md): Merge + API token; people and dates.
- [Vanta and Charthop Integration](../articles/vanta-and-charthop-integration.md): Merge + API token; people and dates.
- [Vanta and Factorial](../articles/vanta-and-factorial.md): Merge + API token; people and dates.

### Integrations by Type › Identity Providers (32)

- [Azure SCIM Attribute Instructions](../articles/azure-scim-attribute-instructions.md): map rbac_role_id before enabling Entra SCIM or admins lose access; role and team attribute mapping.
- [Connect Vanta & Keeper](../articles/connect-vanta-keeper.md): SCIM; users and groups pulled hourly; read-only.
- [Connecting Vanta & Google Workspace (SCIM)](../articles/connecting-vanta-google-workspace-scim.md): Super Admin; SCIM provisioning of Vanta logins with default or custom roles.
- [Connecting Vanta & JumpCloud (SCIM)](../articles/connecting-vanta-jumpcloud-scim.md): enable SCIM in Settings > Login and Security; provisions Vanta logins only (no People records or devices).
- [Connecting Vanta & Microsoft Entra](../articles/connecting-vanta-microsoft-entra.md): OAuth; users, groups, directory roles and consented third-party apps (vendor discovery); Configure scope; older flow in Vanta Gov.
- [Connecting Vanta & Microsoft Entra (GCC High)](../articles/connecting-vanta-microsoft-entra-gcc-high.md): Entra ID GCC High through Azure Government Graph; users, groups, vendor apps; Vanta Gov only.
- [Connecting Vanta & Okta (SCIM)](../articles/connecting-vanta-okta-scim.md): enable SCIM in Vanta, then an Okta SCIM app to provision users.
- [Controlling Scope Through Microsoft Entra](../articles/controlling-scope-through-microsoft-entra.md): group assignments to the Vanta O365 app decide which people are in or out of scope.
- [Controlling Scope Through Okta](../articles/controlling-scope-through-okta.md): Okta app assignment is the source of truth for people scope; keep 'Use Okta to populate the People page' off until it is set.
- [Controlling Scope through JumpCloud](../articles/controlling-scope-through-jumpcloud.md): JumpCloud app access decides who is in or out of scope.
- [Controlling Scope through PingOne](../articles/controlling-scope-through-pingone.md): grant the Vanta app access to users and enable scoping via PingOne.
- [Controlling scope through OneLogin](../articles/controlling-scope-through-onelogin.md): grant the Vanta app access to users and enable scoping via OneLogin.
- [Creating a Custom SAML Connection](../articles/creating-a-custom-saml-connection.md): SAML SSO into Vanta without an IdP API integration (for TPRM, Access Reviews, Trust Center).
- [Creating a Service Account for the Google Workspace Integration](../articles/creating-a-service-account-for-the-google-workspace-integration.md): dedicated admin user and custom admin role with the listed privileges.
- [Dynamic IdP Groups: Google](../articles/dynamic-idp-groups-google.md): use Google groups as Vanta groups for task-set assignments.
- [Dynamic IdP Groups: Okta](../articles/dynamic-idp-groups-okta.md): use Okta groups as Vanta groups for task-set assignments.
- [Enabling SCIM in Vanta](../articles/enabling-scim-in-vanta.md): SCIM lets the IdP own Vanta logins and roles (add-on); what it overwrites.
- [Google Workspace: Integration Guide](../articles/google-workspace-integration-guide.md): full guide: six directory data types, optional vendor discovery, 5-tab listing page, 3-step wizard (features, connect, sync filters), group 'Vanta' filter (an empty group disconnects), tests, permissions.
- [Google Workspace: Quickstart](../articles/google-workspace-quickstart.md): about 10 min: features, OAuth, sync filter; powers MFA, offboarding-SLA and account tests.
- [How to set up SSO for Entra (Office 365)](../articles/how-to-set-up-sso-for-entra-office-365.md): Vanta O365 enterprise app for SSO into Vanta; Business Standard + Entra P1.
- [Include Staged Users in Identity Provider Import](../articles/include-staged-users-in-identity-provider-import.md): Configure scope toggle to import staged or provisioned users (Okta, JumpCloud, OneLogin); takes up to 1 h.
- [Integrating JumpCloud Identity Provider within Vanta](../articles/integrating-jumpcloud-identity-provider-within-vanta.md): toggle Identity Provider (and optionally MDM); API key; SSO app in JumpCloud.
- [Integrating Multiple Identity Providers](../articles/integrating-multiple-identity-providers.md): connect several IdPs, then Manage > Set Precedence for scope, groups, employment status and SSO; duplicate emails become fetch errors.
- [Integrating Vanta & PingOne Identity Provider](../articles/integrating-vanta-pingone-identity-provider.md): custom administrator role and worker app in PingOne; client secret.
- [JumpCloud SCIM Attribute Instructions](../articles/jumpcloud-scim-attribute-instructions.md): SAML first; assign Vanta RBAC roles by JumpCloud group.
- [Okta SCIM Attribute Instructions](../articles/okta-scim-attribute-instructions.md): separate SCIM app; Assignments for roles, Push Groups for Teams.
- [Okta: Integration Guide](../articles/okta-integration-guide.md): full guide: 3 separate Okta apps (API, SSO, SCIM); users, MFA factors, admin roles, groups, apps, password and auth policies, FedRAMP org settings; OAuth+DPoP or SSWS token; IdP scoping; MFA and account-linking tests.
- [Okta: Quickstart](../articles/okta-quickstart.md): API Services app path; users, groups, roles, apps and password policies power tests, reviews and requests.
- [Resolving the Vanta couldn't query a few accounts from Google Workspace due to insufficient permissions. To improve the accuracy of this list, ask an admin to reconnect Google Workspace.](../articles/resolving-the-vanta-couldn-t-query-a-few-accounts-from-google-workspace-due-to-insufficient-permissions-to-improve-the-accuracy-of-this-list-ask-an-admin-to-reconnect-google-workspace.md): Vendor discovery shows 'This list is only partially complete' with Reconnect although the integration has no error; re-add the account to grant the missing scope.
- [Setting up Single Sign-On (SSO) with OneLogin](../articles/setting-up-single-sign-on-sso-with-onelogin.md): create the Vanta app in OneLogin for SSO into Vanta.
- [Tracking Password Settings for Okta in Vanta](../articles/tracking-password-settings-for-okta-in-vanta.md): choose which Okta password policy applies to each app (and AWS) as vendor evidence.
- [Vanta & Identity Providers (IdPs)](../articles/vanta-identity-providers-idps.md): why the IdP comes first: it defines the people list for personnel tests; scope people in or out.

### Integrations by Type › Security Awareness Training (5)

- [Connecting Vanta & AbsorbLMS](../articles/connecting-vanta-absorblms.md): OAuth client credentials; map courses to SAT categories, set group training requirements; completion tests per person in scope.
- [Connecting Vanta & Docebo](../articles/connecting-vanta-docebo.md): OAuth; hourly completion sync; map courses to 9 SAT categories; up to 11 tests; per-group Manage trainings picks Vanta or integration training.
- [Connecting Vanta & Mimecast](../articles/connecting-vanta-mimecast.md): OAuth 2.0 client credentials (Custom API 2.0 app); users, campaigns, completions for SAT tests.
- [Connecting Vanta & Udemy Business](../articles/connecting-vanta-udemy-business.md): API credentials; map courses to categories; completion tracked per person in scope.
- [Connecting Vanta & Wizer](../articles/connecting-vanta-wizer.md): API key + Company ID; users, courses and completions; up to 11 tests.

### Integrations by Type › Version Control Systems (6)

- [Connecting Vanta & GitLab Cloud](../articles/connecting-vanta-gitlab-cloud.md): OAuth; repositories and users; fetches every 6 h; Configure scope.
- [Creating a Security Label within GitHub Issues](../articles/creating-a-security-label-within-github-issues.md): add a 'security' label so Vanta tracks GitHub issues as security tasks.
- [GitHub: Integration Guide](../articles/github-integration-guide.md): full guide: repos, PRs, members, Dependabot alerts, invitations, security-labelled issues; GitHub App installed by an Org Owner; branch-protection and code-review tests; user matching; production-branch property.
- [GitHub: Quickstart](../articles/github-quickstart.md): about 5 min GitHub Cloud App install; verify; optional vanta_production_branch_name property.
- [How to change Azure Devops Read/Write Permissions](../articles/how-to-change-azure-devops-read-write-permissions.md): re-authenticate with Entra admin consent to switch read-only and read+write; no data loss.
- [Ignoring Github Vulnerabilities](../articles/ignoring-github-vulnerabilities.md): dismiss Dependabot alerts in GitHub (Vanta follows) or mark the repository out of scope.

### Integrations by Type › Vulnerability Scanners (9)

- [Connecting Vanta & Microsoft Defender for Endpoint](../articles/connecting-vanta-microsoft-defender-for-endpoint.md): OAuth admin consent; active devices and CVE findings (CVSS v3, fixing KB) on Vulnerabilities; 4 severity tests; Activity tab for sync history and errors.
- [Connecting Vanta & Microsoft Defender for Endpoint for US Government (GCC High)](../articles/connecting-vanta-microsoft-defender-for-endpoint-for-us-government-gcc-high.md): the same for GCC High tenants in Azure Government (CUI holders); Vanta Gov.
- [Connecting Vanta & Orca Security](../articles/connecting-vanta-orca-security.md): API token per region; Orca vulnerability scanner toggle; findings and CSPM alerts.
- [Connecting Vanta & Semgrep](../articles/connecting-vanta-semgrep.md): read-only API token; SAST, secrets and SCA findings plus scan history; vulnerability, secrets-remediation and scan-frequency tests.
- [Connecting Vanta & SentinelOne](../articles/connecting-vanta-sentinelone.md): read-only API token; 8 tests: account linking, vulnerability visibility, prevention policy, alerts addressed, 4 severity tests.
- [Connecting Vanta & Tenable](../articles/connecting-vanta-tenable.md): 3-step wizard: create a Basic User 'Vanta Scanner', give it Can View on All Assets, generate API keys and paste them.
- [Connecting Vanta & Tenable Vulnerability Management FedRAMP](../articles/connecting-vanta-tenable-vulnerability-management-fedramp.md): fedcloud.tenable.com; vulnerabilities (no INFO), scans, assets, users (Admin role); severity, scan-frequency, account-linking and deprovisioning tests; up to 8 h per sync.
- [Setting up Vulnerability Scanning](../articles/setting-up-vulnerability-scanning.md): container and host sources (Inspector, GCR, Defender for Containers, Dependabot, Snyk); SLA deadlines and alerts, severity import threshold, repositories scoped out, history tab of SLA misses.
- [Where does Vanta Pull Vulnerabilities from in Gitlab?](../articles/where-does-vanta-pull-vulnerabilities-from-in-gitlab.md): only from GitLab's Security Dashboard / Security Center on the default branch.

### Integrations by Type › Workflow and Ticketing Tools (13)

- [Connecting Vanta & Asana](../articles/connecting-vanta-asana.md): OAuth; create or link tasks from tests and controls with status/assignee/due synced; task attachments become recommended evidence; users; comments on events.
- [Connecting Vanta & ClickUp](../articles/connecting-vanta-clickup.md): OAuth; tasks for task-based controls, workspace members, task creation from tests.
- [Connecting Vanta & Jira Data Center](../articles/connecting-vanta-jira-data-center.md): Personal Access Token; access sync plus labelled issue tracking and issue creation; IP allowlist.
- [Connecting Vanta & Teamwork](../articles/connecting-vanta-teamwork.md): API token; access data, task tracking and vendor procurement; Configure scope.
- [Controlling Assets Scope Through Tenable](../articles/controlling-assets-scope-through-tenable.md): tag assets in Tenable and limit the Vanta permission's objects to that tag.
- [Jira Custom Fields in Vanta](../articles/jira-custom-fields-in-vanta.md): Vanta detects required Jira custom fields and asks for them when creating issues.
- [Jira: Integration Guide](../articles/jira-integration-guide.md): full guide: features (access reviews, task tracking, task creation, procurement), service account, sync filters by label or JQL per category, status-category mapping, SLA = resolved minus created, manual and automatic issue creation, Jira for Gov.
- [Jira: Quickstart](../articles/jira-quickstart.md): about 10 min: allow user-installed apps, select features, Atlassian OAuth, choose site, sync filters, label issues, verify in Tests filtered by integration.
- [Reconnecting Linear Permissions in Vanta (June 2022)](../articles/reconnecting-linear-permissions-in-vanta-june-2022.md): Linear moved to OAuth; reconnect to resume fetching.
- [Remediation Task Tracking for Access Reviews](../articles/remediation-task-tracking-for-access-reviews.md): create one or many tracker tickets from flagged accounts in an access review (write access needed).
- [Tracking Incident Management and Resolution Tickets in Vanta: Jira](../articles/tracking-incident-management-and-resolution-tickets-in-vanta-jira.md): labels or JQL for incident-management and incident-resolution tickets as incident-process evidence.
- [Vanta & Task Management](../articles/vanta-task-management.md): 12 two-way trackers; Create task on a test, one for all or one per failing item; assignee and status reflected on the test.
- [Vanta & Zendesk Integration](../articles/vanta-zendesk-integration.md): OAuth, read-only users and tickets.

## 2. Product surfaces

Image paths are relative to this file. Surfaces without a path are described from article text only.

### 2.1 Integrations page (connected list)

- Header: H1 "Integrations", a two-line description with an "IP address" link (the allowlist IP), and "Add integration" as the primary at top right.
- Tabs with counts: "Connected (32)" and "Errors (8)". An older build also had "Available (410)", seen behind a modal in gw/15.
- Attention banner (red X): "Some integrations need immediate attention · 8 integrations are not properly fetching data" with a "View errors" button. The newer build collapses it to "64 integrations need your immediate attention" with a chevron.
- Toolbar: "Search connected integrations", the filters Capability, Category, Creator, Status and Type, and an "Apply user scope" button (gear icon).
- Card-row version: logo, name, a green "Connected" chip, a category subtitle (HRIS, Task management) and capability tags (Access, Inventory, Vulnerabilities, Task creation, Task tracking, Vendor procurement). On the right are "Configure scope" (only where the integration supports it) and "Manage".
- Table version (newer): Integration (name, then "4 accounts • First connected August 26, 2026"), Resources ("175 resources / Synced 0 hours ago"), a Status chip, and a ⋯ menu.
- Manage / ⋯ items vary by integration type: Edit, Reconnect, Configure scope, Task tracking labels, Edit Cutoff Date, Edit personnel monitoring, Change IdP precedence (or Set Precedence), and Delete. HRIS help warns "do NOT delete": doing so loses data.
- Images: ../../images/ux/integrations/integrations-page--01.png, ../../images/ux/integrations/integrations-page--05.png, ../../images/ux/integrations/google-workspace-integration-guide--14.png, ../../images/ux/integrations/tracking-external-security-tasks-in-vanta--03.png, ../../images/ux/integrations/migrating-hris-connection-type-in-vanta--01.png

### 2.2 Integration directory ("Add integrations")

- Header: a "Back to integrations" link, H1 "Add integrations", the subtitle "Connect to over 400+ integrations…", a search field ("Search by keyword, category, or capability") and an external "Request integration" link at top right.
- "Featured integrations": 4 cards with tinted icons: Start-up essentials, Enterprise ready, Most popular and Just added.
- Category rows, each with a count chip and "See all": "Recommended for you 6", "Manage and review system access 315", "Integrations built by your team 2". The text lists further job-based rows: devices, infrastructure, policies and documents, personnel, cloud alerts, training, remediation tasks.
- Cards, 3 to a row: logo, name, "By Vanta" or "By Partner", a description cut at 2 lines, and a capability line behind a bolt icon ("Access • Document upload • Vulnerabilities", or "3 Capabilities"). Each card has an assign icon (a dashed person) and a bookmark that fills when saved.
- Search results: "Search results for "google workspace"" with Clear, the same 5 filters, and result cards.
- Images: ../../images/ux/integrations/integrations-page--02.png, ../../images/ux/integrations/integrations-page--03.png, ../../images/ux/integrations/how-to-work-with-system-owners-to-connect-integrations--01.png, ../../images/ux/integrations/google-workspace-integration-guide--07.png

### 2.3 Integration detail, two generations

- Older: a right-hand drawer over the directory. It shows a logo tile, the name, "Built by Vanta", a capability chip and a "Connect" primary under the logo.
  - Drawer sections: Overview; Automation ("Automates 2 tests and 25 controls", a link); Categories; Permissions (one sentence: "read-only API requests to the 1Password SCIM API"); Resources ("1Password Account").
  - Image: ../../images/ux/integrations/integrations-page--04.png
- Newer: a full listing page with a back link, logo + H1 and a one-line description.
  - Line tabs: Overview, API permissions, Resource types, Automated tests, Security.
  - Overview body: prose, a Features bullet list, and Prerequisites as a list of check marks.
  - Right rail, card 1: "Unlocks 4 new tests" and "Automates 0 controls across 0 frameworks", above a black "Connect" primary.
  - Right rail, card 2: Built by, Categories, Capabilities chips (Access, Groups, Vendor discovery, Single sign-on, People), Works with (Automated Compliance, Personnel and Access), Pricing, and an "Additional help: Setup guide" link.
  - Tab content, per the text:
    - API permissions: each permission with its scope, read or write, and the data it covers ("share with your security team").
    - Resource types: every type and field collected.
    - Automated tests: how many tests, which frameworks and controls they map to, and the full list.
    - Security: encryption and retention.
  - Image: ../../images/ux/integrations/google-workspace-integration-guide--08.png

### 2.4 Connect wizard

- Full-screen modal. The header has an X, "Connect AWS" with an info icon, and a "Help Center" link at right; a thin progress bar under it fills as steps complete.
- Left stepper of numbered steps, with sub-steps nested under some of them:
  - AWS: Account type, Select products, Policy creation (AWS policy creator, Policy details), Role creation (AWS role creator, Role details, Role ARN), Region selection, Configure scope.
  - Tenable: 3 steps. Azure: 7, ending "Check connection". GCP: 6, ending "Configure scope".
- Main pane: the step's H2 and a one-line purpose, then numbered instructions with deep links into the vendor console ("Access Control Users page"). Its controls:
  - Fields: Username; Access Key and Secret Key (masked, with a reveal eye); App ID and Tenant ID (placeholder "xxxxxxxx-…").
  - A JSON policy block with Copy.
  - Product toggles with info tooltips, under a grey "What products should I integrate with in Vanta?" explainer.
  - On the right, a screenshot or short video of the vendor screen with the fields to set boxed in.
- Footer: Back, then Next (disabled until the step's input is valid); the last step shows Done.
- Success, old style: "You're connected!" and "Great! All of your credentials are valid…", a Success callout ("could take up to a few hours"), and "Go to integration management".
- Success, new style: a green check, "You're connected", a "Syncing resources…" spinner and "Manage integration".
- Simplified newer wizard (Google Workspace, Iru):
  - A left list of steps with filled or half dots (Select features, Connect, Set sync filters) and one question per step, saved with a black Save.
  - Checkbox options carry helper text; consequences are stated inline ("If that group is missing or empty … Vanta disconnects the integration").
- Scanner steps:
  - A severity import threshold step.
  - The username is validated against the vendor's own user list.
  - Keys only work in their own environment: commercial and FedRAMP keys are not interchangeable (text).
- Images: ../../images/ux/integrations/connecting-vanta-tenable--01.png, ../../images/ux/integrations/connecting-vanta-tenable--13.png, ../../images/ux/integrations/connecting-vanta-tenable--18.png, ../../images/ux/integrations/connecting-vanta-aws-accounts--05.png, ../../images/ux/integrations/connecting-vanta-aws-accounts--08.png, ../../images/ux/integrations/azure-integration-guide--20.png, ../../images/ux/integrations/azure-quickstart--10.png, ../../images/ux/integrations/google-cloud-platform-quickstart--04.png, ../../images/integrations/google-workspace/google-workspace-integration-guide--09.png, ../../images/integrations/google-workspace/google-workspace-integration-guide--11.png, ../../images/integrations/google-workspace/google-workspace-integration-guide--12.png, ../../images/integrations/iru/connecting-vanta-iru--02.png, ../../images/ux/integrations/setting-up-vulnerability-scanning--01.png

### 2.5 Configure scope (resource scope)

- Modal "Configure resource scope" over the Integrations page. Subtitle: "Resource scoping takes at least 1 hour to be updated correctly", then a paragraph on what to keep in scope and a "Learn about scoping resources" link.
- Left column: Accounts, one per connected account; the selected one is tinted.
- Right column:
  - IdP toggles: "Use GSuite to populate the People page" and "Control scope with GSuite" ("Updated about 2 hours ago").
  - A resource-type select (All) and "Search resources".
  - Per-type headers such as "Application Load Balancers in scope 7 / 7", each with "Mark all in • Mark all out", above rows with toggles.
- Turning on IdP scoping opens a confirm modal, "Turn on IdP scoping with GSuite", with an optional IdP group select and Cancel / Publish changes.
- The same step closes the connect wizard: "All your resources have finished loading. Can I configure scope at a later time?"
- Rules (text):
  - Bulk marking is disabled while a filter is applied.
  - A per-resource exemption is kept until a change at the parent level clears it.
  - Every change is logged (who, what, when, which integration).
  - Jamf or IdP group scoping disables the per-item toggles.
- Images: ../../images/ux/integrations/google-workspace-integration-guide--15.png, ../../images/ux/integrations/connecting-vanta-aws-accounts--30.png

### 2.6 Integration management (after connecting)

- Tabs named in the text, layout not seen: Overview (resources synced, fetch history), Activity (sync history and error details per run), Settings (connections; ⋯ > Edit re-runs the setup steps) and Scope (inferred layout).
- Multi-account modal "Link AWS · Manage AWS accounts": connected accounts, each with edit and delete icons; "Add new account" (primary) and "Delete all accounts" (danger).
- Settings set per integration (text): sync filters (a group, Blueprints, labels or JQL per category), severity threshold, regions, cutoff date, the "Task tracking labels" modal, and course-to-category assignments.
- Image: ../../images/integrations/aws/connecting-vanta-aws-accounts--31.png

### 2.7 Errors and reconnect

- The Errors tab count and the red banner with "View errors" sit on the Integrations page.
- Manage > Reconnect re-runs the connection modal for the same credential; Delete loses data.
- The page that uses the data carries its own banner: "This list is only partially complete · Vanta couldn't query a few accounts from Google Workspace due to insufficient permissions … ask an admin to reconnect", with a Reconnect button. It shows up even while the Integrations page reports no error.
- The Activity tab gives per-run error details (text).
- Help articles write every fix as "Likely cause / How to confirm / Fix", for example "wait 10-20 minutes, then check the Integrations page".
- Gap: GCP skips a resource type silently when an API or permission is missing, and no error appears in the UI.
- Images: ../../images/ux/integrations/integrations-page--01.png, ../../images/ux/vendors/resolving-the-vanta-couldn-t-query-a-few-accounts-from-google-workspace-due-to-insufficient-permissions-to-improve-the-accuracy-of-this-list-ask-an-admin-to-reconnect-google-workspace--02.png

### 2.8 Assign an integration to its owner

- The dashed-person icon on a directory card opens a people search popover.
- The person chosen gets a notification, and the assignment records who owns the connection. They must already be a Vanta user.
- Image: ../../images/ux/integrations/how-to-work-with-system-owners-to-connect-integrations--02.png

### 2.9 Identity provider precedence

- Modal "Indicate identity provider precedence": one explanatory sentence, a "Primary identity provider" select, a "Second identity provider" select, and Cancel / Save.
- A user present in two IdPs with the same email becomes a fetch error (text).
- Image: ../../images/integrations/multiple-identity-providers/integrating-multiple-identity-providers--03.png

### 2.10 Test detail (where integration data lands)

- Header: a "Tests" breadcrumb, the test name as H1 and a 3-line description.
  - A metadata row of icons: owner ("Unassigned"), "Ran 2h ago", "SLA: 7 hours", the integration ("Google Workspace", or "Asana, Azure DevOps +4") and a category tag.
  - ⋯ and assign buttons at right.
- Line tabs: Results, Evidence, History, Tasks 0, Controls 26, Audits, Comments 0.
- Evidence tab:
  - "Test criteria" with an About / Logic segmented toggle, under the headings "What is the test?", "What are the inputs to the test?" (named integration resources) and "What is pass and what is fail?" (Show more).
  - Collapsed sections: Test data, Out of scope resource, API requests, Exports.
- Results tab:
  - "Test results" with a "Create task ▾" secondary and a "How to remediate →" primary.
  - Banner: "5 items need remediation", then Select all.
  - Rows: checkbox, name, "Due on …" (red when overdue), ⋯.
  - Hover card on a row: "Jira Task", Detected on, Due on, "Based on the SLA for Security tickets: P2", and "View externally".
- Tasks section: one sub-tab per tracker with counts ("Asana (1) Jira (0) monday.com (0)") and "Create task".
- "Create Asana task" modal:
  - A summary ("1 Asana task will be created for selected item", with "Selected item (1)" expandable).
  - Workspace, then Project and Assignee, each disabled until the field before it is set, then Tags.
  - A radio: "Create one task for all detected items" or "Create individual tasks for each of the 14 detected items".
  - Name, prefilled as "[Vanta] Remediate "…"".
  - Cancel / Create, with Create disabled until the form is valid.
- Images: ../../images/ux/tests/google-workspace-integration-guide--16.png, ../../images/ux/tests/jira-quickstart--10.png, ../../images/ux/tests/vanta-task-management--02.png, ../../images/ux/tests/vanta-task-management--03.png

### 2.11 Tests register filtered by integration

- Tabs: All resource monitoring, Tests by segment.
- Card "Tests passing 0% · 0 of 2 passing", with Automated tests and Documents sub-bars.
- Card "Tests that need attention": Overdue, Needs remediation (no SLA assigned), Due soon.
- Toolbar: Search, then Category, Framework, Control, Integration, Owner, Automated test, Status, Rollout, Clear.
- The Integration filter popover has its own search, Selected and Unselected groups, "Clear (1)" and "Ungroup by selected".
- Table: Name (with category chips), Owner, a Status chip ("Overdue"), Failing entities ("18 Users"), Due date.
- Image: ../../images/ux/tests/jira-quickstart--08.png

### 2.12 Vulnerabilities ("Findings by asset")

- Header: H1, "Learn more", and Refresh and download buttons.
- 2 stat cards: "0 / 1 assets with critical vulnerabilities" and "0 / 1 unscanned assets".
- Search, then filters Source, Severity and Asset type.
- Table: Identifier (a link over the resource id), Sources (integration logos), Asset type, Vulnerability status ("No actionable vulnerabilities" with a check), Due date (with info).
- Pagination: "1-1 of 1 result · Show 20 results per page · Previous / Next".
- Severity import threshold: a radio list, each option with a one-line definition:
  - All severities.
  - Critical only (CVSS 9.0-10.0).
  - Critical and High only (CVSS 7.0+).
  - Critical, High, and Medium only (CVSS 4.0+).
- History (text): a history tab records SLA misses and on-time fixes, and Vanta emails when a new finding appears or one nears its SLA.
- Images: ../../images/ux/vulnerabilities/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--01.png, ../../images/ux/integrations/setting-up-vulnerability-scanning--01.png

### 2.13 CSPM alerts

- Under Assets > CSPM alerts.
- Tabs: Open, Deactivated.
- Search, then Source, Severity and SLA Status.
- Table: checkbox, Title (source logo and an external-link icon), Category, a Severity chip, a Status chip ("Due soon"), Due date.
- Choosing a row opens a right drawer:
  - The title and "View details on Orca Security ↗".
  - "Deactivate monitoring", indefinitely or until a date.
  - Tabs: Information, Impacted asset.
  - Facts: Description, Category, Score, Severity, Remediation, Source.
- SLA windows are set per severity in Settings, with recommended values and a history of edits (text).
- Images: ../../images/ux/vulnerabilities/configuring-cspm-alerts--01.png, ../../images/ux/vulnerabilities/configuring-cspm-alerts--03.png

### 2.14 Bulk tagging

- Full-screen editor:
  - Header: X, "Bulk tagging", Help Center, and "Save changes" (primary).
  - Left: a SERVICE list (AWS, Azure, DigitalOcean, GCP).
  - Tabs: Custom tags, Vanta tags.
- Mapping table: VANTA TAG, with its definition, = CUSTOM TAG, optionally "when equal to" a VALUE. Example: "VantaNonProd is true when the environment tag is not equal to production".
- Image: ../../images/ux/other/bulk-tags--04.png

### 2.15 Training mapping

- "Choose security assignments" modal:
  - A course select and 9 category checkboxes: General security training, HIPAA, PCI DSS, GDPR, CCPA, Insider threat, AI risk, Secure code, Social engineering.
  - "+ Add an Assignment", Delete and Save.
- A group's "Manage trainings" modal:
  - One toggle per category.
  - When a toggle is on, a source radio appears: "Vanta · Secure code training" or "Integrations · 2 from Wizer: XSS, SQL Injection".
  - Cancel / Save.
- Images: ../../images/integrations/absorblms/connecting-vanta-absorblms--04.png, ../../images/ux/personnel/connecting-vanta-absorblms--08.png

### 2.16 Developer surfaces (text only)

- Settings > Webhooks: endpoints, an event catalog with payload schemas, a Testing tab, a delivery log, and single or bulk retry.
- The MCP server and the CLI act with the user's own Vanta permissions.

## 3. The integration model

- **Pipeline**: credential → products/features → sync filters → resources → resource scope → linking → tests → evidence → controls → frameworks → remediation.
- **Credential**: 7 kinds:
  - OAuth, as the connecting user or with admin consent.
  - API key or token.
  - SCIM bearer token.
  - Merge aggregator.
  - AWS IAM role with a customer-managed policy.
  - Azure/GCP script, giving a federated credential or service account.
  - Jira Data Center PAT.
  - The identity that connects becomes the integration's identity, so the 9-point checklist says to use a service account.
- **Products/features**: one connection carries several toggles (AWS 4, GCP 3, Jira 3 plus procurement, Google Workspace 1).
  - Each toggle widens the permission set; the AWS policy JSON is regenerated from the choice.
  - Write access is asked for only by write features: task creation, deprovisioning.
- **Sync filters at connect**:
  - Google group "Vanta" (an empty group disconnects the integration).
  - Iru Blueprints.
  - Jira labels or JQL for each of 4 categories.
  - HRIS cutoff date.
  - AWS regions.
  - Severity threshold at 9.0, 7.0 or 4.0 CVSS. It is applied before anything is written, so a filtered finding never counts toward an SLA.
- **Resources**: every integration declares its resource types and fields (Resource types tab): 44 AWS types, 6 Google Workspace directory types. They land in Inventory, Computers, Access, People, Vulnerabilities, CSPM alerts, Policies and Documents.
- **Cadence**: scheduled, never real time.
  - Hourly: policies, training completions, Keeper users.
  - GitLab every 6 h; Tenable FedRAMP up to 8 h.
  - First sync: up to 1 h (Google Workspace), several hours (Azure, GitHub), up to 24 h for a full GCP repopulation.
- **Resource scope**:
  - 3 levels: account → resource type → resource.
  - 3 separate systems: resource scope, framework scope, test applicability.
  - A change takes up to 1 h and is logged.
  - Tags in the source set scope: VantaNonProd, and VantaNoAlert, which requires a reason.
  - An IdP or MDM group can own people or device scope.
- **Linking**:
  - Account ↔ person by email. An unlinked account fails "<X> accounts associated with users"; "Not a Person" excludes service accounts.
  - Finding ↔ device (Defender).
  - Resource owner from the VantaOwner tag.
  - IdP precedence settles duplicate people.
- **Tests**: continuous checks per resource instance; one failing instance fails the test. Typical sets:
  - Access tools: 2 tests (accounts associated with users; accounts deprovisioned when personnel leave), plus MFA where the source has it.
  - Scanners: 4 severity tests (Critical/High/Medium/Low addressed within SLA), a scan-frequency test and account tests. Tenable FedRAMP comes to 7 tests (inferred from its list); SentinelOne lists 8.
  - Training: up to 11 tests.
  - GCP: 4 autopass tests, where the platform's default behaviour meets the control.
- **Evidence**: the test's Evidence tab is the evidence: criteria (About / Logic), inputs, test data, out-of-scope resources, API requests and exports.
  - Task-tracker attachments become recommended evidence.
  - Audit platforms (Fieldguide, A-SCEND) pull it.
- **Controls**: one test maps to many controls.
  - A Google Workspace deprovisioning test → 26 controls; 1Password: 2 tests → 25 controls; Aikido: 16 tests → 5 controls.
  - The directory shows the count before you connect ("Unlocks 4 new tests").
  - A control passes when all its linked tests pass (inferred from "linking tests to specific controls and requiring all of them to pass").
- **Status and SLA**:
  - Test states seen: Passing, Needs attention, Failing, Overdue, Due soon, Needs remediation (no SLA assigned).
  - SLA per test or per severity ("SLA: 7 hours", "SLA: 90 days" for P2); due date = detected + SLA.
- **Remediation**:
  - Create task from a test: one for all, or one per failing item (14 in the example).
  - Tracker status follows the status category: To Do / In Progress / Done → Open / In progress / Completed.
  - Automatic issue creation fires only on Failing (not Needs Attention), never while a linked issue is open.
  - SLA met = Resolution Date − Created At ≤ SLA.
- **When it fails**:
  - Errors tab count and banner → View errors → the Activity tab's per-run detail → Reconnect or edit credentials (never delete) → wait 10-20 min → check Errors again.
  - Pages that consume the data show partial-data banners.
  - Credentials can expire: an Azure secret after 1 year; a federated credential never.
  - Interim cover is a manual evidence upload; a blocked owner is escalated by assignment.

## 4. For Program Assurance

1. **Evidence sources register**: copy Connected / Errors as an evidence-sources register, one row per source per system (ACAS repository, STIG checklist set, SBOM feed, document library).
   - Each row shows Resources ("1,214 findings · 312 hosts"), "Imported 3 days ago" and a status.
   - The Errors tab holds failed imports and sources staler than the program's own RA-5 frequency (inferred design).
2. **Upload wizard instead of a connection**: ACAS (Tenable.sc/Nessus) usually sits on closed networks (inferred), so "connect" becomes a Stepper upload wizard.
   - Steps: source type (.nessus, .ckl/.cklb, CycloneDX/SPDX) → system (authorization boundary) → map hosts or components to system elements → Configure scope (hosts in or out of the boundary, logged) → severity threshold → review counts → import.
   - It would reuse `import_sbom` and the requirement-import reader pattern.
3. **Source listing page with five tabs**: Overview; What it reads (record types and fields); Controls it informs, counted in this program's baseline and objectives ("Informs RA-5, SI-2, CM-6, CM-7 · 31 objectives", mapping inferred); Handling (CUI marking, where files live); Setup guide.
   - The rail card "Unlocks N tests" becomes "Moves N objectives".
4. **Checks with the program's own SLAs and cadence**: Vanta's tests become derived checks whose SLA and cadence come from the program's parameter values (`program_control_parameters`).
   - Examples: RA-5 scan frequency from its ODP, SI-2 windows per severity or CAT, STIG CAT I/II/III open counts per element.
   - Each check names its inputs, failing entities and out-of-scope resources, as Vanta's Evidence tab does.
5. **Unlinked assets**: account linking becomes asset linking. A scanned host that matches no inventory item lands in an "Unlinked assets" list with Link and "Not in boundary" (Vanta's "Not a Person"). Linked findings then count on their element in Posture.
6. **POA&M items from a failing check**: "Create task" becomes Create POA&M item, one for all findings or one per finding.
   - The due date comes from the SLA, and a linked Jira item's status category flows back.
   - Automatic creation only on failing, and never a duplicate while one is open.
7. **Freshness and refusals**: show "Last imported" against the required cadence, plus a partial-data banner on the screen that uses the data.
   - Unlike GCP's silent skips, a parse refusal lists each host or row skipped and why, as Import requirements already does.
8. **Owner and audit trail**: assign each source to its ISSO or system owner (`program_role_assignments`), as "assign integration" does, and record every import and scope change in the program's activity for the assessor.
