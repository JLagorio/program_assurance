# Error: “Cannot Register” or "Is your device already registered?" when Downloading the Vanta Device Monitor

Source: https://help.vanta.com/en/articles/11345948-error-cannot-register-or-is-your-device-already-registered-when-downloading-the-vanta-device-monitor
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

This guide provides instructions on how to resolve a device that is experiencing issues with registration and displays either "Is your device already registered?" or "Cannot Register" as an error message.
 

## Prerequisites
- 
When installing the device through the Vanta Device Monitor installer, you are seeing the error message "Is your device already registered?" or "Cannot Register" in the browser pop-up.

## Procedure
STEP 1: Locate the company's Vanta Key; this can only be provided to you by your Vanta admin:
- 
Vanta Admin can locate the key within Vanta using the following steps: 
- 
Navigate to the Computers Page <https://app.vanta.com/computers>
- 
Click on the Unmonitored <https://app.vanta.com/computers?tab=unmonitored> Tab
- 
Click on View Setup Instructions
- 
Click on Option 3: MDM and Vanta Device Monitor
- 
Look for the phrase VANTA_KEY
STEP 2: Run the reset command from the Vanta-cli:
Mac:
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Type sudo /usr/local/vanta/vanta-cli reset
- 
Hit 'Return'. It may ask you for a password (use the password you have to download apps or to open your computer)​
Windows:
- 
Search for cmd.exe in the search bar. Right-click and select “run as administrator.”
- 
Type C:\PROGRA~1\Vanta\vanta-cli reset and hit 'Return'​
Linux:
- 
Search for cmd.exe in the search bar. Right-click and select “run as administrator.”
- 
Typesudo /var/vanta/vanta-cli resest and hit 'Return '. Run the below command prompt in your terminal, replacing "VANTA_KEY" with the key from step 1, and "YOUR_EMAIL" with the email for the device's primary user3.

STEP 3: Run the below command prompt in your terminal, replacing "VANTA_KEY" with the key from STEP 1, and "YOUR_EMAIL" with the email for the device's primary user
 
Mac:
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Type sudo /usr/local/vanta/vanta-cli register --secret="VANTA_KEY" --email="YOUR_EMAIL" and hit 'Return'. 
​
- 
For example:
​sudo /usr/local/vanta/vanta-cli register --secret="1232131231asdasd" --email="[email protected]"​
Windows: 
- 
Search for cmd.exe in the search bar. Right-click and select “run as administrator.”
- 
Type C:\PROGRA~1\Vanta\vanta-cli register --secret="VANTA_KEY" --email="YOUR_EMAIL" and hit 'Return'
- 
For example:
​C:\PROGRA~1\Vanta\vanta-cli register --secret="1232131231asdasd" --email="[email protected]"
Linux:
- 
Open terminal
- 
Typesudo /var/vanta/vanta-cli register --secret="VANTA_KEY" --email="YOUR_EMAIL" and hit 'Return'. 
​
- 
For example:
​sudo /var/vanta/vanta-cli register --secret="1232131231asdasd" --email="[email protected]"

## Images

- none
