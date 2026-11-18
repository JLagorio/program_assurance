# Integrating Vanta & CrowdStrike

Source: https://help.vanta.com/en/articles/11345781-integrating-vanta-crowdstrike
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 
CrowdStrike is a cloud security tool with products including endpoint protection and cloud monitoring. You can connect CrowdStrike to Vanta to ensure user access to CrowdStrike is managed following your company's policies. You can also connect to CrowdStrike Spotlight to ingest and display vulnerabilities on the vulnerabilities page. 
Please note: If you have already integrated with CrowdStrike and you need to update the permissions, you may skip many of the steps in the instructions below and edit the existing Vanta Client in CrowdStrike.

## About this Integration 
This integration automates the collection of evidence for vulnerability scan results and proof of subsequent vulnerability remediation within your committed SLAs.
- 
Vanta requires read-only access to user, hosts, and policies information through OAuth.
- 
Estimated setup time: Less than 10 minutes

## Use Cases
Connecting CrowdStrike will allow Vanta to perform the following tests:
- 
Ensure CrowdStrike accounts are linked in Vanta
- 
Ensure CrowdStrike accounts are deprovisioned when personnel leaves
- 
Critical vulnerabilities identified in packages are addressed
- 
CrowdStrike hosts have a non empty prevention policy
- 
CrowdStrike is installed on all cloud instances
- 
CrowdStrike is installed on all workstations
- 
High vulnerabilities identified in packages are addressed
- 
Low vulnerabilities identified in packages are addressed
- 
Medium vulnerabilities identified in packages are addressed
- 
Critical CrowdStrike detections are addressed within SLA
- 
High CrowdStrike detections are addressed within SLA
- 
Medium CrowdStrike detections are addressed within SLA
- 
Low CrowdStrike detections are addressed within SLA

## Requirements
- 
You'll need access Falcon Spotlight vulnerability management solution (additional add-on)
- 
Administrator permissions to set up an API Client
- 
You'll need CrowdStrike Falcon Cloud Security (required if using CSPM security alerts)
- 
You'll need CrowdStrike Falcon® Alerts (required if using SIEM security alerts)

## 1. Set up an API Client in CrowdStrike 
- 
You'll need Falcon Administrator permissions to set up an API Client.
- 
Using the top-left menu, navigate to Support and Resources and select API Clients and keys.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764089/d62b2cb9041abc5d1ab167f4fcad/16251218690580?expires=1794967200&signature=d065e868c4111e8394b0ca891d277f83f4b648ae7e803da640051240a95368b6&req=dSUmEM54mYFXUPMW1HO4zV7sUSVE946hxfT91Ec9yRWQ9ELpncgHHfbfnZr3%0AQRT8B%2FyPpxmrrwwENQU%3D%0A>
- 
Create a new API Client by clicking Add new API client
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2495950007/b8e2a257c47758363982c3892f12/image.png?expires=1794967200&signature=2581cb942c5ccc1cbf2bf51eb2c9a800f8b1fe358fb5936e192ee8c31c4343c2&req=diQuE8B7nYFfXvMW1HO4zb9OY0t%2FBgLt5Gs3V9YI65ou3lAsyib2lBrv0%2B7T%0AVbnMM9eEpsbS0WcNMWQ%3D%0A>
- 
Wait to exit the Add new API client window until you finish setting up the CrowdStrike integration in Vanta.
- 
Name the client a recognizable name, e.g., "Vanta Client." You can leave the description blank.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764090/59ec1cd0fb76da0458ee5e996271/8773622653716?expires=1794967200&signature=b9327c465a9faa6372a77e15f9370e14a8225cf2aef9a033a86b9b94c31540d0&req=dSUmEM54mYFWWfMW1HO4zdy32D6PbIRHIddHVbOIJppHNUy79tmdTHfaVjnN%0Apu70TSc93ZtUOBHNviI%3D%0A>
- 
In the API Scopes section, check the boxes User Management, Hosts, and Prevention Policies in the Read column. This will grant Vanta read-only access to user information in CrowdStrike.
- 
If you have CrowdStrike Falcon Spotlight enabled for vulnerability management, also grant Read access to Vulnerabilities.
- 
If you have CrowdStrike Falcon Cloud Security enabled, also grant Read access to Cloud Security API Assets and Cloud Security API Detect.
- 
If you have CrowdStrike Falcon® Alerts enabled for SIEM, also grant Read access to Alerts and Cloud Security API Assets (if not already granted).
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2495950922/6f38cbe3d3ca3e4141c13e95f2fc/533940fa-10e0-4cb7-9605-47cd6d937f38?expires=1794967200&signature=5e0607290fcf43b019340851cc8e0a7200b4a816b3e6c9396cfb702ec2253db7&req=diQuE8B7nYhdW%2FMW1HO4zXMC%2FcFc0A6YH7nJtpUw%2BlMcVv7rBAdbHJ0XBfvi%0A8DS0M4hN%2F%2BWQ%2FgBKs2g%3D%0A>
 
