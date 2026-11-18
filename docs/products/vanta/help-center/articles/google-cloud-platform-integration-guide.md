# Google Cloud Platform: Integration Guide

Source: https://help.vanta.com/en/articles/16111208-google-cloud-platform-integration-guide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

## Overview
If your team runs infrastructure on Google Cloud Platform (GCP), this integration brings your GCP environment into Vanta automatically. Vanta reads your project configurations, IAM policies, network settings, resource inventory, and container vulnerability data directly from GCP so your team keeps working in GCP while Vanta handles evidence collection for compliance.
 
This guide covers setup for all GCP connection types: organization-level (recommended) and individual project-level. All other sections like data collection, test behavior, permissions, limitations, and troubleshooting, apply to all connection types.
 
New to this integration? Start with the GCP: Quickstart <https://help.vanta.com/en/articles/16110869-google-cloud-platform-quickstart> for a 10–15 minute setup walkthrough using the Console (Cloud Shell) path.
ℹ️ Note: The project Vanta creates during setup to host its scanning infrastructure isn't one of the projects Vanta monitors. See Identify your connection type below for what actually gets monitored.
 

### What you can do with this integration:
- 
Automatically verify IAM configurations, role assignments, and service account controls across your GCP organization.
- 
Monitor logging and alerting configurations (VPC Flow Logs, log sinks, Cloud Monitoring alert policies, and log metrics).
- 
Track container vulnerabilities from GCP Artifact Registry via Container Analysis.
- 
Run CIS GCP Foundations Benchmark tests for out-of-the-box benchmark compliance.
- 
Monitor Kubernetes cluster configuration and hardening controls.
- 
Keep GCP resource inventory current for access reviews and audits.
- 
Powers dozens of automated compliance tests across compute, database, networking, storage, DNS, KMS, and more.
 

### Connection details: 
 | 
Authentication | 
Keyless authentication using GCP Workload Identity Federation. Vanta authenticates as a GCP identity via a workload identity pool and provider created during setup. No long-lived secrets are stored.
Service Account Key auth is also supported but is not recommended. To migrate from key auth to WIF, re-add the same project via Add Project. Vanta updates the credentials in place. See Switching authentication methods. 
 | 
Access level | 
Read-only after setup. All API calls are reads, lists, gets, and getIamPolicy. There are no write operations. The setup script temporarily requires elevated org-level permissions to create the scanner project, IAM roles, and identity pool, but once setup is complete, Vanta's scanner operates read-only.
 | 
Who should run setup | 
A GCP Organization Admin with the Organization Role Administrator role at the org level. Project-level Owner or Editor is not sufficient.
 | 
Connection scope | 
Organization (recommended): Vanta automatically discovers all projects in your GCP org. Individual Projects: You specify which projects to connect; new projects are not discovered automatically.
 | 
Credential mixing | 
You cannot connect some accounts as org-level and others as individual projects within the same Vanta account. All GCP connections must use the same connection type.
 | 
Multiple GCP organizations | 
Connecting more than one GCP organization to a single Vanta account requires the Multiple GCP Organizations feature. Contact Vanta Support to have this enabled.
 | 
Estimated setup time | 
~10–15 minutes (Console / Cloud Shell); ~20–30 minutes (Terraform).
 

### Identify your connection type
 | 
Connection type | 
When to use | 
What Vanta monitors
 | 
Organization (recommended) | 
Your GCP projects live inside a GCP organization and you want broad coverage. | 
All projects Vanta has access to in your org. Scope out non-production projects after connecting via Integrations → GCP → Configure scope.
 | 
Individual Projects | 
You want to monitor only specific GCP projects, or your projects are not inside a GCP organization. | 
Only the projects you explicitly connect. New projects are not discovered automatically.
 | 
Folder-limited (advanced) | 
Your org uses GCP folders and you want to scope Vanta's access to projects within a specific folder. | 
Projects within the specified folder only. Requires additional folder-level IAM grants beyond what the default setup script applies — see Folder-level GCP setups. This is an advanced pattern and can be harder to troubleshoot.
ℹ️Note:  The scanner project is not the same as your monitored projects. When you connect GCP, Vanta creates a dedicated scanning project, with an ID such as vanta-scanner-<timestamp>, to host the Workload Identity Federation resources Vanta uses to read your GCP environment. This project is infrastructure only. It is not the project or projects Vanta monitors. If you connect GCP at the individual-project level and your workload projects do not appear, that is expected. Vanta monitors only the projects explicitly connected. To monitor all current and future projects, connect at the organization level, then go to Integrations > GCP > Configure scope to choose which projects count for compliance.
⚠️ Note: You cannot mix connection types. All GCP connections in a Vanta account must use the same type (org-level or project-level). This cannot be changed without removing and re-adding the integration.
💡 Tip: If your projects are organized inside GCP folders, the default setup script grants permissions at the org level only. Projects nested in folders may not be fully accessible. See Folder-level GCP setups in the Setup Guide.
 
 

## What Vanta collects and why
Vanta fetches dozens of resource types across your GCP environment. Each resource type is fetched independently, with its own API enablement and permission requirements. Resources are grouped by domain below. 
 

### Compute and infrastructure 
 | 
Resource | 
What Vanta collects | 
Why it's collected
 | 
Compute instances | 
Instance metadata, zone, status, disks, network interfaces, service accounts, shielded instance config, IP forwarding, labels, effective firewall rules | 
Powers VM configuration, shielded VM, IP forwarding, and service account assignment tests
 | 
GKE clusters | 
Cluster configuration, private nodes, network policy, binary authorization, legacy auth, secrets encryption, shielded nodes | 
Powers GKE cluster hardening tests
 | 
GKE nodes | 
Node pool configuration, auto-repair, auto-upgrade, OS image type | 
Powers GKE node configuration tests
 | 
Networks | 
Firewall rules and network configuration | 
Evaluated for firewall and network access control tests
 | 
