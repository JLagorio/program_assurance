# Managing Access Requests in Vanta

Source: https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta
Collection: Team Compliance ; Team Compliance › Access
Fetched: 2026-11-17

## Article text

With Vanta, requesting access to company applications is simple and trackable. Personnel can submit access requests, which Vanta routes to the correct approver and application admin and tracks from submission to completion. This feature is especially helpful for IT teams and managers looking to streamline and track access in one place.
 
ℹ️ Note: Approving an access request in Vanta doesn’t create an account or grant permissions in the requested application. The application admin must provision the access outside Vanta, then mark the request as provisioned in Vanta.
 
 

## Get Started with Access Requests
- 
From the left-hand navigation, select Access
- 
From the top navigation, select Requests
You can now view and manage incoming access requests from your personnel.
 
 

## Enable an Application for Access Requests
- 
Select Manage applications
- 
Click on an application you want to enable
- 
Choose an application Approver — the person who approves requests
- 
Choose an application Admin — the person who provisions the account
- 
(Optional) Configure access levels or require personnel to provide freeform information what permissions they need
- 
(Optional) Require a business justification
- 
Click Enable when finished
  

## Adding an access level
To add a new access level, click Add access level and provide the following:
- 
Name: This is how users of Vanta (both admins managing requests and personnel submitting requests) will see this access level
- 
Description (optional):  Personnel will see this description when selecting an access level in an access request. Use it to provide more information or suggestions about who needs this level of access
- 
Entitlement (optional): If this application is integrated with Vanta, you can map it to an entitlement from the integration. Learn more below.
 

## Mapping an access level to entitlements
For integrated applications, Vanta recommends you map access levels to entitlements. Entitlements are the actual role or permission Vanta pulls from the integration’s API. By mapping the entitlement to the access level, Vanta can match the access level in the access request to the actual role on the account that we pull from the integration.
 
The entitlement name is exactly the role or permission Vanta pulls from the integration’s API. Vanta doesn’t run any formatting on the name (e.g., capitalization).
 
The depth and quality of entitlements is dependent on what each integration’s API makes available. If you have any feedback on the list of entitlements available for an integration, please let us know here <https://airtable.com/appdzE72Z37wqchNp/pagw1c6TyTvxH0wRV/form?prefill_Product=Integrations+%28New%2FExisting%29&prefill_Submitter+Email=chris.morris%40vanta.com&hide_Submitter+Email=true> and we will investigate.
 
 

## Connect Slack to Manage Access Requests
- 
Navigate to Settings > Notifications in your Vanta dashboard.
- 
Click Connect Slack.
- 
Follow the prompts to authorize the integration.
Once connected, Slack will be enabled for access request notifications automatically.
 
 

## Submit an Access Request
- 
From the left-hand navigation, click My access requests
- 
All personnel can access this page, regardless of role
- 
Click on an application
- 
Fill in a business justification and permission level (if required)
- 
Click Request access
- 
Track request status under My requests
- 
Pending approval = waiting on the approver
- 
Pending provisioning = waiting on the application admin to provision the access in the application
  

## Submit an Access Request via Slack
You can request access directly in Slack using one of the following methods:
- 
Use a Slash Command: Type /vanta request access in any Slack channel or direct message.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1575889033/f1cf90301b43737b31f6265219b0/AD_4nXf-RjF6uaE3qYF__vABTVHzSmILlcm8Jy8tKc0vZA5IblpWfVDJv20J3BkZKd0uWM8QZmRuT_6tbwAdDaGjV2x3IPAInNDuJ3hJFl2qtoC_4za1YknvKUb5hpw7QzOq-Jd30ZJo?expires=1794967200&signature=1957abe802a641c608a46b8e90e3d1c7a710764a054305368ab82f43e3a21dfe&req=dSUgE8F2lIFcWvMW1HO4zb4Rn6kcS3qN8lVUp2PY9sP1nLPXH7wQ%2FFQKzeeu%0AplRB%2BU5oaZApIlHqfKk%3D%0A>
- 
Open the Vanta App: Find the Vanta app in Slack and click Submit access request.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1575891811/eb2071dd76bb6770872ea46f0df4/unnamed+%281%29.png?expires=1794967200&signature=20340a119aa951329470ebceb1f275ab4fc81f2fff70cd29d78cebc381881e8f&req=dSUgE8F3nIleWPMW1HO4zeEnVpjKenshpgkY8%2FbtVPj2zTM4r3TIbfFhJhWY%0ATvysfGzoXDCGrn%2BRifk%3D%0A>
 
