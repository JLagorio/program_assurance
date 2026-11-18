# Connecting Vanta & Oracle Cloud

Source: https://help.vanta.com/en/articles/11605088-connecting-vanta-oracle-cloud
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Vanta's Oracle Cloud integration helps you monitor users, groups, policies, buckets, and databases from your Oracle Cloud account. Once connected, Vanta will collect this evidence automatically and apply security tests to help you stay audit-ready.
 
This feature is helpful for admins who want to connect either their full tenancy or specific compartments in Oracle Cloud.
 

## Integration Setup in Vanta
Follow these steps to connect Oracle Cloud (OCI) to Vanta.
 

##  Connect the Integration
- 
In Vanta, go to the Integrations page, click Add integration, and search for Oracle Cloud. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect under Oracle Cloud Infrastructure (OCI) 

## Choose a Connection Type
You’ll be prompted to choose how you'd like to connect your Oracle Cloud account.
- 
Connect by Compartment if you want to link specific compartments one-by-one
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1577376045/bd5b6136d37a942bdc95f00d6814/Screenshot+2025-06-18+at+1_48_27%E2%80%AFPM.png?expires=1794967200&signature=d06456be294c08bf40a5af17da2b3ee58be9f5544095b10e02be8ff5d72f6a8e&req=dSUgEcp5m4FbXPMW1HO4zY1Bs6FaLijdHDCEe7AGWV3mjmFqtcAOkRdNFmnC%0AC3c0NouiejYAfvGS34U%3D%0A>
 
- 
Connect Entire Tenancy if you want Vanta to pull from all compartments at once
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1577376387/92e9874c6f02ac0cb3ee87e81e29/Screenshot+2025-06-18+at+1_48_38%E2%80%AFPM.png?expires=1794967200&signature=099f58d4b6fa99942a09e289f361c099f60a89479a762a4c932cbb2b31173db7&req=dSUgEcp5m4JXXvMW1HO4zYXo8S5XHU7cmFzMlB4h4oB7%2F4ctzPBnu4LDpr%2Bk%0ALrnP000p7gd63KS39X8%3D%0A>
 
Click on the method that fits your structure.
 

## Connect by Compartment
Use this option if you want to link one or more specific compartments in your Oracle tenancy.
 

## Oracle Cloud Console Setup
- 
Create a group called vanta-auditor
- 
Create a user and assign them to the vanta-auditor group
- 
Generate API credentials for the user
- 
Save the private key
- 
Copy the fingerprint, user OCID, tenancy OCID, and your compartment OCID
- 
Set policies to grant read-only access
Please note: The full list of required policy statements will be displayed during the OCI setup flow in Vanta.
 

## Vanta Setup
- 
Back in Vanta, select Connect by Compartment
- 
Paste the following into the Vanta form:
- 
Tenancy OCID
- 
User OCID
- 
Compartment OCID
- 
API key fingerprint
- 
Private key contents
- 
Region (see supported regions)
- 
Click Connect to validate and finish setup
Once validated, Vanta will begin monitoring:
- 
Users
- 
Groups
- 
Policies
- 
Buckets
- 
Databases
 

## Connect Entire Tenancy
Use this option if you want to link all compartments within your Oracle account.
 

## Oracle Cloud Console Setup
- 
Create a group called vanta-auditor
- 
Create a user and assign them to the vanta-auditor group
- 
Generate API credentials for the user
- 
Save the private key
- 
Copy the fingerprint, user OCID, tenancy OCID
- 
Set tenancy-wide policies
Please note: All required policy statements will be shown in the OCI linking flow in Vanta. These include permission scopes for resources like buckets, users, databases, and compute instances.
 

## Vanta Setup
- 
In Vanta, select Connect Entire Tenancy
- 
Enter the following in the Vanta form:
- 
Tenancy OCID
- 
User OCID
- 
API key fingerprint
- 
Private key contents
- 
Region (see supported regions)
- 
Click Connect to complete the setup
Vanta will verify access at the tenancy level and pull resources from all compartments.
 

## Resources Monitored by Vanta
Once connected, Vanta will monitor and apply security tests to the following Oracle Cloud resources:
- 
Compartments
- 
Storage Buckets
- 
Security Lists
- 
Network Security Groups
- 
Password Policies
- 
Access Policies
- 
Groups
- 
Autonomous Databases
- 
Accounts
- 
Compute Instances
This data is used to help automate evidence collection and ensure your environment meets compliance standards.
 