CrowdStrike will show you the three pieces of data you need to connect CrowdStrike to Vanta. Don't exit the window where these data are shown -- you'll need them to connect to Vanta.
- 
Client ID: The public API Client ID
- 
Client Secret: A secret shared between CrowdStrike and Vanta. This secret is only shown once.
- 
Base URL: The URL Vanta will use for API requests. This is usually https://api.crowdstrike.com, <https://api.crowdstrike.com,> but it may be different for your instance.

## 2. Connect CrowdStrike to Vanta 
- 
In Vanta, go to the Integrations page, click Add integration, and search for CrowdStrike. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2495952887/db574176ec94b581d9205b10c28b/image.png?expires=1794967200&signature=59f2d735e7401ec3bf7fd7019b800d92d72981cf1d31ba14c57963ea2025e37e&req=diQuE8B7n4lXXvMW1HO4zbEoxCIu9xiAemkPc4gEZj4KnICIv8JqfM83jsL5%0AQnA9ky2vFvdA1jk1bRI%3D%0A>
 
- 
Paste the Client ID, Client Secret, and Base URL from the previous steps into Vanta.
- 
If you are using multi-tenancy, you will also see a Connection Name field. Enter a descriptive name to identify this connection (e.g., the name of the CrowdStrike tenant).
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2495925516/53b0a2d7eca3509dbf204da847f1/image.png?expires=1794967200&signature=0792d3e45484515f52b0b7a4aa4153f5ac56feb93da450d5ca03b6a63faf1fd5&req=diQuE8B8mIReX%2FMW1HO4zf4QqZFwQNN%2FU1cZHktOdfzEa0EuMi1o%2FVcn%2FQUY%0Anf3IuY7B7Twt2QXlGTE%3D%0A>
 
- 
Click Done. Vanta will now fetch data from CrowdStrike regularly.

## Monitoring Access
- 
You can use Access <https://app.vanta.com/access?credentialKey=crowdstrike> to see which users are authorized to access your CrowdStrike instance and which roles these users are assigned.
- 
Vanta will also run tests to ensure that you've linked users in CrowdStrike with users in Vanta <https://app.vanta.com/tests#crowdstrike-account-linked-in-vanta> and removed users from CrowdStrike when they are offboarded <https://app.vanta.com/tests#crowdstrike-account-access-removed-on-termination>.
 

## Monitoring Device Security
- 
When using CrowdStrike as the antivirus solution on an MDM monitored <https://help.vanta.com/en/articles/11345406> computer, Vanta will test to ensure CrowdStrike is installed on your monitored devices <https://app.vanta.com/tests/crowdstrike-installed-on-workstations?tab=results>.
- 
To pass the test, all monitored devices must be scoped into Vanta from both the MDM and CrowdStrike integrations.
- 
For more information about resource scoping in Vanta, see our documentation here <https://help.vanta.com/en/articles/11346114>
 

