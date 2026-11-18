# Include Staged Users in Identity Provider Import

Source: https://help.vanta.com/en/articles/11345661-include-staged-users-in-identity-provider-import
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

By default, Vanta is configured to import active users from your Identity Provider (IdP) instance. However, this setting can also import users who are not yet active but considered “staged.” The exact account statuses that Vanta considers “staged” vary by integration.
- 
For Okta, enabling this setting will import staged and provisioned <https://help.okta.com/en-us/content/topics/users-groups-profiles/usgp-end-user-states.htm> users.
- 
For Jumpcloud, enabling this setting will import staged <https://jumpcloud.com/support/manage-user-states#:~:text=A%20user%20state%20indicates%20where,User%20State%20for%20User%20Creation.> users.
- 
For OneLogin, enabling this setting will import unactivated <https://developers.onelogin.com/api-docs/1/users/user-resource> users.
To update this setting:
- 
Navigate to the integrations <https://app.vanta.com/integrations> page and select Configure Scope on your IdP connection
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766233/48f163bddca9185b1881f32be3c2/27570955399572?expires=1794967200&signature=e48620bae3ab9210ad860beb19b51b70c7b6fde40f720623a9d05ac95203402d&req=dSUmEM54m4NcWvMW1HO4zbNBzD2CU3nOCCDHCn%2BkZcikz1N9gkXcCtHaC%2BmT%0AfqqRcr4RNHNFnxGefBY%3D%0A>
- 
A modal will open and allow you to toggle whether or not Vanta should read in staged users
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766230/66cbce72c03d645c998520328abe/27570955409556?expires=1794967200&signature=fa544e3debdecd5f4af1fc834ed77de7b3ed2e901f78de4c29b5d7ebc299b649&req=dSUmEM54m4NcWfMW1HO4zZ67XaD%2Fy4RpEhCe8UNfZERcP5%2Bs%2F7z1BuAr4kg1%0AEZ7scsYtvfmHnUwO7r8%3D%0A>
- 
Please note that once you make the change it will take up to an hour for these changes to propagate in Vanta

## Images

- [image 01] ../../images/ux/integrations/include-staged-users-in-identity-provider-import--01.png
- [image 02] ../../images/ux/integrations/include-staged-users-in-identity-provider-import--02.png
