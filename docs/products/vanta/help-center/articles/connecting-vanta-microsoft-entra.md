# Connecting Vanta & Microsoft Entra

Source: https://help.vanta.com/en/articles/11345655-connecting-vanta-microsoft-entra
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. Vanta Government customers currently see an earlier version of the connection flow; see Connecting from Vanta Government below.
Microsoft Entra connects to Vanta using OAuth, allowing Vanta to import your users, groups, directory roles, and the third-party applications consented in your tenant for access monitoring and vendor discovery.
 

## Prerequisites
- 
Works with all Microsoft Entra ID plans. Syncing sign-in activity and MFA registration data requires Microsoft Entra ID P1 or P2. 
- 
An account with the Global Administrator role in Microsoft Entra. Vanta reads your whole tenant, so only a Global Administrator can approve the connection.
- 
During connection, Vanta requests the following read-only Microsoft Graph permissions: 
- 
User.Read.All (required): user profiles
- 
Directory.Read.All (required): groups, group membership, directory roles, service principals, and app role assignments
- 
AuditLog.Read.All (optional): sign-in activity and MFA registration reports. If this permission isn't granted, the connection still succeeds and Vanta omits that data.
- 
Only users with a primary domain email address populated in Entra will be imported to the Vanta People page.
- 
If your organization uses Conditional Access for workload identities in Microsoft Entra (a premium feature that applies policies to service principals), ensure the Vanta enterprise app is excluded from any blocking policies before connecting. See Conditional Access policies below for details.
​
 

## Explore the integrations page
When you navigate to the Microsoft Entra integration, you'll land on its listing page, which includes five tabs that cover what you need to know before (and after) you connect.
- 
Overview — Start here. A summary of what the integration does, its top capabilities, and the prerequisites you'll need in place before connecting. When you're ready, select Connect to begin setup.
- 
API permissions — Exactly what access Vanta requests from Microsoft Entra: each permission's scope, whether it's read or write, and what data it covers, etc. Share this tab with your security team if they need to review access before you connect.
- 
Resource types — Every resource type Vanta imports from Entra, down to the specific fields collected for each. Use this to understand exactly what data will show up in Vanta once connected.
- 
Automated tests — How many tests connecting Entra unlocks and which frameworks and controls they map to (SOC 2, ISO 27001, etc.), plus the full list of tests by name. Useful for scoping compliance coverage ahead of an audit.
- 
Security — How Vanta protects the data it collects — encryption, data retention, access controls, and infrastructure. Visit Vanta's Trust Center <https://trust.vanta.com/> for the full picture.
When you're ready to connect, continue reading below to the setup guide. 
 
 
 
 

## Setup guide
- 
In Vanta, go to the Integrations page and click Add integration. Search for Microsoft Entra. For help navigating the Integrations page, see this guide <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click the integration tile and then click Connect. 
- 
In the setup wizard, click Connect again. You will be redirected to the Microsoft login page. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705961707/42a96ed5a2008f221d33701708f7/image.png?expires=1794967200&signature=52e0b062147dc073ccce4e5c5dc1e80601db465e17e0b7c642b9dcb219b75ad8&req=dicnE8B4nIZfXvMW1HO4zfmkQWWRNFcGgbEJU9P2glFZVOY7R26Jvmc81cBe%0A11PkhCtXndUwPPDLl5Y%3D%0A>
- 
Sign in with your Global Administrator account. Microsoft shows the read-only access Vanta requests. Review it and click Accept.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705963469/0cd06dcfafcac05a5b6485ad29b7/image.png?expires=1794967200&signature=ec73853797a417638882221330cac96ffd03685945ba12c4e4134f7dc2b2582e&req=dicnE8B4noVZUPMW1HO4zaVqE%2BFb4GIpqbyTsgywzW4uGksejYZVu0YAs5mA%0AFRTOKdAuPBa4gcQYJ6I%3D%0A>
- 
You'll be redirected back to Vanta. Vanta validates that it can read users, groups, directory roles, and service principals in your tenant. If any of these can't be read (for example, due to insufficient permissions or a Conditional Access policy blocking the request), the connection attempt fails. Resolve the permission or policy issue (see Conditional Access policies), then try connecting again.
- 
On the Set sync filters step, choose what Vanta syncs from Entra: 
- 
Leave Only sync selected users from Entra unchecked to sync your whole directory. You then choose which users appear on the People page and in audit scope from within Vanta.
- 
Check Only sync selected users from Entra to decide in Entra which users Vanta syncs. Vanta imports only the users assigned to the Vanta O365 app in your directory. You can narrow this further with a scoping group after connecting. See Controlling Scope Through Microsoft Entra <https://help.vanta.com/en/articles/11345767> for the assignment steps.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705965480/619ccd65384e5f55f84adbc4751c/image.png?expires=1794967200&signature=b680eab06779c96ac52e117f427fa094ed70d1cd5504e47012110fac624d4074&req=dicnE8B4mIVXWfMW1HO4zaGx74PRgJKZs4QApvSJntVbawkuAAtIeYnt81oI%0AX%2BfJgZgn6AhM%2ByeuOEk%3D%0A>
⚠️ Before you enable this filter: assign users to the Vanta O365 app in Entra first. If you enable the filter before anyone is assigned to the app, your first sync will import no users. If you haven't set up app assignments yet, leave the box unchecked; you can turn the filter on any time after connecting.
- 
Click Save. Setup completes, Vanta shows the connection confirmation, and your first sync begins using the filter choice you made.
- 
If you have connected multiple identity providers, you will be prompted to indicate which identity provider takes precedence for users in the connected IdPs. See Integrating Multiple Identity Providers <https://help.vanta.com/en/articles/11345659> for more information.
💡Tip: You can change your sync filter choice any time after connecting:
- 
Go to Settings (gear icon), then scroll to the Features section. 
- 
Click on Personnel. 
- 
Select the Setup tab. 
- 
Review the integrations connected in the Personnel source section. 
- 
Use the three dots button to manage the integration, or Configure scope to change how users are scoped.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2455935234/9e3c2c6ec8bf19a7feb9ce8ab334/image.png?expires=1794967200&signature=37d6a9d96f21e73b987052276bc44bba5409fa5ed94563cdf943d900d4735a5b&req=diQiE8B9mINcXfMW1HO4zXd%2Bhe6WfkeAqyvRiBHHMna4yOlKETy4nQkgiMf7%0ArK9MWhBN9q%2FpGNCShoU%3D%0A>
- 
Here you can click Add another source to add another integration via the dropdown menu or edit and manage the integration via the three dots button. 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2455935772/63a4ca3d4457f54edeece35feda2/image.png?expires=1794967200&signature=b60f501dd574c5ebaba3ac1ce932bf6d118f4ef42d93dcba43f2790a3ad565b2&req=diQiE8B9mIZYW%2FMW1HO4zT0N2T2gtqIW0jB7D53Q25KBV0LwG%2BjihOhyMPL%2B%0AAjvqDjGb2sUW%2FchTJwE%3D%0A>
 
 
 

