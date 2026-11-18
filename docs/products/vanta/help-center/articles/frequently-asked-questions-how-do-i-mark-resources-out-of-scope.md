# Frequently Asked Questions: How do I Mark Resources out of Scope?

Source: https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

You may have some inventory items built into your infrastructure that have yet to be included in the scope of your audit. You can mark them out of scope on the Integrations <https://help.vanta.com/en/articles/11345761>.
You can mark resources out of scope in the following connection types:
- 
Cloud Provider
- 
Identity Provider (IdP)
- 
Version Control System
- 
Human Resource Information System (HRIS)
- 
Datastore Provider
- 
Mobile Device Management Tool (MDM)
 

## Manually Configure the Scope of Your Resources
- 
Select Integrations from the left-hand navigation panel
- 
Choose the integration you would like to adjust, and select configure scope
- 
From here, you can toggle each option off or on one by one, or select:
- 
Mark all in: to mark all options in scope
- 
Mark all off: to mark all options out of scope
- 
Changes will be saved automatically
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769247/43856e0a0c9314dfa339450a15e3/21995609974548?expires=1794967200&signature=8f6c9b2a4ce58f4c103f271492482e09ab6a69c00a4591cd8896563f4a81f0ee&req=dSUmEM54lINbXvMW1HO4zUTWq1fNgxbGNp2%2FpF%2FWvJR4ntRHNIH%2BavtOXBhP%0ANxXYz265ok5PBBK1x0I%3D%0A>
 

## Scoping through Tags
- 
Vanta supports reading tags (called labels in GCP) from our various cloud provider integrations to populate different attributes of cloud resources, such as owner, description, user data, and scope. While these attributes can be set manually on the inventory page or integration page for scoping, these fields are not persistent and will disappear once the integration is disconnected. For this reason, we recommend using tags, as they are continuous and more scalable.
- 
Tagging can be done through the following:
- 
Vanta tags <https://help.vanta.com/en/articles/11345627>
- 
Custom tags <https://help.vanta.com/en/articles/11345627>
 

## What should be considered In-Scope or Out-of-Scope for an audit?
- 
In-scope inventory should include any item used in your production environment, items containing sensitive information, and items containing user data. It is essential to ensure these items are secure due to the nature of the information they contain.
- 
Out-of-scope inventory could be any items not used in a production environment or items that do not contain sensitive information.
 

## Turning off automatic scoping of new resources
By default, Vanta automatically scopes in new resources as a best practice so that users don't have to manually keep track of resources that are scoped in for an audit. In some scenarios, you may not want this behavior. This behavior is currently only available for the following Version Control System integrations: GitHub, GitLab, and Bitbucket. If you would like to scope in new repositories manually, follow these steps:
 
- 
Select Configure Scope on the Integrations page
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769248/03e8c4d7ea7cf9c5748b45e41fa4/15115712378260?expires=1794967200&signature=095d84f02d3587797cad1c9c8e653c6d70fb91a0f49387bfeae771c0c042f893&req=dSUmEM54lINbUfMW1HO4zby4QmRoBe5wu9vTHR70dMjZxcwKCgwGeYlUVhWU%0AmH4kUfK4yRRLeyO8A34%3D%0A>
- 
Turn off the toggle for Automatically scope in new repositories
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769246/e4c9a99cd3d6cf5bf3f6b709242e/15115785542036?expires=1794967200&signature=44215bee45866fadf34237f12efb8a64520506a0ecb2289adbe9c7808a1eb6c9&req=dSUmEM54lINbX%2FMW1HO4zWA6JmzWytRHGUeEAiSMwzmCmt3YzF70v7e4uf%2BM%0A94yH8e3OXGsPznD3kpw%3D%0A>
- 
Confirm the change in the warning prompt if you would like to proceed.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769245/60591a91b3e48e17b5a510b00670/15115789138324?expires=1794967200&signature=507f79f8663f0770efc436296f63305e46ddad94c9eab5abb1d7925d55d5f11e&req=dSUmEM54lINbXPMW1HO4zVqpE5nKkfDCJRci1cvSBQufwn%2F%2BI3%2Bj9fp%2FTVW1%0Au%2F54mBlNi6jGV1LRLpY%3D%0A>
- 
New repositories will no longer be scoped in by default
- 
Ensure you periodically check for new repositories to ensure you've included the appropriate ones for your audit.
- 
You can always turn the toggle back on if you'd like to scope in new repositories automatically.
 

## Syncing IdP scoping with associated resources
When using IdP scoping to only mark a subset of users within Vanta's scope, it may also be helpful to apply the same scoping logic to any resources fetched from other integrations (like GitHub), so that only resources linked to scoped-in users are marked as within scope.
- 
To do this, you can turn on the Apply user scope to resources toggle by clicking on the Apply user scope button above the list of your connected integrations on the integrations page.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769263/7eababcb0d72ba6189c16087a381/23257142958484?expires=1794967200&signature=9ca461b48e7235506498999b9d7480a40a28094a01add7073e9f6326b656d2ff&req=dSUmEM54lINZWvMW1HO4zXiAcP5r%2BUojR0S2EkT%2FsZSQkO5DuJjSNX35lYUg%0Ag9gJS9J0ktsnEyj%2F82Y%3D%0A>
- 
By default, this is turned off - turning it on will apply the same user-level scoping logic for any associated resources.
- 
This will take effect the next time Vanta pulls in any account information and generally updates it within the hour. Currently, this feature only supports applying IdP scoping to user accounts.
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769264/f688a02ebca4952c7c45fe5c5e65/23257175707284?expires=1794967200&signature=ff3b906daca305bdd4e4c34032e1c97a83cd990e2de58224e3895cc8e7fbf93d&req=dSUmEM54lINZXfMW1HO4zUOHWCZpWqOvf84TfFYaH5ikSqUz7%2B%2FkMShE9kXx%0AYy4gQP76W8M6j1mx%2BOU%3D%0A>
- 
Once this setting is turned on, any accounts that are linked to a user within Vanta will be unable to be manually toggled in or out of scope, and the "Mark all in" and "Mark all out" quick actions will only apply for accounts without a linked user.
- 
To individually mark an account as out of scope, you will need to either unlink it from its current in-scope user (which can be done with the unlink button on the account row), or mark the owning user as out of scope.
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769265/226f454268d4c5aff0d90843db33/23257142979732?expires=1794967200&signature=3e497af7f46230fb0026ee580af1bd0158e7a2a81f658af0be14500deb9879bc&req=dSUmEM54lINZXPMW1HO4zYtkMuzfRlDRFvQAJget7J4IBMKVuo9jS4NcH2SF%0Aevto8NHPClgafYQHZPM%3D%0A>

## Images

- [image 01] ../../images/ux/integrations/frequently-asked-questions-how-do-i-mark-resources-out-of-scope--01.png
- [image 02] ../../images/ux/integrations/frequently-asked-questions-how-do-i-mark-resources-out-of-scope--02.png
- [image 03] ../../images/ux/integrations/frequently-asked-questions-how-do-i-mark-resources-out-of-scope--03.png
- [image 04] ../../images/ux/integrations/frequently-asked-questions-how-do-i-mark-resources-out-of-scope--04.png
- [image 05] ../../images/ux/integrations/frequently-asked-questions-how-do-i-mark-resources-out-of-scope--05.png
- [image 06] ../../images/ux/integrations/frequently-asked-questions-how-do-i-mark-resources-out-of-scope--06.png
- [image 07] ../../images/ux/integrations/frequently-asked-questions-how-do-i-mark-resources-out-of-scope--07.png
