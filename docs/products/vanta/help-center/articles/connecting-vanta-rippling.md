# Connecting Vanta & Rippling

Source: https://help.vanta.com/en/articles/11345682-connecting-vanta-rippling
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

## Overview
Vanta integrates with Rippling via OAuth to sync employee records, managed device inventory, and background check status. Once connected, this integration supports compliance monitoring and evidence collection. This integration is most useful for companies that use Rippling as their primary HR system, MDM provider, or background check platform and want to reduce manual compliance work in Vanta. 
 
We support three Rippling products under a single connection: 
- 
HRIS: syncs employee records including hire dates, termination dates, employment type, and leave data 
- 
MDM: syncs managed computer inventory including encryption, screenlock, and installed software 
- 
Background checker: syncs background check status for employees 
⚠️ Note: If you use Rippling's Checkr integration, Vanta does not support background check data flowing through that chain. If you use both Rippling and Checkr, connect each as a separate integration in Vanta.
You can connect one, two, or all three products during setup. Each product you turn on must be active in your Rippling account. 
⚠️Note: Selecting a product you don't have will cause sync errors. 
Estimated setup time: 5-10 minutes
 
 

## Use cases and capabilities
- 
Employee records and HR compliance – We sync active and terminated employees from Rippling to support onboarding and offboarding workflows, access reviews, and HR compliance tracking. Contractor vs. employee status, start and end dates, and upcoming approved leave are all included.
- 
Device compliance (MDM) – We sync managed computer inventory from Rippling MDM to power device compliance checks, including full-disk encryption, screenlock, password manager detection, and antivirus detection. Only desktops and laptops with a serial number are synced — mobile devices, tablets, and devices without serial numbers are excluded.
- 
Background check tracking – We pull background check status from Rippling to monitor whether employees have completed background checks, powering compliance tests without manual tracking.
 

### Capabilities summary
 | 
Resource/capability | 
Supported | 
How it is used in Vanta
 | 
Employees (active) | 
Yes | 
Access reviews, onboarding/offboarding tracking, automated tests
 | 
Employees (terminated) | 
Yes | 
Offboarding compliance, historical records
 | 
Employment type (employee vs contractor) | 
Yes | 
Access reviews, compliance classification
 | 
Employee leave data | 
Yes | 
HR compliance, upcoming leave visibility
 | 
Managed computers (desktops/laptops) | 
Yes | 
Device inventory, encryption and screenlock checks, software auditing
 | 
Mobile devices/tablets | 
No | 
Not synced
 | 
Password manager detection | 
Yes | 
Device compliance tests
 | 
Antivirus detection | 
Yes | 
Device compliance tests
 | 
Background check status | 
Yes | 
Background check compliance tests, evidence collection
 | 
Background check completion date | 
Partial | 
Uses employee start date as proxy – actual completion data is not available from Rippling
 
 

## Prerequisites
- 
Vanta admin account 
- 
Rippling admin account (the OAuth authorization inherits the permissions of the connecting user, so the connecting user must have full admin access)
- 
Rippling’s Identity and Access Management (IAM) product (this is required for the OAuth connection to work) 
- 
Read access to Leaves in Rippling (if you want leave tracking data to appear in Vanta) 
- 
Each Rippling product you turn on in Vanta (HRIS, MDM, Background checker) must be active in your Rippling account
⚠️ Important: Only one HR provider can be connected in Vanta at a time. If you already have a different HR system connected, you must disconnect it before connecting Rippling HRIS. 
 
 