## Configure the Scope
- 
Establish which Microsoft Entra items should be marked in or out of scope for your audit. To learn more about controlling scope, see Controlling Scope Through Microsoft Entra <https://help.vanta.com/en/articles/11345767>.
- 
You can configure scope later by selecting the three-dot menu and then selecting Configure scope on the connected Microsoft Entra card from the Integrations page.
 
 

## What to do if some users are not showing up in the Scope configuration
It may be that once connected, you are not seeing some or all of the users you expect in the Scope configuration. This is likely because the email field for the user is not populated in Entra. Please refer to this article <https://help.vanta.com/en/articles/11345980> on how to remedy that.

## 
 

## Conditional Access policies
Vanta's Office 365 integration authenticates using app-only (client credentials) authentication. No user sign-in is involved during background syncs. This means standard Conditional Access policies that target user sign-ins (such as requiring compliant devices or trusted network locations) do not typically affect the Vanta integration.
 
However, if your organization uses Conditional Access for workload identities (a Microsoft Entra ID Premium feature that applies policies to service principals and applications), those policies can block Vanta's background API calls. When this happens, the integration credentials are automatically disabled in Vanta and the connection will stop syncing.
 
If your integration credentials are being unexpectedly disabled:
- 
In the Microsoft Entra admin center <https://entra.microsoft.com/>, go to Protection > Conditional Access > Policies.
- 
Review any policies scoped to workload identities (service principals or applications).
- 
If a policy is blocking the Vanta enterprise app, add it as an exclusion under the policy's Target resources or Workload identities settings.
- 
Save the policy and reconnect the integration in Vanta.
If you're unsure whether a Conditional Access policy is causing the issue, work with your Microsoft administrator to review active policies targeting workload identities in your tenant.
 
 

## Connecting from Vanta Government
Vanta Government customers currently connect using the earlier flow:
- 
On the Integrations page, click Connect on the integration card.
- 
A modal asks whether to create personnel records from Office accounts. Toggle this on or off and click Continue.
- 
Click Connect Office 365, sign in with your Global Administrator account, and click Accept.
- 
After connecting, you can choose whether the integration populates the People page as users are added.
 

###

## Images

- [image 01] ../../images/integrations/microsoft-entra/connecting-vanta-microsoft-entra--01.png
- [image 02] ../../images/integrations/microsoft-entra/connecting-vanta-microsoft-entra--02.png
- [image 03] ../../images/integrations/microsoft-entra/connecting-vanta-microsoft-entra--03.png
- [image 04] ../../images/ux/settings/connecting-vanta-microsoft-entra--04.png
- [image 05] ../../images/ux/settings/connecting-vanta-microsoft-entra--05.png
