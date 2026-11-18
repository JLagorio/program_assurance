# Troubleshooting missing Jamf computers

Source: https://help.vanta.com/en/articles/11345968-troubleshooting-missing-jamf-computers
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Environment Details
After successfully connecting the Jamf integration, the computers from Jamf should show up on the inventory page, computers page, and the computers tab on a profile.
 

## Cause & Resolution
VantaNoAlert
If you are missing devices please ensure they are not in a group called VantaNoAlert in Jamf.
 
Devices added to this group will not show up in Vanta. 
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763457/faa189ae80a1e70d4e0622e5c03b/15045216357396?expires=1794967200&signature=a20b926a3bbc93566e164325522777ae846e00c36d482306fa3bfdee99087bfc&req=dSUmEM54noVaXvMW1HO4zQ4gp4Nj1EhUjgiq0b%2FFgfxHxkQcMGQFNIczaqC1%0Ac%2B2HzT4jBUVMoI7vSFk%3D%0A>
 
Devices are marked out of scope
Administrators should also verify the devices have not been toggled out of scope by going to the integrations page and clicking "Configure scope" : <https://app.vanta.com/integrations?configurescope=jamf>
​
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763458/c20a5defb19e9bfa69c1290019c2/15045281012628?expires=1794967200&signature=8fb4b9f68f2bdf97ea3e36efec98beadc9669a928a517ccf946ca4acc62ab59e&req=dSUmEM54noVaUfMW1HO4zavodcElUSllC7PpbM16r91IOscUJojxsXl9OeRk%0AsSlOyLAZrV3XHDPbIvs%3D%0A>

Read more about configuring scope here. <https://help.vanta.com/hc/en-us/articles/360062025631-Frequently-Asked-Questions-How-do-I-Mark-Resources-out-of-Scope-?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo0ODQ3NDY3OTc4NjQ0LCJ0aWNrZXRfaWQiOjQ4MTczLCJjaGFubmVsX2lkIjo2MywidHlwZSI6IlNFQVJDSCIsImV4cCI6MTY4NDY3MjcxNH0.keyvm-gFnV43vDVr42Bk8D1kX0nUpLr62d3D1ICExKY> 
​
​
Email in User and Location does not match 
If the email in the User and Location field in Jamf does not match the owners Vanta associated email, it will not be assigned an owner. Devices with no owner will be surface on the Inventory items have owners test.  <https://app.vanta.com/monitors#inventory-list-owners>
​
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763460/138d9a06fd62060b63f2d6ee8b2d/15045735380372?expires=1794967200&signature=1812b8db244e93603e620098f79a3f8373d59bd577a9827b9e96e242432fc87a&req=dSUmEM54noVZWfMW1HO4zY0J1sOys4MSsaqxJJChRNmHinbgn73KsmJmTLYj%0AX8bch%2FD24h5ukNiB5KU%3D%0A>

​
Vanta does not currently support re-assigning owners on the inventory page because the field is configured and resides in Jamf:
​
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763476/8b26fac75703cfc22ecfb5c656b8/15045461781908?expires=1794967200&signature=df48598a30626e603efd0cdd749aa5d6247446b431c1d694e616cb1da6e5253c&req=dSUmEM54noVYX%2FMW1HO4zdpSb0iawrs0y2zvPdla7713D30jcGa3F7pt%2BlW2%0Acq64ov7fyHh3xW39fjY%3D%0A>
Administrators will need to go into Jamf and set the email in Jamf to match the email in Vanta.
 

## Additional Resources
- 
Connecting Vanta & Jamf Pro <https://help.vanta.com/hc/en-us/articles/360053420011-Connecting-Vanta-Jamf-Pro?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo0ODQ3NDY3OTc4NjQ0LCJ0aWNrZXRfaWQiOjQ4MTczLCJjaGFubmVsX2lkIjo2MywidHlwZSI6IlNFQVJDSCIsImV4cCI6MTY4NDY3MjcxNH0.keyvm-gFnV43vDVr42Bk8D1kX0nUpLr62d3D1ICExKY>
- 
Configure Screen Lock with Jamf Pro <https://help.vanta.com/hc/en-us/articles/10469261603348-Configure-Screen-Lock-with-Jamf-Pro-?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo0ODQ3NDY3OTc4NjQ0LCJ0aWNrZXRfaWQiOjQ4MTczLCJjaGFubmVsX2lkIjo2MywidHlwZSI6IlNFQVJDSCIsImV4cCI6MTY4NDY3MjcxNH0.keyvm-gFnV43vDVr42Bk8D1kX0nUpLr62d3D1ICExKY>

## Images

- [image 01] ../../images/integrations/jamf/troubleshooting-missing-jamf-computers--01.png
- [image 02] ../../images/ux/integrations/troubleshooting-missing-jamf-computers--02.png
- [image 03] ../../images/integrations/jamf/troubleshooting-missing-jamf-computers--03.png
- [image 04] ../../images/ux/inventory/troubleshooting-missing-jamf-computers--04.png