Subnets | 
Subnet configuration, including enableFlowLogs flag | 
Powers the VPC Flow Logs compliance test (checked per subnet, not per VPC)
 | 
Load balancers | 
Configuration and logging settings | 
Evaluated for logging enablement
 | 
Cloud IDS endpoints | 
IDS endpoint configuration | 
Inventoried for security monitoring
ℹ️ Note: GKE nodes are identified by the goog-gke-node label on Compute instances and appear in Vanta as two separate resource types — Compute Instances and GKE Nodes. Both may need to be scoped independently if you want them excluded.
 

### Databases
 | 
Resource | 
What Vanta collects | 
Why it's collected
 | 
Cloud SQL instances | 
Database version, backup settings, SSL enforcement, flags, IP configuration | 
Powers SQL compliance tests including SSL, backup, and per-flag tests for PostgreSQL, MySQL, and SQL Server
 | 
BigQuery datasets | 
Encryption, labels, access controls | 
Evaluated for public access and encryption
 | 
Spanner instances | 
Instance configuration, databases, labels | 
Inventoried as a SQL database resource
 | 
Bigtable instances | 
Clusters, labels, location | 
Inventoried as a NoSQL database resource
 | 
Datastore projects | 
Project configuration | 
Auto-passes encryption tests (GCP encrypts by default)
 | 
Firestore projects | 
Project configuration | 
Auto-passes encryption tests (GCP encrypts by default)

### IAM and security
 | 
Resource | 
What Vanta collects | 
Why it's collected
 | 
Role grants | 
IAM role bindings at the project, folder, and org level | 
Powers access reviews and IAM compliance tests
 | 
Roles | 
Custom role definitions and included permissions | 
Evaluated for overly permissive role configurations
 | 
Service account keys | 
Key type (USER_MANAGED vs. SYSTEM_MANAGED), valid-after time | 
Powers the user-managed key rotation test
 | 
API keys | 
Restrictions, active status | 
Powers API key hygiene tests
 | 
KMS keys | 
Rotation settings, public access status | 
Powers key rotation (90-day) and public access tests
 | 
Essential contacts | 
Contacts configured per project | 
Evaluated for org-level contact configuration
 | 
Project API enablement | 
Enabled APIs per project | 
Used to gate resource fetching and project validation
 | 
Data access audit logging config | 
Audit logging configuration per project | 
Powers Cloud Audit Logging tests

### Storage and messaging 
 | 
Resource | 
What Vanta collects | 
Why it's collected
 | 
Storage buckets | 
IAM policy, encryption, versioning, lifecycle, uniform access, public access | 
Powers storage access, encryption, and versioning tests
 | 
Pub/Sub topics | 
IAM policy | 
Inventoried as a messaging resource
 | 
Pub/Sub subscriptions | 
IAM policy | 
Inventoried as a messaging resource
 | 
Cloud Tasks queues | 
Queue configuration | 
Inventoried as a queuing resource
ℹ️ Note: Cloud Storage buckets configured with Requester Pays cannot be fully monitored by Vanta. These buckets will appear in your resource inventory with limited metadata and a fetch error indicating they are Requester Pays buckets.

### Monitoring and logging
 | 
Resource | 
What Vanta collects | 
Why it's collected
 | 
Cloud Monitoring alert policies | 
Alert policy configuration, filters, notification channels | 
Powers GCP monitoring compliance tests
 | 
Log sinks | 
Sink destination, filter configuration | 
Evaluated for the unfiltered sink requirement
 | 
Log buckets | 
Retention settings | 
Powers the log retention test
 | 
Log metrics | 
Metric filter configurations | 
Powers CIS log metric tests
 | 
Cloud Monitoring metrics | 
Monitoring metrics | 
Supporting data for monitoring tests

### Networking
 | 
Resource | 
What Vanta collects | 
Why it's collected
 | 
DNS managed zones | 
DNSSEC configuration | 
Powers DNSSEC enablement and algorithm tests
 | 
DNS policies | 
Logging settings | 
Powers DNS logging tests

### Container vulnerabilities
 | 
Resource | 
What Vanta collects | 
Why it's collected
 | 
Container repositories (Container Registry) | 
Repository metadata | 
Powers vulnerability tracking for legacy Container Registry
 | 
Artifact Registry repositories | 
Repository metadata | 
Powers vulnerability tracking for current Artifact Registry
 | 
Container vulnerabilities | 
Vulnerability occurrences from Container Analysis, severity, CVSS scores | 
Powers vulnerability tracking and SLA monitoring

### Other
 | 
Resource | 
What Vanta collects | 
Why it's collected
 | 
GCP organization projects | 
Project IDs, validation outcomes, labels, org name | 
Used to expand org credentials into per-project syncs
 | 
Cloud Run functions | 
Function configuration | 
Inventoried as a compute resource
 | 
Vertex AI models | 
AI model metadata | 
Inventoried as an AI/ML resource
ℹ️ Note: Vertex AI model inventory is being progressively rolled out and may not yet be available for all accounts. If you expect to see Vertex AI models but they are not appearing, contact Vanta Support.
 

### How resource fetching works
- 
API gating: Before fetching each resource type, Vanta checks whether the required GCP API is enabled on the target project. If it isn't, that resource type is silently skipped for that project, no error appears in the Vanta UI. If you're missing a resource type, confirm the relevant API is enabled on the affected project.
- 
Permission gating: Similarly, Vanta tests IAM permissions before fetching each resource type. Missing permissions for a specific resource type cause that type to be silently skipped for that project.
- 
Organization credential expansion: Org credentials don't fetch resources directly. Before each sync, Vanta discovers all active projects in your org and creates a per-project credential for each one. Projects that fail validation (missing APIs, missing permissions) are stored with that outcome and skipped for resource fetching.
- 
Tests evaluate per resource instance, not per project. Most GCP compliance tests check whether every applicable resource instance meets the requirement — not just whether the project is configured. For example: if three Cloud SQL instances exist and one is missing a required alert policy, the test will fail even if the other two are compliant. When a test fails after making a change in GCP, verify the fix is applied to every resource instance in scope.
 
 
 

