# Connecting Vanta & Envoy

Source: https://help.vanta.com/en/articles/11345723-connecting-vanta-envoy
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
The Envoy integration connects your Envoy account to Vanta over OAuth, allowing Vanta to read employee data and display it on your Access page for personnel tracking and access reviews. The integration supports both the US and EU Envoy environments, and a single Vanta domain can connect more than one Envoy company.
 
Estimated setup time: 5 minutes
 
 

## Use cases and capabilities
- 
Personnel and Access Tracking: Vanta reads employee records from Envoy and lists them on the Access page as Vanta accounts, so you can track and review Envoy access alongside your other connected systems.
⚠️ Note: Employees without at least one assigned location in Envoy are excluded from sync.
- 
Multiple Envoy Connections: Link more than one Envoy company to a single Vanta domain, each with its own connection name. Useful for organizations with separate subsidiaries or business units in Envoy.
- 
Hosting Region Selection: Choose the Envoy environment where your organization's data lives, United States (envoy.com) or Europe (envoy.eu).

### Capabilities overview
 | 
Resource/Capability | 
Supported | 
How it is used in Vanta
 | 
Employee/User Accounts | 
Yes | 
Personnel tracking and access reviews on the Access page
 | 
Location-based filtering | 
Yes (automatic) | 
Employees without an assigned Envoy location are excluded from sync
 | 
Multiple Envoy connections | 
Yes | 
A single Vanta domain can connect more than one Envoy company
 | 
Hosting region (US/EU) | 
Yes | 
Connect to envoy.com (US) or envoy.eu (EU)
 | 
Account status/deactivation | 
No | 
Envoy's employee data doesn't include suspension or termination status, so it isn't reflected in Vanta
 | 
Write-back to Envoy | 
No | 
Vanta only reads Envoy data 
 | 
Task/evidence syncing | 
No | 
Not supported for this integration 
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have an Envoy account with Admin or Global Admin access. A Global Admin account is preferred, since it can see all locations across your organization.
- 
You know which Envoy hosting region your organization uses: United States (envoy.com) or Europe (envoy.eu). Selecting the wrong region will cause the Envoy login step to fail.
 
 

## Setup guide

### Step 1: Find the Envoy integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Envoy. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2579089510/37443cd4be5d1bc8203b17d16970/image.png?expires=1794967200&signature=15e742ac07ced4e1f358dce0d045cba3777ca9148802f2c4e452237ba13d1836&req=diUgH8l2lIReWfMW1HO4zT2uulEG7q2diX9MpwPu3M9atw82t%2B5WXWmQGfl3%0A94Jz6xBF0jb7q5NIa0s%3D%0A>
 

### Step 2: Authorize the connection
- 
In the Envoy Connections modal, click Add Connection.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2579090906/9a63f06838b48c61ff9d5fa074c8/image.png?expires=1794967200&signature=3c5a80701a63d2ba1d45e6101e4d19ac1555518425ccfef8c80bebf188629519&req=diUgH8l3nYhfX%2FMW1HO4zXB3u%2ByT1tSHZ%2BSBu2OFxG78oFva6fcu44RLpSMk%0A829M1z3bWCqy2wtSkDQ%3D%0A>
- 
In the Link Envoy modal, provide a Connection Name, select the appropriate Hosting Region, and click Connect Envoy.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2579096036/f99d0fc6af9690d6889112edda04/image.png?expires=1794967200&signature=3ac99269bdf85f62256b441653d58d40ce5c45bbc936a5814379639f320c9efe&req=diUgH8l3m4FcX%2FMW1HO4zYHoYY%2FEV6d%2F2U5R%2FgCufVYmSYmQUqLIflZhBuzB%0A4nhrgkEzuFwGXre4iXE%3D%0A>
- 
Vanta redirects you to Envoy's authorization page. If you aren't already logged in, log in with the Envoy account you want to use for this connection.
- 
Review the permissions Vanta is requesting and approve access.
- 
Envoy redirects you back to Vanta automatically.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759873/f1bcfe1b7a0468e5fe4e6ef3acb8/22755263525652?expires=1794967200&signature=ab407f940d83edf4390cb3aeeb5598d8742c9e93345f000c001d8bf4fc94ec50&req=dSUmEM57lIlYWvMW1HO4zZ6lElaFqDSDD0Avg23vdzy2ywaqUNnsQz3n5jFW%0AlnXNGeoQySQFbnuIKT4%3D%0A>
ℹ️ Note: If your organization uses more than one Envoy company (for example, separate subsidiaries or regional accounts), you can add additional connections from the same integrations page. Each connection is authorized separately and tied to a specific Envoy company. To connect another account, go to Integrations > Connected > Envoy > Edit > Add Connection.
 

