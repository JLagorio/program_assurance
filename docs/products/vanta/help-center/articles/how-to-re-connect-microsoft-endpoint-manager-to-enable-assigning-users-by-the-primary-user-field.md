# How to re-connect Microsoft Endpoint Manager to enable assigning users by the  primary user field

Source: https://help.vanta.com/en/articles/11345941-how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

If your Microsoft Endpoint Manager integration was connected before April of 2023, it still relies on the enroll by user field to assign an owner to the device on Vanta. In April, we released an update that allows the primary user field to be used, and administrators will need to reconnect their existing connection to take advantage of this (if they desire).
 

## Prerequisites
- 
Administrator access to Vanta
- 
An Azure AD Account with one of the following roles: Global Administrator, Cloud Application Administrator, Application Administrator, or owner of the service principal.
 

## Procedure
- 
Sign into Azure and then search for Enterprise Applications: 
​
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761849/5f419f001af6be9702b1c2851196/upload_248241437597274050?expires=1794967200&signature=3aa13b409dff9c7914569b7e72a994ab3712d441be0fdecdece7f074522d13e8&req=dSUmEM54nIlbUPMW1HO4zc%2FtdD29x29QUTyS0IxT3RD%2FDkOGllGoTNhkqi75%0AdB%2Fn%0A>
 
- 
You would then search for Vanta Intune in the search box for applications and click on your Vanta Intune application
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761857/6f5434a2c53bf1a882860cbb10a6/upload_836866594417495591?expires=1794967200&signature=41ca3f5c66814f8e7f5e9435e14fcf4a21b95fb1bd8eb60ae43d05ec7b17d858&req=dSUmEM54nIlaXvMW1HO4zepwklEI9t%2B8uLJZ%2F6ftrhzxrNbY%2F4zCFmmp3EVs%0AXzs%2F%0A>
 
- 
From here, click properties
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761856/c6a072e68052612bf861f1221033/upload_2797367835367791639?expires=1794967200&signature=60e6891097531e35c7ca235c82abf7eb356755ab4e9634c1be91e5b86746dae6&req=dSUmEM54nIlaX%2FMW1HO4zXLpzD9TlWnK18%2BgOrh%2Bosgv3JgUoTwGoY5U%2BSw1%0AQFqD%0A>
 
- 
Then delete it
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761858/d2c32ffad020e77f9a95bb6287f0/upload_1825989329339631046?expires=1794967200&signature=d5d2e59b94ed5c38a651763476d4b7222069f6a4b749e7225374bb849f85b0dd&req=dSUmEM54nIlaUfMW1HO4zbJk5a8OZNm8UZrpgcaDXET%2Bp%2Fi2HeZ5kjsv7aKP%0AgmgSdZngwh2%2B1p2HMG0%3D%0A>
 
- 
Once deleted, you can go to the integrations page on Vanta, click Manage, then Edit under Microsoft Endpoint Manager
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761872/4642f309ca5827348d980b06fa50/15783348283668?expires=1794967200&signature=f50d1314ef63ef1bc54a80b4a3f731e7f1185adcfe5e7469838898d17e3cecd8&req=dSUmEM54nIlYW%2FMW1HO4zZz%2B3xEEZ%2BAGiQABHZ3En4z3BDK3N%2BG%2BhzLT%2FJHR%0APvm4GQK%2B%2FCp9I%2FwY6b0%3D%0A>
 
- 
Click connect Microsoft Endpoint Manager and re-follow
 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761885/c5b377fc9fff67b1edd5c3f23242/15783351227028?expires=1794967200&signature=6c971aae5ccbf773e4f931beb098e166bb6c52231139965a90a6c504ebe7560c&req=dSUmEM54nIlXXPMW1HO4zVsESv4MEsMN3rHnqr7JKRRbiQ8vAM9ovFoMjgJU%0ALtWyJL1Izlx4v81GnGI%3D%0A>
 
- 
You will be taken to a window where you will sign into Microsoft Endpoint Manager using your Microsoft account and then be re-directed to this window where you need to accept the permissions to install the updated app
 
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761892/9ad7068a2b0ad2d1727ee9e8d1c4/15783339173524?expires=1794967200&signature=7e51aa7dd4992a7efbeb0834bba9a1073dc5e1a19b3b0fb61be6c3660b11baa8&req=dSUmEM54nIlWW%2FMW1HO4zb3tVP8djE8REKttqMUDqo2Ddzad5HTcpFYbcPGE%0AqNeG9yEXVJvxBoU6sYQ%3D%0A>
 
- 
Once this is done, the integration should be re-connected, and devices on the inventory page will be assigned an owner using the primary user field.
 

## Additional Resources
- 
Delete an enterprise application <https://learn.microsoft.com/en-us/azure/active-directory/manage-apps/delete-application-portal?pivots=portal&tabs=http>
- 
Microsoft Endpoint Manager - Configuration for Vanta <https://help.vanta.com/en/articles/11345788>

## Images

- [image 01] ../../images/integrations/azure/how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field--01.png
- [image 02] ../../images/integrations/azure/how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field--02.png
- [image 03] ../../images/integrations/azure/how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field--03.png
- [image 04] ../../images/integrations/azure/how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field--04.png
- [image 05] ../../images/ux/integrations/how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field--05.png
- [image 06] ../../images/ux/integrations/how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field--06.png
- [image 07] ../../images/integrations/microsoft/how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field--07.png