Then, fill out the form that appears to complete your request.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1575892198/267ae8ce93be48d83d5225ee30f7/AD_4nXetBZVXu8indw4sc8mzqorllLGayD3vuGoKMjnRSQxK4slwNidlP-pJgUEZ-F-ouAlUUBV4BTgMKfMDtTx_L2dO0fTI72LaOlzzUfSMcRZAiTeBj0M6cA8-FppcIOxh9p9nI0lAng?expires=1794967200&signature=41fdae2dc82da0d7c935d21a2bbf9ed7f2fb22ee1467831ad8b38422cffc596d&req=dSUgE8F3n4BWUfMW1HO4zSr6wFKa603V0NFFOX7%2F%2BQCdp2Jh9JdXTDPoSJ9q%0AIyrYf1KXLICpHykZWSU%3D%0A>
 

## Approve an Access Request
Approve from Email
- 
If assigned as the approver, you’ll receive an email titled:
​[Action Required] [Name] requested access to [Application]
- 
Click Review request
- 
Click Approve or Deny
- 
If denying, you’ll be prompted to give a reason
- 
Once approved, the request is routed to the application admin
​ 
Approve from Vanta
- 
From the left-hand navigation, select Access, then Requests
- 
If you don’t see this tab, you may not have full admin access
- 
Click an access request with status Pending approval
- 
(Optional) Use Needs my attention to filter requests
- 
Click Approve or Deny
- 
If denying, you’ll be prompted to give a reason
- 
After approval, the request moves to the application admin for provisioning
 
Approve from Slack 
If you're designated as the application approver, you'll receive a Slack message when someone submits an access request.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1575894259/1671b15275ed611b65cc1ee2a855/AD_4nXcqkDlj58ARKGCGEurN5txrnYJ8TiAXRVa1paescyzrUGqBlavev8XtEsySy7FGAdJXKqF3ebgk_g01flErLgUpUSYsTsf_tGaPEx0ThFuIJYmTI_jF18yuYwRjgGatHFzd9HYIkQ?expires=1794967200&signature=24c278dbee8986961d9383cc183639ce27a741a2bdad745be2b0ae7ee5f89302&req=dSUgE8F3mYNaUPMW1HO4zfdpB8s1H6fQ6M3s11DJYXrZ0s4hN6Dd4%2FJSRt6e%0A2UaYFkT%2F196mF6bnYi0%3D%0A>

You can approve or deny the request directly from that message, no need to leave Slack.
 

## Mark an Access Request as Provisioned
Before marking a request as provisioned, create the account or grant the requested access directly in the application. Marking a request as provisioned records completion in Vanta and notifies the requester. It doesn’t change access in the application.

## 
Mark from Email
- 
If you’re the application admin, you’ll get an email titled:
​[Action Required] Provision a [Application] account for [Name]
- 
Click Review request
- 
Click Mark as provisioned
- 
The request is marked complete, and the requester is notified
​ 
Mark from Vanta
- 
From the left-hand navigation, select Access, then Requests
- 
Click a request with status Pending provisioning
- 
(Optional) Use Needs my attention to filter requests
- 
Click Mark as provisioned
- 
The request is marked complete, and the requester is notified
​
Mark from Slack
If you're an application admin, you'll receive a Slack message once an access request is approved.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1575896019/293577a32362a1cdff77db5b394f/AD_4nXeifG62w6BLxWus-kCmm9iLLbrL2xpg43Avy-vRzs_WGRZJoOTSqZbo0qgCAJc6TINtmgjPLHAsTRKrfeelL9TcJNosTZdkpiKZhW-nap24lNzZvf2A92Zs5RwkKxFsNq0vhpdK?expires=1794967200&signature=bc0f3633ea0003d2be299d4bc9434830cfd6591de6191e971b06cbee9dbf151a&req=dSUgE8F3m4FeUPMW1HO4zWb2iqcgOBBvOxfHkeM0TJBLcfvjtlEq62XCzFm2%0ASmgCGKNWeQ8hsms79Lw%3D%0A>

You can mark the request as provisioned directly from that message.

