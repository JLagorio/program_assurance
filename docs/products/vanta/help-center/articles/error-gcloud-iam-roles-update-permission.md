# Error: (gcloud.iam.roles.update) PERMISSION_DENIED: You don't have permission to get the role at organizations

Source: https://help.vanta.com/en/articles/11346019-error-gcloud-iam-roles-update-permission
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Environment Details
While connecting, GCP administrators can sometimes run into an error similar to the one below:
 ERROR: (gcloud.iam.roles.update) PERMISSION_DENIED: You don't have permission to get the role at organizations/123456789098/roles/VantaProjectScanner.
 
Note: the organization ID will be unique to your organization. The ID above, 123456789098, is a random sequence of numbers used for example purposes only and will not be present in your specific error message. 
​
​Example from Cloud Shelladmin@cloudshell:~ (gcp-testing-123456)$ bash ./individual-projects-vanta-gcp-connection.sh "gcp-testing-123456""test-provider""test-prod"

[ Vanta ] Creating custom role VantaProjectScanner for listing project resources with configuration metadata.

Note: permissions [compute.subnetworks.get] are in 'TESTING' stage which means the functionality is not mature and they can go away in the future. This can break your workflows, so do not use them in production systems!

Are you sure you want to make this change? (Y/n)? y

ERROR: (gcloud.iam.roles.update) PERMISSION_DENIED: You don't have permission to get the role at organizations/185242803049/roles/VantaProjectScanner.

- '@type': type.googleapis.com/google.rpc.ErrorInfo

domain: iam.googleapis.com

metadata:

permission: iam.roles.get

resource: organizations/123456789098/roles/VantaProjectScanner

reason: IAM_PERMISSION_DENIED
 

## Cause
A common reason for this error is that the administrator running the shell commands does not have the owner role assigned at the organization level. The organization admin role is insufficient; we usually see this error when users need more permissions.
 

## Resolution
Ensuring that your user in GCP has the minimum required permissions defined here <https://help.vanta.com/en/articles/11345945>.
 

## Additional Resources
- 
Roles in GCP  <https://cloud.google.com/iam/docs/understanding-roles>
- 
Creating and managing custom roles <https://cloud.google.com/iam/docs/creating-custom-roles>
- 
GCP Integration FAQ <https://help.vanta.com/hc/en-us/articles/9163346241812-GCP-Integration-FAQ?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxMDk5MTAzNzY0NzUwOCwidGlja2V0X2lkIjo0MjE4MiwiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2NzY3NDE3OTh9.jVriNdsXCi8kxGt6dn0kADcT6wnOGSvk_4Nfqvv5qow>
- 
Connecting GCP Container Registry to Vanta <https://help.vanta.com/hc/en-us/articles/360052741391-Connecting-GCP-Container-Registry-to-Vanta?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxMDk5MTAzNzY0NzUwOCwidGlja2V0X2lkIjo0MjE4MiwiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2NzY3NDE3OTh9.jVriNdsXCi8kxGt6dn0kADcT6wnOGSvk_4Nfqvv5qow>
- 
Connecting A GCP Organization <https://help.vanta.com/hc/en-us/articles/12443609853076-Connecting-A-GCP-Organization?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxMDk5MTAzNzY0NzUwOCwidGlja2V0X2lkIjo0MjE4MiwiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2NzY3NDE3OTh9.jVriNdsXCi8kxGt6dn0kADcT6wnOGSvk_4Nfqvv5qow>

## Images

- none
