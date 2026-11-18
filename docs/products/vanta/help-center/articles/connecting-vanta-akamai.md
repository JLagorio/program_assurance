# Connecting Vanta & Akamai

Source: https://help.vanta.com/en/articles/13730345-connecting-vanta-akamai
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

## Overview
Akamai is a content delivery network and cloud provider for edge security, application protection, and performance. Vanta integrates with Akamai to provide visibility into both domain security posture and user access. By connecting Akamai to Vanta, you can: 
- 
View managed domains in inventory, including DDoS, WAF, and bot management protections
- 
Evaluate whether domain protections are enabled and properly configured
- 
Sync users and groups via SCIM to support access visibility and offboarding checks

## Use Cases 
Connecting Akamai to Vanta enables you to: 
- 
Maintain an inventory of externally facing domains: Track domains managed by Akamai and view their protection status within Vanta.
- 
Validate domain security controls: Ensure DDoS, WAF, and bot protections are enabled and actively enforced on production domains
- 
Monitor protection posture over time: Identify domains that are unprotected, misconfigured, or operating in non-enforcement modes
- 
Support audit and compliance requirements: Demonstrate that externally facing infrastructure is secured with appropriate controls
- 
Review and manage user access to Akamai: Sync Akamai users and groups into Vanta to validate access and support offboarding checks

## Prerequisites
Note: You can connect using either SCIM or EdgeGrid, depending on your use case. You may also choose to configure both if you want to enable both access visibility (SCIM) and domain security monitoring (EdgeGrid).

## SCIM Authentication (user and group provisioning)
To connect via SCIM, you must have: 
- 
An Akamai account on an Enterprise plan
- 
SSO enabled
- 
Note: SCIM provisioning in Akamai requires SSO to be configured. If SSO is not yet enabled, set it up in your Akamai Identity & Access Management settings before connecting via SCIM. 
- 
Admin (or equivalent) access
- 
A SCIM base URL
- 
A provisioning key (bearer token) from a SCIM directory with at least one user (required for connection validation)
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226689042/8989db0ac5eb9a524980c21e5922/e1ba6660-59f6-459c-937f-779a7c4753d9?expires=1794967200&signature=36013b43182c1b9cd6306076c69984b32329e794e5361acadc4508cbf9f2adea&req=diIlEM92lIFbW%2FMW1HO4zWEq%2ByFFjHhPfWFT6rr%2FPS9OSg7iohwsiy%2F%2FksGd%0AFQte%2BtN0a4wv00aytZQ%3D%0A>
 

## EdgeGrid API Authentication (domain inventory and security monitoring)
To connect via Edgegrid, you must have: 
- 
An Akamai account with API access to:
- 
Property Manager (PAPI)
- 
Application Security (App & API Protector)
- 
The following EdgeGrid credentials:
- 
Client token
- 
Client secret
- 
Access token
- 
Host
Vanta uses these credentials in read-only mode to retrieve domain and security configuration data.
 

## Setup guide 

## Option 1: Connect via SCIM (user and group sync)
Vanta uses SCIM to pull users and groups from your Akamai directory. These users appear in Vanta as Akamai accounts, allowing you to:
- 
View who has access to Akamai
- 
Link accounts to individuals in Vanta
- 
Validate offboarding and access ownership
To connect via SCIM:
- 
Enter your SCIM base URL and provisioning key (bearer token) in Vanta.
- 
Ensure your SCIM directory contains at least one user for validation.
- 
Complete the connection flow in Vanta.
 

## Option 2: Connect via Edgegrid API (domain monitoring)
Vanta connects to Akamai using EdgeGrid to retrieve domain and security configuration data. This includes: 
- 
Hostnames from Property Manager
- 
Security configurations and match targets from App & API Protector
This data is represented in Vanta as domain inventory resources and used to evaluate domain protection status.
 

## How Vanta processes domain data:
Vanta applies the following logic when ingesting Akamai data: 
- 
Only hostnames with a PRODUCTION network configuration are included.
- 
Only security configurations with a production version are processed.
- 
Configurations without a production version are skipped.
- 
Domains not routed through Akamai (lacking a production CNAME) are marked as having all protections bypassed.
If a hostname is part of multiple match targets, Vanta uses the last one encountered (a warning is logged for this occurrence).
 

