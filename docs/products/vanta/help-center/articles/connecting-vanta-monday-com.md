# Connecting Vanta & monday.com

Source: https://help.vanta.com/en/articles/11345763-connecting-vanta-monday-com
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Monday.com is no longer read-only, and now has the ability to enable write permissions. This does require the customer to enable the scope within the Vanta integrations page, then update the Vanta app within monday.com

## Connecting Vanta & monday.com
- 
Install the Vanta app <https://auth.monday.com/oauth2/authorize?client_id=faf8d52cbb2400e2c81cf30bbb84bbc6&response_type=install> in your monday.com account (this step will soon be unnecessary after the Vanta app is added to the monday.com <http://monday.com/> app marketplace).
- 
In Vanta:
- 
To connect, go to the Integrations page and search for monday. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
Select Enable Access
- 
Write access is needed to create monday.com items from Vanta
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764059/6856176e62e2ace01b7111dc8cad/27578533313812?expires=1794967200&signature=5855793b362ac30067afdce8a70ba469f3271f0a2fe1b12d7759e7fe76711b63&req=dSUmEM54mYFaUPMW1HO4zR%2F9K7dK4sco6XESJt8xEaZnX2R1m50V%2Fpk0vCCR%0ANp67gXxVCMEYogK09kc%3D%0A>
- 
You will be redirected to monday.com's login page
- 
After logging in, authorize Vanta to read your account information. After you have done this, you will be redirected to Vanta, and the connection will be complete
Whoever connects the integration will be the author of all of their account's Monday tickets created in Vanta. Currently, there isn't a way for multiple users to connect the integration in the same customer account or to choose a different author for some of the tickets automatically.

## Default labels
Vanta only recognizes the default labels set for the “Priority” column in tasks:
- 
Critical ⚠️️
- 
High
- 
Medium
- 
Low
All other custom priority labels will be classified as the lowest priority. To satisfy the test “Security issues assigned priorities” in Vanta, assign any priority level to all incomplete security tasks.
Vanta also only recognizes the default labels for the Status column:
- 
Working on it
- 
Stuck
- 
Done
For the purpose of the tests in Vanta, a task is only considered closed if the status is “Done”.

## Troubleshooting

## # Invalid Scope Param
You may encounter the following error when attempting to connect monday.com to Vanta:{"error": "invalid_scope", "error_description":"Invalid scopeparam"}
If this occurs, it's possible that you have previously installed an old version of the Vanta integration without the required permissions. Please go to:https://<YOUR_MONDAY_URL>.monday.com/admin/installedApps/manage
Find Vanta in the list of installed applications, and find the "Update" button to update the version to the latest. Once that is complete, return to Vanta and attempt the connection flow again.

## Images

- [image 01] ../../images/integrations/monday-com/connecting-vanta-monday-com--01.png
