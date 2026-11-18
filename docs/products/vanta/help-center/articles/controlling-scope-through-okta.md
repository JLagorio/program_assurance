# Controlling Scope Through Okta

Source: https://help.vanta.com/en/articles/11345660-controlling-scope-through-okta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

The enhanced Okta integration makes it easy to define which employees should be added to Vanta and which should be kept out of scope. Using your IdP as the source of truth for employee scoping, you’ll reclaim the lost time spent managing multiple applications and benefit from a faster, simpler workflow.
 
To prevent importing all users <https://help.vanta.com/en/articles/11346102-frequently-asked-questions-vanta-okta-integration>, keep “Use Okta to populate the People page” turned off until you’ve configured Okta scoping.
 

## Configure Okta
- 
Log in to Okta and navigate to the Assignments tab for the Vanta app (Vanta SAML)
- 
Assign the Vanta app (Vanta SAML) in Okta to the desired employees or groups. For setup instructions, visit the Okta help center
- 
How to assign an app to a group in Okta <https://help.okta.com/en/prod/Content/Topics/users-groups-profiles/usgp-assign-app-group.htm>
- 
Creating group rules in Okta for automatic assignment <https://help.okta.com/en/prod/Content/Topics/users-groups-profiles/usgp-create-group-rules.htm>

## Validate Account Assignments
- 
Verify that the list of employees and/or groups assigned to the Vanta app reflects your desired scoping preferences.
- 
Vanta recommends creating an automated provisioning process to assign the Vanta app to new employees.

## Enable the Feature in Vanta
- 
Navigate to the Integrations Page
- 
From the Connected tab, search for Okta
- 
Select Configure scope
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766104/b09bd3f99c14fc6fbb3751d2929f/27499512824724?expires=1794967200&signature=3ef92c6cc1b49cdf7922b133142e350fe7c923141ba61310e7e980c31aea5c4e&req=dSUmEM54m4BfXfMW1HO4zdJZJnSAsA6%2BFDpVkYXvME4E6IMK8TNLDdzPOJSs%0AnTwBqnOkOtxwWgsR73k%3D%0A>
- 
Enable the IdP scoping toggle
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766111/725a5b12700b218e9ab12e96f4e4/27499512849684?expires=1794967200&signature=3f40ba72ff0cee46ceba011de8ffdb19cfd4a7a71c6b9ad445dc87af2662d0f8&req=dSUmEM54m4BeWPMW1HO4zUPgLKGaOIo58YPNd3ikmkX00idqmNievsCiMtl3%0AzEee3yWeZiRV4QuDGVk%3D%0A>
- 
Once this feature is enabled, all user scope will be managed through Okta, and the scoping toggle in Vanta will be disabled. Vanta will update the scope status for IdP accounts on the following data fetch, which happens hourly.
⚠️ Note: When Control scope with Okta is enabled, accounts who are removed from the Vanta application in Okta will be marked as out of scope in Vanta, which may potentially also mark associated personnel as out of scope.
 
If your offboarding process removes accounts from the Vanta application assignment manually before deactivating or deleting the accounts, those accounts and associated personnel will no longer be visible in Vanta for audit review. To ensure terminated employees remain visible for compliance purposes, consider:
- 
Keeping accounts belonging to terminated personnel assigned to the Vanta application in Okta until audit evidence has been collected, and do not remove application assignment BEFORE deactivating or deleting the accounts.
- 
Disabling Control scope with Okta and managing scope directly in Vanta and managing scope directly in Vanta (see How do I Mark Resources Out of Scope? <https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope>).
 

## Creating Multiple Vanta Okta apps for Workspaces
If you use Vanta Workspaces, you can add multiple Vanta apps in Okta, one for each Workspace.
- 
Follow the same steps under “Add Vanta to your Okta Account”.
- 
When you select Add Integration and complete the prompts under General settings, ensure the app label contains Vanta (name must be exact).
- 
You can choose to customize the text in parentheses.
- 
When you connect Okta on the Integrations page, we will recognize if you have multiple Vanta apps in Okta. After adding your API Token and Okta domain, you’ll see a prompt on the next step to select the Vanta app you want to connect.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766103/9e1875a14150ca8851f0796de1c5/KHEV-G3NqhlxqPo8aPsugWqiUEgNgzhjL1WCHVmY5AT5eIKNkgKaaRhcpCcWrBk2RjIsKiU2HnMyjJSwzaBIlK0Z36XJyHngNfnlMCLoi4z9X__s1agfjE65-aqhs48Q_BRaIz1UcHfxxpI4oalJSEE?expires=1794967200&signature=dc7ffd9b2a5d0f07a803a1a5d787307443220fef85577f5d41d8deb3bac26685&req=dSUmEM54m4BfWvMW1HO4zbf%2BAFnu5SUUnZuES3%2Fch2Qlk5891bhBsrFZVvD%2F%0AIg58gyyFCsMfu1ODJpQ%3D%0A>
Once you select the Vanta app you want to connect, paste the Vanta domain ID into the Domain ID field of the app you chose.
 

## Controlling scope with multiple Vanta Okta apps
- 
Follow the instructions in Controlling Scope Through Okta <https://help.vanta.com/en/articles/11345660> to choose which employees should be added to Vanta.
- 
If you’ve created multiple Vanta Okta apps for each Workspace, you can choose to assign different employees and/or groups to each Vanta app to control scoping for each Workspace.
Be sure to consult your auditor, or reach out to Vanta Support to validate the set of accounts that should and should not be managed by Vanta.

## Images

- [image 01] ../../images/ux/integrations/controlling-scope-through-okta--01.png
- [image 02] ../../images/ux/integrations/controlling-scope-through-okta--02.png
- [image 03] ../../images/ux/integrations/controlling-scope-through-okta--03.png
