# Google Cloud Platform: Quickstart

Source: https://help.vanta.com/en/articles/16110869-google-cloud-platform-quickstart
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Connect Google Cloud Platform (GCP) to Vanta so the project configurations, IAM policies, network settings, and container vulnerability data your team manages in GCP automatically power compliance tests, access reviews, and evidence collection.
 
This guide is for: GCP customers connecting at the organization level (recommended) 
 
Time to complete: ~10-15 minutes
 

## What you’ll do 
This quickstart walks you through the following steps: 
- 
Verify your GCP permissions (~2 min)
- 
Open the GCP integration in Vanta and select your connection type (~1 min)
- 
Select the products you want Vanta to monitor (~1 min)
- 
Run the Cloud Shell script to grant Vanta access to your GCP organization (~5–7 min)
- 
Enter your scanner project number and complete setup (~1 min)
ℹ️ Note: The scanner project is not the same as your monitored projects. When you connect GCP, you run a Vanta-provided script that creates a dedicated scanning project in your GCP organization, with a display name of vanta-scanner and a project ID such as vanta-scanner-<timestamp>. This project is infrastructure only. It is not the project or projects Vanta monitors. If you connect GCP at the individual-project level and your workload projects do not appear, that is expected. Vanta monitors only the projects explicitly connected. To monitor all current and future projects, connect at the organization level, then go to Integrations > GCP > Configure scope to choose which projects count for compliance.
 
 

## Before you begin
Confirm all of the following before starting:
- 
You have the following GCP roles at the organization level. Project-level Owner or Editor is not sufficient to run the setup script. See the GCP Integration Guide for the full permissions breakdown.
- 
Organization Administrator — to grant Vanta's roles at the organization level
- 
Organization Role Administrator — to create Vanta's custom scanner roles
- 
Project Creator — to create the vanta-scanner project (granted domain-wide by default, but may be restricted in some organizations)
ℹ️ Note: The key permissions required from Organization Administrator for this setup are resourcemanager.organizations.getIamPolicy and resourcemanager.organizations.setIamPolicy. Your GCP admin may be able to grant these via a custom role instead. See the GCP Integration Guide <https://help.vanta.com/en/articles/16111208-google-cloud-platform-integration-guide> for the full permissions breakdown and testing guidance.
- 
You have Vanta admin access.
- 
Your GCP projects live inside a GCP organization. Standalone projects not attached to an organization are not supported.
- 
Your GCP account will be either an individual project connection or an organization connection. You cannot mix both types in the same Vanta account.
- 
(Optional) If you want container vulnerability scanning, plan to enable the Container Analysis API and Container Scanning API in your GCP projects.
- 
(Optional) If you plan to use Terraform instead of Cloud Shell, have your Terraform environment ready. This quickstart covers the Console (Cloud Shell) path only. See the GCP Integration Guide for the Terraform path.
 
 

## Setup guide
Explore the integration page. 
 
When you navigate to the GCP integration, you'll land on its listing page which includes five tabs that cover what you need to know before (and after) you connect.
- 
Overview: what the integration does, prerequisites, and what connecting unlocks.
- 
API permissions: exactly what access Vanta requests from GCP (share with your security team if they need to review access first).
- 
Resource types: every resource type Vanta imports, down to the specific fields. 
- 
Automated tests: how many tests connecting GCP unlocks and which frameworks they map to.
- 
Security: how Vanta protects the data it collects.
See the GCP Integration Guide <https://help.vanta.com/en/articles/16111208-google-cloud-platform-integration-guide> for a full breakdown of each tab.
 
 
 
 
 
 
Follow these steps to connect the integration.
 
Step 1: In Vanta, go to the Integrations page, click Add integration, and search for Google Cloud Platform.
 
Step 2: Click on the integration card.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2571443736/d2a960e4b7632cf70289aab3344c/5f18ef00-4f69-4ba9-83ce-96b258487ed1?expires=1794967200&signature=9d1c069d7be2a7a373366ca372f5abe4a2481767088fa06c54d6000e2effec26&req=diUgF816noZcX%2FMW1HO4zUngOdfGln7XU%2Ff3KS1rAzK8mmLdvSkmKkGwib3A%0A4zT19zpOCkefmMAS74U%3D%0A>
 
