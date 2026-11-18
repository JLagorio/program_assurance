# Login from new device message after re-linking Justworks

Source: https://help.vanta.com/en/articles/11345913-login-from-new-device-message-after-re-linking-justworks
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

After re-linking Justworks, the administrator who re-linked it may receive periodic notifications from Justworks that their account had been logged in from a new device, which understandably may cause alarm.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760324/53b42bec92ec354b101fe1231f8d/17545081483540?expires=1794967200&signature=a9da49a35d4cde683fb74fbc9bb7722848c31ebbd26cc54232d0aaddf639d072&req=dSUmEM54nYJdXfMW1HO4zYzzt7CS9WmJ7cxOlWiWVfzV99gDntCRRxU1zRM9%0AVL5mnfHevExZhCaEux8%3D%0A>
 
- 
This should be from an IP that Merge uses for fetching data for the integration and is a false alarm. However,since the account is in use by an actual human, and there is always a chance for compromise, we suggest administrators be diligent and always investigate these emails. If it is determined this is not an IP from Merge, please get in touch with Justworks using the details in the alert email.
- 
If an administrator wishes to stop these periodic messages, the workaround would be to create a user in Justworks with the appropriate permissions and a strong password to connect to Vanta. Once this service account is created, they can reconnect the integration using it. We still suggest an administrator periodically inspect these messages if the password is compromised.
- 
This would prevent the emails from alerting the administrator, but we also recommend the inbox be checked periodically in case a login that does not originate from Merge does occur.
- 
Another workaround would be to leave everything as is since Merge only has so many unique IP Addresses that will log in to the user to fetch data. Eventually, they would stop receiving these new IP login emails as they would have already logged in before and rotate between the same ones.

## Images

- [image 01] ../../images/integrations/justworks/login-from-new-device-message-after-re-linking-justworks--01.png
