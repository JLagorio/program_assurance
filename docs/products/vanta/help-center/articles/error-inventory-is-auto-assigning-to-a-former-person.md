# Error: Inventory is auto assigning to a former person

Source: https://help.vanta.com/en/articles/11345884-error-inventory-is-auto-assigning-to-a-former-person
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When resources are synced Vanta will automatically assign the owner as the user who connected the integration by default.
 
When this happens, hovering your mouse over the "i" icon next to the owner's name will display a tooltip that reads:
 
"This field was automatically assigned a default value by Vanta"
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758214/179c6dbfae0c841920f1533344b5/31649946657556?expires=1794967200&signature=0671e33a038c2e9973a802b20ce855bb637486eef8e6399dc389dc0604b07162&req=dSUmEM57lYNeXfMW1HO4zfbnGgIRdRIdvL44sianZ6PnPxdduks6HvCO%2BnaZ%0AXsLgx8NUN%2BtnrEnB1rY%3D%0A>
 

## Option A
The user you want these resources to auto-assign to can reconnect the affected integration (AWS/GCP). If you do go this route, please make sure not to delete the integration but only reconnect. Deleting the connection may have adverse effects.
​
To reconnect:
- 
From the Integrations Page <https://app.vanta.com/integrations>, select Manage then Edit next to your Cloud integration
- 
Select the Edit pencil icon next to your existing account
- 
Go through the flow prompted
- 
Select Done - note that the Vanta user who selects "Done" here will be the new default owner
 

## Option B
- 
Use bulk tags to automatically tag synced cloud resources. This process will enable you to update the owner directly in your Cloud environment if necessary. Please see our help article, which goes over Bulk Tags <https://help.vanta.com/en/articles/11345627> in more detail.
 
If you encounter any issues with these solutions, please email [email protected]. We are here to help.

## Images

- [image 01] ../../images/ux/inventory/error-inventory-is-auto-assigning-to-a-former-person--01.png
