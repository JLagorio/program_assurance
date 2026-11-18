# Connecting Vanta & ManageEngine

Source: https://help.vanta.com/en/articles/11345714-connecting-vanta-manageengine
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Endpoint and Device Management (MDM)
Fetched: 2026-11-17

## Article text

Vanta integrates with ManageEngine to synchronize device compliance data and support automated device trust monitoring. By pulling real-time device posture information, Vanta helps ensure that only compliant devices retain access to company systems—simplifying device access reviews and supporting compliance requirements.
 
Estimated setup time: Less than 5 minutes
 
 

## How it works
ManageEngine is a device trust and compliance platform that verifies devices meet your organization’s security policies before granting access to applications and resources.
 
Vanta’s Access integration connects to ManageEngine and synchronizes device compliance data on an hourly schedule. This enables Vanta to continuously evaluate device posture and compliance status as reported by ManageEngine.
 
Note: Vanta’s ManageEngine integration currently supports only the ManageEngine MDM v1 endpoints and does not support the Endpoint Central Cloud API suite, though it does support pulling the full catalog of device apps via Endpoint Central.
 

## Use cases
Connecting ManageEngine enables the following compliance checks:
- 
Validate device compliance status as reported by ManageEngine
- 
Verify that only compliant devices have access to organizational resources
- 
Monitor device posture and security policy adherence
- 
Support compliance requirements with accurate, up-to-date device data
 

## Requirements
To connect this integration, you must have:
- 
An Administrator account with access to the ManageEngine Admin console
 

## Connect the integration
- 
In Vanta, go to the Integrations page, click Add integration, and search for ManageEngine. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>. 
- 
Click Connect to open a login modal (if you are not already logged in to ManageEngine). 
​
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2084785433/a54f7e95b83f70284b24c53657af/78f6365b-61ac-4e37-ac29-eee4ee940571?expires=1794967200&signature=9aca0d1c1f9015c0ac28edf18196d4e72e7798f889046dfeef56cbdacff23b56&req=diAvEs52mIVcWvMW1HO4zbZ7wtfmS%2Fq%2FGugNcce0ul%2Bbo%2By8h5fLe2JV7TDg%0AKRmWgToHz0Oz4VtCI58%3D%0A>
 
- 
Grant Vanta access to your ManageEngine account. 
- 
You will be automatically redirected back to Vanta once authentication is complete. 
​
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2084785434/0761848726f435c3af6fc16a92b4/0d0b80c3-e1e9-4d9e-93fa-5d9bea6ec3e8?expires=1794967200&signature=c00d382bfcb1c658cc77a27fb34a8dd3213d57e79742608decaf245cff870059&req=diAvEs52mIVcXfMW1HO4zeIyfLQg9xPP0POc%2FJio20QFTKHP4QgP9h26H3H5%0ATNHO2ZdNPtYcljaJu6k%3D%0A>
 
 

## Permissions
The ManageEngine integration provides read-only access to your account. Vanta does not create, modify, or delete any data in ManageEngine.
 
 

## Data access scope
Vanta can access the following information: 
- 
Device data
- 
Full device application inventory
- 
Device compliance status and related details
- 
Device posture information
Vanta does not have write permissions and cannot update any data in ManageEngine.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-manageengine--01.png
- [image 02] ../../images/integrations/manageengine/connecting-vanta-manageengine--02.png