Step 3: Click Connect. This will launch the connection wizard. 
 
Step 4: When prompted to select a connection type, choose Organization (recommended). This allows Vanta to automatically discover all projects within your GCP organization. You can scope out non-production projects after connecting.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2571443578/4ee55918e99fd6389c6d9d641d26/6e7dcaa2-8002-4f96-99f6-67bc6ec777af?expires=1794967200&signature=3a16dbfe806039788f1db7443556794129bc91ecbd1b3ffb3d7cb01be5011e3a&req=diUgF816noRYUfMW1HO4zVtMnroLhIDR%2BK2WCoV%2BI0X5LzOMxNwvT0r7s7e%2F%0A%2BNmTB5Az4R%2FQpAvL2bE%3D%0A>
ℹ️ Note: If you select Individual Projects, Vanta will only monitor the specific projects you connect. New projects added to your org later won't be discovered automatically. You cannot have both individual project connections and an organization connection at the same time. To switch to organization-level, first remove all individual project connections, then connect at the organization level.
ℹ️ Note: This only affects connection type (individual projects ↔ organization). If you're migrating your authentication method from service account keys to Workload Identity Federation, see Switching authentication methods in the GCP Integration Guide <https://help.vanta.com/en/articles/16111208-google-cloud-platform-integration-guide>.
Step 5: Specify the organization to scan. Enter the domain name. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2571443315/9ad9572f6a353c84338ee1b6bf37/e4acdf8b-c9f6-4456-9fef-9b236c6a1c70?expires=1794967200&signature=d40783904d7142f2c75179e5db1c892d19a396e4f9fe520c4ff60dbf7a8e2f94&req=diUgF816noJeXPMW1HO4zbZSWqql%2FmpqGiGvQjJMGk7i3meiq4reNudf90sQ%0ADdoC1bJOZTcAvdo4akg%3D%0A>
 
Step 6: Select the products you want Vanta to monitor. Google Cloud Platform is required. Optionally enable:
- 
Container Analysis — to pull container vulnerability data (requires both the Container Analysis API and the Container Scanning API to be enabled in your GCP projects)
- 
CIS Foundations Benchmarks — to run CIS benchmark compliance tests
Click Next.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2571443114/f1b019e2bb8fda01b09dd69b7f85/37a84285-0782-4ef0-9c49-dd96fa4d5e7d?expires=1794967200&signature=eec1a37f6d154fe9405012d9d3c5a55a71b487771c381a378edd1d0f25a601b2&req=diUgF816noBeXfMW1HO4zdxjf3mgME7yuOi3BwCMoFIqmJIJ9DAZsc1FBzPp%0An0dysDaeIbbuM8a5zMI%3D%0A>
 
Step 7: Follow the in-product instructions to open Google Cloud Shell and run the Vanta-provided setup script. This script: 
- 
Creates a new dedicated project with the display name vanta-scanner (project ID: vanta-scanner-<timestamp>) in your GCP organization to host the Workload Identity Federation resources used by Vanta.
- 
Enables all required APIs on that project.
- 
Creates a custom IAM role at the org level that combines the permissions needed to scan your projects and organization, and grants the standard iam.securityReviewer role at the organization level.
- 
Grants the Vanta scanner the necessary roles across your organization.
- 
Outputs your scanner project number.
⚠️ Note: Organization-level permissions are required. Project-level Owner or Editor is not sufficient. If the script fails with a permissions error, confirm you have Organization Admin and Organization Role Administrator at the org level before retrying.
ℹ️ Note: The script is idempotent. If it fails partway through, you can safely re-run it. It will update existing resources rather than create duplicates.
Step 8: When prompted, click Authorize. And then copy the Project Number (a numeric ID).
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2571442829/792b0460960061388d314b38272c/66478246-aab6-40a9-8390-4ea538117637?expires=1794967200&signature=18ab45f08393ba6e5bf1844bee3f43a9ca11c5ba3cd5c3c285ec67f15ced14a9&req=diUgF816n4ldUPMW1HO4zQD7X00UDsGY8uAvYhRkbyAvtahy6uJlD0tN6Kk8%0AkXVxZDA4I6%2F04PQ2xm8%3D%0A>
ℹ️ Note: Project number vs. project ID: Vanta requires the numeric project number, not the project name or project ID string (e.g., my-vanta-scanner). Find it on the GCP Console home page under your project name if you're unsure.
Step 9: Paste the scanner project number into Vanta and click Next. Vanta will validate the connection by checking that the scanner project exists, that org-level permissions are granted, and that base APIs are enabled on the scanner project. Some issues such as missing APIs on individual monitored projects, may only surface during the first sync. Then we’ll confirm GCP as Connected.
 
 
 
 

