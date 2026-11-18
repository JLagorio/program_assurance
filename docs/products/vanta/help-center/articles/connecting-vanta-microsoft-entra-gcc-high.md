# Connecting Vanta & Microsoft Entra (GCC High)

Source: https://help.vanta.com/en/articles/13355368-connecting-vanta-microsoft-entra-gcc-high
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 
Automatically provision and deprovision users in Vanta using Microsoft Entra ID (Azure AD) in the GCC High environment. This integration enables continuous synchronization of users, groups, and vendor applications between Entra ID (GCC High) and Vanta.
 
 

## How it works
The Microsoft Entra ID (GCC High) integration uses the Microsoft Graph API to synchronize users, groups, and vendor applications from your Entra ID (GCC High) tenant into Vanta.
 
The integration leverages OAuth 2.0 authentication with admin consent to securely access your Entra ID (GCC High) directory. Once connected:
- 
New users are automatically provisioned in Vanta
- 
Departing users are automatically deprovisioned
- 
Groups and group memberships remain continuously synchronized
- 
Vendor applications assigned through app roles are synced into Vanta
This connection enables rapid deployment of Vanta across your organization while ensuring your directory data remains aligned with your Entra ID (GCC High) environment.
 
Data syncs automatically on a recurring schedule to keep user, group, and vendor application information up to date.
 
 

## Use cases
- 
Provision Vanta access to all employees: Grant access to Vanta in just a few clicks and maintain continuous synchronization with your Entra ID (GCC High) directory.
- 
Synchronize key employee attributes: Seamlessly sync employee details such as name, email, title, manager, MFA status, and login activity from Entra ID (GCC High) into Vanta.
- 
Track third-party vendor applications: Automatically identify applications users access through app role assignments in Entra ID (GCC High), ensuring comprehensive visibility into your organization’s third-party tools.
- 
Sync groups and group memberships: Maintain an up-to-date view of your organization’s access structure and group-based permissions.
- 
Route procurement approvals to managers: Streamline approval workflows by automatically assigning procurement approval steps to an employee’s manager.
 

## Requirements
To install and configure the Microsoft Entra ID (GCC High) integration, you must: 
- 
Be a Vanta Administrator
- 
Be a Microsoft Entra ID (GCC High) administrator with permission to grant admin consent in your tenant
 

## Connect the integration
- 
To connect, go to the Integrations page and search for Amazon Web. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>. 
- 
Click Connect. 
- 
You will be redirected to the Microsoft authorization flow. Sign in with your Entra ID GCC High admin account.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2062506304/2657f277d560545b141d9ded3cd9/05187c08-2b07-4614-9d0c-c9c7c2b41816?expires=1794967200&signature=e6b672609745866e0a2136141cf694db2bf7ecf31e034a2029a5f74164be5350&req=diAhFMx%2Bm4JfXfMW1HO4zdJA135fcrB7tKO%2BC8EBm3aByUM0KSI0ymYLSNqL%0AOc31oV4w5jXiDrKOCA0%3D%0A>
 
- 
Review and accept the permissions requested by Vanta.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2062506307/e145bc75c1d291b6e92931fefcda/de6c3f0e-f562-4e6f-a5b9-9bf0b23b8101?expires=1794967200&signature=9a071f088dc2e99cf8f616350644525bc85f93a97994b1c8a076c77d66869965&req=diAhFMx%2Bm4JfXvMW1HO4zQzE5UhiAIQAp%2FFWm%2FUQk0%2B4Vf9ZhI0f9EEww55C%0AJhm3phPLlMVYN6ZePSg%3D%0A>
 
- 
You will be redirected back to Vanta. The integration is now connected.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2062506323/cc0b4e63f31cc0981a551d58c0e3/77182b19-2472-4c1b-bbf7-0faf0117dfd7?expires=1794967200&signature=7f9845f422133922726cdae14716b228288efde1ccc0dfe9b074c5241dfccfe8&req=diAhFMx%2Bm4JdWvMW1HO4zZwQCQnnHwxJHdOkQENz6StyR4LZDIoKOyCpTFPt%0Al0CQrW86wwEmaH0oHcA%3D%0A>
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2062506317/eeec8dde592195258470d9ec4da1/4b8f4d75-47b3-4a89-8501-57033451009f?expires=1794967200&signature=0380040b0f7c0bc380e1c4e8a937ed0d42d13044706558d780cefa494e18e990&req=diAhFMx%2Bm4JeXvMW1HO4zau%2F0CuAZZI6AndptOt2Y0z8mY%2BxuLA%2Bp6ccWYEU%0At%2FAGqrQdJ8s91N41pDo%3D%0A>
 
 

## Permissions
The Microsoft Entra ID (GCC High) integration provides read-only access to your directory. Vanta does not create, modify, or delete any data within your Entra ID (GCC High) tenant.
 
 

## Data access scope
Vanta can access the following data:
- 
Audit log data — Used to determine which users have multi-factor authentication (MFA) enabled
- 
Directory data — Used to sync users, groups, group memberships, admin roles, and vendor applications
- 
User and group profile photos — Displayed within Vanta
- 
User profile attributes — Including name, email, title, manager, and login activity
Vanta does not update or write any data back to Entra ID (GCC High).
 
 

## Related articles
- 
List users API documentation <https://learn.microsoft.com/en-us/graph/api/user-list?view=graph-rest-1.0&tabs=http>
- 
List groups API documentation <https://learn.microsoft.com/en-us/graph/api/group-list?view=graph-rest-1.0&tabs=http>
- 
DirectoryRole resource type documentation <https://learn.microsoft.com/en-us/graph/api/resources/directoryrole?view=graph-rest-1.0>

## Images

- [image 01] ../../images/integrations/microsoft-entra/connecting-vanta-microsoft-entra-gcc-high--01.png
- [image 02] ../../images/integrations/microsoft-entra/connecting-vanta-microsoft-entra-gcc-high--02.png
- [image 03] ../../images/integrations/microsoft-entra/connecting-vanta-microsoft-entra-gcc-high--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-microsoft-entra-gcc-high--04.png