## Prerequisites 
- 
Your GCP projects live inside a GCP organization.
- 
The person running the setup script has Organization Administrator, Organization Role Administrator, and Project Creator at the org level. Project Creator is granted domain-wide by default but may be restricted in some organizations. See What the setup script requires for the full breakdown.
- 
You have Vanta admin access.
- 
You are connecting either all org-level or all individual-projects. You cannot mix both types in a single Vanta account.
- 
If your org uses GCP folders to organize projects, confirm you have folder-level IAM access as well. See Folder-level GCP setups.
- 
(Optional) To enable container vulnerability scanning: plan to have the Container Analysis API and Container Scanning API enabled in scanned projects.
- 
(Optional) If using Terraform: have your Terraform environment ready.
- 
(Optional) If switching connection types (e.g., individual projects to organization): you'll need to delete the existing integration first and plan for up to ~24 hours for full repopulation. Some configuration history may not carry over. Note: migrating your authentication method from key auth to WIF does not require deleting the integration (see Switching authentication methods).
 
 

## Explore the integration page
When you navigate to the GCP integration in Vanta, you'll land on its listing page, which includes five tabs that cover what you need to know before (and after) you connect.
- 
Overview: Start here. A summary of what the integration does, its top capabilities, and the prerequisites you'll need in place before connecting (like required GCP roles or project setup). You'll also see what connecting unlocks, like how many tests and controls across which frameworks, plus who built the integration and links to additional help. When you're ready, select Connect to begin setup.
- 
API permissions: Exactly what access Vanta requests from GCP: each permission's scope, whether it's read or write, and what data it covers, with a link to Google's own documentation. Share this tab with your security team if they need to review access before you connect.
- 
Resource types: Every resource type Vanta imports from GCP (compute instances, IAM policies, storage buckets, and more), down to the specific fields collected for each. Use this to understand exactly what data will show up in Vanta once connected.
- 
Automated tests: How many tests connecting GCP unlocks and which frameworks and controls they map to (SOC 2, ISO 27001, etc.), plus the full list of tests by name. Useful for scoping compliance coverage ahead of an audit.
- 
Security: How Vanta protects the data it collects (encryption, data retention, access controls, and infrastructure). Visit Vanta's Trust Center <https://trust.vanta.com/> for the full picture.
When you’re ready to connect, continue to the setup guide below.
 
 
 
 

## Setup guide

### Method 1: Console (Cloud Shell) - Organization level 
See the GCP Quickstart for the full console (Cloud Shell) walkthrough for organization-level setup <https://help.vanta.com/en/articles/16110869-google-cloud-platform-quickstart#h_eb6ebb5070>. 
 

### Method 2: Console (Cloud Shell) - Individual projects 
Use this path to monitor specific GCP projects rather than your full organization.
 
The flow is identical to the org-level path <https://help.vanta.com/en/articles/16110869-google-cloud-platform-quickstart#h_eb6ebb5070>, with these differences:
- 
Select Individual Projects at Step 3.
- 
The script additionally grants the project-level custom role and roles/iam.securityReviewer directly on each specified project.
- 
New projects added later must be manually added to Vanta.
- 
You cannot later switch to org-level without removing and re-adding the integration.
ℹ️ Note: Only affects connection type (individual ↔ organization). For auth-method migration (service account keys → WIF), see Switching authentication methods below.
⚠️ Note:  Use the Vanta-generated Terraform as the source of truth for both Terraform methods below. If your platform team customizes the configuration, these values must match exactly what Vanta expects: the scanner project number, the workload identity pool ID (vanta-<externalId>), the identity provider ID (vanta-aws), the IAM role names, and the required APIs. The setup generates the correct role names for your connection type — do not rename them. A naming mismatch in any of these, even a minor one, can prevent Vanta from authenticating successfully even if all the GCP-side resources exist and appear correctly configured.
 

