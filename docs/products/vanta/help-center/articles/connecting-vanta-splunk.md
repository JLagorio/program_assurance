# Connecting Vanta & Splunk

Source: https://help.vanta.com/en/articles/13440222-connecting-vanta-splunk
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta integrates with Splunk (Cloud) to monitor and manage access to your tools. By synchronizing user access data, Vanta helps ensure that only active employees retain access and that access is promptly removed when personnel leave—supporting automated compliance workflows, streamlined access reviews, and structured access requests.
 
Estimated setup time: Less than 10 minutes.
 
 

## How it works
Vanta connects to Splunk (Cloud) and synchronizes user, role, and group data on a recurring basis. This data powers three key workflows within Vanta:
- 
Automated compliance tests - Vanta automatically verifies that accounts are linked to active employees and are deprovisioned when personnel leave the organization.
- 
Access Reviews - Synced users are surfaced in Vanta’s Access Reviews. Approvers can validate whether access remains appropriate, confirm least-privilege alignment, and generate audit-ready evidence.
- 
Access Requests - Entitlements from Splunk (Cloud) are imported into Vanta. Requesters can submit access requests for specific roles or access levels, approvers can review requests with context, and system administrators can track provisioning activity.
 

## Use cases
Connecting Splunk (Cloud) to Vanta enables you to:
- 
Monitor and manage personnel access to Splunk (Cloud)
- 
Ensure that only active employees retain access to company systems
- 
Simplify access reviews and support compliance requirements
 

## Requirements
To connect this integration, you must have: 
- 
Access to the Splunk (Cloud) dashboard
- 
The URL for your Splunk (Cloud) dashboard
- 
A Splunk (Cloud) user account with roles that include the following capabilities:
- 
edit_user
- 
change_authentication
- 
list_all_objects
- 
An authentication token for a user with the required capabilities
- 
Vanta’s outbound IP address added to the Search Head API Allow List
​
Best practice: We recommend creating a dedicated service account for the Vanta integration. Authentication tokens inherit the permissions of the user who generates them, and tying tokens to an individual account may disrupt the integration if that user’s access changes or is removed.
 

## Connect the integration
When connecting Splunk (Cloud) to Vanta, you will be prompted to provide a Host Name and an Authentication Token.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087273517/314e9120309edbd882e2824a46d7/1138091d-0581-4fb4-8f36-1122bd4b61a1?expires=1794967200&signature=ccfcaac632038e0933c525a491f11b3367daf5575f30661c15cff41d5fde70c5&req=diAvEct5noReXvMW1HO4zb7EHhsik4%2B07W3%2FBFgvzv0ZqYjCYvOZ4EGRVOLF%0AV5oTEQTkcUgvUYE4C4g%3D%0A>
 
- 
Enter the Host Name: The Host Name can be found in the base URL of your Splunk (Cloud) instance. These typically follow the format:
​
​https://<Host <https://<Host> Name>.splunkcloud.com
Enter the <Host Name> portion of the URL in the integration modal.
​
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087291115/c479d2310e497737531401bd7d0f/08dcd591-122d-4936-a2a9-915f1b01a160?expires=1794967200&signature=60435577ce624a183b14907be9a7bcaec708b97de2fd18295d9f85234a9e7e51&req=diAvEct3nIBeXPMW1HO4zRCPzXGW8%2B0oeBMlWoqmBTdGACBAHfKR2kti1An9%0Aq3Av%0A>
 
- 
Generate an Authentication Token: Next, generate an Authentication Token that Vanta will use to make authorized requests to the Splunk API and retrieve data required for compliance tests. Authentication tokens can be created under:
​
​Settings → Token in your Splunk (Cloud) dashboard.
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087293239/e07940457e7fd186011d30a959e0/3f743937-3559-4f81-b5b2-e1c35e7248a1?expires=1794967200&signature=937aaf481a8b284ce6f62472ccbfff4037691624a92b40da357697af277f1566&req=diAvEct3noNcUPMW1HO4zT5%2Fl7oqdnOtxybcRt3A0ZgFFAkcgcrZqRC9h3NZ%0AwsZs%0A>

Selecting this tab should redirect you to a page listing existing tokens in your Splunk (Cloud) instance. If the Token Authentication feature is not enabled, you may be redirected to a page prompting you to enable it. If so, click Enable Token Authentication to proceed.
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087295148/f346239929527037cee9e03bf9d1/12b8fae4-4bc9-4e60-ba53-047586d9e564?expires=1794967200&signature=6c3c9e2aa1db7d229f354ddec3e97eb9f433aac86e5ce7ae23a9bd7834112e4b&req=diAvEct3mIBbUfMW1HO4zcEgiesEVFVNwjSsxMBgxnIwRvyIDRRaym3VBWXq%0Ai%2BID%0A>
 
