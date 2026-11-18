# Connecting Vanta & Gusto

Source: https://help.vanta.com/en/articles/11345685-connecting-vanta-gusto
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

Gusto can be connected to your Vanta instant, allowing simple tracking of onboarding/offboarding dates from your HR system.
Vanta requires read-only access to an employee's name, email, and employment.

## Prerequisites
- 
Admin permissions in Vanta
- 
Gusto admin account with Admin Full Access <https://support.gusto.com/team-management/user-permissions/collaborators/1141380501/Types-of-administrators.htm> privileges to the employee directory.

## Procedure
- 
In Vanta, go to the Integrations page, click Add integration, and search for Gusto. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
Vanta uses OAuth to establish the Gusto Integration. Connecting via OAuth makes it easy to integrate the app by simply signing in to your account. Click the Connect Gusto button to be taken to the sign in page.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765272/cd50e042f1843a1188936848ff2e/16643026512660?expires=1794967200&signature=99219e685798383c0fbf0d268e01019da795933b70f6b43fe2960f2a870194c4&req=dSUmEM54mINYW%2FMW1HO4zb3sGiSRBJbjBMQGIucGaQ1%2B1r9PsBMqaio6wQ1%2F%0A7m37wgACREkpC%2B9%2Fepg%3D%0A>
- 
Within the same tab you will be taken to the Gusto sign-in page where the credentials must be entered to sign in via email. You must log in using an admin account and Admin Full Access <https://support.gusto.com/team-management/user-permissions/collaborators/1141380501/Types-of-administrators.htm> privileges to the employee directory.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765273/3c04a5120bc666ef9cc0afeef2b4/19311415557652?expires=1794967200&signature=220bb7564d0219002a9a274dd5442cf37d36d155df273fd3022abfc3fea768f2&req=dSUmEM54mINYWvMW1HO4zQpe5Bm62uwVJ%2BRpLR%2FDS2GIN6XsVxECva5xezdl%0ANDeKuZg0uTWzc1fuBUI%3D%0A>
- 
Once you have successfully signed in, you will be prompted to authorize Vanta's access to your company's Gusto instance, click the 'Authorize' button to confirm this.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765274/8013c568fd733cc011ef3e4472cc/16643026514452?expires=1794967200&signature=7698a1054a3431a0e459908e0cdfdf11ab9d0d2966fba4a322b30cf1dedb4e35&req=dSUmEM54mINYXfMW1HO4zTiIzA0iyoujox%2B0kpRVP7hkn1pchRTSxEtxRVQe%0AwR7J4s%2F5eSpLZgXejaU%3D%0A>
- 
You will be taken back to Vanta to select a cut-off date. Vanta will automatically pull in everyone who is currently active in Gusto, and all the users who have left after the specified cut-off date.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765290/68d3689ba5feb082e197e80e19ec/16643026516756?expires=1794967200&signature=a42bd7bfd138c62341922eb36be4b22b7a532c47d12ec8bea8800e30f5b87e10&req=dSUmEM54mINWWfMW1HO4zerypB1rKe8%2FmiVABN3XMA0kkHFs5ulvLFxZOFU1%0A%2BkP%2F3deinwCjsMnaLkw%3D%0A>
- 
You will be taken back to the connections page on Vanta once the process is completed successfully. Your Gusto integration is now complete!

## Common Issues
- 
Gusto does not allow an end date to be set for contractors. This can result in a user profile displaying the status Inactive, limiting further actions. This can be resolved by marking the user as Out of Scope <https://help.vanta.com/en/articles/11345970> for offboarding or manually unlinking the profiles' HR Data <https://help.vanta.com/en/articles/11346035> if they are an active employee.
​
- 
If Vanta was connected to a since deactivated Gusto account, this can cause issues with reconnecting to a new account. Disconnecting the app from within the old Gusto account will allow active account details to surface. Instructions can be found in Gusto's help center. <https://support.gusto.com/article/211123171454257/Set-up-provisioning-apps>
​
Once disconnected within Gusto, Please disconnect the integration completely within Vanta, before attempting to reconnect again. 
​
​

## Additional Resources
- 
How Does a Person's Employment Status get Determined? <https://help.vanta.com/en/articles/11345592>
- 
I have a user my HRIS integration that is not my Identity Provider, will Vanta create a user for them? <https://help.vanta.com/en/articles/11345939>
- 
Migrating your HRIS System <https://help.vanta.com/en/articles/11345681>

## Images

- [image 01] ../../images/integrations/gusto/connecting-vanta-gusto--01.png
- [image 02] ../../images/integrations/gusto/connecting-vanta-gusto--02.png
- [image 03] ../../images/integrations/gusto/connecting-vanta-gusto--03.png
- [image 04] ../../images/integrations/gusto/connecting-vanta-gusto--04.png