### Method 3: Terraform setup - organization level 
- 
Follow steps 1-3 of the Console path <https://help.vanta.com/en/articles/16110869-google-cloud-platform-quickstart#h_eb6ebb5070>.
- 
Select Terraform as your setup method. Click Next.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2573399694/bd026c0522e26b78275166937db9/a201e6da-86fa-41aa-9824-d2aa25100de0?expires=1794967200&signature=f10284e59394a2ff416d9bc2fffb7ada5eedd7b6d981ce10f88aeec0ebb3f87e&req=diUgFcp3lIdWXfMW1HO4zdigMYqcpFdLMIhJtgUeGslV8RmJua0KWfa2AsgZ%0AeEWlaofGpO1CsakfS%2FA%3D%0A>
- 
Specify the organization to scan. Enter the domain name. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2573400388/196b65886c31988fa89f53f7ced2/85403a7d-0129-416d-beba-17586756d717?expires=1794967200&signature=1df92e49a8d62fd956de1ae137012fead0cad236da78ec81736df2bdc02688eb&req=diUgFc1%2BnYJXUfMW1HO4zUdKp9Dgn%2F0vbd4yFd769Fk2pkspIrpPe5m5RZ9M%0ABmBsiVY5hmoSgHc%2B5Ew%3D%0A>
- 
Select the products you want Vanta to monitor. Google Cloud Platform is required. Optionally enable:
- 
Container Analysis — to pull container vulnerability data from Artifact Registry
- 
CIS GCP Foundations Benchmarks — to run CIS benchmark compliance tests. 
- 
Click Next. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2573401092/91d604301d53ecd9e3035bf0f3d8/7016d605-50f2-4a74-ae48-62c5c48aa8c5?expires=1794967200&signature=150070658c3cfaa219f6d79ce8d3a0350e848fac774a277b4ca3f1a2938634dd&req=diUgFc1%2BnIFWW%2FMW1HO4zarCfT8kNCAOxsxJvQtitHaZ%2FY%2FwbJqpPCev4J%2B%2F%0ARGwNKwOoV84D76pyHnE%3D%0A>
- 
Download the generated Terraform script to set up the required project, service account, and roles. All projects must belong to the same GCP organization. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2573401618/46fd55d7da2734a417eb07f5ccd1/36869337-031e-4ff9-bb38-47193114620b?expires=1794967200&signature=67822d810895d8c3bb1287cacbfb89d06678097b049e7201d8fe20f3293c01fc&req=diUgFc1%2BnIdeUfMW1HO4zcH7uqPjEpTGLBZ%2FEFni%2BpFy%2BYIcucQ%2FYygLmnU3%0ASOfDhpyNwoTtq36iCw0%3D%0A>
- 
After you apply the Terraform configuration, a project number will be generated in the output. You will need this for the next step. 
- 
Paste the copied project number into Vanta. Click Next.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2573402505/23fbd44fb1d71a26173daa81f169/fd3f8983-4499-4f2b-a3d2-6615ff541653?expires=1794967200&signature=bfdacaca335faf357745aff31f5a08943e9bcb83721aecf7e30070886e56d07e&req=diUgFc1%2Bn4RfXPMW1HO4zb2fBbQCUyZ4jqHH%2BBOtdWbXhyUBjKsU%2FS%2FRn1ip%0A4bzsj59hV17mBYSSZbQ%3D%0A>
- 
Vanta will validate the connection before confirming GCP as Connected.
- 
You can then configure scope in the connection wizard or do so later: 
- 
Go to your GCP integration on the Integrations page.
- 
Click Configure scope.
- 
Mark any non-production or irrelevant projects as out of scope.
 

### Method 4: Terraform setup - individual projects 
Use this path if you want to use Terraform to connect specific GCP projects rather than your full organization.
 
The flow is the same as the org-level Terraform path, with these differences:
- 
Select Individual Projects.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2573404638/900a1d291543108d3454095f8c44/2c58e5b6-2c8c-4df9-a0b0-30e9fd10d595?expires=1794967200&signature=118e37c56ec2a6e9adf8c0158d20320d00b83c5d23d0c230c8d239793c56737f&req=diUgFc1%2BmYdcUfMW1HO4zaQLNKHrT7%2BlcVfAwefmnb14gBCxb8z1t51fMZ3z%0AvcaR%2Bxy6M4eEuVjPaZI%3D%0A>
- 
Select the GCP projects you want Vanta to monitor. 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2573405374/6ae7607bacdcbd5b4df8500ecb50/ed7bf35c-720c-4bee-905d-777900a0df84?expires=1794967200&signature=1f110c3b51492461eeb9cfbe901be93ec0a1aaa7a96f06cf129e7de7577cee51&req=diUgFc1%2BmIJYXfMW1HO4zdEBJF9PikI3bi7QgekXRyl5drscZ98jJ2rJxcDM%0AdNiFMeN%2BxrKjRsVMKW8%3D%0A>
- 
The configuration grants the project-level custom role and roles/iam.securityReviewer directly on each specified project.
- 
New projects added to your GCP environment later will not be discovered automatically. To add them, update the projects variable and re-apply your Terraform configuration.
- 
You cannot later switch to org-level without removing and re-adding the integration.
ℹ️ Note: The switch limitation described above only affects connection type (individual ↔ organization). For auth-method migration (service account keys → WIF), see Switching authentication methods below.
 

### Folder-level GCP setups
If your GCP organization uses folders to organize projects, the default 
setup script grants permissions at the organization level only. Projects nested 
inside folders may not be fully accessible to the Vanta scanner.
 
To resolve this, additional IAM role grants are required at each relevant folder 
level, specifically, the VantaProjectScanner custom role and 
roles/iam.securityReviewer must be bound to the Vanta scanner principal at the folder level.
 
This is an advanced configuration that depends on your specific folder structure, 
service account details, and WIF setup. Contact Vanta Support to walk through 
the correct grants for your environment.
ℹ️ Note: Folder-scoped setups combined with Workload Identity Federation can introduce additional edge cases. If resources in a folder-scoped setup aren't appearing after confirming IAM bindings, contact Vanta Support.
 

### Switching authentication methods
To migrate an existing GCP project from service account key auth to Workload Identity Federation (WIF), open the existing GCP connection and select Add Project. Enter the same project ID that is already connected to Vanta, then follow the current Vanta-generated setup flow using the newly generated script or Terraform instructions.
 
If the project already exists in Vanta, Vanta updates its existing credentials in place. You do not need to create a new project or delete the existing project, credentials, or full GCP integration first. Do not reuse an older script or service account key from a previous connection.
⚠️ Note: Do not confuse this with switching connection types. Switching between org-level and project-level connections still requires removing and re-adding the integration. Migrating your authentication method does not.
⚠️ Note: Think carefully before disconnecting an active integration. Removing the GCP integration will temporarily remove synced GCP resources from Vanta. Some configuration history including disabled test justifications, snoozed findings, and remediation records, may not fully carry over after reconnecting. If you're managing an active audit, coordinate this change at a low-risk time.

### Additional cautions when migrating an existing connection:
- 
Do not reuse a script from an older GCP connection. Always use the current Vanta-generated script or Terraform. Older scripts may configure a different workload identity pool or set of IAM roles that no longer match what Vanta expects.
- 
If the original scanner project was deleted or the project number has changed, a full reconnect is required.
- 
If after reconnecting you see persistent 403 errors or missing inventory despite confirmed API and IAM configuration, contact Vanta Support.
- 
After reconnecting, plan for up to approximately 24 hours for resources and test history to fully repopulate in large environments.
 
 