- 
(Optional) Configure Token Expiration Settings: Once Token Authentication is enabled, the Tokens page will display all created tokens.Tokens can be created immediately, but they typically include an expiration date. When tokens expire, users must renew them in Vanta. If desired, you can configure tokens to never expire: 
​
Navigate to Token Settings on the Tokens page:
​
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087298776/229e2b11c4466f71c92d322a5f56/b4a66d89-4363-4df6-8a4a-49526b81f171?expires=1794967200&signature=c6e93ad44e97bd2a3080b0c4bae7e741db9f2b4cfba562454fa9983ce1377c26&req=diAvEct3lYZYX%2FMW1HO4zdiU3A%2FThbfLvmGUnlxtMyLsTT7rFdN1V7uytQx0%0A3qNM%0A>

Update the Default Expiration field to never and click save to confirm your changes. This configuration is optional.
​
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087301612/6e5e04e5a5efbf86c9d2e1df9a64/64e5b5f3-f47f-4afe-9da0-aa8a92909fed?expires=1794967200&signature=623fc989b195fc63a2604693520e1cb41f3a66a6acf3da30ab842dd0526f1b8f&req=diAvEcp%2BnIdeW%2FMW1HO4zX8ziwpmldCRC%2F2FuQYHCBXA28lwiDWoFx4ygU6Z%0ATcaj%0A>
 
- 
Create a New Token: Regardless of expiration settings, click New Token to open the token creation modal.
​
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087306554/12998fa31b1359ea8b66776724bc/2cc93887-fbf5-4df7-8a9f-24a93b61bfa6?expires=1794967200&signature=0347fd4ffad5b388806fd3171f2dd93de66b9dfb3edba57b9f8e96a395ba4039&req=diAvEcp%2Bm4RaXfMW1HO4zVqudMNdwjqN0p0VJHk7%2FhnRCF945VucmZfML8OV%0ADg4I%0A>

Tokens are assigned to a user and inherit that user’s capabilities. 
 
For the token to function properly, the associated user must have the following capabilities: 
​
​acs_list_ip_allow_list
change_authentication
edit_user
list_all_objects
​
The sc_admin role typically includes these capabilities. Alternatively, you may create a custom role containing these specific capabilities.
​
To create or edit a role: 
​
- 
Navigate to Settings → Roles
​
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087321303/e7f9273d8bbdba4c735335889878/412aaaea-09a8-487c-b2e8-a1fda4a02652?expires=1794967200&signature=749681ef9a4f1b8e889e21af4a182d88147c19b9affe0290882d474f742ee160&req=diAvEcp8nIJfWvMW1HO4zdAmr9g%2F1sWlxxJliG5KfCSnGeY8z5DM0aSQTPO4%0A3CoM%0A>
 
- 
View existing roles on the Roles page 
​
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087322105/f59fc1af628b9c2af294f3c45c07/d5d1c73b-09bc-4cb4-b7e6-94bd9c3e47ab?expires=1794967200&signature=aba160285ebb3d351d23c4a3b9849674582afec1ef6af257f2a7862e93111ce4&req=diAvEcp8n4BfXPMW1HO4zfTvOev3QxKP7ab5KdFqB9E%2BRseiCeWp%2B7nNd68P%0AqSjI%0A>
 
- 
Click New Role to create a new role, or select an existing role to edit
​
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087322545/4a8362a5342d0bc771e2cb9ab98b/73907f75-df81-4957-9fb2-21d74c0348d8?expires=1794967200&signature=8e6054eb425141286a78e507d668c6bac7b8d1806d92d75b7ddfa4a761cc7cf0&req=diAvEcp8n4RbXPMW1HO4zYonH8nggLYZhpTacj7VKeuKmNBdaj3kY8nEr%2B2m%0Aver0%0A>
 
- 
Assign the required capabilities under the Capabilities section
​
- 
Complete Token Creation: In the New Token modal: 
​
- 
Enter a valid username in the User field
- 
Enter any value in the Audience field
- 
Click Create 

