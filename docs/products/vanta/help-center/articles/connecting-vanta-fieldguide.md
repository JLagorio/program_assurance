# Connecting Vanta & Fieldguide

Source: https://help.vanta.com/en/articles/12326824-connecting-vanta-fieldguide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Fieldguide is an AI-powered audit management platform designed for audit firms. When audit firms integrate Fieldguide with Vanta, they can streamline the audit process by automatically syncing customer evidence and related metadata into their Fieldguide engagement. This eliminates duplicate uploads, reduces back-and-forth, and ensures auditors always have the most up-to-date information.
 

## Who It’s For
This tool is for Audit partners using Fieldguide and their customers. Audit firms can find Vanta in the Integrations section of their user profile
 

## How It Works

### Default Vanta request list audit experience 
- 
Customers that are not on a professional, enterprise, or package with audit control SKU only have access to the default Vanta request list audit experience.
- 
Auditors working with these customers only have access to the one directional sync pulling data from Vanta into Fieldguide. See table below.

### IRL (information request list) audit experience
- 
Customers that are on a professional, enterprise, or package with audit control SKU have access to the IRL audit experience.
- 
Auditors working with these customers only have access to the bi-directional sync between Fieldguide and Vanta. See table below.
- 
Audit firms must set up an integration user in Fieldguide. This user will need to also be added to the Vanta platform as an auditor.
- 
The customer creates the audit in Vanta selecting the integration user as the auditor and choosing advanced options = import your own request list.
- 
The customer should not upload a request list and should notify the auditor that the audit is set up in Vanta.
- 
The auditor will upload the request list to Fieldguide and the list will push over to Vanta. The customer should then be able to see the request list in Vanta. The customer can fulfill the requests and push them back over to Fieldguide.
 

## Current Status
The Fieldguide team is actively working on updating their Vanta integration. See below to understand what is currently available, and what is in development. 
 | 
API capability | 
Default Vanta request list API integration | 
New IRL API integration
 | 
Evidence files  | 
One-direction sync* | 
One direction sync
 | 
Evidence name | 
One-direction sync* | 
One direction sync
 | 
Evidence description | 
One-direction sync* | 
One direction sync
 | 
Evidence Status | 
N/A* | 
One direction sync
 | 
Evidence commenting | 
N/A* | 
One direction sync
 | 
Framework codes/control mappings | 
N/A* | 
Not yet syncing from Fieldguide to Vanta (in development)
*Please Note: Fieldguide does not plan to update the existing endpoints. Only the custom IRL endpoints support bidirectional syncing, which requires the customer to be conducting an IRL audit in Vanta for their auditor to use the bi-directional sync with Fieldguide.
⚠️ Note: Upload all evidence to an Information Request List (IRL) item before you mark it Audit ready. Fieldguide syncs evidence when the item is marked Audit ready, not when files are uploaded. Files you add afterward will appear as shared with your auditor in Vanta, but they won’t sync to Fieldguide until your auditor flags the item and you mark it Audit ready again.
 
 

## Use Cases
- 
Auditors can review evidence in Fieldguide without needing manual uploads or chasing updated files in Vanta. 
- 
Evidence is pushed into Fieldguide, reducing mismatches and version issues for auditors. 
- 
Customers do not need to log into Fieldguide to upload audit evidence.

## Requirements
- 
Customer must add their audit firm in their settings in Vanta. 
- 
Customer must have a Vanta account and have created an audit engagement.
- 
Customer must assign their auditor to their engagement (remember to assign the fieldguide integration user as the auditor if using the IRL bi-directional sync).
- 
Auditors must have set up the integration user on Fieldguide.

## How to Connect the Integration
- 
The auditor must work with Fieldguide to set up the integration user in Fieldguide. Email [email protected] to get this user added to Vanta as well.
The Fieldguide integration will expand over time, with our teams actively developing deeper functionality.

## Images

- none
