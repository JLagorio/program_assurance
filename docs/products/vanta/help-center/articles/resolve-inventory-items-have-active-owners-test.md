# Resolve 'Inventory items have active owners' Test

Source: https://help.vanta.com/en/articles/11345538-resolve-inventory-items-have-active-owners-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

## Resolve 'Inventory items have active owners' Test
- 
Click on the failing resource to be immediately taken to the inventory item (Note: you cannot click on custom inventory items from the test; you would need to go to the inventory page)
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770011/e2261c6f71117d84b4a717e9ab52/15656951670804?expires=1794967200&signature=fc8a97b7b5819210b0f3cb23022815fafc09654d03f529a961b3668574918e81&req=dSUmEM55nYFeWPMW1HO4zWJ3qVZJEfERby9FCWUag71GHMEoUXm4GfsGDab9%0A0TXeO3%2FM6vTFtGC9EGw%3D%0A>
OR
- 
From the inventory page, navigate to any inventory resource tabs you wish to check. Use the dropdown to filter resources by No Owner or Former employee-owners
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770013/137311983a954626ec7690cb778c/15657027788052?expires=1794967200&signature=55c570e0ed4b072260c516b8f8b85b87b136afffbb3048f2162d4ae6ac9d7be9&req=dSUmEM55nYFeWvMW1HO4zSJlSD6Ny%2F1alheNpkxB7F%2FDX%2B8XGbbMMt73PNPR%0AgiRi0Wh8p3L2A4zIdO8%3D%0A>
- 
If the device has been reassigned to a different employee, update the owner using the Owner drop-down.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770012/784b697e89553ea4cf1a6e25771c/15657212480532?expires=1794967200&signature=26fed22dcb71f644f3bb03686ddf00f9fb875ba6afd1c2c36229d622ea906721&req=dSUmEM55nYFeW%2FMW1HO4zbNd70Pd%2BKCcWOTpZ19nqOnrKTSE%2BnM0jSh%2BGXbR%0ADSyApaPvGDqK5hMiF%2F0%3D%0A>
- 
If the device is decommissioned or pending reassignment, remove/scope out the device by disabling the Vanta Device Monitor. 
​Note: Disabling the Vanta Device Monitor or removing a computer is a permanent action. Once removed, to have the computer reappear, the new user will need to reinstall the Vanta Device Monitor.
- 
Both of these actions can also be completed from the user profile on the People Page

## Common Reasons For Failure
- 
The currently assigned owner has been offboarded, is marked as not a person, or has been scoped out from the connected HRIS/IdP.
- 
The 'VantaOwner' Bulk Tag is not set to the email address of an active user in Vanta.
- 
The currently assigned owner is marked as on leave
- 
The presently assigned owner has a future start date

##

## Images

- [image 01] ../../images/ux/tests/resolve-inventory-items-have-active-owners-test--01.png
- [image 02] ../../images/ux/inventory/resolve-inventory-items-have-active-owners-test--02.png
- [image 03] ../../images/ux/inventory/resolve-inventory-items-have-active-owners-test--03.png
