# Azure: Quickstart

Source: https://help.vanta.com/en/articles/15605280-azure-quickstart
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Connect Azure to Vanta so the cloud resources, identities, security configurations, and vulnerability findings your team manages in Azure automatically power compliance tests, access reviews, and evidence collection.
⚠️ Note: This guide covers the standard Azure connection using Cloud Shell (the recommended method). For the manual Azure Portal path, SCIM provisioning, or advanced configuration, see Azure: Integration Guide <https://help.vanta.com/en/articles/15693150-azure-integration-guide>.
⚠️ Terminology note: Microsoft Entra ID and Azure Active Directory (Azure AD) are the same product <https://learn.microsoft.com/en-us/entra/fundamentals/new-name>. Microsoft rebranded Azure AD to Entra ID in 2023. Vanta documentation uses Entra ID.

## What you'll do (~10 minutes)
- 
Confirm prerequisites and choose your connection type (~2 min)
- 
Run the Cloud Shell script to register the Vanta app in Azure (~5 min)
- 
Complete setup in Vanta and verify the connection (~3 min)
 
 

## Before you begin
Confirm all of the following before starting:
- 
You have Admin access in Vanta.
- 
You have the Global Administrator or Privileged Role Administrator role in Microsoft Entra ID. Owner or Contributor roles on a subscription are not sufficient. The script requires the ability to grant admin consent to the app registration, which is a directory-level permission, not a subscription-level one.
- 
You know which connection type you need (see below).
 

### Choose your connection type before starting 
 | 
Type | 
Use when
 | 
Subscription | 
You have one subscription, or a small number of subscriptions to connect individually.
 | 
Tenant | 
You have many subscriptions under a single tenant and want to connect them all at once.
💡 Tip: If you're unsure, start with Subscription. You can reconnect later.
⚠️ Note on License requirements: A basic Azure connection does not require an Entra license. However, a Microsoft Entra ID P1 license (included with M365 Business Premium, E3, E5, or available as a standalone add-on) is required to use group-based scoping and Conditional Access MFA detection with Vanta. M365 Business Standard does not include Entra P1 and will not support these features. Entra P2 is not required unless your organization uses risk-based Conditional Access policies.
 
 

## Setup guide
Follow these steps to connect the integration.
 
⚠️ Note: Connecting Azure Government? Use the Azure for US Government integration instead. See Government cloud environments in the Azure: Integration Guide <https://help.vanta.com/en/articles/15693150-azure-integration-guide#h_0417755737>.
 

### Step 1: Start the connection flow in Vanta
- 
To connect, go to the Integrations page and search for Azure. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500857422/0bc90af05ac5a16654f532bb6806/45413c03-2af6-44f7-b747-e4573ae72697?expires=1794967200&signature=c41fc86cc1d64e77a8f19ded7322966557b7b6ac260ff8f61b2bb40288c2b934&req=diUnFsF7moVdW%2FMW1HO4zf%2BNyduiPfcncWtXrWIML9Vw1C4gek3SO43p5Xfd%0AhC9rbuLkaaAi6F6sOQg%3D%0A>
 

### Step 2: Choose your connection type
- 
Select either:
- 
Subscription: Use this option if you have one or a few subscriptions as each will need to be linked individually.
- 
Tenant: Use this option if you have many subscriptions under one tenant.
- 
When prompted to choose a setup method, select Cloud Shell. This is the default recommended option.
- 
Click Next. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500871911/8da6699266262f8e9fed5e142615/3202785d-de22-403a-9072-13c97c586e54?expires=1794967200&signature=78e60ec43b15b878cfb4525c52f6359374674c46ed11609070d56ef974e4c374&req=diUnFsF5nIheWPMW1HO4zU5UBAxwF1it2KQVeLuGxF4IdHKAAG9fDv6GIdc8%0AVzc8ewHw71kIuve0Yz8%3D%0A>
 