## Creating an API Client in Akamai (EdgeGrid)
- 
Log into the Akamai Control Center <https://control.akamai.com/apps/auth/#/login> with an Administrator account in the to set up the EdgeGrid API client.
- 
In the Control Center, navigate to Identity & Access Management > Users and API Clients <https://www.google.com/url?q=https://control.akamai.com/apps/identity-management/%23/tabs/users/list&sa=D&source=docs&ust=1775851847525249&usg=AOvVaw0O5HIMD_JfXcAsRb3chzx2>.
On this screen, select Create API client.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226694756/8411df3aa36313b36c8e9b64c571/3f2ba1bc-1a95-4e6b-a449-5da3ac82ac60?expires=1794967200&signature=1273dd6f67bd088129b7cfb0a6aea1306866668fbd68d4903cff7a47448027dd&req=diIlEM93mYZaX%2FMW1HO4zYqpjoo%2FHyrj6fqrnCHjZCI46md6saBzKiE1VqzH%0AQ8%2Bgihrdg56uLD%2F7UEU%3D%0A>
- 
In the options, select Myself and then click Advanced.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226696135/83d0fba84239651624e8ad3069ec/47c60305-524c-4e2b-b329-e6a74c71c072?expires=1794967200&signature=a6de9efae22f581f023f706c8d3298441e03980c2744835f29d8143b926b3e38&req=diIlEM93m4BcXPMW1HO4zYe96dgeybbpITZe8hF1%2Fb3fEdhkoXNYXUJA3tZ8%0ANo8RMjEkTKOx7U9pzjw%3D%0A>
- 
In the Advanced screen, under the APIs menu, choose Select APIs.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226697053/a55c31a25cd780b0d36eebaba398/c389fcf9-1c98-44cb-aa39-8ee543554df5?expires=1794967200&signature=cd032f16a29bd28589bce3fee3462abfa46ddf9579e09d0248efd4eb00d0af96&req=diIlEM93moFaWvMW1HO4zXGa0sJl5w0qgOrpxHSDLnVFSltFuIC75Jls%2FD5%2F%0AhuLD9xsiKH8aqoPEhsQ%3D%0A>
- 
Clear API selection, then select only the following READ-ONLY permissions: 
- 
Application Security
- 
Property Manager (PAPI).
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226698286/632c62a64ea61611eaf534e9c017/6146dc8e-72b6-41d2-8c31-8202a1cda07a?expires=1794967200&signature=b4bb924c6c81229e16c531009db35e1a6428e6a5c319f87c5edaf5353f75a7cf&req=diIlEM93lYNXX%2FMW1HO4zXkkNOB2C%2FAcwriK%2BwTFrYhQ2a9ztpPiwC5RUvRP%0Au9H1MufsKNQWZcYldBk%3D%0A>
- 
Click Create API client, review the configuration and then download the credentials.
 | 
Important: The API client credentials are only displayed at the time of creation. Make sure to copy or download the credentials before leaving this page. Once you close or navigate away, you will not be able to view them again and will need to generate a new API client. 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226700002/8d9f192da6e4b97dfb48bef2d20a/3880839f-a8f4-4667-addb-c4d5c18a0d34?expires=1794967200&signature=6bc962f2e708d6e269b3858c87b98ef5f4a6bec5d3948d2262b13b243d56f5ed&req=diIlEM5%2BnYFfW%2FMW1HO4zZJNF65dVaiPo6V3TKx4TeJ26K%2Bj4ewKI%2FSx1gBP%0ASj33iEd8%2FliFIctaDBw%3D%0A>
 

## Connect Edgegrid credentials in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Akamai. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
Select the EdgeGrid API auth method and click Next.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226701793/54d3105d95a4efa78931077a6800/b7ca314d-1e40-4a45-9fd1-922c58d95d43?expires=1794967200&signature=d049a03a65873a3b8d7c0adf46ebe94e4c79a0abb87c07f4d45f27e28f8ef266&req=diIlEM5%2BnIZWWvMW1HO4zbS%2F56wU%2BcMP1J5inshn2SgYDybP5HeliVnmWPCO%0AblFgbx0JFFSuj%2FZkXPU%3D%0A>
- 
Enter the credentials from the downloaded file: 
- 
Client token
- 
Client secret
- 
Access token
- 
Host
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226702346/19a0a8fd7d79c9988520fe7e756f/4e925d50-3bc7-48e1-8d85-123b42e0dd44?expires=1794967200&signature=67812173bbb43b754feb3b4e4fc680e308e46157afefec4705af8909950be2de&req=diIlEM5%2Bn4JbX%2FMW1HO4zUWyWfNIrtiXehAsGZJSdrmCUtcEcBisMgIICyIU%0A5%2FA2vYZs55dWfyIDxDI%3D%0A>
- 
Click Done. Vanta will begin fetching data from Akamai on a recurring basis. 

## Domain Security Monitoring
Once connected, you can use the Akamai integration to monitor your registered domains.
 
Vanta evaluates each domain to confirm that the following protections are enabled:
- 
DDoS protection
- 
Web Application Firewall (WAF)
- 
Bot management protections

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-akamai--01.png
- [image 02] ../../images/integrations/akamai/connecting-vanta-akamai--02.png
- [image 03] ../../images/integrations/akamai/connecting-vanta-akamai--03.png
- [image 04] ../../images/integrations/akamai/connecting-vanta-akamai--04.png
- [image 05] ../../images/integrations/akamai/connecting-vanta-akamai--05.png
- [image 06] ../../images/integrations/akamai/connecting-vanta-akamai--06.png
- [image 07] ../../images/ux/integrations/connecting-vanta-akamai--07.png
- [image 08] ../../images/ux/integrations/connecting-vanta-akamai--08.png