### Step 3: Confirm the connection
- 
After authorizing, the Envoy connection should appear as Connected in your Vanta integrations list.
- 
Vanta begins reading employee data from Envoy shortly after setup completes.
 
 

## Reconnecting existing connections (company ID update)
Vanta now identifies every Envoy connection by your Envoy company ID, so it can keep each connection correctly associated with the right Envoy organization and avoid linking the same company more than once.
 
If you connected Envoy before this update, you'll see a Reconnect required banner in the connections list, naming each connection that still needs to be re-authorized. You won't be able to add a new connection until every existing connection has been reconnected.
 
To reconnect:
- 
Go to Integrations > Connected > Envoy > Edit.
- 
For each connection flagged with a warning icon, click Edit (the pencil icon).
- 
Confirm the connection name (and hosting region, if shown), then click Connect Envoy and approve access in Envoy.
- 
Repeat for every flagged connection.
- 
Once all connections are reconnected, Add Connection becomes available again.
 
 

## Permissions

### Read access
We use the authorization you grant during setup to read employee records, location assignments, and company information from your connected Envoy account(s), and to display that data on your Access page in Vanta.
 

### Write access
Vanta does not have write access to your Envoy account. We don't create, modify, or delete any employees, locations, or companies in Envoy.
 
 

## Troubleshooting and FAQs

### The integration shows as disconnected or needs reconnection
- 
Likely cause: The Envoy authorization was revoked, expired, or the account used to connect no longer has access.
- 
How to confirm: Go to Integrations in Vanta and check the status of the Envoy connection.
- 
Fix: Click Reconnect (or Edit > Connect Envoy) on the affected connection and complete the OAuth flow again.

### "Add Connection" button is missing or disabled
- 
Likely cause: One or more existing connections still need to be reconnected under the new company ID requirement.
- 
How to confirm: Check the connections list for the Reconnect required banner.
- 
Fix: Reconnect every flagged connection (see Reconnecting existing connections above). Add Connection becomes available once all connections are up to date.

### Envoy login fails immediately after selecting a region
- 
Likely cause: You selected the wrong Hosting Region for your organization.
- 
How to confirm: Check which URL your team actually uses to sign in to Envoy (envoy.com vs. envoy.eu).
- 
Fix: Edit the connection and choose the region that matches where your team signs in to Envoy.

### "The account ID of the credential from the OAuth integration already exists"
- 
Likely cause: That Envoy company is already connected to Vanta under a different connection name.
- 
Fix: Edit the existing connection instead of adding a new one.

### "Vanta couldn't retrieve your Envoy company" or reconnect keeps failing
- 
Likely cause: The Envoy account used doesn't have permission to view company information, or the authorization didn't complete fully.
- 
Fix: Retry the reconnect and confirm the Envoy account has the required access. If the issue persists, contact Vanta support.

### User accounts are missing or incomplete after sync
- 
Likely cause: The employee doesn't have a location assigned in Envoy. Vanta excludes employees without at least one location from sync.
- 
Fix: Assign a location to the employee in Envoy, or confirm the account used to authorize the connection has visibility into the relevant locations.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-envoy--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-envoy--02.png
- [image 03] ../../images/integrations/envoy/connecting-vanta-envoy--03.png
- [image 04] ../../images/integrations/envoy/connecting-vanta-envoy--04.png