​

## View All Company Access Requests
Admins with access to the Access Module can see all access requests:
- 
From the left-hand navigation, select Access, then Requests
- 
View all requests and statuses from this page
- 
Use filters:
- 
Needs my attention = requests assigned to you
- 
Open requests = all pending company-wide requests
 

## FAQ
ℹ️ Note: We updated our terminology from system to application. For example, System Admin is now referred to as Application Admin.
 
Who should I contact with feedback?
- 
Please submit product feedback here <https://airtable.com/appdzE72Z37wqchNp/pagw1c6TyTvxH0wRV/form?prefill_Product=Integrations+%28New%2FExisting%29&prefill_Submitter+Email=chris.morris%40vanta.com&hide_Submitter+Email=true>.
 
Can application admins and approvers see access requests?
- 
Yes! They can view and act on any access request assigned to them in Vanta. They must have the Collaborator Role. Vanta will check for this before enabling an application.
 
Can I submit another request for an application I’ve already requested access to?
- 
Yes. You can submit multiple access requests to the same application if needed.
 
Will these requests connect with Access Reviews or Offboarding?
- 
We're actively building support to surface access requests during reviews and offboarding.
 
What if an approver or application admin leaves the company? 
- 
If an assigned approver or application admin is no longer an active Vanta user, access requests for that application are blocked until you update the assignment. Anyone opening the application under My access requests will see a warning identifying the invalid approver, admin, or both.
- 
To update the assignment:
- 
Go to Access → Requests → Manage applications.
- 
Open the affected application.
- 
Replace each invalid Application approver or Application admin with an active Vanta user. You only need to change the assignments identified as invalid.
- 
Click Update.
- 
If your workspace has an Applications tab under Access, you can instead update the application's Approver and Admin fields directly from that tab. Changes save automatically.
 
What integrated applications currently support access levels?
- 
The following integrations support access levels today: 
- 
Slack, Checkr, Bitbucket, Cloudflare, Zoom, Sentry, Asana, Knowbe4, Calendly, OpenAI, Zendesk, Jamf, Pagerduty, Heroku, Monday, Snyk, Brex, Supabase, Box, Clubhouse, Fivetran, Launchdarkly, Tenable, Netlify, Lattice, Grafana Cloud, Ramp, Ashby, Curricula, Render, Smartsheet, Opsgenie, Twingate, Qualys, Doppler, Workspace One, Lever, Guru, Sigma, Lacework, Asset Panda, Dockerhub, Hook, Torii, Statsig, Vendr, Harness, Productboard.
 
Why do only some integrated applications support access levels?
- 
Vanta is rolling out access levels gradually to our integrations in order to ensure the entitlement data being pulled from each integration is high quality.
 
How does Vanta get the list entitlements for an application?
- 
Vanta gets the list of entitlements for an application by building a deduplicated list of the entitlements pulled from all the accounts fetched by the integration (including those fetched in the past but since deleted). For example, we might see that 5 accounts pulled from Slack have the “Member” entitlement and 2 accounts have the “Admin” entitlement; as a result, the list of entitlements for Slack would be “Admin” and “Member”.
- 
A limitation of this approach is that if an entitlement was never actually assigned to an account, Vanta won’t know about it since it never appeared in the integration’s API fetches. 
 
I’m trying to add an access level for an integrated application but an entitlement is missing. What should I do?
- 
An entitlement might be missing because:
- 
No accounts currently fetched from the integration have this entitlement.
- 
The application's API doesn’t make entitlements available.
- 
Vanta's integration isn’t pulling the entitlement properly. Please leave us feedback here <https://airtable.com/appdzE72Z37wqchNp/pagw1c6TyTvxH0wRV/form?prefill_Product=Integrations+%28New%2FExisting%29&prefill_Submitter+Email=chris.morris%40vanta.com&hide_Submitter+Email=true> and we will look into fixing the issue.

## Images

- [image 01] ../../images/ux/access/managing-access-requests-in-vanta--01.png
- [image 02] ../../images/ux/access/managing-access-requests-in-vanta--02.png
- [image 03] ../../images/ux/access/managing-access-requests-in-vanta--03.png
- [image 04] ../../images/ux/access/managing-access-requests-in-vanta--04.png
- [image 05] ../../images/ux/access/managing-access-requests-in-vanta--05.png
