# Exclude Computers from being Imported to Vanta in Jamf Pro

Source: https://help.vanta.com/en/articles/11345967-exclude-computers-from-being-imported-to-vanta-in-jamf-pro
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

There are currently two ways to exclude devices from the scope in Vanta:
- 
The first method is to toggle the devices out of scope manually; see Frequently Asked Questions: How do I Mark Resources out of Scope? <https://help.vanta.com/hc/en-us/articles/360062025631-Frequently-Asked-Questions-How-do-I-Mark-Resources-out-of-Scope-?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxNDA3OTk2MjQ0NzI1MiwidGlja2V0X2lkIjo0OTAyNywiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2ODQ2NzU1ODZ9.xgL4B_u6GyOE7Zi6SEM8uyrm_Zo0WnNdCjta8bV5lu0>
- 
Another method is to add the devices to a smart or static group named VantaNoAlert. Administrators can follow Jamf's instructions on creating static and smart groups here. <https://docs.jamf.com/10.27.0/jamf-pro/administrator-guide/Smart_Groups.html> Once the devices are added to these groups, they will no longer be in scope in Vanta.

## Images

- none
