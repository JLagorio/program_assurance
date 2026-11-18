# Azure: Integration Guide

Source: https://help.vanta.com/en/articles/15693150-azure-integration-guide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers.

## Overview 
If your team runs infrastructure in Azure and manages employee identities through Microsoft Entra ID, this integration brings that data into Vanta automatically. Your team keeps working in Azure. Vanta handles evidence collection, access reviews, and compliance monitoring using the cloud resources, user directory, role assignments, security configurations, and vulnerability findings it reads directly from your environment.
 
Want the fastest way to get connected? Go to Azure: Quickstart <https://help.vanta.com/en/articles/15605280-azure-quickstart>.
⚠️ Note on Azure and Entra ID: The Azure integration in Vanta connects to two Microsoft systems: Azure Resource Manager for cloud infrastructure data (VMs, databases, networking, storage) and Microsoft Entra ID for identity data (users, groups, roles, MFA). Both are accessed through a single integration tile in Vanta called "Azure." When this guide refers to Entra ID, it means the identity system that the Azure integration reads from — not a separate integration. This applies to both the Azure and Azure for US Government integrations. Each reads from Azure Resource Manager and Microsoft Entra ID in its own cloud environment. 

### What you can do with this integration
- 
Automatically collect evidence across SOC 2, ISO 27001, NIST 800-53, FedRAMP, HITRUST, CIS v8, CJIS, NIS2, TISAX, and 23 NYCRR 500.
- 
Track whether Azure users have MFA enforced via Conditional Access.
- 
Verify that terminated employees have had their Entra ID accounts deactivated.
- 
Bring users, groups, and role assignments into access review workflows.
- 
Collect vulnerability findings from Microsoft Defender for Cloud.
- 
Monitor cloud resource configurations across compute, networking, storage, databases, and containers.

### Azure integrations in Vanta 
 | 
Integration | 
What it does | 
Setup method
 | 
Azure (this guide) | 
Reads cloud resource configurations from Azure Resource Manager and identity data (users, groups, roles, MFA) from Entra ID, in commercial Azure | 
App registration via Cloud Shell or Azure Portal
 | 
Azure for US Government | 
Same as above, for Azure Government environments | 
App registration via Cloud Shell or Azure Portal 
 | 
Azure SCIM | 
Provisions and deprovisions Vanta user accounts based on Entra ID assignments. Does not read cloud resources. | 
Entra enterprise app provisioning configuration
Setting up one does not configure the other. If users are syncing but provisioning isn't working, or if you're seeing unexpected user counts after enabling SCIM, the cause is almost always a misconfiguration in the SCIM layer specifically. See How the Azure connection and SCIM work together for details.
 

### Connection details 
ℹ️ Note on multiple Vanta workspaces: The same Azure tenant can be connected to more than one Vanta workspace. There is no restriction enforcing a one-to-one relationship between Azure tenants and Vanta workspaces.
 | 
Detail | 
Value
 | 
Connection type | 
Service principal (app registration) with client secret
 | 
API surfaces | 
Azure Resource Manager (ARM) for cloud infrastructure; Microsoft Graph API for directory and identity data
 | 
Access level | 
Read-only. Vanta never writes to your Azure environment.
 | 
Resource types collected | 
~42 across compute, databases, networking, storage, identity, monitoring, containers, and vulnerabilities
 | 
Service variants | 
Commercial Azure. Azure Government environments use the separate Azure for US Government integration.
 | 
Who should connect | 
A Global Administrator or Privileged Role Administrator in Microsoft Entra ID
 | 
Client secret expiry | 
Client secrets expire; you set the expiry when you create the secret, up to a maximum of 24 months.
 
 

## What Vanta collects and why
This section covers the data Vanta reads from Azure and why each category is collected. For how this data powers specific Vanta workflows, see Use cases and capabilities. 
 

### Identity and directory data (Microsoft Graph)
 | 
Data | 
What Vanta collects | 
Why it's collected
 | 
Users | 
ID, email, display name, account status, creation time, last sign-in | 
Powers personnel records, access reviews, deprovisioning tests
 | 
MFA status | 
Whether MFA is enabled per account, Conditional Access policy enforcement | 
Powers MFA compliance tests
 | 
Groups | 
Group ID, name, member list | 
Access reviews, IdP group imports, scoping
 | 
Role assignments | 
Role type, assignment target, assignment method (direct or via group) | 
Surfaces privileged access; powers access reviews
 | 
Service principals | 
App ID, display name, assigned permissions | 
Vendor and application visibility
ℹ️ Note: Vanta detects MFA enforcement via Conditional Access policies, which requires a Microsoft Entra ID P1 license (not included with M365 Business Standard).

### Cloud resources (Azure Resource Manager)
 | 
Category | 
What Vanta collects
 | 
Compute | 
Virtual machines, scale sets, Azure Functions
 | 
Databases | 
Azure SQL, Cosmos DB, PostgreSQL, MySQL, and others
 | 
