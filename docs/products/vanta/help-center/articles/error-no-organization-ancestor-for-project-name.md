# Error: “no organization ancestor for (project name)”

Source: https://help.vanta.com/en/articles/11345918-error-no-organization-ancestor-for-project-name
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Environment Details
- 
When connecting GCP, the following error is received - "ERROR: no organization ancestor for (project name)"

## 
Cause
In order for the Vanta integration to work successfully, projects must exist within an organization. Projects without a parent organization are currently not supported by the Vanta integration. To check if your project exists within an organization, follow these steps.
- 
Navigate to the Google Cloud console and select the project selector drop-down on the top left. Find "Manage Resources" from the menu button in the modal that appears
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760687/32e2096cbbe84c2072d40aa5fea0/17267369838996?expires=1794967200&signature=c6a88f4a166045ea5a87937920edba108992b13b5047a98e08662f499fef3bed&req=dSUmEM54nYdXXvMW1HO4zQbUHQ3uxvx44hnRtZfkiBsJsqrXutggnu2E2pdw%0AqoegEoD09tll7FZmzvA%3D%0A>
 
- 
On the Manage Resources page, you can see all GCP projects more clearly. If you do not see the organization's icon (a building) as a parent for your projects, the projects do not currently sit within an organization. See a valid setup for Vanta below:
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760686/0d5cc3f55be244a721b4d6517703/17267369843732?expires=1794967200&signature=ab80dfddeb2b917173041185858b7ebabbec67969bfb70f391e0300107a4ea7a&req=dSUmEM54nYdXX%2FMW1HO4zde3wPY%2FGRF0RO4AWIrV6ym0s5B91mRLtzsjBtee%0AJexCyWA9fW2na9QronU%3D%0A>
 

## Resolution
- 
If projects are not within an organization, first create the organization <https://cloud.google.com/resource-manager/docs/creating-managing-organization>
- 
Next, migrate your projects <https://cloud.google.com/resource-manager/docs/project-migration> into the organization

## Images

- [image 01] ../../images/integrations/gcp/error-no-organization-ancestor-for-project-name--01.png
- [image 02] ../../images/integrations/gcp/error-no-organization-ancestor-for-project-name--02.png
