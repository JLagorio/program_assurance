# Connecting Vanta & PayFit

Source: https://help.vanta.com/en/articles/12159430-connecting-vanta-payfit
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

Vanta integrates with PayFit to sync employee data for user provisioning and access management. This supports automated onboarding and offboarding workflows. By pulling real-time employment information, Vanta helps ensure that only current employees retain access to company systems, simplifying access reviews and supporting compliance requirements.
 
Estimated setup time: Less than 5 minutes
 

## How It Works
The PayFit integration syncs your employee data from PayFit into Vanta using OAuth authentication. The integration provides read-only access to collaborators, contracts, and time data to automatically provision and de-provision users in Vanta.
- 
Integration type: OAuth-based sync
- 
Frequency: Real-time sync with automatic updates
- 
Direction: One-way (PayFit → Vanta)
- 
Data flow: Employee information is synced from PayFit to Vanta

## Use Cases
Automatically provision users in Vanta
- 
Sync all your PayFit employees into Vanta with just a few clicks
- 
Keep user access in sync with your PayFit employee directory
- 
Automatically add new employees and remove terminated employees
Sync key employee details
- 
Effortlessly sync employee information such as Name, Email, and employment dates
- 
Maintain accurate employee records for compliance and access management
- 
Track employee lifecycle from hire to termination
Streamline access management
- 
Ensure tasks and approvals are routed to the correct employees
- 
Maintain up-to-date employee information for security reviews
- 
Support compliance requirements with accurate employee data
 

## Requirements
- 
Vanta administrator account with integration permissions
- 
PayFit administrator account with ability to authorize third-party applications
- 
Active PayFit account containing employee data
 

## Connect the Integration
- 
To connect, go to the Integrations page, click Add integration, and search for PayFit. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
Select Add Connections to enable the PayFit integration.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709669004/367c531d48fb862a317208947144/a4055a82-a2c1-47bd-ab46-11ac11f4b32c?expires=1794967200&signature=223eefc234d8b15eab8bbfae6df06ec6cdf84199be91b672b3ce033009fbdcc4&req=dScnH894lIFfXfMW1HO4zXbyU6%2FikHlQiu11X7ZJSinIe531Qwnx0CdQ4GgL%0Athy7oZUupLOLli3Dm2Y%3D%0A>
- 
Select Connect PayFit to start the connection.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709670471/38f64005f3bb454753ab205a9a8d/8d512696-f886-4fec-b469-b25099fc903f?expires=1794967200&signature=7361faa61a203ff7c9ffd86474a25941dedc74a186c59cc40a029a79c244200c&req=dScnH895nYVYWPMW1HO4zdU4DENzdI1BKfM0zkTkCIcCCVITXGJpAHXac99A%0AYHfP43SawSES6RqXpkQ%3D%0A>
- 
When prompted, sign in to PayFit and choose the company you want to integrate
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709452044/864b150954b432e2d6b9d1c5f61d/99bdfcb4-92fd-4364-963f-c481c2ac556d?expires=1794967200&signature=522e6941b7366943df39abc15e9e390ad8d51db4c8d800ad7c934b8e417d2a03&req=dScnH817n4FbXfMW1HO4zcv7DOUxpvSH1%2BXXWTitMRLNSF0inAmMwgT702sI%0A0liSx%2F7SSVM4xycT9wM%3D%0A>
- 
Authorize the following read-only permissions:
- 
Collaborators
- 
Contracts
- 
Collaborators’ Contracts
- 
Time data
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709426738/2ffff11c084f8c3417a5d4f330cb/4c57f63b-c996-4a97-a87d-311366479c6c?expires=1794967200&signature=59061d5871edada108f293208a18c08107b3de7bc21c4aaedacfc45e5c1cfc08&req=dScnH818m4ZcUfMW1HO4zdBAnnHleOyV3apRS5YpjOJhw3tjLSa%2BWe4MFc%2FG%0A1kKKvPTphwoAFSj9oxw%3D%0A>
 
Please note: After authorization, you will be redirected back to Vanta. The integration flow will complete automatically, and you can configure options such as an end date cutoff from within Vanta.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1709427978/b7112ef2a522e27c0c6a276f63cd/83421b1e-cf5f-47ac-9eb7-9b23f013f373?expires=1794967200&signature=db988ed1a74b5690e3dc7208465b819cb98bb903b7254dd0f1d3dd7ad369169b&req=dScnH818mohYUfMW1HO4zZGMD5Gisb%2BHT0y1eqbUpdBMQ820WMTIUuoLRbjj%0AxlLlvWQub%2BYq0mOC37c%3D%0A>
 
 

## Permissions
Vanta accesses the following data from your PayFit organization:
- 
Vanta will be able to view:
- 
Employee information (name, email, employment dates)
- 
Contract details and status
- 
Time and absence data (for leave tracking)
- 
Vanta will be able to do:
- 
Nothing (Vanta has read-only access)
 

## Related Articles
- 
Managing user access and permissions <https://help.vanta.com/hc/en-us/articles/11345385-assigning-user-roles-and-permissions>
 

## Frequently Asked Questions
No users syncing
- 
Verify that your PayFit account has active employees with contracts
- 
Check that employees have valid email addresses
- 
Ensure the OAuth connection is still valid and hasn’t expired
Please note: OAuth tokens can expire. If data stops syncing, try reconnecting the integration to refresh authorization.
Incorrect field mapping
- 
Confirm that employee data is filled correctly in PayFit
- 
Verify employees have professional email addresses
- 
Contact support if data appears to be missing or incorrect
Access denied errors
- 
Confirm you have admin access to both Vanta and PayFit
- 
Try reconnecting the integration if the OAuth token has expired
- 
Check that your PayFit account is active and has the necessary permissions
Sync not updating
- 
The integration syncs automatically, but the initial sync may take up to 24 hours
- 
Check the integration status page for error messages
- 
Contact support if sync issues persist beyond 24 hours
Please note: Cutoff dates determine which employees are included in the sync. Ensure your cutoff date is set correctly in Vanta if expected employees are missing.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-payfit--01.png
- [image 02] ../../images/integrations/payfit/connecting-vanta-payfit--02.png
- [image 03] ../../images/integrations/payfit/connecting-vanta-payfit--03.png
- [image 04] ../../images/integrations/payfit/connecting-vanta-payfit--04.png
- [image 05] ../../images/integrations/payfit/connecting-vanta-payfit--05.png