This will generate the Authentication Token that Vanta uses to retrieve account data from your instance.
​
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087344381/5897a288c2ee93d206faa91a2f91/e7473794-a5ea-4e1f-ba03-d5f8f9e84397?expires=1794967200&signature=200f63fd01f54b821920895633b0cb27f9b8077e85b4169fab96dc615447c45c&req=diAvEcp6mYJXWPMW1HO4zXbhVsOeu%2B4RajSJt5kQk3pKJH3A6MdGSd8Xl1cA%0ARLrP%0A>

The generated token will be displayed only once in the Token field. Copy this value and enter it into the Authentication Token field in Vanta.
​
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087346335/47a69d64d55ad9fac7fa78a9df2e/30826f95-b674-4ee6-9817-0d80e1065b07?expires=1794967200&signature=90fb127b07c6b6374b8ae2944e0a686af15379b501adcf54da779bf53276d30f&req=diAvEcp6m4JcXPMW1HO4zR0k2NKMHN74Dz6bYFVzkFGsOR1cgNOr38xRxliY%0AEw9u%0A>

After clicking Close, the modal will close and the new token will appear as enabled in the Tokens table.
​
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087347067/2987d8a5b1991685780a307dd06d/67007457-69ea-48b4-9ac2-a5befbb6c02d?expires=1794967200&signature=43672f478c6a7027e4935236a55635fa2a7e37f9aa732e87cb6d7932dc469a36&req=diAvEcp6moFZXvMW1HO4zca%2FHdd3CflUNNEEQP0nYTG7ZymO0%2FcRfSZubvxD%0Ajnfr%0A>
 
- 
Add Vanta’s IP CIDR to the Search Head API Allow List: To allow Vanta to interact with your Splunk (Cloud) environment, you must add Vanta’s IP CIDR to the Search Head API IP Allow List. Splunk deploys features across configurable subnets. The Search API feature used by Vanta is not exposed to any subnet by default. 
​
To configure the allow list: 
​
- 
Navigate to Settings → Server Settings.
​
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087365153/7564d52a675a2348c16175a68724/1da194bc-a437-4b14-ba95-0a26b8f0deea?expires=1794967200&signature=0c363c89d8c5a926d4b3f37847aee82873a6c80c8c28a1d86cc23b6d51d0d0e3&req=diAvEcp4mIBaWvMW1HO4zcuKyeY5QHW6vK03YXIrOO8%2FMtm9byhTTCYZ0K2s%0AdBSl%0A>
 
- 
Select IP Allow List.
​
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087365764/7eb96647923fbfe851c8c5901fcb/901efebe-affb-46fa-a413-ab667f1eaf37?expires=1794967200&signature=b92167650ef7018cbf7823884ab9729f175b306b88f4a2c14d619b17f9c82404&req=diAvEcp4mIZZXfMW1HO4zcTrJjPk1XMFokVPyo9peXv4MceHq%2F7As3PbjypD%0AgCNv%0A>
 
- 
Click the Search Head API access tab.
​
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087366317/cb91be8565f47916805ec2db73af/bd79f887-81eb-4b1b-9ebd-64728ddae2c6?expires=1794967200&signature=5173eef1384efe106ba6ff61dcfa483e7d391b08bfcd9576a9ca77e61384f698&req=diAvEcp4m4JeXvMW1HO4zQ%2BQbZZSQ1B6rsYMHGLXIr0vwzwLpfapovJLIVQU%0A9NAN%0A>
 
- 
Click + Add IP subnet, enter Vanta’s IP CIDR, and select Save to confirm.
​
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087366789/8cc4cb0b8673477443f1707ab928/090f6a9d-c8ff-4ae3-8af6-3ab2797bbc28?expires=1794967200&signature=943d614e5d0cc90bcdd13644a786666738d803ed452cf7871a151f392290cad6&req=diAvEcp4m4ZXUPMW1HO4zW6kd1skJZwAuPbRQfH3iSqiJpk%2Fu%2FNxsJhXvy4e%0AEzK3%0A>
 
- 
The IP CIDR you have to add should be displayed in the linking modal.
​
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087367726/daaabe2a475772563816dc81334a/af4a77cd-e57d-431b-8cea-ba1c2a8eaf74?expires=1794967200&signature=0f65b311cefcdd568967e9f0c6c7d41900bba549b90a73ed99d7e29826dd4de2&req=diAvEcp4moZdX%2FMW1HO4zdLwnx9qiQNmSfY%2F2o7YJWuL5ySrZQs8cfAgiCEH%0AMb1Y%0A>
 
