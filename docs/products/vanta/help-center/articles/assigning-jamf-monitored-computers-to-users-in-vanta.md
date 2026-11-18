# Assigning Jamf monitored computers to users in Vanta

Source: https://help.vanta.com/en/articles/11345940-assigning-jamf-monitored-computers-to-users-in-vanta
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When using Jamf, Vanta will look at the email field under User and Location to assign ownership of a computer in Vanta. Below, we walk through how to view this field and manually assign an owner in Vanta if needed.
 

## Procedure
- 
In Jamf, Search Inventory 
- 
Click on the computer
- 
Select User and Location
- 
View the email that currently exists for that profile
​​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761828/61df2856243734220087553c1328/21340451765268?expires=1794967200&signature=1ce01e20119f6b8726a15b800f723d8a760b6a975efa0d687dc17f2ac969ea47&req=dSUmEM54nIldUfMW1HO4zUunfiJF3Ffc7PEFo0tga7hlW1bylsoNY3LrEKTS%0AuKqm%0A>

​​
- 
Vanta will look at this email to see if there is a match within Vanta. If there is, Vanta will automatically assign ownership of that device to the corresponding employee.
- 
If the email doesn't match a current employee in Vanta, you can update this email field in Jamf so it aligns. Vanta will then assign the computers after the next data fetch.
- 
Another option would be to assign ownership via the Inventory Page <https://app.vanta.com/inventory?q=#employee-computers-mdm%20> by clicking the pencil icon next to the computer (please note: you will only be able to do this if the device is currently unassigned):
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761827/22c9350e12ced45d3def46f506d3/21340451772052?expires=1794967200&signature=be0475186613932567263d865e02baafa4b359d1f359317bc8b8389bff8e61ba&req=dSUmEM54nIldXvMW1HO4zZ8hLJXYZoKn47rCYVgwK5LobNmdBO%2BVOc54igzt%0A0B19%2Br2cPfCFxxeZraM%3D%0A>

## Images

- [image 01] ../../images/integrations/jamf/assigning-jamf-monitored-computers-to-users-in-vanta--01.png
- [image 02] ../../images/ux/inventory/assigning-jamf-monitored-computers-to-users-in-vanta--02.png