## Setup guide
- 
In Vanta, go to the Integrations page, click Add integration, and search for Rippling. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2298725865/b050866f3d57015e5b9846c58323/ec3f79f5-5093-423e-b277-b09786cdd094?expires=1794967200&signature=d1284020ea56470ded1763d49f12268e57bc2db164cc5e02365da9e41f663faf&req=diIuHs58mIlZXPMW1HO4zXaNdm%2FFj3%2FrHlO5Zk0kwn6gspfyPrmk6z2CAN3D%0AhQgCNoeGyvU27d%2FFkKE%3D%0A>
- 
Select which Rippling services you wish to connect with Vanta
- 
Human Resource Information System (HRIS) 
- 
Mobile Device Management (MDM) to demonstrate employee computers are configured securely
- 
Background checker
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2298730116/5854d25b4bffa8f0c84848cee910/174f72d7-d7df-4be0-a71e-85fe4d91735c?expires=1794967200&signature=ebdee03a8eff0fa73d563263a23f6718eb2a64a095b4eccdb21be16f926f8a4f&req=diIuHs59nYBeX%2FMW1HO4zQfEvOzxht6hEf%2FBdi7qwnSfvu2puzn6wfPAIi50%0AMUenYFvrPImatFiPheE%3D%0A>
- 
Click Next. 
- 
Click Connect Rippling. 
- 
You'll be redirected to the Rippling sign-in page. Be sure to sign in using your Rippling admin account. 
ℹ️ Note: If you are the Administrator in Rippling but not in Vanta, you can invite the person who can connect Vanta to Rippling.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2298738622/57970f4b9e9ef42f0bea211c13b7/8b766678-e70c-4a24-aabe-633d919b43d8?expires=1794967200&signature=da45598649cd4ef1449989d6f426fa7fe4d6c6d092ed6a654b003e05c30d3975&req=diIuHs59lYddW%2FMW1HO4zfSuU6qUBlOUscI34TpbPBAXhHs7IG%2FLxC8vcztT%0A52NZ%2BE3Awd1ybsmp7nQ%3D%0A>
- 
Review the list of data Vanta is requesting access to and click Authorize.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2298739836/1fde34bb6f16b48ceb86662882c1/9b43ffa2-1c8b-4f4c-b035-a444e304068c?expires=1794967200&signature=f6af545a055504673b2829e5c49060218d0c2a590646298077c8748472b851f1&req=diIuHs59lIlcX%2FMW1HO4zeydSV7nLW8X3gLAfcOsXIRUAMSraIX%2Fb8gWB14n%0A9XdwH2PjP6sNp9%2Bv82A%3D%0A>
- 
Click Continue to be automatically redirected to the Vanta Integrations page. 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2298741324/b78939a0d3e6d07318180aa69212/210da98b-6eff-4d9b-b201-5f8944635281?expires=1794967200&signature=4787a50fe1b514b85cf83b376cc3b23730912d6eee7de6bf9e840d3b194a5cb4&req=diIuHs56nIJdXfMW1HO4zXPBGzF5ozCYN7Qx7RBvmZT8NAtwB8htbvJlRCnK%0ApV%2BAsbEAq90prIhOgVU%3D%0A>
 
ℹ️ For HRIS Connections: You'll be prompted to set a cutoff date. This determines which employees are imported. Vanta will include employees who were active on or after this date. This date can be edited at a later time from the integration settings.
⚠️ Important: Complete this step carefully. Clicking outside the cutoff date dialog without saving will leave the date blank, which may cause employees to be missing from Vanta. If this happens go to Integrations → Manage → Edit Cutoff Date to set it.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2298744506/3c34270e21032d69b14a0d74c0b7/35c1ade8-ec5f-4fed-a760-2844b6e0fad2?expires=1794967200&signature=89493c63fea197a768fb728eabeec6d565d19b57efda18e7d2a80214536658a8&req=diIuHs56mYRfX%2FMW1HO4zTPSyed6%2FufOU0uXZ86GcMjT%2F5lpAf9oXwknsKme%0A%2B6IDuH23oGyaMqb%2BKJY%3D%0A>
- 
Your connection is complete! Depending on the number of resources to be synced, these can take some time to be populated. You can configure scope at a later time by clicking on Configure Scope on the Integrations page in Vanta.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2298745367/fffcdb5b7bd7c0c72da6330a1f25/bd6a1021-5b3b-4c02-9347-19f779fc3e11?expires=1794967200&signature=10b1ff59dcac8d44631d2aedb54cd0552c8502d921f3885f3b49354b6ffc525d&req=diIuHs56mIJZXvMW1HO4zT1EOINCTTK8vGtpBRgSQAcy3D1JfTBBQqarJ6RF%0AdRQynh7BXo8IjekNc3c%3D%0A>
 
 

## Verification and validation

### Where to find synced data
After setup, data appears in Personnel → People (employees), Personnel → Computers (devices), Personnel → People → Background checks (background checks), and Tests (automated tests). 
 

### What to check if data is missing
 | 
Data missing | 
What to check
 | 
Employees | 
Verify the cutoff date is set: Integrations → Connected → Manage → Edit cutoff date
 | 