### Step 3: Select products
- 
You’ll see toggles for products that extend what Vanta monitors in your Azure environment:
- 
Azure Kubernetes Monitoring: Provides automated scanning and configuration checks for your Azure Kubernetes Service (AKS) clusters to detect vulnerabilities and strengthen container security.
- 
Microsoft Defender for Cloud: Enables continuous assessment of your Azure resources against Microsoft’s built-in security recommendations and compliance benchmarks.
- 
Microsoft Azure: Monitors your Azure infrastructure for continuous evidence collection and compliance tracking. Enable this for all Azure connections.
- 
Azure Key Vault: Monitors your key vaults for access controls and configuration. Enable this option if you use the Azure Key Vault service to manage keys and secrets. (Note: enabling this requires one more manual step after setup — see Key Vault requires an additional role assignment <https://help.vanta.com/en/articles/14485519-connecting-vanta-azure-using-cloud-shell#h_01ef80a23c> below).
- 
Enable any products relevant to your environment, then click Next.  
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500874453/1e3685baadc07fbcad634f880413/b64043f3-26ac-4493-b10e-5d4eb8116643?expires=1794967200&signature=3553fca7eb9eb559e638fb94a6261f0992b76e45f927e0661234d50d54521a82&req=diUnFsF5mYVaWvMW1HO4zS4QyxhYjSuPYQeB5kHR10vh52T%2B9K1%2Fdl99Qmcm%0A73aF6DnZJp8GT%2BaMjOQ%3D%0A>
 

### Step 4: Enter your Azure identifiers
- 
If connecting a subscription:
- 
Enter your Subscription ID.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500875088/591acfda738a453d163a66fbb33e/18fdec22-dbbf-48e2-a6e4-c34fb5eee003?expires=1794967200&signature=d1577184c03b09a2c23e0c4416e2c1df3d998aac79a6d06d8d0ad9ac2f264e17&req=diUnFsF5mIFXUfMW1HO4zZZ8z0gICbz5Dh6ShBGGZPSPc0Og69xZrGpimefc%0AyGy%2B%2BuTFBP6veb26yXc%3D%0A>
- 
If connecting a tenant:
- 
Enter your Tenant ID (Directory ID).
- 
Enter a Tenant Name (this is the display name used in Vanta).
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500876046/1a5d1ed9f46a8b0242fd14626682/070f2dc4-5024-40be-ba33-f0292ed45d39?expires=1794967200&signature=389fd2644aa787b7039335a9b6183c8fc0bcbe2b788467e0648ea20bb2193fdc&req=diUnFsF5m4FbX%2FMW1HO4zaP0iY2VnPvbsE89ZYN%2B3I9rlxJayN%2FGGsyw%2BR5w%0AtR4JXG1VMTeJKvvXwUU%3D%0A>
- 
Click Next. 

### Step 5: Download the Vanta setup script
Vanta provides a setup script and generates a customized command with the right flags based on your selections.
- 
Click Copy or open the collapsible section titled View script contents and download the script.
- 
Keep this Vanta browser tab open because you’ll return to it shortly to enter credentials.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500877961/7e22ab26aa8e90faf37e1aa52a64/a793a9ab-228f-49e3-96b3-46fbdbbc8d5f?expires=1794967200&signature=b52b08f10d5df4503cf08c992fca0abf2c876bf9576f90127be7a71b83d487e7&req=diUnFsF5mohZWPMW1HO4zWeZodLruUusrl1u%2BcOBSrB7RT%2BfZDKXsVOdjcdz%0AqAwtcKz4pwix5o6jyUk%3D%0A>
 

### Step 6: Open Azure Cloud Shell in Bash mode
- 
In a new browser tab, open the Azure Portal.
- 
Click the Cloud Shell icon in the top navigation bar.
- 
If prompted to set up Cloud Shell storage, follow the Azure prompts to complete that setup.
- 
Once Cloud Shell is open, confirm it’s set to Bash mode. If it shows PowerShell, click the dropdown at the top-left of the Cloud Shell pane and switch to Bash. 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500879135/8e559db09a1039398069487b8523/54c717a8-5e04-4a83-9e0e-14aafb418d6e?expires=1794967200&signature=0d8289f00171dea90c6acd41b0405dea76eaa9b05624f51a0fa0fc282527ae34&req=diUnFsF5lIBcXPMW1HO4zZTRQ9nHowue4p5l5rMQUhbcxb8fjpTJ7EdBnGFU%0ABN%2FvjZrKu8Z3SzvlWRE%3D%0A>
 

### Step 7: Upload and run the script
- 
Drag and drop the downloaded vanta-azure-connection-script.sh file directly into the Cloud Shell window. Azure uploads it automatically.
- 
Return to Vanta and copy the command shown on screen. It will look like one of the following:
- 
Subscription connection: bash -s -- --type subscription --id YOUR_SUBSCRIPTION_ID
- 
Tenant connection: bash -s -- --type tenant --id YOUR_TENANT_ID
- 
Federated credential parameters --auth federated, –subject, –external-id, and –issuer
- 
If you selected Azure US Government, the command includes --cloud gov.
- 
If you enabled Azure Key Vault, the command includes --key-vault.
What to expect while the script runs:
- 
The script creates the vanta-scanner app registration in your Microsoft Entra ID.
- 
It pauses briefly after creating the app — this is expected and allows Azure to propagate the new registration across its servers.
- 
It assigns the required Microsoft Graph permissions and the Azure Reader RBAC role scoped to your subscription or management group.
- 
Total runtime is typically 2–4 minutes.
 
 
ℹ️ Note: If the script encounters an error, it automatically removes any partially created app registration. You can safely re-run the script after resolving the issue.
ℹ️ Note: The script will prompt you to log in to Azure in your browser. Complete the login and return to Cloud Shell.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500881486/ae86da8611d89559132f09d290de/2b0dfd51-0bbd-4837-a95e-f0c90607efe3?expires=1794967200&signature=1e4e4da54d3fc24a417614141db301266df001da8c909bbf7862df1fae553b6c&req=diUnFsF2nIVXX%2FMW1HO4zSQl8xZJqR0s1snXpB86R%2FOvLW8GmXY0nIdec2%2Be%0APa2QtYkWDMCst8HK%2Bn8%3D%0A>
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2500881739/f8b59f7bcad3aabaa0b639705aa6/eb6a54f8-83c3-4441-8236-9be620ed7299?expires=1794967200&signature=6d03ad7f4d7f8db2c1a4dae8314b617c77fa69ecb1dfe10dbbe1a0004e4d1cd8&req=diUnFsF2nIZcUPMW1HO4zbeKhP7autgf1LZ1acxJqctgkaHAUeZe4OVRlQIy%0ALbWlOjjSCLHg6MsxICk%3D%0A>
 

### Step 8: Copy the output credentials
When the script completes successfully, it displays two values in the Cloud Shell output:
- 
APP ID (Application / Client ID)
- 
TENANT ID (shown for subscription connections)
Copy both values immediately.
⚠️ Note: If you close Cloud Shell without copying it, you must re-run the script to generate a new one.

### 
Step 9: Enter credentials in Vanta
- 
Return to the Vanta browser tab.
- 
Paste the APP ID and TENANT ID into the corresponding fields.
- 
Click Connect.
Vanta validates the credentials by confirming access to your Azure directory and resource groups. If validation succeeds, you’ll see a confirmation screen. If validation fails, check the following:
- 
Confirm you copied both values without extra spaces or line breaks.
- 
Confirm the APP SECRET was copied before closing Cloud Shell. If not, re-run the script to generate a new one.
- 
Review the Troubleshooting section <https://help.vanta.com/en/articles/14485519-connecting-vanta-azure-using-cloud-shell#h_4546887368> below for additional help.
- 
If the error persists, contact Vanta Support.
💡 Tip: The client secret expires in 1 year. Set a calendar reminder to renew it before it expires. See Credential expiry (annual renewal required) below.
Initial data collection begins automatically and may take up to a few hours to fully populate in Vanta.
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2644953652/137836c50689ad76d1ebcc8e2112/c64245ce-e13a-4663-b139-322a521189b0?expires=1794967200&signature=e08da204acea95d0f9cdaf82c73470dbd49679542d1e27c9da9f6c326dcf385a&req=diYjEsB7nodaW%2FMW1HO4zU5duBf2VD19JOPv26Ez0GMneVEeAIMaANGR3fl6%0A4vPFuWiMUFVUXflOVAc%3D%0A>
 
 

### Key Vault requires an additional role assignment
If you enabled the Azure Key Vault product during setup, one more step is required. The standard setup script does not assign the Key Vault Reader RBAC role.
The starting point depends on your connection type:
- 
Subscription connection: In the Azure Portal, go to the Subscription page for the subscription you are connecting.
- 
Tenant connection: In the Azure Portal, go to the Tenant Root Group.
To assign the Key Vault Reader role:
- 
Go to Access Control (IAM).
- 
Click Add role assignment.
- 
On the Role tab, search for Key Vault Reader. This role is listed under the Security category. If you are browsing by page rather than searching, look in that category to locate it. Select the role and click Next.
- 
On the Members tab, under Assign access to, select User, group, or service principal.
- 
Click + Select members and search for vanta-scanner. Select the application and click Select.
Click Review + assign to complete the assignment.
 
 
 

## Optional products
Enable additional monitoring during setup or at any time from Integrations > Azure > Configure.
 

### Azure Kubernetes Service (AKS) monitoring <https://help.vanta.com/en/articles/11345694-azure-kubernetes-guide>
Enables node-level security tests for AKS clusters. Required for AKS-related controls in SOC 2, CIS v8, and other frameworks.
ℹ️ Note: Private clusters are not supported for node-level scanning. Vanta will still list private clusters in your inventory, but node security tests will not apply to them.
 

### Microsoft Defender for Cloud
Required for container and server vulnerability data to appear in Vanta. Without this enabled and configured in Azure, the Vanta Vulnerabilities page will show "No vulnerability data received."
 
To use Defender for Cloud with Vanta:
- 
Toggle Defender for Cloud on in Vanta integration settings.
- 
Enable the appropriate Defender plan in Azure (Defender for Containers or Defender for Servers).
- 
Set monitoring coverage to Full in Azure.
- 
Allow time for a scan to complete before expecting data in Vanta.
If you see "No vulnerability data received" after setup, see No vulnerability data received (Azure) <https://help.vanta.com/en/articles/11345850-no-vulnerability-data-received-azure>.
 

### Azure Key Vault
Enables monitoring of Key Vault secrets and access policies.
⚠️ Note: After the setup script runs, you must manually assign the Key Vault Reader role to the Vanta app registration on each Key Vault you want monitored. This step is not automated by the script.
 
 

## Verify your connection
After connecting, Vanta will run an initial sync. Allow a few hours for data to fully populate.
- 
Azure should appear as Connected on your Integrations page.
- 
Cloud resources will appear under Inventory.
- 
Users and groups that the Azure integration reads from Entra ID will appear in the People section.
- 
Compliance tests powered by Azure data will populate under Tests.
- 
If Defender for Cloud is enabled, vulnerability data will appear under Vulnerabilities after the first scan completes.
 
 

## Troubleshooting

### The script fails immediately
- 
Likely cause: Cloud Shell is in PowerShell mode, or the account running the script doesn't have the required role.
- 
Fix: Confirm Cloud Shell is in Bash mode. Confirm the signed-in account has Global Administrator or Privileged Role Administrator role in Entra ID.
 

### "Insufficient permissions" error during setup
- 
Likely cause: The account used for setup cannot grant admin consent. This requires Global Administrator or Privileged Role Administrator. Subscription-level roles (Owner, Contributor) are not sufficient.
- 
Fix: Re-run setup using an account with the correct Entra ID role. Note that admin consent and app assignment are different things. Granting app assignment alone will not resolve this error.
 

### Integration shows as broken or disconnected
- 
Likely cause if using a secret-based connection: The client secret has expired (expires after 1 year).
- 
Fix: In the Azure Portal, navigate to your Vanta app registration > Certificates & secrets. Create a new client secret and copy the value. In Vanta, go to Integrations, select Azure, and update the secret.
- 
Note: Vanta switched over to using federated credentials in September 2026. This kind of credential doesn’t expire. If your connection is based on a federated credential, the cause for a broken connection lies elsewhere.
 

### Azure users or groups not appearing in Vanta
- 
Likely cause: Directory.Read.All was not granted with admin consent, or the initial sync hasn't completed yet.
- 
Fix: Confirm the permission is granted as Application type (not Delegated) with admin consent status showing Granted. Allow up to a few hours for the initial sync.
 

### MFA not showing as enforced
- 
Likely cause: MFA enforcement via Conditional Access requires a Microsoft Entra ID P1 license. P1 is included with M365 Business Premium, E3, and E5 — but not M365 Business Standard, which uses the Entra ID Free tier. Per-user legacy MFA and Security Defaults are not detectable by Vanta as Conditional Access policies.
- 
Fix: Confirm your tenant has an Entra P1 or P2 license and that MFA is enforced via Conditional Access policies, not per-user settings.

## 
 

## Additional resources
- 
Azure: Integration Guide <https://help.vanta.com/en/articles/15693150-azure-integration-guide> — manual connection, SCIM setup, user scoping, government cloud variants, advanced troubleshooting
- 
No Vulnerability Data Received (Azure) <https://help.vanta.com/en/articles/11345850-no-vulnerability-data-received-azure>
- 
Azure SCIM attribute instructions <https://help.vanta.com/en/articles/11345646-azure-scim-attribute-instructions>
- 
Azure Kubernetes Guide <https://help.vanta.com/en/articles/11345694-azure-kubernetes-guide>
- 
Azure Alerts <https://help.vanta.com/en/articles/11345693-azure-alerts>
- 
Resolve 'Load balancer used (Azure)' test <https://help.vanta.com/en/articles/11346022-resolve-load-balancer-used-azure-test> 
- 
How to Troubleshoot Azure Resources Not Appearing in Inventory  <https://help.vanta.com/en/articles/16023664-how-to-troubleshoot-azure-resources-not-appearing-in-inventory>

## Images

- [image 01] ../../images/ux/integrations/azure-quickstart--01.png
- [image 02] ../../images/ux/integrations/azure-quickstart--02.png
- [image 03] ../../images/ux/integrations/azure-quickstart--03.png
- [image 04] ../../images/ux/integrations/azure-quickstart--04.png
- [image 05] ../../images/ux/integrations/azure-quickstart--05.png
- [image 06] ../../images/ux/integrations/azure-quickstart--06.png
- [image 07] ../../images/integrations/azure/azure-quickstart--07.png
- [image 08] ../../images/integrations/azure/azure-quickstart--08.png
- [image 09] ../../images/integrations/azure/azure-quickstart--09.png
- [image 10] ../../images/ux/integrations/azure-quickstart--10.png