## Verify your connection
- 
GCP should appear under the Connected tab on your Vanta Integrations page.
- 
In GCP, confirm the vanta-scanner-<timestamp> project was created and that its Workload Identity Pool and provider are active.
- 
Vanta will begin discovering your GCP projects and resources. Initial sync may take several hours. This is normal, no action is needed.
ℹ️ Note: Sync timing: Vanta syncs with GCP on a scheduled cadence per resource type, not in real time. After making a change in GCP, allow at least a full sync cycle before expecting test statuses to update. For large environments or after a full reconnect, plan for up to approximately 24 hours before all resources and test results are fully repopulated. If a resource or test state hasn't updated after 24+ hours, collect the affected project/resource ID and contact Vanta Support.
 
 

## (Optional) Configure scope
After connecting at the organization level, you can exclude projects from monitoring:
- 
Go to your GCP integration on the Integrations page.
- 
Click Configure scope.
- 
Mark any non-production or irrelevant projects as out of scope.
ℹ️ Note: You may see Google-managed system projects (prefixed sys-) and Google-managed service agent accounts appear after connecting at the org level. These are normal Google system resources and are not a security risk. Service agent accounts can be marked Not Applicable in access reviews.
 
 

## Troubleshooting

### The Cloud Shell script failed with a permissions error.
See Before you begin – Organization Admin and Organization Role Administrator at the org level are required; project-level Owner/Editor won’t work. 
 

### My GCP projects aren't appearing in Vanta.
The vanta-scanner project is a scanning proxy, not where your workload projects live — those are discovered through the org-level permissions granted during setup. Give it a few hours for the first sync. If they still haven't appeared, see the GCP Integration Guide's troubleshooting section for role-binding checks.. 
 

### I entered a project ID instead of a project number.
Project IDs are strings (e.g., my-vanta-scanner). Project numbers are numeric IDs (e.g., 123456789012). Find your project number on the GCP Console home page, then update your Vanta integration settings.
 
For issues after setup like sync timing, disconnects, missing resource types, or switching auth methods, see the GCP Integration Guide <https://help.vanta.com/en/articles/16111208-google-cloud-platform-integration-guide>'s troubleshooting section.
 
 

## Additional resources
- 
GCP: Integration Guide <https://help.vanta.com/en/articles/16111208-google-cloud-platform-integration-guide>: Full reference for all connection types, data collection, permissions, limitations, and advanced troubleshooting
- 
CIS GCP Foundations Benchmark <https://help.vanta.com/en/articles/11647393-cis-gcp-foundations-benchmark>: List of CIS controls mapped to Vanta's automated tests.
- 
Setting up Vulnerability Scanning <https://help.vanta.com/en/articles/11345769-setting-up-vulnerability-scanning>: How to enable container vulnerability scanning in Vanta.

## Images

- [image 01] ../../images/ux/integrations/google-cloud-platform-quickstart--01.png
- [image 02] ../../images/ux/integrations/google-cloud-platform-quickstart--02.png
- [image 03] ../../images/ux/integrations/google-cloud-platform-quickstart--03.png
- [image 04] ../../images/ux/integrations/google-cloud-platform-quickstart--04.png
- [image 05] ../../images/ux/integrations/google-cloud-platform-quickstart--05.png