Devices | 
Confirm MDM is active in Rippling and the device is a desktop or laptop with a serial number
 | 
Background checks | 
Confirm Background checker is active in Rippling
 | 
Leave data | 
Confirm the connecting Rippling user has Read access to Leaves; reconnect if the permission as added after initial setup
 
 

## Permissions
We use the connection to read employee records, pull device inventory reports, and retrieve background check status. We also initiate report generation in Rippling (for MDM and background check data) by requesting that Rippling compile a report. This doesn't create or modify any customer data in Rippling. 
 

### Permissions details
 | 
Permission | 
Description | 
Use cases
 | 
employee:name:read | 
Read employee first name, last name. | 
We identify employees for access reviews and compliance tracking.
 | 
employee:employmentType:read | 
Read employee employment type. | 
We identify whether employees are full-time, part-time, or contractors.
 | 
employee:title:read | 
Read employee job title. | 
We pull in job title information for employee records.
 | 
employee:workEmail:read | 
Read employee work email. | 
We match employees across systems for access reviews.
 | 
employee:startDate:read | 
Read employee hire date. | 
We track employee onboarding dates.
 | 
employee:endDate:read | 
Read employee termination date. | 
We track employee offboarding and termination dates.
 | 
employee:roleState:read | 
Read employee status. | 
We determine whether employees are active or inactive.
 | 
employee:department:read | 
Read employee department. | 
We pull in department assignments for employee records.
 | 
employee:read | 
System scope for employee data access. | 
Required system-level permission for reading employee records.
 | 
reports:hardware:read | 
Read hardware report. | 
We pull in device inventory data for MDM compliance.
 | 
reports:hardware:write | 
Write hardware report. | 
We request that Rippling generate a hardware inventory report, then read the resulting device data for MDM compliance.
 | 
reports:soc2:read | 
Read SOC 2 report. | 
We pull in background check status reports for compliance.
 | 
reports:soc2:write | 
Write SOC 2 report. | 
We request that Rippling generate a background check status report, then read the results for compliance tracking. 
 | 
company:leave_requests:read | 
Read company leave request records. | 
We pull in employee leave request data including leave types, dates, and approval status.
 

### Write access 
Our write access to Rippling is limited to initiating report generation. This triggers Rippling to compile a report (Hardware, SOC 2) that we then read. No employee records, device records, or customer data are created or modified by us in Rippling. We do not create, modify, or store any documents in your Rippling account.
 
 

## Troubleshooting and FAQs
Issue: Connection fails at authorization
- 
Likely cause: The connecting user lacks Rippling admin permissions, or the Rippling account doesn't include the IAM product.
- 
Fix: Use a Rippling administrator account to reconnect. If your account doesn't include IAM, confirm your plan with Rippling before retrying.
 
Issue: 400 error or integration disconnects after setup
- 
Likely cause: A product was selected in Vanta (HRIS, MDM, or Background checker) that is not active in your Rippling account.
- 
Fix: Go to Integrations → Rippling → Reconnect and select only the products active in your Rippling account.
 
Issue: Leave data is missing
- 
Cause: The connecting Rippling user doesn't have Read access to Leaves, or this permission was added after the initial connection was made.
- 
Fix: Confirm the permission is assigned in Rippling, then go to Integrations → Rippling → Reconnect. Leave data will sync after reconnection.
 
Issue: Background check data is missing when using Rippling's Checkr integration
- 
Cause: Rippling has a native integration with Checkr. However, Vanta does not support background check data that flows through Rippling's Checkr integration — the chain of data is broken and Vanta cannot read it.
- 
Fix: Connect Checkr directly as a separate integration in Vanta. Go to Integrations → Available → search for Checkr and connect it independently. This ensures background check data syncs correctly in Vanta.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-rippling--01.png
- [image 02] ../../images/integrations/rippling/connecting-vanta-rippling--02.png
- [image 03] ../../images/integrations/rippling/connecting-vanta-rippling--03.png
- [image 04] ../../images/integrations/rippling/connecting-vanta-rippling--04.png
- [image 05] ../../images/integrations/rippling/connecting-vanta-rippling--05.png
- [image 06] ../../images/integrations/rippling/connecting-vanta-rippling--06.png
- [image 07] ../../images/integrations/rippling/connecting-vanta-rippling--07.png
