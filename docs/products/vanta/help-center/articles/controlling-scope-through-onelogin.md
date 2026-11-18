# Controlling scope through OneLogin

Source: https://help.vanta.com/en/articles/11345664-controlling-scope-through-onelogin
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Vanta's OneLogin integration enables you to control which employees should be automatically marked in and out of scope in Vanta via OneLogin by granting the Vanta application access to users in OneLogin, and by enabling scoping via OneLogin.
IMPORTANT: Be sure to consult Support and/or your auditor to validate the set of employees that should and should not be managed by Vanta
​
​
 Ensure the Vanta app is configured correctly in OneLogin
- 
Please follow the instructions here. <https://help.vanta.com/en/articles/11345657>
​
​
Grant the application to employees who should be in-scope in OneLogin
- 
Follow the instructions provided by OneLogin <https://onelogin.service-now.com/support/?id=kb_article&sys_id=f34a1d43db109700d5505eea4b9619bd> to grant the Vanta app to employees who should be in-scope.
Enable the feature in Vanta
- 
Navigate to the Integrations
- 
Click on the three-dot menu next to OneLogin and select Configure scope
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766385/9c0349a9de4493dd5079b545b515/16322499036308?expires=1794967200&signature=d82870354436bdc9849ad56f488a5b087b29f9fefcd513bba23f86b5258e8f0e&req=dSUmEM54m4JXXPMW1HO4zfLNtjwf9JPDBmVmOBx6J4ZFsv%2FzX4xPB3evKxr2%0AymKk3K4aiAZO6TA8MbU%3D%0A>
- 
Enable the IdP scoping toggle:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766387/097b4f361bba61d45818390fb8e3/16322522456724?expires=1794967200&signature=0ba91f080ff132e4e77ee3a82691a085b72be44b0ba34c11570c6ffc33e3ed5d&req=dSUmEM54m4JXXvMW1HO4zfDLzUXOaOqlfEQQRdCc%2FzrX6204ZcYpqNjfP3ud%0A6Nu26VkvMmDaB%2BNKY9o%3D%0A>
- 
Once this feature is enabled, all employee scoping will be managed through OneLogin, and the scoping toggle in Vanta will be disabled. Vanta will update the scope status for IdP accounts on the following data fetch, which happens hourly.
​
⚠️ Note: When Control scope with OneLogin is enabled, accounts who are removed from the Vanta application in OneLogin will be marked as out of scope in Vanta, which may potentially also mark associated personnel as out of scope.
 
If your offboarding process removes accounts from the Vanta application assignment manually before deactivating or deleting the accounts, those accounts and associated personnel will no longer be visible in Vanta for audit review. To ensure terminated employees remain visible for compliance purposes, consider:
- 
Keeping accounts belonging to terminated personnel assigned to the Vanta application in OneLogin until audit evidence has been collected, and do not remove application assignment BEFORE deactivating or deleting the accounts.
- 
Disabling Control scope with OneLogin and managing scope directly in Vanta (see How do I Mark Resources Out of Scope? <https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope>).

​

## Using OneLogin for Workspaces
- 
If you use Vanta Workspaces, you can create multiple Vanta OneLogin apps using the instructions here <https://help.vanta.com/en/articles/11345657>, one for each Workspace. If you choose to enable IdP scoping, the app you connect to each Workspace determines what set of employees are scoped in. 
​
​

## Images

- [image 01] ../../images/ux/integrations/controlling-scope-through-onelogin--01.png
- [image 02] ../../images/ux/integrations/controlling-scope-through-onelogin--02.png
