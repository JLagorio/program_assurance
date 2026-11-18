# How to configure the GCP integration to only scan projects in a specific folder

Source: https://help.vanta.com/en/articles/11345947-how-to-configure-the-gcp-integration-to-only-scan-projects-in-a-specific-folder
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Users may want to configure the GCP integration to only scan projects in a specific folder in their organization. To accomplish this, follow the steps below.
- 
Select the Organization linking flow for GCP in Vanta
- 
Enter your domain on the Select an organization to scan page and click Next
- 
Select the products you want Vanta to scan on the Select Products page and click Next
- 
Perform the steps below in lieu of the steps on the Create service account & role page
- 
In GCP, create a role at the organization level with the following permissions. This role could be named "VantaOrganizationScanner"
 appengine.applications.get
bigquery.datasets.get
cloudasset.assets.searchAllResources
compute.instances.get
compute.instances.getEffectiveFirewalls
compute.subnetworks.get
iam.roles.list
pubsub.topics.get
resourcemanager.folders.getIamPolicy
resourcemanager.folders.list
resourcemanager.organizations.getIamPolicy
resourcemanager.projects.get
storage.buckets.get
 
- 
Create an additional role at the organization level with the following permission. This role could be named "VantaFolderScanner":
 resourcemanager.projects.list
resourcemanager.projects.get
 
- 
Create a service account in one of the projects that exists inside of the folder you want Vanta to scan.
- 
In the Organization level IAM configuration, grant access for the service account and apply the "VantaOrganizationScanner" role created above, as well as the "Security Reviewer" role.
- 
In the Folder level IAM configuration, grant access for the service account and apply the "VantaFolderScanner" role.
- 
Navigate to service accounts in the project where the service account was initially created, and generate a JSON key for the service account where the permissions above were applied.
- 
In Vanta, click Next to skip through the "Create service account & role" section of the GCP linking flow and upload the JSON key.
 

## Troubleshooting
Ensure that when looking at the service account from the folder level there are two roles inherited from the organization level and one applied from the folder level. It might look something like this:
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762299/8c787fbe80bda1d3cda622ffda34/15428568047892?expires=1794967200&signature=49df3e7cf7e50775bf29e0b3191f098cbc0fb4fd4618561e786a2e45beefe148&req=dSUmEM54n4NWUPMW1HO4zTBb3IWlCM6WnhIdvdAMf8%2FJtgaKi839ErlQbQkL%0AK4JBoKIVoFEsHqK0cQk%3D%0A>

## Images

- [image 01] ../../images/integrations/gcp/how-to-configure-the-gcp-integration-to-only-scan-projects-in-a-specific-folder--01.png
