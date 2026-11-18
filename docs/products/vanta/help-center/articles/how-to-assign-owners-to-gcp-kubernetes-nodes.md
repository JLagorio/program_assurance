# How to assign owners to GCP Kubernetes Nodes

Source: https://help.vanta.com/en/articles/11345989-how-to-assign-owners-to-gcp-kubernetes-nodes
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Administrators can have ephemeral compute instances flagged as not having an owner in Vanta on the  Inventory items and have owners <https://app.vanta.com/monitors#inventory-list-owners> test. Often, the cases were already terminated before an administrator has time to take any action, or if the instances are still up, the admin must manually assign owners to several different resources on the inventory page.
 
Going to the Kubernetes engine page, selecting clusters, and scrolling down to Metadata allows administrators to add the VantaOwner  <https://help.vanta.com/hc/en-us/articles/9270488281492-Bulk-Tags?source=answerbot&auth_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo0MDY1MDIwNzc0MTEsInRpY2tldF9pZCI6NDUxNjMsImRlZmxlY3Rpb25faWQiOjEzNzM4NzA1NDQzMjIwLCJhcnRpY2xlcyI6WzEzNTkxMjAyOTA3OTI0LDQ0MTMxMjcwNDk4NzYsOTI3MDQ4ODI4MTQ5Ml0sInRva2VuIjpudWxsLCJleHAiOjE2ODA3OTA4NDV9.TOUJwYTauP8hqM7az-A1-ix_cdwLDiEvC3c89Zzi0n8>label to the cluster. This will enable them to assign an owner to the nodes by entering the owner's Vanta-associated email address.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764641/83394847ef8ba32993c86dda0a4f/13738804419988?expires=1794967200&signature=7184b03cd40e09b05a28c16b140a6b6bce3fc29c7659a15054f6a178d8b8b2aa&req=dSUmEM54mYdbWPMW1HO4zTRLTPoJ8AmMX8n7voZugEUSu2PPtXrzUjVRRABb%0A8qeMwyrtELrPWEIuMcI%3D%0A>

## Prerequisites
- 
Administrator access on Vanta
- 
GCP Owner access
 

## Procedure
- 
Confirm the Vanta-associated email of the owner you wish to assign the nodes to; you can find their email on their profile on the People Page:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764638/af647731f0ac4197ed14c551c069/13739086618772?expires=1794967200&signature=f5557ebdb772f0e5674281dad4e558578695fabcc8ac9a94a7e98872c349658a&req=dSUmEM54mYdcUfMW1HO4zQlnTejQtPMbfVfF3jhbhrtdX0VKqhATs4%2B05j5z%0A%2BPzsejkkF422KxfQ2MY%3D%0A>
 
- 
Once you have their email, follow the instructions linked here to attach tags to a cluster <https://cloud.google.com/kubernetes-engine/docs/how-to/tags#attach-tag-cluster> :
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764640/a975c5205a0c93f26069a9c53241/13739175355796?expires=1794967200&signature=37c3649f5f1d471b830f24a3063cd964462746d78b0d4effda6ab3ff66c2b51e&req=dSUmEM54mYdbWfMW1HO4zURoBtN2uadGn%2BhdD12npBXCEL%2Bu8EppEVRlM0%2Fy%0A0G29IgOQoI1GUd6rOFI%3D%0A>
 
- 
When setting the email value, follow the correct GCP label syntax. See Bulk Tags in Vanta <https://help.vanta.com/hc/en-us/articles/9270488281492-Bulk-Tags?source=answerbot&auth_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo0MDY1MDIwNzc0MTEsInRpY2tldF9pZCI6NDUxNjMsImRlZmxlY3Rpb25faWQiOjEzNzM4NzA1NDQzMjIwLCJhcnRpY2xlcyI6WzEzNTkxMjAyOTA3OTI0LDQ0MTMxMjcwNDk4NzYsOTI3MDQ4ODI4MTQ5Ml0sInRva2VuIjpudWxsLCJleHAiOjE2ODA3OTA4NDV9.TOUJwYTauP8hqM7az-A1-ix_cdwLDiEvC3c89Zzi0n8> for more information:
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764636/38d9fffc64829ac9e63fbdc81e40/13739286811156?expires=1794967200&signature=97eb799d95d2fddb1ade56d6862dbd10f950869b72230f21b549326a2c3a6b9a&req=dSUmEM54mYdcX%2FMW1HO4zYr38O8lU%2B9gpeR3DlkvNigUOiO6ws9bGhMGu7p2%0AhcYJslWBX%2FjHnNApUg0%3D%0A>
 
- 
Once added, these tags should be applied to all new nodes upon creation:
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764659/0e51b8e3e7a8432405435eb171c5/13739406589588?expires=1794967200&signature=8fd7ca5dff028f00555e6fad95c3c69017afe20f77029be24e52cd3c37f0706b&req=dSUmEM54mYdaUPMW1HO4za%2Be7zfNHgkaJUpLD65dYuMOe2yfT1U2TqB804ce%0AsGWVxHD%2B2lX5Y7s3fgY%3D%0A>
 

## Additional Resources
- 
Bulk Tags <https://help.vanta.com/hc/en-us/articles/9270488281492-Bulk-Tags?source=answerbot&auth_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo0MDY1MDIwNzc0MTEsInRpY2tldF9pZCI6NDUxNjMsImRlZmxlY3Rpb25faWQiOjEzNzM4NzA1NDQzMjIwLCJhcnRpY2xlcyI6WzEzNTkxMjAyOTA3OTI0LDQ0MTMxMjcwNDk4NzYsOTI3MDQ4ODI4MTQ5Ml0sInRva2VuIjpudWxsLCJleHAiOjE2ODA3OTA4NDV9.TOUJwYTauP8hqM7az-A1-ix_cdwLDiEvC3c89Zzi0n8>

## Images

- [image 01] ../../images/integrations/gcp/how-to-assign-owners-to-gcp-kubernetes-nodes--01.png
- [image 02] ../../images/ux/personnel/how-to-assign-owners-to-gcp-kubernetes-nodes--02.png
- [image 03] ../../images/documentation/how-to-assign-owners-to-gcp-kubernetes-nodes--03.png
- [image 04] ../../images/documentation/how-to-assign-owners-to-gcp-kubernetes-nodes--04.png
- [image 05] ../../images/integrations/gcp/how-to-assign-owners-to-gcp-kubernetes-nodes--05.png
