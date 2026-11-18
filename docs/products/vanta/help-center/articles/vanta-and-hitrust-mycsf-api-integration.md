# Vanta and HITRUST MyCSF API Integration

Source: https://help.vanta.com/en/articles/11345795-vanta-and-hitrust-mycsf-api-integration
Collection: Audit Readiness ; Audit Readiness › Compliance Standards Library
Fetched: 2026-11-17

## Article text

## Overview
The Vanta and HITRUST MyCSF integration provides a seamless connection between Vanta's and HITRUST's MyCSF assessment application. This integration automates key compliance processes, including:
- 
Automatic Control Syncing: Ensures Vanta assessments remain current with your HITRUST assessment scope.
- 
Evidence Export: Allows users to export completed evidence back into MyCSF for review by the HITRUST QA team after an audit.
This integration streamlines HITRUST compliance by reducing manual effort, improving accuracy, and ensuring a consistent connection between platforms.
 

## Step 1: Connect to MyCSF
Vanta requires an API Key and User Name from MyCSF to enable the integration. These credentials are used for secure read-and-write API requests to retrieve controls and import evidence.
 
Generate an API Key and User Name in MyCSF
Official HITRUST guidance on creating an API user. <https://www.manula.com/manuals/hitrust/mycsf-2-0/1/en/topic/adding-a-new-api-user>
 
Follow these steps to generate the required credentials in MyCSF:
- 
Log in to MyCSF using an Administrator Account that can manage "Subscribers."
- 
Navigate to Administration > Subscribers.
- 
Click "NEW API USER."
- 
Under Access Type, select "Read and Write" and click "CREATE API USER."
- 
A User Name and API Key will be generated and displayed on your screen.
- 
Securely store these values as they are needed to connect Vanta to MyCSF.
- 
Note: If the API key is lost, it will not be retrievable again. If needed, you must create a new API User.
 

## Step 2: Configure the Connection in Vanta
- 
Log in to Vanta.
- 
To access the connection flow, which can be accessed from:
- 
On the HITRUST framework page, click the connection banner OR
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516754519/1fa5488e6f14ae79f6b9625063ed/32578739385492?expires=1794967200&signature=964bdb3bb6cddf368b149d2392fc6e534fb13bd08c1129b165b7e817124c0160&req=dSUmEM57mYReUPMW1HO4zaPB6%2FDxQkDYDtB6nvniKnSoH0Isr5bfl6UMQ2oY%0AxmH%2BfBw29xZ48M%2BUuqY%3D%0A>
- 
In Vanta, go to the Integrations page, click Add integration, and search for HITRUST. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Connect from the HITRUST MyCSF integration card.
- 
Enter the API Key and User Name generated from MyCSF and click Next
- 
Select the HITRUST assessment you want to sync into Vanta and click Next
- 
Validate your selection then select Done.
Please note: A “Syncing requirements from HITRUST MyCSF. This may take some time.” dialog will appear. Once the sync is complete, all the controls in scope for your HITRUST assessment will be uploaded to Vanta, and relevant tests and document mappings will be prepopulated for you.
 
Export Evidence to MyCSF
 
After completing your compliance work in Vanta and obtaining auditor validation, you can export evidence back to MyCSF:
- 
Navigate to the Audit section in Vanta.
- 
Open your ongoing HITRUST audit
- 
Click Export followed by Open to export to MyCSF
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516754520/b5f7033a2f895e7a685edaa289d5/32578772219412?expires=1794967200&signature=733cdce083af66bd6a3b00007937b05bd673c4dbd094203c0f54f18a040dfeed&req=dSUmEM57mYRdWfMW1HO4zehDOShonp9KF8TS4t1zclzBneSkUWj3LzkVGShW%0AwFjwh0BxHCn1k2ReD1w%3D%0A>
- 
Review the list of evidence items to be exported:
- 
Policies
- 
Tests
- 
Documents
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516754525/e2aac9d926d5d6ec5d4be05e78a6/32578772220308?expires=1794967200&signature=a02ee5d9dd7f1df11d50069b0d7080bb64394de1049e6b85dd6f93455284a181&req=dSUmEM57mYRdXPMW1HO4zdFNd6UOCtw%2Fj1rxYevnW0XXO%2FVsAi9jHUYTFIUe%0AN%2F9NMpVExEtT%2FsNr8x4%3D%0A>
- 
Confirm that you are happy with what will be exported to MyCSF
- 
Click Export to MyCSF to initiate the export process.
If you need additional assistance, contact [email protected]

## Images

- [image 01] ../../images/ux/frameworks/vanta-and-hitrust-mycsf-api-integration--01.png
- [image 02] ../../images/ux/audits/vanta-and-hitrust-mycsf-api-integration--02.png
- [image 03] ../../images/ux/audits/vanta-and-hitrust-mycsf-api-integration--03.png