## Verification and validation
- 
GCP appears under the Connected tab on the Vanta Integrations page.
- 
In GCP, confirm the vanta-scanner-<timestamp> project was created. For WIF connections, verify the Workload Identity Pool and provider are active under IAM & Admin > Workload Identity Federation. For legacy key-based connections, confirm the Vanta service account exists under IAM & Admin > Service Accounts.
- 
For org-level connections, go to IAM & Admin → IAM at the org level and confirm that the Vanta custom role and roles/iam.securityReviewer are bound to the scanner principal.
- 
Vanta will begin discovering and syncing resources. Initial sync may take several hours.
ℹ️ Note: Vanta syncs with GCP on a scheduled cadence per resource type, not in real time. After making a change in GCP, allow at least a full sync cycle before expecting test statuses to update. For large environments or after a full reconnect, plan for up to approximately 24 hours before all resources and test results are fully repopulated. If a resource or test state hasn't updated after 24+ hours, collect the affected project/resource ID and contact Vanta Support to check fetch and validation logs.
 
 

## Use cases and capabilities

### IAM and access reviews
 
Vanta reads IAM role grants, role definitions, service account key types, and API key configurations across your GCP organization to power:
- 
Access review workflows for users and service accounts.
- 
Tests for overly permissive primitive roles (Editor, Owner).
- 
User-managed service account key rotation tracking (90-day requirement).
- 
API key hygiene tests (restrictions, active status).
ℹ️ Note: GCP automatically creates SYSTEM_MANAGED keys for certain service accounts, which can trigger a known false positive. See Limitations and edge cases > SYSTEM_MANAGED service account keys.
ℹ️ Note: When connecting at the org level, large numbers of Google-managed service agent accounts will appear in access reviews. These are GCP system accounts and are not a security risk. Mark them Not Applicable in Vanta's access review workflow.
 
 
 

### Logging and monitoring 
ℹ️ Note: Tests evaluate per resource instance, not per project (see How resource fetching works). If one Cloud SQL instance lacks a required alert policy or notification channel, the test fails even if other instances are compliant.
Log sinks: Vanta checks whether each project has at least one log sink with no filter. If all your sinks have filters applied, the test will flag it as a gap. This is intentional. The control requires ensuring all log entries are exported without restriction.
 
VPC Flow Logs: Vanta checks the enableFlowLogs flag on each subnet individually via the Compute Engine API. Two common causes of unexpected failures:
- 
Enabling at the VPC or network level does not propagate to subnets. Each subnet must be individually configured.
- 
Enabling via GCP's Network Management API does not satisfy the test. Vanta checks the subnet-level enableFlowLogs flag via the Compute Engine API specifically. If you've enabled logs via the Network Management API, you'll also need to set the flag at the subnet level via Compute Engine.
 
Verify subnet-level flow log status:
gcloud compute networks subnets describe SUBNET_NAME --region=REGION
 
Look for enableFlowLogs: true in the output.
 
Cloud Monitoring alert policies: For GCP monitoring tests (Cloud SQL, NoSQL, compute) to pass:
- 
Alert policies must be configured without resource-specific filters. A filter scoped to a specific instance name or database ID prevents Vanta from associating the policy with all relevant resources.
- 
Alert policies must have at least one active notification channel attached (email, Slack, PagerDuty, etc.). A correctly configured metric filter with no notification channel will still cause the test to fail.
Log metrics (CIS): Vanta checks for log metric filters and corresponding alert policies for specific security events, including project ownership changes, audit config changes, custom role changes, firewall rule changes, network changes, Cloud Storage IAM changes, and Cloud SQL config changes.
 
Audit logging: Vanta checks that Cloud Audit Logging is correctly configured at the org or project level.
 
 

### Container vulnerability scanning
 
Vanta reads container vulnerability data from GCP Container Analysis (Artifact Registry). Legacy Container Registry is also supported.
To enable container vulnerability scanning:
- 
Enable the Container Analysis API and Container Scanning API in each GCP project where you want scanning. The Container Analysis API is free; the Container Scanning API may incur GCP charges.
- 
Confirm the Vanta scanner principal has the permissions granted by roles/iam.securityReviewer (which includes containeranalysis.occurrences.list) on each scanned project.
- 
If the scanner project is separate from the projects containing your container repositories, enable both APIs in both the scanner project and the repository projects.
Enable via Cloud Console:
- 
Enable Container Analysis API <https://console.cloud.google.com/flows/enableapi?apiid=containeranalysis.googleapis.com>
- 
Enable Container Scanning API <https://console.cloud.google.com/flows/enableapi?apiid=containerscanning.googleapis.com>
Enable via gcloud:
gcloud services enable containeranalysis.googleapis.com
gcloud services enable containerscanning.googleapis.com
 
If the Container Analysis and Container Scanning APIs aren't enabled, container vulnerability fetching is silently skipped for that project with no UI error. If the Container Vulnerability toggle in the Vanta GCP integration settings appears disabled, this is often the cause.
ℹ️ Note: Vanta lists all image versions (digests) per repository and evaluates vulnerabilities for the latest image by upload time. If a tag filter is configured, only images matching the tag filter are considered when selecting the latest image.
ℹ️ Note: Vanta uses the effective severity assigned by GCP's Container Analysis service, based on CVSS scores and asset-specific factors. Priority in Vanta should match what you see in the GCP dashboard.
⚠️ Note: GCP Security Command Center (SCC) is not supported. Vanta does not ingest findings from GCP SCC or GCP On-Demand Scanning (ODS). Container vulnerability coverage is scoped to Artifact Registry via Container Analysis. Vanta's GCP vulnerability path is container-image findings only — if you're comparing against SCC findings, those are a different source. For SCC findings that need to appear in Vanta for audit purposes, add a custom evidence document.
 
 
 