- 
Validate the Connection: Return to the integration connection modal in Vanta. Click Validate and store to link your Splunk (Cloud) account to Vanta. If configuration is correct, you will see a confirmation screen indicating that the connection was successful. 
​
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087357848/ca6e41b15d73dacf81080f3611e9/b612bdfb-0f30-4183-b710-deea0fd10490?expires=1794967200&signature=9a29f01aba03555ddca68849595424dd5f1d17cf698e1e57a816b646d2a09867&req=diAvEcp7molbUfMW1HO4zcrwx%2FQlWk7lrBc%2FEm0FO%2B3uyECwIb6%2FFWYc%2BpJh%0AGByI%0A>
 
 

## Access capabilities
 | 
Resource | 
Supported | 
Usage
 | 
Users | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>﻿
 | 
Groups | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Role/Entitlements | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Last Login | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 

## Permissions
The Splunk (Cloud) integration provides read-only access to your environment. Vanta does not create, modify, or delete any data in Splunk (Cloud).
 
 

## Data access scope 
Vanta can access the following data: 
- 
User Data: Used to confirm that only active employees retain system access and that terminated employees are deprovisioned promptly. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows Vanta to display available users when tracking or assigning access.
- 
User Group Data: Used to validate least-privilege access and confirm that group-based access controls align with compliance requirements. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this enables approvers to see which groups grant access and map access levels to entitlements.
- 
User Role and Entitlement Data: Used to ensure employees are assigned to appropriate roles, validate least-privilege access, and confirm that high-privilege roles (for example, admin or superuser) are granted only to authorized personnel. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows requesters to select from the correct set of roles and ensures approvers can review the specific level of access being requested.
Vanta does not have write permissions and cannot update any data in Splunk (Cloud).
 
 

## Related articles
- 
Access requirements and limitations for the Splunk Cloud Platform REST API <https://help.splunk.com/en/splunk-cloud-platform/leverage-rest-apis/rest-api-tutorials/10.1.2507/rest-api-tutorials/access-requirements-and-limitations-for-the-splunk-cloud-platform-rest-api>
- 
Set up authentication with tokens <https://help.splunk.com/en/splunk-cloud-platform/administer/manage-users-and-security/10.1.2507/authenticate-into-the-splunk-platform-with-tokens/set-up-authentication-with-tokens>
- 
Configure IP allow lists for Splunk Cloud Platform <https://help.splunk.com/en/splunk-cloud-platform/administer/admin-config-service-manual/10.2.2510/administer-splunk-cloud-platform-using-the-admin-config-service-acs-api/configure-ip-allow-lists-for-splunk-cloud-platform>
- 
Access endpoint descriptions <https://help.splunk.com/en/splunk-cloud-platform/leverage-rest-apis/rest-api-reference/10.2.2510/access-endpoints/access-endpoint-descriptions>
 

## Troubleshooting FAQ
This section highlights common configuration issues that may occur during installation. It is not an exhaustive list of all possible errors, but focuses on the most frequent setup blockers.
 
 

### Invalid Splunk (Cloud) Hostname
[image 20]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087273537/f4907453dddc0733bf5012a2e846/75a665ee-ddf7-4df9-a4af-392182e08aa1?expires=1794967200&signature=e5ae8be858b8572546fff0ee4ea4065d73d332b073953c496e8f7b0fa2e581ef&req=diAvEct5noRcXvMW1HO4zQgLw4Jzgs0u3B8LzA%2FbnHGP00JTV8EAyA2MOMzA%0ApkZ63q3yTFjt1E5JCaU%3D%0A>
 
Splunk (Cloud) instances typically follow the format:
 
https://<Host <https://<Host> Name>.splunkcloud.com
 
The Host Name field should contain only the <Host Name> portion of the URL. This error occurs when the value entered does not match the host name assigned to your Splunk (Cloud) instance.
 
 

### The current user role/s is missing the acs_list_ip_allow_list capability
[image 21]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087273547/2060e6c173747d7e8e3aaf4822ca/3750cfcd-1679-4d48-a64e-56c5d2f2b4fc?expires=1794967200&signature=fc36d867b2b6c0be790304b7cf596aa7926cceb3da22a9d924e203d7ba36e2f0&req=diAvEct5noRbXvMW1HO4zT16fERl2dHYtYSN7jcMvy4m5EnZRxCaQ0z5TtW%2B%0AJcXKHItlVf8c0IQTByg%3D%0A>
 
This error occurs when the current user role does not include the acs_list_ip_allow_list capability. Vanta checks your instance’s IP Allow List configuration through the API. This capability must be assigned to the user’s role to allow that validation.
 
