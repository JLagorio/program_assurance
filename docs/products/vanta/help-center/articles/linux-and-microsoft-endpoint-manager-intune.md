# Linux and Microsoft Endpoint Manager (Intune)

Source: https://help.vanta.com/en/articles/11345914-linux-and-microsoft-endpoint-manager-intune
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Administrators may notice that after successfully connecting Microsoft Endpoint Manager (MEM) and setting up the compliance  <https://help.vanta.com/en/articles/11345788>policies, Linux devices do not report on Password Manager, Anti-virus, or Screen lock:
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760427/dea2306a1a98e91f682f408daebf/17500247346068?expires=1794967200&signature=01345fc2b245edebf53044055a116ae346f74333fdeca989b1d09808c39ae157&req=dSUmEM54nYVdXvMW1HO4zYT18tCOqzBbPMReBG7Gj0zSiJtv4KgwxOd0uLRP%0AEFHpIoqPdmgEFGHE0G8%3D%0A>
 
This occurs because Microsoft Endpoint Manager does not report back information on these settings.
​
This means that the controls for Anti-Virus, Password Manager, and Screen Lock will never pass for Linux devices.
 
Administrators can choose to deactivate monitoring for the Linux devices  <https://help.vanta.com/hc/en-us/articles/10258188330004-Deactivate-monitoring-for-a-resource-on-a-Test?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxNDA5MDMxMzYxNjE0OCwidGlja2V0X2lkIjo1NDU4MywiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2OTIyODY4MzB9.FMTSjrmNRXuYXUHh96WBoAPzNqv-GL0HsIyHjXDkA84>on the related test and provide manual evidence for these devices.
 
It's recommend to check with your auditor regarding manual evidence, as auditor requirements may vary, or reach out to us at [email protected] and we will be happy to guide you.
 
Note: the computers page will always show a 'x' for those fields, even if the devices have been deactivated on the test.
 
If administrators do not want these devices shown on the computers page due to the limited monitoring, these devices can be marked as out of scope from Microsoft Endpoint Manager integrations setting by click configure scope, and then search for and toggling the scope of those Linux devices.
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760426/63c516b4199a4dd56928c9d53f5f/17500455940884?expires=1794967200&signature=b0bd0586a191df639574cd4a4b0ab28dc366c526d13e9142fa4963301f40340e&req=dSUmEM54nYVdX%2FMW1HO4zfn4Kcnvs7iWWSMqPTGFngsGEr0zYTgFC%2FhuO29O%0AUUOW7Sj%2BbgRXTyx8Ulk%3D%0A>
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760443/7ce68d358fba0c058213644039d1/17500663537428?expires=1794967200&signature=4a36061636bbfba71875b14d74cfbfe7421617022385fa6ebb382a52766971bf&req=dSUmEM54nYVbWvMW1HO4zVI%2BEocmV2HckzOyV1Vr6SQm84YaaelQFsnZYncb%0AugfAUGEhw4vdYxPOEgI%3D%0A>

## Images

- [image 01] ../../images/ux/devices/linux-and-microsoft-endpoint-manager-intune--01.png
- [image 02] ../../images/ux/integrations/linux-and-microsoft-endpoint-manager-intune--02.png
- [image 03] ../../images/ux/integrations/linux-and-microsoft-endpoint-manager-intune--03.png
