# Controlling Scope through JumpCloud

Source: https://help.vanta.com/en/articles/11345662-controlling-scope-through-jumpcloud
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Vanta's JumpCloud identity provider integration enables you to control which employees should be automatically marked in and out of scope in Vanta, through JumpCloud.
Be sure to consult Support and/or your auditor to validate the set of employees that should and should not be managed by Vanta
Ensure the Vanta app is configured correctly in JumpCloud
- 
You must have the Identity Provider part of the integration activated
​
​
Grant the application to employees who should be in-scope in JumpCloud
- 
Follow the instructions provided by JumpCloud <https://jumpcloud.com/support/authorize-users-to-an-sso-application> to grant the Vanta app to employees who should be in-scope.
Enable the feature in Vanta
- 
Select Integrations from the left-hand panel
- 
Search for JumpCloud in the Connected tab, and click on the Configure scope button
- 
Enable the IdP scoping toggle
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766288/b381585fa42ca900afc34755dc92/19011543397268?expires=1794967200&signature=f0a34cbff0f164b169b869b5300aa7b80db4ae80cd43f3ebede889d9d053fe20&req=dSUmEM54m4NXUfMW1HO4zXoDUWxsOIviuGMtltyqiLpI91rzNKcrT5iyoxPO%0AisrVpxKxs6HkVpWwl1g%3D%0A>
- 
Once this feature is enabled, all employee scoping will be managed through JumpCloud, and the scoping toggle for accounts and users in Vanta will be disabled
- 
Vanta will update the scope status for JumpCloud accounts and users on the following data fetch, which happens hourly
- 
Keep in mind that you can still manually scope managed computers
- 
Note that accounts and users are scoped by this functionality but used in different places within Vanta. Accounts are used for access review, while users are used for employee management (the people page) and log-in
- 
You may also allow or disallow fetching staged users from JumpCloud
⚠️ Note: When Control scope with JumpCloud is enabled, accounts who are removed from the Vanta application in JumpCloud will be marked as out of scope in Vanta, which may potentially also mark associated personnel as out of scope.
 
If your offboarding process removes accounts from the Vanta application manually before deactivating or deleting the accounts, those accounts and associated personnel will no longer be visible in Vanta for audit review. To ensure terminated employees remain visible for compliance purposes, consider:
- 
Keeping accounts belonging to terminated personnel assigned to the Vanta application in JumpCloud until audit evidence has been collected, and do not remove application assignment BEFORE deactivating or deleting the accounts.
- 
Disabling Control scope with JumpCloud and managing scope directly in Vanta (see How do I Mark Resources Out of Scope? <https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope>)

## Images

- [image 01] ../../images/ux/integrations/controlling-scope-through-jumpcloud--01.png