### CIS GCP Foundations Benchmark
 
If you enabled CIS GCP Foundations Benchmarks during setup, Vanta runs automated tests mapped to CIS controls across IAM, logging, networking, virtual machines, storage, Cloud SQL (PostgreSQL, MySQL, SQL Server), and BigQuery. See the CIS GCP Foundations Benchmark article <https://help.vanta.com/en/articles/11647393-cis-gcp-foundations-benchmark> for the full control list.
✅ Feature availability: CIS GCP Foundations Benchmark tests are enabled as part of your Vanta plan configuration. Contact Vanta Support if you've enabled the product during setup but tests are not appearing.
 
 
 

### Kubernetes (GKE)
 
When GKE clusters and nodes are in scope, Vanta evaluates cluster hardening configuration including:
- 
Private nodes and private cluster settings
- 
Network policy enforcement
- 
Binary authorization
- 
Legacy authorization (disabled)
- 
Secrets encryption at rest
- 
Shielded nodes
- 
Node auto-repair and auto-upgrade
- 
Container-Optimized OS (COS) with containerd runtime
- 
Metadata server enforcement
 
 

### Autopass tests 
 
Several Vanta tests automatically pass when a valid GCP credential is connected. They verify that GCP's default platform behavior satisfies the control:
- 
Storage buckets encrypted: GCP encrypts all Cloud Storage buckets by default.
- 
Logs centrally stored: verified via the GCP credential connection.
- 
IAAS data encrypted at rest: GCP encrypts compute instance disks by default.
- 
Customer data encrypted at rest: GCP encrypts data by default across core services.
 
 
 
 

## Limitations and edge cases

### Cannot mix or switch connection types
A Vanta account must use either organization-level connections or individual project-level connections, not both, and switching between them requires removing and re-adding the GCP integration. Some configuration history, including disabled test justifications and snoozed findings, will not carry over. Plan for up to ~24 hours for full repopulation after reconnecting.
 

### Multiple GCP organizations
Connecting more than one GCP organization to a single Vanta account requires the Multiple GCP Organizations feature. Contact Vanta Support to enable it. 
Once enabled, connect an additional organization directly from Vanta:
- 
Go to Integrations in Vanta.
- 
Select your existing GCP integration.
- 
You'll see a list of your connected GCP organizations.
- 
Click Add to connect another organization.
- 
Follow the standard connection workflow.
Each organization connects independently with its own WIF setup, and Vanta displays resources from all connected organizations on a single dashboard.
 

### VPC Flow Logs — Network Management API gap
Vanta checks the subnet-level enableFlowLogs flag via the Compute Engine API. Enabling flow logs via GCP's newer Network Management API alone does not satisfy this test. If you've configured flow logs through a path Vanta doesn't detect, use manual evidence or contact Vanta Support.
 

### GCP Security Command Center (SCC)
Vanta does not ingest findings from GCP SCC or GCP On-Demand Scanning. Container vulnerability coverage is limited to Artifact Registry via the Container Analysis API.
 

### Requester Pays buckets
Cloud Storage buckets configured with Requester Pays cannot be monitored and will be silently skipped.
 

### Legacy App Engine Cloud Tasks queues
Cloud Tasks queues using the older App Engine queue format (requiring appengine.applications.get) are not supported and will return empty results.
 

### GCP Backup and DR service
Vanta checks the native Cloud SQL backup setting to verify database backup compliance. GCP's Backup and DR managed backup service is not recognized by this test.
 

### Folder-level scoping
Vanta supports scoping at the project level only. Scoping out an entire GCP folder is not supported. Individual projects within a folder must be scoped out one at a time.
 

### GCP project labels do not cascade to child resources in Vanta
Applying a GCP label to a project object does not automatically exclude or include that project's child resources (buckets, instances, databases, etc.) in Vanta. Each resource is evaluated individually based on its own labels and Vanta scope settings. If you want to exclude an entire environment, the cleanest path is to scope out the project itself via Integrations → GCP → Configure scope, rather than relying on project-level labels.
 

### Silent skipping on missing APIs or permissions
If a required GCP API is not enabled on a project,or if the scanner principal is missing permissions for a specific resource type, Vanta silently skips that resource type for that project. No error is surfaced in the Vanta UI.
 
A common scenario: GCP projects and Cloud Storage buckets appear in Vanta, but Compute instances are missing. This does not mean Vanta has full project access. It means only the resource types that passed their permission and API checks were fetched. One known gap: custom IAM roles intended to replicate roles/iam.securityReviewer sometimes omit permissions like compute.instances.list and serviceusage.services.list, causing Compute resources and API enablement checks to silently fail. If you're using a custom role in place of roles/iam.securityReviewer, compare its permissions against the built-in role carefully.
 

### sys- projects
Google creates system projects prefixed with sys- for internal GCP management. These appear in the Vanta resource inventory when connecting at the org level and must be scoped out individually.
 

### SYSTEM_MANAGED service account keys
GCP creates SYSTEM_MANAGED keys automatically for certain service accounts. A known false-positive issue can cause these to appear in the user-managed key rotation test. In GCP, go to IAM & Admin > Service Accounts, find the flagged account, and check the key type under the Keys tab. If the key type is SYSTEM_MANAGED, contact Vanta Support.
 

### GKE dual-resource representation
GKE nodes appear in Vanta as both Compute Instances and GKE Nodes. Both resource types may need to be scoped independently.
 

### Firebase
Vanta runs a limited scope of tests on Firebase projects, primarily around org-level IAM and access configuration. Firebase-specific services such as Firebase Hosting, Firebase Authentication, and Firebase Security Rules are not monitored. Vanta evaluates Firebase projects using standard GCP-level tests only (IAM, access configuration, and general project settings).
 
 

## Permissions

### What Vanta uses after setup (read-only)
 