Networking | 
Network security groups, firewalls, load balancers, Front Door, Application Gateway, Traffic Manager (see Resolve 'Load balancer used Azure test' <https://help.vanta.com/en/articles/11346022-resolve-load-balancer-used-azure-test>)
 | 
Storage | 
Blob storage, file shares, managed disks
 | 
Containers | 
AKS clusters, container registries
 | 
Monitoring | 
Activity logs, diagnostic settings, alert rules
 | 
Security | 
Defender for Cloud findings (requires Defender plans enabled in Azure)
 | 
Key management | 
Key Vault secrets and access policies (requires Key Vault Reader role)

### What Vanta does not collect or do 
 | 
What | 
Detail
 | 
User credentials or passwords | 
Never read
 | 
Authentication tokens | 
Not accessed
 | 
Write access to Azure | 
Vanta does not create, modify, or delete any data in your Azure environment
 | 
Real-time data | 
Data is synced on a scheduled cadence, not in real time
 | 
VNet peering configurations | 
Not collected or evaluated. Vanta does not know whether VNets are peered, or evaluate peering configuration correctness. 
 | 
VPN gateways, ExpressRoute, Azure Firewall | 
Not collected as networking resources 
 | 
Private endpoints / private link | 
Not part of the networking test suite
 
 
 

## Prerequisites and readiness checklist 
Complete all items in this checklist before starting setup. 
 

### Confirm your Azure role
The connecting account must have Global Administrator or Privileged Role Administrator in Microsoft Entra ID. These are Entra ID directory-level roles, not Azure subscription-level roles. The Azure integration requires directory-level permissions because it reads identity data from Entra ID in addition to cloud resources. Subscription-level roles (Owner, Contributor) are not sufficient.
ℹ️ Note: Admin consent is a directory-level grant that allows the Vanta app registration to read data across your tenant. App assignment controls which users can sign in to an application. These are different things. The integration requires admin consent. App assignment alone will not resolve permission errors.
 

### Configure required permissions 
 | 
Permission | 
Type | 
Required for
 | 
Reader | 
Azure role on subscription or tenant | 
Collecting cloud resource data
 | 
Directory.Read.All | 
Microsoft Graph application permission (admin consent required) | 
Collecting Entra identity data
 | 
Key Vault Reader | 
Azure role on each Key Vault | 
Key Vault monitoring (optional)
 | 
Policy.Read.All | 
Microsoft Graph application permission | 
CIS Benchmark policy data (optional)
⚠️ Note: Directory.Read.All must be granted as Application type with admin consent. Delegated type will not work and is the most common cause of user data not appearing in Vanta.
 

### Confirm license requirements
- 
Basic Azure connection: no Entra license required.
- 
Microsoft Entra ID P1 required for: group-based scoping, Conditional Access MFA detection. P1 is included with M365 Business Premium, E3, E5, or available as a standalone add-on. M365 Business Standard does not include P1. Entra P2 is only required for risk-based Conditional Access policies.
 

### Decide which integrations you need 
- 
Cloud resource monitoring + identity data only? Azure API integration (this guide).
- 
Cloud resource monitoring + user/group provisioning into Vanta? Azure API integration + Azure SCIM.
- 
Running in Azure Government? Use the Azure for US Government integration instead of the Azure integration. See Government cloud environments. 
 

### Choose your connection type 
 | 
Type | 
Use when
 | 
Subscription | 
You have one subscription, or a small number to connect individually
 | 
Tenant | 
You have many subscriptions under a single tenant and want to connect them all at once
 

### Plan for client secret expiry
If you connect using the Azure Portal, you choose the client secret's expiry when you create it. Azure allows a maximum of 24 months.
 
If you connect using Cloud Shell, the script sets the expiry for you. After setup, you can check the expiration date in the Azure portal under Microsoft Entra ID → App registrations → your Vanta app → Certificates & secrets.
 
Either way, note the expiration date and set a calendar reminder. When a client secret expires, Vanta stops collecting data from Azure until you create a new secret and reconnect the integration.
 
 

### Readiness checklist — quick reference
- 
You have Global Administrator or Privileged Role Administrator in Entra ID.
- 
You have Vanta admin access.
- 
You've decided between Subscription and Tenant connection type.
- 
You've confirmed which optional products you want to enable (Defender, AKS, Key Vault).
- 
If using SCIM: SSO is fully configured and working before you proceed. See How the Azure connection and SCIM work together.
 
 

## Setup guide
⚠️ Note: The steps in this section are for commercial Azure. If you're connecting an Azure Government environment, follow Government cloud environments instead — the steps are similar, but you'll use the Azure for US Government integration and Azure Government portal.
 

### Connect using Cloud Shell (recommended)
Cloud Shell is the fastest and least error-prone path. Full step-by-step instructions are in the Azure: Quickstart <https://help.vanta.com/en/articles/15605280-azure-quickstart>.
 

### Connect using the Azure Portal (manual)
Use this method if you cannot use Cloud Shell, or if your organization requires manually reviewing each step of the app registration process.
- 
From the left-hand navigation panel in Vanta, select Integrations.
- 
Click Add Integration and search for Azure. 
- 
In the right panel that slides out, select Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509229825/d06ccc7f039ae5f17133f3c017c6/image.png?expires=1794967200&signature=82951606c7b497bb4b2cc8e058e84312867d0b5f3cfaa7c8d69708812aab3d9f&req=diUnH8t8lIldXPMW1HO4zdWOcpt7fHAOkLIWhbcbMJi9vfuXnr2noZkHkub7%0Aebovq%2BJok8OsCoUYcs8%3D%0A>
 

### Choose your connection type 
Supported connection patterns
 
Before connecting, review what Vanta supports for Azure:
- 
You can connect multiple subscriptions to a single Vanta workspace (each linked individually).
- 
You can connect multiple tenants to a single Vanta workspace (each set up using the Tenant connection flow).
- 
You can connect individual subscriptions that belong to the same or different tenants.
- 
The same Azure tenant can be connected to multiple Vanta workspaces — each workspace maintains its own independent connection and app registration.
- 
You cannot mix tenant-level and subscription-level connections within a single Vanta workspace. If you previously connected subscriptions directly and want to switch to a tenant connection, you must unlink those subscription connections first.
For step-by-step instructions on adding multiple connections, see: 
How to connect multiple Azure subscriptions to Vanta <https://help.vanta.com/en/articles/11345621-how-to-connect-multiple-azure-subscriptions-to-vanta>.
 
If you don't see the option to add additional tenants, contact Vanta Support. 
- 
Select the connection type: 
- 
Subscription - Choose this option if you have one or a few subscriptions. Each subscription must be linked individually.
- 
Tenant - Choose this option if you manage multiple subscriptions under a single tenant. 
- 
Select Azure Portal, then click Next. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509230414/89e8a50d1aa82c31111719f3942d/84ebce75-3389-4d60-9883-d71adc63d88b?expires=1794967200&signature=7d20a8e7215ddef40c5e546635b16a528ae8c9f56d237d525e027a4bcea50dc0&req=diUnH8t9nYVeXfMW1HO4zSxd3EaMi6rJ6zhMW90wBHrzfMXLq6AYb6Lj8c2t%0AVCqv%2FdI90G07aV7yh5g%3D%0A>
 

### Select Products
- 
Microsoft Azure is enabled by default and cannot be disabled.
- 
If you use Microsoft Azure Kubernetes Monitoring and/or Microsoft Defender for Cloud for vulnerability scanning, enable these options to populate the Vulnerabilities page in Vanta. Hover over the tooltip for more information. 
- 
Click Next.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509232652/c303b8f511c8715d7d7c3bf1d817/914028a1-b9b8-4c3b-8f11-1dfbf3123fcc?expires=1794967200&signature=492650c34b98d56e89a34f7c993b2b49ae444077bed9bc22704ee5688beafa7f&req=diUnH8t9n4daW%2FMW1HO4zZDrgJsvDVPssD17GCDmGS8EgtyitTOMhkrVFrbH%0AzK%2FSMGLos8KTGCrIVoU%3D%0A>
 

### Select your Azure subscription
ℹ️ Note: These steps assume you have at least one Azure subscription. If you do not see any subscriptions, verify that your account has access to a subscription in Azure.
- 
Click the Subscriptions hyperlink on this page, or navigate directly to Subscriptions in the Azure portal.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509239713/a9541ff1a11c8444f418d000706f/c766bb6f-8112-42dd-9ad0-cd0010240526?expires=1794967200&signature=50137bd4c4b59ea7c92d3fbf4dfe178dd61ee29f83495be001342e9a8b6afd2d&req=diUnH8t9lIZeWvMW1HO4zYbPcv26UzqvXt8LR0tBviE7VsP1k0%2F%2F4HsHq7BG%0Axrn6NiQe3uC7uR9gQTE%3D%0A>
- 
Copy the subscription ID. 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509239977/2d3432ed080e4c915a5227b82f8f/4668fdcb-d845-4a78-973d-98cd06c99d9d?expires=1794967200&signature=94f306867e14283accd50e3218be3d6895068373dbbabe8f8e9b743b6d34116b&req=diUnH8t9lIhYXvMW1HO4zX9Ff1oxspxJDaSssEc%2Ff5uffn2RihlcdWNqTMLP%0Aj9fU3DRlfrha9Y4NsB0%3D%0A>
- 
Paste the subscription ID into the corresponding field in Vanta.  

### Register the Vanta application 
- 
In the Azure Portal, navigate to App Registrations.
- 
Click + New registration.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509243606/9671060fa8ea53a8b2d79e228916/edb63fda-aaad-4dfb-9b4d-b80dd7213204?expires=1794967200&signature=47c3d20fd3ebccfea0207596c55a832f2a2f254cda332b39f9a60ea828da401e&req=diUnH8t6nodfX%2FMW1HO4zcsjIk7cCpPb7e4DrYqkbA7WbLuNQAjFOGVOxVTf%0ABckHrH7NEJTpZ%2FP%2F3ys%3D%0A>
- 
Enter vanta-scanner as the application name and keep all default settings. 
- 
Click Register.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509243908/a00671a15b39dd7de920178a1d53/f98a6970-71e7-4b1c-ad74-13aa5e92fbf7?expires=1794967200&signature=0386234f5862ad58b445d3973cf4f63f9f6b51d97172fecd55b3dd1603e6d4f2&req=diUnH8t6nohfUfMW1HO4zbc5C6oTc6fWGZHLSmfGEYLty40CE0R6KKbuuYCH%0AE5YCrJzZQisifBvqQHE%3D%0A>
- 
Copy the Application (client) ID and the Directory (tenant) ID to paste into Vanta. 
- 
Paste the values into their respective fields on the Register the Vanta Application page in Vanta. 

### Create a federated credential
- 
In the Certificates & secrets tab of the registered application, go to Federated credentials and click Add credential.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2644947027/71ba92815aaf2e4b5b3c13f8aa30/ac4e565d-31da-4bd3-bc5b-4d4c8b38f2a4?expires=1794967200&signature=90290a2b2cf533f683f4634f1c4932814e69493a872043c6cef9ef301359e784&req=diYjEsB6moFdXvMW1HO4zf790RGM5XRBEGEhkrjkY7YLvahwN9fECjyP12ee%0Ax0x2W0bUR7sLMhSW%2Bsk%3D%0A>
- 
For the Federated credential scenario, choose Other issuer.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2644947401/4be6f575a5d28e6a03c8311e15d3/43ae4cb8-fd13-4e3a-93ec-ce95b935c600?expires=1794967200&signature=e18b7ad1860ca40f2df9fc91059794e09f2a82a7eb83bca278014a3ca18e3098&req=diYjEsB6moVfWPMW1HO4zdHCobjdWZWSmaleP%2BrZfPek43SIaXDBWcB04zWC%0AEwtt0uaUWkJ1ix0Bbus%3D%0A>
- 
Set Issuer to the Vanta-provided URL, choose Explicit subject identifier, and set Value to the Vanta-provided subject identifier.
- 
Choose a Name for the federated credential.
- 
For Audience, click on Edit (optional) and input the Vanta-provided audience identifier.
- 
Click Add to confirm the credential creation.
 

### Configure app access
- 
In the Azure Portal, open the same app registration and navigate to API permissions. 
- 
Click + Add a permission. 
- 
Select Microsoft Graph.
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509251024/d0449415774e6cb317806d646fdf/8b924832-88cf-4754-825d-44cd658b6f86?expires=1794967200&signature=d0959147edf022f8313213dae6ddb9b81afc1406027fe7c09bb41e2901941b00&req=diUnH8t7nIFdXfMW1HO4zR5z5NSn1uzD0ShargIusiz9k%2FH6c3uo9Bx7PRdl%0AJfA19f%2FKFQ8tUhaXNIA%3D%0A>
- 
Choose application permissions. 
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509251491/c6d304424f6a236f9cc209584f76/e3dff632-0a76-40cb-9fe7-3d42398343d8?expires=1794967200&signature=cb183998f46833b27d5b2bb4c59116f9e49276f8fe3f5673e16c5e017d4194ff&req=diUnH8t7nIVWWPMW1HO4zfLBGBIn%2BV9EamFzGnlIxnEPCBozmSKh3ZqOuyiO%0A5ZV78iIJe1hxIy%2FwQOo%3D%0A>
- 
Search for and select Directory.Read.All.
- 
Click Add permissions. 
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509251893/005adbbac9caacd99aabb112f3b8/5bac4386-db02-4471-8025-dbe4446c683c?expires=1794967200&signature=d078824f5e94fe6b2f36e0f0b8152e0e549c01e056ddfcaf1373fc4d51cc86f5&req=diUnH8t7nIlWWvMW1HO4zUxeKIQ8jaW08FKk1bLpFrX5Vuaz7JpgiBq5Q6Uv%0Atz17ngHL8g5bk6nB9Pc%3D%0A>
- 
Click Grant admin consent for Your Organization. 
- 
Confirm by selecting Yes.
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509252525/d500de7dae4d6c0d469a054bc1b7/5b16723f-f840-482e-b869-703ba7a4ea18?expires=1794967200&signature=69d962afcd5c7f0151e419414c2c93ffef10f738292d7ec2fbe85b4c9c3df8d6&req=diUnH8t7n4RdXPMW1HO4zTDSPKYSxGo7CqjX%2Fooo%2FOg%2FJqEPdjSfpSPItuPs%0ANkGAogRPjrTjnJNpo%2F0%3D%0A>
- 
Return to Vanta and click Next. 
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509253809/9967d28ac9e65494b772fce605b4/c30c31b2-d94b-419d-b363-273b0557a8ed?expires=1794967200&signature=c446838e05f0207796f0e5bcd220cd9056f04627d14e60df9af05760d6074903&req=diUnH8t7nolfUPMW1HO4zQrY%2B9fLdhG9THlRJ5k%2F7xbWeYkO6GJE5eFB7o2r%0ANL7zDztX8gJuj3TBFgw%3D%0A>
 

### Assign the reader role 
- 
In the Azure Portal, navigate to your Subscription. 
- 
Select Access control (IAM). 
- 
Click + Add, then select Add role assignment.
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509255613/afa8a385277dcbf5efa1445aa07c/5e5d3cf5-0689-4507-ac3e-7d4b92f9bbd7?expires=1794967200&signature=a563feb04afb23417d0932c599aa58a249b0f85fdb0ce7fad699b74831966107&req=diUnH8t7mIdeWvMW1HO4zZbUpDJlxcGrZbh6qU4pFQwiwUijPpGpW0zewHrg%0AiyjX6SheNwdEougDMZc%3D%0A>
- 
Under Role, select Reader, then click Next. 
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509258714/feaf7e684760e78bbef13e2b2e8d/5dc3233d-14b0-428c-9d73-4bbf25c17387?expires=1794967200&signature=6b610f271046ca76701fe62b802b48ce95e21b80b9888c692cdf0520ede0eb64&req=diUnH8t7lYZeXfMW1HO4zanh2LtUE0v%2FgTo9fYgMO9c7kGR0z%2F3p9aZxJANN%0AS1SxJG1yH8Gyu6ppNOs%3D%0A>
- 
Click + Select members. 
- 
Search for the vanta-scanner application you created earlier and select it. 
- 
Click Select.
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509259159/b2c587bcce1ae2b1577dac0306b2/3d1a8218-4f6a-4e6c-bc9c-310b3580eef0?expires=1794967200&signature=0fd55f176a0a7d1dd00bece16626fcc3a5c90a0063e568c050b058f48dfe885c&req=diUnH8t7lIBaUPMW1HO4zYhWLHRmtmhZMGVoFmvmjryO3qYJFTlpLirGE9j0%0ANRNmZs%2BGwpfD91JLq30%3D%0A>
- 
Review the configuration and click Review + assign. 
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509259501/ec163e3f24b8e005b974686c03c4/2f78333a-f091-4a8c-9967-2e003e4fa9a4?expires=1794967200&signature=12950c84e5e18b4b2d1fa90102c97f53270fb636122ed856efb8e3dbe7e3fe80&req=diUnH8t7lIRfWPMW1HO4zVnoQ6yrQ6Jq8%2Bil7WcoLkIjmHiCg0IKGNkaPKmJ%0AVPxQUDdJMpD%2FFQkAXZg%3D%0A>
- 
Return to Vanta and click Next. 
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509260538/081ab7f0b547b634fd22f78b8244/15b13a53-d82f-4b8c-82c1-4b6e377a1a0c?expires=1794967200&signature=d6d34d18d2fc79905defa2bd8f4ca0577f76e1c0fe8d883f6280ca6fc6cb4f9c&req=diUnH8t4nYRcUfMW1HO4zTaLTaQwU7EVjYcV6Vyp6ZMxxS0JmajieoSTqxLh%0AWU81qgpu7RqeTFbihr8%3D%0A>
 

### Check connection
If the setup was completed successfully, Vanta will display a confirmation screen indicating that the connection was established. 
 
[image 20]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509260873/947189142251ebd8684d7abafbd9/00821b97-29c0-4a51-b4ac-7e49b0379c11?expires=1794967200&signature=a99c899837c6b6dd52f78dfd8f6576df6ad08c18bf7712c9fa1a57576bfe1230&req=diUnH8t4nYlYWvMW1HO4zQM8IMa3JJGuOXSrZ63Vm%2F%2BJLPpsP%2F8FqYVGpVD4%0AsH4PwMm3%2B8CjCIZFJ00%3D%0A>
 

### Optional configurations

### Azure Kubernetes Service (AKS) monitoring <https://help.vanta.com/en/articles/11345694-azure-kubernetes-guide>
Enables node-level security tests for AKS clusters. Enable in Integrations > Azure > Configure.
ℹ️ Note: Private clusters are not supported for node-level scanning. Vanta will list private clusters in inventory, but node security tests will not apply to them.

### Microsoft Defender for Cloud
Required for vulnerability data to appear on the Vanta Vulnerabilities page. Enable in Integrations > Azure > Configure, then confirm the following in Azure:
- 
The appropriate Defender plan is enabled (Defender for Containers or Defender for Servers).
- 
Monitoring coverage is set to Full.
- 
At least one scan has been completed.
If Vanta shows "No vulnerability data received," see No vulnerability data received (Azure) <https://help.vanta.com/en/articles/11345850-no-vulnerability-data-received-azure>.

### Azure Key Vault
Enables monitoring of Key Vault keys and secrets for security best practices including expiration, rotation, and access controls.
 
If you connected via Cloud Shell and toggled on Azure Key Vault during setup, the Key Vault Reader role was assigned automatically by the script. No additional action is needed.
 
If you connected via the Azure Portal, manually assign the Key Vault Reader role to the Vanta app registration on each Key Vault you want monitored. Navigate to each Key Vault > Access control (IAM) > Add role assignment > select Key Vault Reader > assign to the Vanta app registration.
 
 

## How the Azure connection and SCIM work together
This section covers one of the most common sources of configuration problems in the Azure integration. Read it before enabling SCIM.
 

### The standard Azure connection is the foundation
When you connect Azure through the standard setup flow, Vanta uses the Microsoft Graph API with Directory.Read.All permission to read user and group data from Entra ID. This is the foundation of the integration. It handles identity data, access reviews, MFA detection, and group visibility in Vanta.
 

### SCIM is a separate, optional layer
SCIM (System for Cross-domain Identity Management) handles the provisioning and deprovisioning of users into Vanta. It is not the same as the standard Azure connection and is not interchangeable with it.
ℹ️ Note: Both integrations connect to Entra ID. The standard Azure integration reads data from it, while SCIM writes provisioning changes based on it.
 | 
  | 
Azure connection (standard) | 
SCIM
 | 
Purpose | 
Read identity and cloud data for compliance | 
Provision and deprovision users in Vanta
 | 
Required | 
Yes, for the integration to function | 
No — optional
 | 
Configured in | 
Azure app registration + Vanta integration settings | 
Entra enterprise app + Vanta integration settings
 | 
Scoping behavior | 
Controlled by scoping settings in Vanta | 
Overrides Vanta scoping settings entirely
 
 
Required setup order
 

### SSO must be fully configured and working before you enable SCIM.
Enabling SCIM before SSO setup is complete can result in a partially broken authentication state that locks users out of Vanta. Complete SSO setup first, confirm it is working, then enable SCIM.
 

### SCIM overrides scoping settings — and does so silently
If SCIM is enabled, the Entra scoping settings in Vanta (for example, "sync only users in these groups") no longer take effect. SCIM becomes the sole source of truth for which users are synced into Vanta.
 
This means:
- 
Users you excluded via scoping settings may reappear in Vanta after SCIM is enabled.
- 
Scoping changes made in Vanta after enabling SCIM will have no effect.
- 
There is no in-product warning when SCIM overrides your scoping configuration.
When SCIM is enabled, manage user scoping through Entra's enterprise app assignment in Azure, not through Vanta's integration scoping settings.
 
 
Enabling SCIM requires configuration on both sides 
 
Toggling SCIM on in Vanta is not sufficient. You must also:
- 
Assign users or groups to the Vanta enterprise app in Entra. Users must be explicitly assigned before SCIM will provision them.
- 
Configure provisioning mappings in Entra. Navigate to the Vanta enterprise app → Provisioning → configure attribute mappings. See Azure SCIM attribute instructions <https://help.vanta.com/en/articles/11345646-azure-scim-attribute-instructions> for details on the rbac_role_id custom attribute, which does not appear natively in Entra's UI and must be added manually.
- 
Enable provisioning in Entra. Set provisioning status to On in the Entra portal. Toggling SCIM on in Vanta does not start provisioning.
 
 
Three named failure modes 
- 
⚠️ SSO lockout: Configuring SCIM before SSO setup is complete can lock users out of Vanta. Always confirm SSO is working before enabling SCIM.
- 
⚠️ SCIM enabled, no users provisioned: If SCIM is toggled on in Vanta but no users are appearing or being deprovisioned, check: (1) users are assigned to the Vanta enterprise app in Entra, (2) provisioning mappings are configured, (3) provisioning is set to On in the Entra portal. Toggling on in Vanta alone is not enough.
- 
⚠️ SCIM silently overrides scoping: If user counts changed unexpectedly after enabling SCIM, or if scoping settings stopped having any effect, SCIM is overriding them. To resolve: disable SCIM, reconfigure scoping via integration settings, then re-evaluate whether SCIM is needed and manage scoping through Entra's enterprise app assignment instead.
 
 
 

## Configure user scoping
By default, Vanta imports all users from Entra ID. To limit which users appear in Vanta, use scoping. 
⚠️ Note: Scoping settings in Vanta do not apply when SCIM is enabled. If SCIM is enabled, manage scoping through Entra's enterprise app assignment. See How the Azure connection and SCIM work together.
How it works: When scoping is enabled, Vanta treats the configured scope as the source of truth. Only users matching your scope criteria will sync.
 
Setup:
- 
In Vanta, go to Integrations > Azure > Configure scope.
- 
Define your scope using users or Entra groups.
 
Service accounts and test accounts: Service accounts and test accounts in Entra will sync to Vanta by default and will appear in access reviews and user counts. To prevent this, exclude them via scoping, or use group-based scoping to define a group of human employees and scope to that group only.
⚠️ Note: Scoping interacts with offboarding. If your offboarding process removes users from the scoped group, those users will disappear from Vanta — including terminated employees you may still need for audit evidence. To preserve audit visibility, either keep terminated users in the scoped group (while deactivating them in Entra), or manage scope directly in Vanta.
 
 
 
 
 

## Government cloud environments
Azure Government environments connect through a dedicated Azure for US Government integration.
 
Previously, the option to connect to Azure Government endpoints was embedded inside the Azure integration's linking flow, and a single Azure integration served both commercial Azure and Azure Government. That option has moved to its own integration.
 
Azure for US Government is available in both Vanta Government and Vanta Commercial workspaces. If you don't see it in your integrations catalog, contact Vanta Support.
 

### Which integration should I use? 
 | 
Your environment | 
Use this integration
 | 
Commercial Azure (portal.azure.com) | 
Azure
 | 
Azure Government (portal.azure.us) | 
Azure for US Government
If your organization runs infrastructure in both clouds, you can connect both integrations to the same Vanta workspace. Each maintains its own connection and app registration.
 

### A note on terminology
Azure Government is Microsoft's US sovereign cloud for infrastructure — virtual machines, databases, storage, networking. GCC High is a separate thing: it refers to Microsoft 365 and Office 365 offerings that are hosted in Azure Government. There is no Microsoft product called "Azure GCC High."
 
If you're connecting Azure infrastructure that runs in Azure Government, use Azure for US Government, regardless of whether your Microsoft 365 tenant is GCC High.
 
If you're connecting Microsoft 365 services in a GCC High tenant, those have their own integrations in Vanta — Microsoft Entra GCC High, Intune GCC High, and Microsoft Defender for Endpoint (GCC High).
 

### What's the same as commercial Azure 
Azure for US Government reads the same resource types, runs the same automated compliance tests, and requires the same permissions as the commercial Azure integration:
- 
Reader role on the subscription or tenant, plus Key Vault Reader if you enable Key Vault monitoring
- 
Directory.Read.All as an application permission with admin consent.
Both Subscription and Tenant connection types are supported, using either Cloud Shell or the Azure Portal. Users, groups, and role assignments sync into access reviews the same way.
 

### What's different
Vanta calls Azure Government service endpoints rather than commercial ones. During setup, the practical difference is which portal you work in:
 | 
  | 
Commercial Azure | 
Azure Government
 | 
Azure portal | 
portal.azure.com | 
portal.azure.us
When following the setup steps in this guide, use the Azure Government portal wherever the Azure portal is referenced.
 

### Azure Government setup guide

## 
The setup process is the same as commercial Azure. Before you start, note these three differences:
- 
In your integrations catalog, select Azure for US Government rather than Azure.
- 
Work in the Azure Government portal at portal.azure.us, not portal.azure.com. Every reference to the Azure portal in the setup steps above means the Government portal when you're connecting a Government environment.
- 
You won't be asked to choose a cloud environment. Vanta uses Azure Government endpoints automatically because you selected the Azure for US Government integration.
Everything else is identical: choose Subscription or Tenant, then connect using either Cloud Shell (recommended) or the Azure Portal.
 

### Connecting with Cloud Shell
- 
In Vanta, go to Integrations, click Add integration, and then find Azure for US Government.
- 
Click Connect.
- 
Select your connection type: Subscription or Tenant.
- 
Select Cloud Shell, then click Next.
- 
Enable any optional products you use — Azure Kubernetes Monitoring, Microsoft Defender for Cloud, or Azure Key Vault. Click Next.
- 
Open portal.azure.us and click the Cloud Shell icon in the top navigation bar. Confirm the shell is in Bash mode, not PowerShell.
- 
Copy the script from Vanta, paste it into Cloud Shell, and press Enter.
- 
Return to Vanta and click Next. Vanta will confirm when the connection is established.
 

### Connecting with the Azure Portal
- 
In Vanta, go to Integrations, click Add integration, and then find Azure for US Government.
- 
Click Connect. 
- 
Select your connection type, then select Azure Portal and click Next.
- 
Enable any optional products you use, then click Next.
- 
Complete the remaining steps — providing your subscription or tenant ID, registering the Vanta application, granting API permissions, and assigning the Reader role — exactly as described in Setup guide above, working in portal.azure.us throughout.
- 
Return to Vanta and click Next to confirm the connection.
 
 

### Common Azure Government SSO errors 
If you're setting up SSO for an Azure Government environment and see one of these errors from Microsoft, here's what they mean in the context of a Vanta connection:
- 
AADSTS700016: this usually means a commercial Entra client ID was used against an Azure Government endpoint instead of the environment-specific client ID. Confirm you connected through the Azure for US Government integration and registered the app in the correct Entra environment for your tenant type, not the standard commercial one.
- 
AADSTS50011: this indicates a redirect URI mismatch between what's registered in Entra and what Vanta expects for your environment. Confirm the redirect URI configured in your Entra app registration matches the one Vanta provided during setup.
If either persists after confirming your environment and redirect URI, contact Vanta Support with the full error code.
 
 

## Verification and validation
After setup, confirm the following to verify the integration is working and data is syncing.
- 
Integration is active — Go to Integrations and confirm Azure shows Connected with a recent sync timestamp.
- 
Resources are appearing — Go to Inventory. Azure resources should appear across the relevant categories.
- 
Users are syncing — Go to People. Entra ID users should appear and be linked to personnel records.
- 
Compliance tests are populating — Go to Tests. MFA, deprovisioning, and resource configuration tests should show data.
- 
Role assignments are visible — Open a user's profile. Entra ID role assignments should appear. If they don't, confirm Directory.Read.All was granted as Application type with admin consent.
- 
Vulnerability data is appearing (if Defender is enabled) — Go to Vulnerabilities. Data should appear after the first scan completes in Azure.
 
 

## Use cases and capabilities

### Quick reference
 | 
Resource / Capability | 
Supported | 
How it's used in Vanta
 | 
Users | 
Yes | 
Personnel records, access reviews, deprovisioning tests, evidence
 | 
Groups | 
Yes | 
Access reviews, scoping
 | 
Role assignments | 
Yes | 
Surfaces privileged access; access reviews
 | 
MFA enforcement | 
Yes (requires Entra P1/P2 + Conditional Access) | 
Automated compliance tests
 | 
Cloud resource inventory | 
Yes | 
Compliance tests, evidence collection
 | 
Vulnerability findings | 
Yes (requires Defender for Cloud) | 
Vulnerabilities page, compliance tests
 | 
AKS node monitoring | 
Yes (private clusters not supported) | 
AKS security tests
 | 
Key Vault monitoring | 
Yes (Cloud Shell assigns role automatically; Portal path requires manual role assignment) | 
Key management evidence
 | 
User provisioning (Entra → Vanta) | 
Via SCIM only | 
Separate setup required

### Personnel management and lifecycle
 
Vanta uses Entra ID as a live source of identity data, syncing user profiles, account status, group memberships, role assignments, and MFA enrollment on a regular cadence.
 
What this powers in Vanta:
- 
People section: Entra ID accounts are matched to Vanta user records by email address and appear on the People page with account status, role assignments, and MFA enrollment visible.
- 
Access reviews: Synced users, groups, and roles surface in Vanta's access review workflows.
- 
Automated tests: User data powers the core identity compliance tests.
⚠️ Note: Vanta's source of truth for employment status is your HRIS, not Entra ID. If a user is active in Entra but marked as terminated in your HRIS, Vanta will show them as terminated. If a user appears unexpectedly terminated in Vanta, check their status in your HRIS first.
 
 
 

### Automated compliance tests 
Azure data powers several automated compliance tests in Vanta, depending on your framework and configuration. Tests run continuously and update as Vanta syncs new data.
 
MFA on Azure
Vanta checks whether every in-scope Entra user account has MFA enforced via Conditional Access.
- 
Passes when all in-scope users have MFA enforced.
- 
Fails when one or more users are not covered by an active Conditional Access policy requiring MFA.
- 
Requires Entra P1 or P2. Per-user legacy MFA is not evaluated.
Azure accounts are associated with active users in Vanta
Vanta checks whether each active Entra account can be matched to a known, active user in Vanta.
- 
Passes when every active Entra account is linked to an active Vanta user record.
- 
Fails when an active account cannot be matched, or is matched to a user marked as terminated.
- 
Matching is done by email address.
 
 

## 

## Troubleshooting and FAQs

### "Insufficient permissions" or connection failure at setup
- 
Likely cause: The account used does not have the required Entra ID role, or admin consent was not granted.
- 
Fix: Re-run setup using an account with Global Administrator or Privileged Role Administrator role. Confirm Directory.Read.All shows Granted status (Application type) — not Pending.

### Azure returns an authorization error referencing Microsoft.Authorization/roleAssignments/write
- 
Likely cause: The account running the Vanta Azure connection script doesn't have the Azure RBAC permissions needed to create role assignments (normally held via Owner or User Access Administrator). This is a script-time failure, distinct from the Entra ID directory role required earlier in setup.
- 
Fix: An authorized Azure administrator can temporarily elevate access:
- 
In the Azure portal <https://portal.azure.com/>, go to Microsoft Entra ID → Properties.
- 
Set Access management for Azure resources to Yes, then select Save.
- 
Sign out and back in, then rerun the Vanta Azure connection script.
- 
Once setup is complete, return to this setting and switch it back to No.
- 
This is a Microsoft Azure configuration step, not a Vanta setting, and may only be required in certain customer environments. If your organization doesn't permit this kind of access elevation, contact your Azure administrator or Microsoft Support to get the required RBAC permissions assigned directly. For more on this process, see Microsoft's guide to elevating access to manage Azure subscriptions and management groups <https://learn.microsoft.com/en-us/azure/role-based-access-control/elevate-access-global-admin>.
 

### Integration shows as broken or disconnected
- 
Likely cause if using a secret-based connection: The client secret has expired (expires after 1 year).
- 
Fix: In the Azure Portal, navigate to your Vanta app registration > Certificates & secrets. Create a new client secret and copy the value. In Vanta, go to Integrations, select Azure, and update the secret.
- 
Note: Vanta switched over to using federated credentials in September 2026. This kind of credential doesn’t expire. If your connection is based on a federated credential, the cause for a broken connection lies elsewhere.

### Azure users or groups not appearing in Vanta
- 
Likely cause: Directory.Read.All was not granted with admin consent, or granted as Delegated rather than Application type.
- 
Fix: Confirm the permission is Application type with admin consent showing Granted. Allow up to a few hours for the initial sync to complete.

### MFA not showing as enforced
- 
Likely cause: MFA enforcement via Conditional Access requires a Microsoft Entra ID P1 license. P1 is included with M365 Business Premium, E3, and E5 — but not M365 Business Standard, which uses the Entra ID Free tier. Per-user legacy MFA and Security Defaults are not detectable by Vanta as Conditional Access policies.
- 
Fix: Confirm your tenant has an Entra P1 or P2 license. Confirm MFA is enforced via Conditional Access policies.

### SCIM enabled but no users provisioned
- 
Likely cause: Provisioning was toggled on in Vanta only — configuration in the Entra portal is incomplete.
- 
Fix: Confirm (1) users are assigned to the Vanta enterprise app in Entra, (2) provisioning mappings are configured, and (3) provisioning is set to On in the Entra portal. See How the Azure connection and SCIM work together.

### A resource type isn't appearing in Vanta
- 
See How to Troubleshoot Azure Resources Not Appearing in Inventory <https://help.vanta.com/en/articles/16023664-how-to-troubleshoot-azure-resources-not-appearing-in-inventory> for a full walkthrough covering subscription scope, manual scoping, tags, Inventory page support, and sync timing. 

### The subnet flow logs test fails even though I've enabled flow logs 
- 
Cause: This is the most common cause of this test failing. Vanta's subnet-level flow log test requires a flow log whose target resource is the specific subnet, not the parent VNet. If you enabled flow logging at the VNet level, it will not satisfy the subnet-level test, even though flow logging is genuinely active for traffic in that VNet. 
- 
Fix: Confirm you have an Azure Virtual Network flow log configured with its target resource set to the specific subnet, not the VNet it belongs to. This test is not checking for the older, deprecated NSG flow logs feature either, it specifically looks for a subnet-targeted VNet flow log. If you're unsure what your current flow log is targeting, check the flow log's configuration in Azure and confirm the target resource type and target resource shown there.

### A VM or scale set fails the NSG/firewall configuration test, even though Azure shows an NSG attached at the subnet level 
- 
Cause: This test can only use a subnet's NSG to pass a VM or scale set if that subnet's VNet is in scope and has been fetched by Vanta. If the VNet or subnet has been scoped out of your Azure integration, Vanta cannot see the subnet-level NSG relationship, even though it exists in Azure. 
- 
Fix: Confirm the VNet containing the affected VM or scale set's subnet is in scope in Vanta. If you've recently changed scoping, allow a full sync cycle to complete before rechecking the test.

### No vulnerability data received
See No vulnerability data received (Azure) <https://help.vanta.com/en/articles/11345850-no-vulnerability-data-received-azure>.

## Images

- [image 01] ../../images/ux/integrations/azure-integration-guide--01.png
- [image 02] ../../images/ux/integrations/azure-integration-guide--02.png
- [image 03] ../../images/ux/integrations/azure-integration-guide--03.png
- [image 04] ../../images/ux/integrations/azure-integration-guide--04.png
- [image 05] ../../images/integrations/azure/azure-integration-guide--05.png
- [image 06] ../../images/integrations/azure/azure-integration-guide--06.png
- [image 07] ../../images/integrations/azure/azure-integration-guide--07.png
- [image 08] ../../images/integrations/azure/azure-integration-guide--08.png
- [image 09] ../../images/integrations/azure/azure-integration-guide--09.png
- [image 10] ../../images/integrations/azure/azure-integration-guide--10.png
- [image 11] ../../images/integrations/azure/azure-integration-guide--11.png
- [image 12] ../../images/integrations/azure/azure-integration-guide--12.png
- [image 13] ../../images/integrations/azure/azure-integration-guide--13.png
- [image 14] ../../images/ux/integrations/azure-integration-guide--14.png
- [image 15] ../../images/integrations/azure/azure-integration-guide--15.png
- [image 16] ../../images/integrations/azure/azure-integration-guide--16.png
- [image 17] ../../images/integrations/azure/azure-integration-guide--17.png
- [image 18] ../../images/integrations/azure/azure-integration-guide--18.png
- [image 19] ../../images/ux/integrations/azure-integration-guide--19.png
- [image 20] ../../images/ux/integrations/azure-integration-guide--20.png
