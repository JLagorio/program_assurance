# Deploy the Vanta Device Monitor when using an MDM Vanta does not Integrate with

Source: https://help.vanta.com/en/articles/11346030-deploy-the-vanta-device-monitor-when-using-an-mdm-vanta-does-not-integrate-with
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

If you use a mobile device management (MDM) tool that we do not integrate with, you can still deploy the Vanta Device Monitor using the script provided in the unmonitored section of the Computers page. It is essential to note that these scripts have a VANTA_OWNER_EMAIL field, and we expect it to be set to a unique email string value for every installation to register the Vanta  Device Monitor with the correct user. The field cannot be set to a single static email, as all Vanta Device Monitors will register with the person who owns the email. That being said, if your MDM supports passing variables or arguments to a script, you can leverage this functionality and pass the different employee emails as arguments from a text file or an array. We recommend reaching out to your MDM providers for support on how to achieve this best.
 

## Prerequisites
- 
Administrator Access to Vanta
- 
Administrator Access to your MDM Tool of choice

## Script from Unmonitored Section
- 
Log in to Vanta as an administrator
- 
Head to the Unmonitored section of the Computers page
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767275/4edef031028bbb4857b2e8658e6a/27501919016212?expires=1794967200&signature=978cb0fba1364bf58d4c024097f4e586e7b12a5637d39db9d3dcf47608be7190&req=dSUmEM54moNYXPMW1HO4zbXJkJhjz0KLg6ieuZ7mT%2Bb%2FtjIXoHl8eMPQt86M%0AEH3PSqvngQLTZE202Wo%3D%0A>
- 
Select View Setup Instructions
- 
On the Setup page that opens up, click on the last tab, Option 3: MDM and Vanta Device Monitor
- 
You should then be presented with three different scripts: one for Mac OS, one for Linux, and one for Windows. Select the script based on the OS of the devices used on your MDM.
​
​

## Images

- [image 01] ../../images/ux/devices/deploy-the-vanta-device-monitor-when-using-an-mdm-vanta-does-not-integrate-with--01.png
