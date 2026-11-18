# Connecting Vanta & MongoDB Atlas for Government

Source: https://help.vanta.com/en/articles/13355889-connecting-vanta-mongodb-atlas-for-government
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
MongoDB Atlas for Government is the FedRAMP Moderate offering of MongoDB's managed cloud database service, hosted in a dedicated government environment. Vanta connects to it using a read-only API key to monitor your database clusters and user accounts against your compliance requirements.
 
Estimated setup time: 10-15 minutes 
⚠️ Note: This integration connects to MongoDB Atlas for Government at cloud.mongodbgov.com, which is a separate environment from the commercial MongoDB Atlas (cloud.mongodb.com). API keys from the commercial instance will not authenticate against the government environment. If your organization uses commercial Atlas, use the MongoDB Atlas integration <https://help.vanta.com/en/articles/11345902-connecting-vanta-mongodb-atlas> instead.
 
 

## Use cases and capabilities
This integration pulls MongoDB Atlas for Government cluster configurations and organization account data into Vanta. Once connected, your Atlas environment powers automated tests covering encryption, backup retention, replication, access management, and secure configuration — without manual evidence collection or data exports.
- 
Encryption and secure configuration monitoring: Cluster configurations are imported so Vanta can verify that encryption is enabled, TLS 1.2 or higher is enforced, and clusters are running on dedicated nodes with appropriate tier and storage autoscaling settings.
- 
Backup and retention compliance: Backup schedules and retention policies are checked automatically. Vanta confirms that clusters are backed up at least every 12 hours and that backups are retained for at least 30 days.
- 
Replication verification: Cluster replication settings are imported so Vanta can confirm that your databases are replicated for high availability.
- 
Access and account lifecycle management: Organization user accounts and their access levels are synced so Vanta can verify that accounts are associated with known users and that access is removed when personnel leave.
 

### Capabilities overview 
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
MongoDB Atlas for Government Clusters | 
Yes | 
Full configuration imported; used to verify encryption, backup, replication, TLS, node type, and autoscaling settings
 | 
MongoDB Atlas for Government Accounts | 
Yes | 
Organization users and access metadata imported; used to verify account association and deprovisioning
 | 
Backup schedule and retention monitoring | 
Yes | 
Checked against 12-hour backup frequency and 30-day retention thresholds
 | 
Access lifecycle tracking | 
Yes | 
Accounts validated against personnel records for timely deprovisioning
 

### Automated tests
Once connected, Vanta runs the following automated tests against your MongoDB Atlas for Government data.
 | 
Resource | 
Vanta test
 | 
Clusters | 
MongoDB Atlas for Government clusters encrypted
 | 
  | 
MongoDB Atlas for Government clusters backed up
 | 
  | 
MongoDB Atlas for Government clusters retain backups for at least 30 days
 | 
  | 
MongoDB Atlas for Government clusters backed up at least every 12 hours
 | 
  | 
MongoDB Atlas for Government clusters on dedicated nodes
 | 
  | 
MongoDB Atlas for Government cluster tier autoscaling
 | 
  | 
MongoDB Atlas for Government cluster storage autoscaling
 | 
  | 
MongoDB Atlas for Government clusters replicated
 | 
  | 
MongoDB Atlas for Government enforces minimum TLS version 1.2 or higher
 | 
Accounts | 
MongoDB Atlas for Government accounts associated with users
 | 
  | 
MongoDB Atlas for Government accounts deprovisioned when personnel leave
 
 

## API key types
Vanta supports two kinds of Atlas API key. Pick the one that matches the scope you want Vanta to monitor, and select the same type when you connect the integration in Vanta.
- 
Organization-based key: Lets Vanta monitor every project in the organization. Use this if you want full coverage. You must be an Organization Owner to create it.
- 
Project-based key: Scopes Vanta to a single project. Use this if you only want to monitor one project. You must be a Project Owner to create it.
The key is assigned its own role when you create it. Give it the Organization Read Only role for an organization-based key, or the Project Read Only role for a project-based key. The key carries its own permissions and does not inherit the creating user's access.
 
 