## Oracle Cloud Supported Regions
Vanta supports many Public regions as well as EU Sovereign Cloud and DRCC/Dedicated Regions. A full list of supported regions is below.
 

## Public Regions
- 
Australia (ap-)
- 
ap-sydney-1
- 
Ap-melbourne-1
- 
South America (sa-)
- 
sa-saopaulo-1 (São Paulo, Brazil)
- 
sa-vinhedo-1 (Vinhedo, Brazil)
- 
sa-santiago-1 (Santiago, Chile)
- 
sa-valparaiso-1 (Valparaíso, Chile)
- 
sa-bogota-1 (Bogotá, Colombia)
- 
Canada (ca-)
- 
ca-montreal-1
- 
Ca-toronto-1
- 
Europe (eu-)
- 
eu-paris-1 (France)
- 
eu-marseille-1 (France)
- 
eu-frankfurt-1 (Germany)
- 
eu-milan-1 (Italy)
- 
eu-amsterdam-1 (Netherlands)
- 
eu-jovanovac-1 (Jovanovac, Serbia/Eastern Europe)
- 
eu-madrid-1 (Spain)
- 
eu-stockholm-1 (Sweden)
- 
eu-zurich-1 (Switzerland)
- 
Asia/Pacific (ap-)
- 
ap-hyderabad-1 (India)
- 
ap-mumbai-1 (India)
- 
ap-osaka-1 (Japan)
- 
ap-tokyo-1 (Japan)
- 
ap-singapore-1 (Singapore)
- 
ap-singapore-2 (Singapore)
- 
ap-seoul-1 (South Korea)
- 
ap-chuncheon-1 (Chuncheon, South Korea)
- 
Middle East/Israel (me-, il-)
- 
il-jerusalem-1 (Israel)
- 
me-riyadh-1 (Saudi Arabia)
- 
me-jeddah-1 (Saudi Arabia)
- 
me-abudhabi-1 (UAE)
- 
me-dubai-1 (UAE)
- 
Mexico (mx-)
- 
mx-queretaro-1
- 
Mx-monterrey-1
- 
Africa (af-)
- 
af-johannesburg-1 (South Africa)
- 
United Kingdom (uk-)
- 
uk-london-1
- 
Uk-cardiff-1
- 
United States (us-)
- 
us-ashburn-1 (Virginia/Eastern US)
- 
us-chicago-1 (Illinois/Central US)
- 
us-phoenix-1 (Arizona/Western US)
- 
us-sanjose-1 (California/Western US)

## EU Sovereign Cloud Regions
- 
eu-frankfurt-2
- 
eu-madrid-2

## Dedicated Region Customer Regions
- 
Input your private region name
 

## Edit Oracle Cloud Credentials
- 
Go to the Integrations page in Vanta
- 
Search for Oracle
- 
Click Connect under Oracle Cloud Infrastructure (OCI)
- 
Click Manage
- 
Click Edit
- 
Click the edit icon for the account you want to update
- 
Add or remove regions from the available region list
- 
Click Save to apply changes
 
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127182535/97bb4cf9e2bef42b7143e9773a47/230536ea-7292-48fd-be95-2fb0ced71ead?expires=1794967200&signature=3d6d6f7d604117a7214c08555534ee394b34610ceff06569ae54c563bdb95bc9&req=diElEch2n4RcXPMW1HO4zWQ3ezh0UT6fyPh1uKc36FUQDqcwRMn%2BOUzhbCeh%0At9UUiFxggtpPIUI5c44%3D%0A>
 
 
Note on DRCC:
- 
You can only add or remove DRCC region IDs using the region input field
- 
Realm ID and Domain are read-only after initial setup to prevent configuration errors. 
- 
These values define the DRCC realm identity and must remain consistent with the Oracle SDK registration. Changing them would require re-registering the realm, which could cause conflicts with existing connections. To use a different realm, create a new credential.

## Images

- [image 01] ../../images/integrations/oracle-cloud/connecting-vanta-oracle-cloud--01.png
- [image 02] ../../images/integrations/oracle-cloud/connecting-vanta-oracle-cloud--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-oracle-cloud--03.png
