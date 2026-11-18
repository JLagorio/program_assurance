# Connecting Vanta & MongoDB Atlas

Source: https://help.vanta.com/en/articles/11345902-connecting-vanta-mongodb-atlas
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Using MongoDB Atlas for Government? See Connecting Vanta & MongoDB Atlas for Government <https://help.vanta.com/en/articles/13355889-connecting-vanta-mongodb-atlas-for-government> instead.
 
The read-only MongoDB Atlas integration syncs user and cluster data to automate multiple tests and ensure your databases are set up securely.
- 
The organization owner <https://docs.atlas.mongodb.com/reference/user-roles#mongodb-authrole-Organization-Owner> is required to generate the new API key to ensure correct permissions are inherited
- 
Navigate to your MongoDB Atlas account <https://cloud.mongodb.com/> and select the organization that you would like Vanta to monitor. You must be an organization owner <https://docs.atlas.mongodb.com/reference/user-roles#mongodb-authrole-Organization-Owner> to generate a new API key
- 
Select Access Manager, followed by Organization Access
- 
Click Create API key and create a new key with "Organization Read Only" permissions
- 
Click Add Access List Entry and add the Vanta IP address for your instance:
 | 
Instance | 
URL | 
Outbound IP
 | 
Commercial (US) | 
app.vanta.com | 
34.227.127.165/32
 | 
EU | 
app.eu.vanta.com | 
52.57.23.214/32
 | 
AUS | 
app.aus.vanta.com | 
52.63.146.195/32
 | 
Government | 
app.vanta-gov.com | 
18.254.119.214/32
If you're unsure which instance you're on, check the URL you use to log in to Vanta, or see Vanta's IP Address <https://help.vanta.com/en/articles/11346004-vanta-s-ip-address>.
- 
Copy the generated values, then navigate to the Integrations page in your Vanta instance and search for 'MongoDB Atlas <https://app.vanta.com/integrations?state=available&integration-dialog=mongoatlas&flow=add>'
- 
Click Connect. Paste the Public Key and Private Key generated to their respective fields when prompted
- 
Select Validate and Store
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759811/5e199111ba15d7e2fa4275201c27/27565086347156?expires=1794967200&signature=81605c67d975467f270ee12275deb20e54d1e580bddb9b3307c2656e63828841&req=dSUmEM57lIleWPMW1HO4zV%2BoHet884IIyRpplTWOwR8D3NVxJRUefvbx8Oxn%0A0dORS9HdJVMTQP7ag08%3D%0A>
 

## Keep in Mind
- 
For Government Users: Ensure you are logged into your Atlas for Government account. The administrative interface is separate from the standard commercial Atlas interface.
- 
After connecting your MongoDB Atlas environment to Vanta, Your Multi-Cloud Cluster Database doesn't appear within the Connection Scope.
- 
Currently, We're unable to retrieve those resources from MongoDB Atlas via the API Endpoint [Get all clusters]
- 
Unfortunately, there is no resolution to this issue at the moment, However you can provide manual evidence via Document upload of your Multi-Cloud Cluster alert settings and backups.
​

## Images

- [image 01] ../../images/integrations/mongodb-atlas/connecting-vanta-mongodb-atlas--01.png