## Monitoring Vulnerabilities
- 
You can also use the CrowdStrike integration to monitor for vulnerabilities from CrowdStrike Spotlight. If you have not enabled the CrowdStrike integration already, ensure that you enable Spotlight during configuration.
- 
If you have already enabled the CrowdStrike integration and want to ingest vulnerabilities, you will need to reconnect the integration and select Spotlight during configuration.
- 
For more information on vulnerability management in Vanta, see our documentation here <https://help.vanta.com/hc/en-us/sections/20377177967380-Vulnerabilities>
 

## Monitoring Cloud Security Alerts (CSPM)
If you have CrowdStrike Falcon Cloud Security enabled, Vanta will monitor two types of data:
- 
Cloud Security Assets — cloud resources (such as servers, containers, and serverless functions) detected by CrowdStrike across your AWS, GCP, Azure, and other cloud environments.
- 
Cloud Security IOMs (Indicators of Misconfiguration) — misconfigurations on those assets are surfaced as Security Alerts in Vanta. Vanta ingests IOMs with Critical, High, or Medium severity that have a non-compliant status. Informational findings are excluded.
If you have already connected CrowdStrike and want to enable Cloud Security, reconnect the integration and select Cloud Security during configuration. You will also need to update your API Client to include Read access for Cloud Security API Assets and Cloud Security API Detect. Read access for Cloud Security API Assets and Cloud Security API Detect.
 

## Monitoring Detections (SIEM)
If you have CrowdStrike Falcon® Alerts enabled, Detections will be shown as Security Alerts in Vanta.
 
If you have already connected CrowdStrike and want to enable Alerts, reconnect the integration and select CrowdStrike Falcon® Alerts during configuration. You'll also need to update your API Client to include Read access for Alerts and Cloud Security API Assets.
 
 

## Updating an Existing API Client
Follow the steps below if you have already integrated but need to add more permissions to the Vanta Client: 
- 
You'll need Falcon Administrator permissions to set up an API Client.
- 
Using the top-left menu, navigate to Support and resources followed by API Clients and Keys.
- 
Edit the Vanta API Client.
- 
In the API Scopes section, check the boxes User Management, Hosts, and Prevention Policies in the Read column. If you are also enabling CrowdStrike Falcon Spotlight, add Vulnerabilities. If you are enabling CrowdStrike Falcon Cloud Security, add Cloud Security API Assets and Cloud Security API Detect. If you are enabling CrowdStrike Falcon® Alerts, add Alerts (and Cloud Security API Assets, if not already granted).
- 
Click Save.
 

## Permissions
Vanta accesses the following data from your CrowdStrike account:
 
Vanta will be able to view:
- 
Data about your users
- 
Data about your user details
- 
Data about your user groups
- 
Crowdstrike Monitored Host
- 
Crowdstrike Prevention Policy
- 
Crowdstrike Vulnerability Management Vulnerability
- 
CrowdStrike Cloud Security Assets (when CrowdStrike Falcon Cloud Security is enabled)
- 
CrowdStrike Cloud Security IOMs (when CrowdStrike Falcon Cloud Security is enabled)
- 
CrowdStrike alert Detections (when CrowdStrike Falcon® Alerts is enabled)
 
 Vanta will be able to change:
- 
N/A

## Images

- [image 01] ../../images/integrations/crowdstrike/integrating-vanta-crowdstrike--01.png
- [image 02] ../../images/integrations/crowdstrike/integrating-vanta-crowdstrike--02.png
- [image 03] ../../images/integrations/crowdstrike/integrating-vanta-crowdstrike--03.png
- [image 04] ../../images/integrations/crowdstrike/integrating-vanta-crowdstrike--04.png
- [image 05] ../../images/ux/integrations/integrating-vanta-crowdstrike--05.png
- [image 06] ../../images/ux/integrations/integrating-vanta-crowdstrike--06.png