Vanta operates read-only through the scanner principal using custom IAM roles and one built-in GCP role. The exact role names and structure depend on your connection type and setup method. The setup script or Terraform configuration creates the correct roles automatically.
 
 

### Organization-level connections
 
The setup script creates a single custom role at the org level that combines resource-reading and organization-level permissions:
resourcemanager.projects.get
resourcemanager.projects.list
resourcemanager.folders.list
essentialcontacts.contacts.list
iam.roles.list
resourcemanager.organizations.getIamPolicy
resourcemanager.folders.getIamPolicy
bigquery.datasets.get
compute.disks.list
compute.instances.get
compute.instances.getEffectiveFirewalls
compute.subnetworks.get
pubsub.topics.get
storage.buckets.get
cloudasset.assets.searchAllResources
 
Plus roles/iam.securityReviewer (built-in GCP role, granted at the org level) grants broad read-only access across most GCP services, including IAM policies, service account keys, API keys, KMS keys, Cloud SQL settings, GKE configuration, audit logs, and more. This is the primary role that enables most of Vanta's compliance test coverage. If you substitute a custom role here, ensure it includes all permissions from roles/iam.securityReviewer. Commonly missed permissions include compute.instances.list and serviceusage.services.list.
ℹ️ Note: The exact grant level of roles/iam.securityReviewer may differ between the Cloud Shell and Terraform setup methods. The Vanta-generated setup creates the correct bindings automatically.
 

### Individual project connections 
 
The setup script creates two custom roles:
- 
A project-level custom role (granted on each monitored project):
resourcemanager.projects.get
bigquery.datasets.get
compute.disks.list
compute.instances.get
compute.instances.getEffectiveFirewalls
compute.subnetworks.get
pubsub.topics.get
storage.buckets.get
cloudasset.assets.searchAllResources
 
2. An organization-level custom role (granted at the org level):
 
essentialcontacts.contacts.list
iam.roles.list
resourcemanager.organizations.getIamPolicy
resourcemanager.folders.getIamPolicy
 
Plus roles/iam.securityReviewer (built-in GCP role, granted on each monitored project).
ℹ️ Note: The exact role names vary by setup method (Cloud Shell vs. Terraform). The setup script or Terraform configuration creates the correct roles automatically, you do not need to create them manually. To verify your setup, check IAM & Admin in GCP for the Vanta custom roles and roles/iam.securityReviewer bound to the scanner principal.
 

### What the setup script requires (one-time, elevated)
 
The person running the Cloud Shell or Terraform script must hold the following at the organization level. The required permissions are covered by these GCP roles:
- 
Organization Administrator (roles/resourcemanager.organizationAdmin) — to grant Vanta's roles at the organization level
- 
Organization Role Administrator (roles/iam.organizationRoleAdmin) — to create Vanta's custom scanner roles at the org level
- 
Project Creator (roles/resourcemanager.projectCreator) — to create the vanta-scanner project. This role is granted domain-wide by default but may be restricted in some organizations. If the setup script fails at the project creation step, this is the most likely cause.
- 
Service Usage Admin — to enable APIs on the scanner project
ℹ️ Note: If the person running the script encounters errors enabling APIs on the scanner project, they may need the Service Usage Admin role. In most cases, project creation automatically grants sufficient permissions.
If your organization restricts Organization Administrator: the only permissions actually required from it are resourcemanager.organizations.getIamPolicy and resourcemanager.organizations.setIamPolicy. Your GCP admin can grant these via a custom organization role instead.
 
If you can't obtain org-level roles at all: use the project-scoped connection option, which limits IAM changes to the specific projects you're connecting. You still need Project Creator and Organization Role Administrator.
 
 

### Required APIs (on the scanner project)
 
The setup script enables these automatically. If you need to enable them manually:
 
Required for all connection methods:
bigquery.googleapis.com
cloudasset.googleapis.com
cloudkms.googleapis.com
cloudresourcemanager.googleapis.com
containeranalysis.googleapis.com
essentialcontacts.googleapis.com
firestore.googleapis.com
iam.googleapis.com
logging.googleapis.com
monitoring.googleapis.com
pubsub.googleapis.com
serviceusage.googleapis.com
sqladmin.googleapis.com
storage-api.googleapis.com
 
Required for Workload Identity Federation only:
iamcredentials.googleapis.com
sts.googleapis.com
 
All required APIs must be enabled on the scanner project. Vanta will not scan projects with missing required APIs. These APIs are only required on the scanner project. Standard metadata API calls do not generate significant GCP billing.
 
 
 
 
 

## Troubleshooting and FAQs

### The setup script failed with a permissions error.
 
Confirm you hold the roles listed in what the setup script requires; project-level Owner or Editor is not sufficient. The script can be safely re-run once permissions are in place; it's idempotent and will update existing resources rather than fail on duplicates.
 
 

### My workload projects aren't appearing in Vanta.
 
The vanta-scanner project is a proxy for authentication, it's not where your monitored resources live. Vanta discovers workload projects through the org-level permissions granted during setup. If projects aren't appearing after several hours, confirm the org-level role bindings were applied correctly.
 
 

### Some of my GCP projects are showing but not all of them.
 
If you connected as an individual project, Vanta only monitors that specific project. To monitor all projects, remove the integration and reconnect at the organization level. After reconnecting, use Integrations → GCP → Configure scope to mark non-production projects out of scope.
 
 

### Some resource types are missing from a project that does appear in Vanta.
 
Seeing a project (or some resources like Cloud Storage buckets) in Vanta does not mean Vanta has full access to that project. Vanta fetches each resource type independently; each requires both the right GCP API and the right IAM permissions. If one resource type is missing while others are present:
- 
Identify the missing resource type and the project it should appear in.
- 
Confirm the required API is enabled on that project (not just the scanner project).
- 
Check whether roles/iam.securityReviewer is bound to the scanner principal on the project. If a custom role is being used instead, compare it against roles/iam.securityReviewer — commonly missed permissions include compute.instances.list and serviceusage.services.list.
- 
Check for IAM conditions or deny policies restricting the scanner principal on that project or folder.
- 
If the project lives inside a GCP folder, confirm folder-level role bindings were applied — org-level bindings alone may not cover projects in folders.
 
 