Add the acs_list_ip_allow_list capability to the associated role and retry the connection.
 
 

### Missing the following capabilities to guarantee that Vanta retrieves all the resources from your account
[image 22]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087273545/6043733a31575fec967fa37ddf8d/4d4a36e3-4bc8-4d07-9183-297325a422e3?expires=1794967200&signature=f6e557279f1a8af0dc514a4a55c56d63f75659f5b09a56ed93cc945c268bde40&req=diAvEct5noRbXPMW1HO4zRn8yWlQIIw9vyJ0D4eLqTZ0kSc%2FT1BjwpZRVyvx%0AvpLrm8pPr2fY54zvkj0%3D%0A>
 
This error indicates that one or more required capabilities are not assigned to the user role.
 
The listed capabilities are necessary for Vanta to retrieve users, roles, and groups from your Splunk (Cloud) instance. Add the missing capabilities to the user role to resolve the issue.
 
 

### Your Search API IP Allow List is not open for Vanta
[image 23]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087273527/40cda034a0f2f0804469c213074f/65994637-9d48-4284-973b-0e82f6fe3944?expires=1794967200&signature=bf7e3b4c29184100af7fed18bd82c11dcabd8d39e6a8b7994a4c6f6d59e2b487&req=diAvEct5noRdXvMW1HO4zd%2Ba9lFnIjx3eskQT2BWOFdUiMrLj%2FYPsC4VHq7C%0A4DdVuH%2FDE7qzdqJMDPg%3D%0A>
 
This error occurs if Vanta’s IP CIDR has not been added to your Search Head API IP Allow List.
 
The error message will display the expected CIDR value that must be added. Update your IP Allow List configuration accordingly and retry the connection.
 
 

### Splunk authentication token is invalid
[image 24]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2087273536/7e4c7d697c0b65cae091985cec8f/63d1a830-8eb4-40ad-bb44-585ed062219e?expires=1794967200&signature=e5311467ad1032c5f301fe6f96a0d26517ca226b855c2e56f002737961553f09&req=diAvEct5noRcX%2FMW1HO4zba0vPTiqWbjROHdFQJO%2Fc%2F%2BNQpAVsScCWfwrSSM%0A3p1KjMOGDwr91VOjTw4%3D%0A>
 
This error occurs when Vanta is unable to authenticate with the Splunk API using the provided token.
 
Review the Authentication Token entered in Vanta and confirm that:
- 
The token was copied correctly
- 
The token is active
- 
The token has not expired

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-splunk--01.png
- [image 02] ../../images/integrations/splunk/connecting-vanta-splunk--02.png
- [image 03] ../../images/integrations/splunk/connecting-vanta-splunk--03.png
- [image 04] ../../images/integrations/splunk-enterprise/connecting-vanta-splunk-enterprise--05.png
- [image 05] ../../images/integrations/splunk/connecting-vanta-splunk--05.png
- [image 06] ../../images/integrations/splunk/connecting-vanta-splunk--06.png
- [image 07] ../../images/integrations/splunk/connecting-vanta-splunk--07.png
- [image 08] ../../images/integrations/splunk/connecting-vanta-splunk--08.png
- [image 09] ../../images/integrations/splunk/connecting-vanta-splunk--09.png
- [image 10] ../../images/integrations/splunk/connecting-vanta-splunk--10.png
- [image 11] ../../images/integrations/splunk/connecting-vanta-splunk--11.png
- [image 12] ../../images/integrations/splunk/connecting-vanta-splunk--12.png
- [image 13] ../../images/integrations/splunk/connecting-vanta-splunk--13.png
- [image 14] ../../images/integrations/splunk/connecting-vanta-splunk--14.png
- [image 15] ../../images/integrations/splunk/connecting-vanta-splunk--15.png
- [image 16] ../../images/integrations/splunk/connecting-vanta-splunk--16.png
- [image 17] ../../images/integrations/splunk/connecting-vanta-splunk--17.png
- [image 18] ../../images/ux/integrations/connecting-vanta-splunk--18.png
- [image 19] ../../images/ux/integrations/connecting-vanta-splunk--19.png
- [image 20] ../../images/ux/integrations/connecting-vanta-splunk--20.png
- [image 21] ../../images/ux/integrations/connecting-vanta-splunk--21.png
- [image 22] ../../images/ux/integrations/connecting-vanta-splunk--22.png
- [image 23] ../../images/ux/integrations/connecting-vanta-splunk--23.png
- [image 24] ../../images/ux/integrations/connecting-vanta-splunk--24.png