## Prerequisites
To connect MongoDB Atlas for Government to Vanta, you need:
- 
A Vanta administrator account.
- 
A MongoDB Atlas for Government account in your government instance (https://cloud.mongodbgov.com).
- 
Permission to create the API key: Organization Owner for an organization-based key, or Project Owner for a project-based key.
You also need to allow Vanta's outbound IP address through the Atlas API access list. You can find this address on your Integrations page, or see Vanta's IP Address <https://help.vanta.com/en/articles/11346004-vanta-s-ip-address> for a full list by instance.
 
 

## Setup guide
Generate the key in your government Atlas instance at https://cloud.mongodbgov.com. Follow the section that matches the key type you chose above.
 

### Organization-based API key
- 
Log in to your MongoDB Atlas for Government account at https://cloud.mongodbgov.com.
- 
Select the organization you want Vanta to monitor.
- 
Confirm you are an Organization Owner. You must hold this role to generate a new key.
- 
Select Access Manager > Organization Access.
- 
Click Create Application and choose the API Key option.
- 
Create a key with Organization Read Only permissions, then click Next.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2525986505/62ce35920c594a850ba12b3590e0/18b287c8-ee5b-424d-86c7-6406b11c0ee7?expires=1794967200&signature=9d977cb3af00d0a86eeee98c88b0650dc87739977a86dc7aa447543bb12b8d16&req=diUlE8B2m4RfXPMW1HO4zSwBSqbZDZ%2BzV3lDFHf%2BJXOs%2B32VK2i%2BZo3iNNvN%0Awt4s4VZ8qc%2B3KyFwmE8%3D%0A>
- 
Click Add Access List Entry and add Vanta's outbound IP address. You can find this on your Integrations page, or in Vanta's IP Address <https://help.vanta.com/en/articles/11346004-vanta-s-ip-address>.
- 
Copy the generated Public Key and Private Key. The private key is shown only once, so store it securely before proceeding.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2525991893/fbcdf1ee8baceff4e33ef95ef439/image.png?expires=1794967200&signature=3e214cd045cf92d0bc230e1ed7dcac8fde3942bd65ea96c7e19786cad6ad5d1b&req=diUlE8B3nIlWWvMW1HO4zfcg7xut2rVZemrJgd0KzOB%2FG7MHvV2IEvUIe15C%0ALR5icZyN8IH8BXkUT%2FA%3D%0A>
- 
In Vanta, go to Integrations and click Add integration. 
- 
Search for MongoDB Atlas for Government. Click the integration tile and then click Connect. 
- 
Select Organization-based API key from the dropdown menu, paste the Public Key and Private Key, and click Validate and store.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2525992900/752e75f2c1bea1b105e7d32d10cb/073e12b1-55b0-45b3-b984-9ce6083b1062?expires=1794967200&signature=c12738aaf70e73c0c96d09542b5f56d65cb59dc579c113e9574933fadc5bb176&req=diUlE8B3n4hfWfMW1HO4zVtc%2FprslcEyhfhGmPLS0l9VOuDYDsWaX6jzyxxy%0ABomiC%2F65qRSc2DEk%2B7A%3D%0A>
 

### Project-based API key
- 
Log in to your MongoDB Atlas for Government account at https://cloud.mongodbgov.com <https://cloud.mongodbgov.com>.
- 
Open the Project Overview page for the project you want Vanta to monitor.
- 
Confirm you are a Project Owner. You must hold this role to generate a new key.
- 
Select Security > Project Identity & Access, then open the Applications section and the API Keys tab.
- 
Click Create Application and choose the API Key option.
- 
Create a key with Project Read Only permissions, then click Next.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2525993357/b4ccf426f9197f8bd4e03078f687/385dea96-8b42-49a4-9658-f5f8fe505433?expires=1794967200&signature=6a6c739ef9c519f23d2c2e2d398412b9039d2bbe6819840af90ca02e8222091e&req=diUlE8B3noJaXvMW1HO4zTVvDd9qS2MKFQO7RWGSZSVapLdmqRxsVUzO8cQA%0AT3oorS5nVmkSjauUUHY%3D%0A>
- 
Click Add Access List Entry and add Vanta's outbound IP address. You can find this on your Integrations page, or in Vanta's IP Address <https://help.vanta.com/en/articles/11346004-vanta-s-ip-address>.
- 
Copy the generated Public Key and Private Key. The private key is shown only once, so store it securely before proceeding.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2525994744/56527bd82df36a739856afdc373a/image.png?expires=1794967200&signature=4dea509f5f155dfdd2755a52c5fcb2d75640af3740e96f530e0a7f88b50f661d&req=diUlE8B3mYZbXfMW1HO4zfNL2pM7z8eZCgiCwQIkTbwRRZy%2BSEeRDJpwXG7s%0ARF7%2BvStyVN%2F4OhkkfHw%3D%0A>
- 
In Vanta, go to Integrations and click Add integration. 
- 
Search for MongoDB Atlas for Government. Click the integration tile and then click Connect. 
- 
Select Project-based API key from the dropdown menu, paste the Public Key and Private Key, and click Validate and store.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2525995231/8f1f86deb929fc7728544cbdbdf9/7ed63e95-4f2b-4865-ae5f-ac94f28c6b09?expires=1794967200&signature=d9f53865ad07f249c44d18ad2e9f1f78375b38ccbeec8c3c9c4090e55beae8c6&req=diUlE8B3mINcWPMW1HO4zYeEtR128RKnMi0gSjW1a7XAx%2F2MU3VAKhJm1jan%0AQPQKk6qX7bnfiBN1t6Q%3D%0A>
 

### Choose the projects to monitor
After you validate the key, Vanta asks which projects to track. An organization-based key lists every project you can access, so select the ones you want Vanta to monitor. A project-based key is limited to its single project. Save your selection to finish connecting.
 

### Add another connection
You can connect more than one MongoDB Atlas for Government account by repeating these steps.
- 
Go to Integrations and find the connected MongoDB Atlas for Government integration.
- 
Click Manage and select Edit.
- 
Click Add Connection in the MongoDB Connections modal.
All connections can be edited or removed individually.
 
 

## Permissions

### Read access
- 
Your Atlas organizations and their users (metadata only).
- 
Your Atlas clusters and their configuration, including encryption, backup, replication, autoscaling, and TLS settings.

### Write access
There is no write access. We do not create, modify, or delete clusters, users, or any other Atlas resource. We do not access the data stored inside your databases. 
 
The API key carries Organization Read Only (or Project Read Only) permissions, so the connection cannot make changes in Atlas.
 
 

## Troubleshooting and FAQ

### The key fails to validate.
- 
Fix: Confirm you generated it in the government instance (https://cloud.mongodbgov.com). Keys from the commercial instance do not work here.

### Vanta cannot reach Atlas.
- 
Fix: Confirm Vanta's outbound IP address (found on your Integrations page) is on the API access list for the key.

### No accounts or projects appear.
- 
Fix: Confirm the key has the Organization Read Only or Project Read Only role and that the role covers the projects you expected.

### Which integration should I use — MongoDB Atlas for Government or MongoDB Atlas?
- 
Fix: Use the one that matches the Atlas instance you log in to:
- 
MongoDB Atlas for Government if you sign in at https://cloud.mongodbgov.com. This is the FedRAMP Moderate government environment.
- 
MongoDB Atlas if you sign in at https://cloud.mongodb.com. This is the commercial environment.
The two are separate services with separate credentials. An API key from one will not authenticate against the other.
 

### What FedRAMP level does this integration support?
- 
FedRAMP Moderate.

###

## Images

- [image 01] ../../images/integrations/mongodb-atlas-for-government/connecting-vanta-mongodb-atlas-for-government--01.png
- [image 02] ../../images/integrations/mongodb-atlas-for-government/connecting-vanta-mongodb-atlas-for-government--02.png
- [image 03] ../../images/integrations/mongodb-atlas-for-government/connecting-vanta-mongodb-atlas-for-government--03.png
- [image 04] ../../images/integrations/mongodb-atlas-for-government/connecting-vanta-mongodb-atlas-for-government--04.png
- [image 05] ../../images/integrations/mongodb-atlas-for-government/connecting-vanta-mongodb-atlas-for-government--02.png
- [image 06] ../../images/integrations/mongodb-atlas-for-government/connecting-vanta-mongodb-atlas-for-government--06.png