### The GCP integration disconnected on its own.
 
Vanta may automatically disconnect GCP credentials after detecting repeated, persistent authentication or permission failures over multiple sync cycles. This process is not instantaneous; Vanta uses safeguards to avoid disconnecting on transient errors. For key-based connections, a revoked or deleted service account key can also trigger disconnection.
 
Check the following in GCP: for WIF connections, confirm the Workload Identity Pool and provider in the vanta-scanner project are still active and not deleted or disabled; for key-based connections, confirm the service account and key are still active. Confirm org-level role bindings for the scanner principal are intact.
 
 

### A GCP test result didn't update after I fixed the issue in GCP.
 
First, confirm the fix was applied to every affected resource instance, not just one (see How resource fetching works). Once all instances are remediated, allow up to a full sync cycle (up to ~24 hours in large environments) before expecting the test to update.
 
 

### VPC Flow Logs are enabled in GCP but the test still fails.
 
This is usually the Network Management API gap (see Logging and monitoring > VPC Flow Logs for the check and verification command). If you've confirmed subnet-level flags are set and the test still fails, contact Vanta Support or use manual evidence for that test.
 
 

### My Cloud Monitoring alert policies are configured but tests still fail.
 
Two common causes: (1) the alert policy has a resource-specific filter (e.g., scoped to a specific database or instance name). Vanta requires policies that apply project-wide without filters; (2) the alert policy has no active notification channel; at least one is required. Verify both conditions on every relevant resource instance, not just one.
 
 

### SYSTEM_MANAGED service account keys are appearing in the user-managed key rotation test.
 
This is a known false positive. See Limitations and edge cases > SYSTEM_MANAGED service account keys for how to confirm and what to do.
 
 

### Hundreds of Google service agent accounts appeared in access reviews after I connected.
 
Expected behavior when connecting at the org level. Google-managed service agents are GCP system accounts. Mark them Not Applicable in Vanta's access review workflow. Do not attempt to modify their IAM roles to satisfy tests. If they're appearing incorrectly in test results, contact Vanta Support for review.
 
 

### The "critical IAM roles" test is flagging service accounts I didn't create, including the Vanta scanner principal.
 
- 
Vanta's scanner principal: The scanner principal (WIF identity or service account, depending on your auth method) holds roles/iam.securityReviewer and the custom read-oriented roles granted during setup. These are intentional and read-only. You manage this principal and can review or adjust its permissions, but reducing permissions may prevent Vanta from scanning.
- 
Google-managed service accounts: GCP creates service accounts automatically for managed services (App Engine, GKE, Compute Engine, etc.). These should generally not be modified. If they appear as failing, this may be a false positive. Contact Vanta Support for review.
- 
Default service accounts with primitive roles: GCP creates default service accounts for projects that can end up with Editor or Owner roles. These are expected findings and should be remediated in GCP (minimize their permissions) rather than dismissed in Vanta.
 
 

### I want to switch from project-level to org-level connection.
 
Remove the existing GCP integration and reconnect using the organization connection type. Some configuration history including disabled test justifications and snoozed findings, will not carry over. Plan for up to ~24 hours for full repopulation. Coordinate this change away from active audit windows if possible.
 
 

### Can I connect more than one GCP organization?
 
Connecting multiple GCP organizations requires the Multiple GCP Organizations feature, which must be enabled by Vanta. Contact Vanta Support. Each org connects independently with its own WIF setup.
 
 

### Does Vanta support GCP Security Command Center?
 
No. Vanta does not ingest findings from GCP SCC or GCP On-Demand Scanning. Container vulnerability coverage is scoped to Artifact Registry via the Container Analysis API. If you're comparing Vanta vulnerability findings against SCC findings, those are different sources. Vanta surfaces container-image findings only. For SCC findings needed in Vanta for audit purposes, add a custom evidence document.
 
 

### Does Vanta support Google Firebase?
 
Vanta runs a limited scope of tests on Firebase projects, primarily around org-level IAM and access configuration. Firebase-specific data stores and features are not fully covered.
 
 

### How does Vanta determine container vulnerability severity?
 
Vanta uses the effective severity assigned by GCP's Container Analysis service, based on CVSS scores and asset-specific factors. Vulnerability priority in Vanta should match what you see in the GCP dashboard.
 
 

### What happens if I need to re-run the setup script?
 
The script is idempotent. If the scanner project, roles, or identity pool already exist, the script updates them in place rather than failing. It's safe to re-run if setup was interrupted.
 
 

### I'm using Terraform and getting authentication errors even though my GCP resources exist.
 
Confirm the following values in your Terraform configuration exactly match what Vanta generated: the scanner project number, the workload identity pool ID (vanta-<externalId>), the identity provider ID (vanta-aws), and the IAM role names. A naming mismatch in any of these can prevent authentication even when all GCP-side resources appear correctly configured. Use the Vanta-generated Terraform as the source of truth rather than rewriting it.

## Images

- [image 01] ../../images/ux/integrations/google-cloud-platform-integration-guide--01.png
- [image 02] ../../images/ux/integrations/google-cloud-platform-integration-guide--02.png
- [image 03] ../../images/ux/integrations/google-cloud-platform-integration-guide--03.png
- [image 04] ../../images/ux/integrations/google-cloud-platform-integration-guide--04.png
- [image 05] ../../images/ux/integrations/google-cloud-platform-integration-guide--05.png
- [image 06] ../../images/ux/integrations/google-cloud-platform-integration-guide--06.png
- [image 07] ../../images/ux/integrations/google-cloud-platform-integration-guide--07.png
