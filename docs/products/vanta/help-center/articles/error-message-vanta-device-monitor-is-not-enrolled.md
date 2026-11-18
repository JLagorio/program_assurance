# Error Message: "Vanta Device Monitor is not enrolled"

Source: https://help.vanta.com/en/articles/11346048-error-message-vanta-device-monitor-is-not-enrolled
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Prerequisites
- 
When troubleshooting the Vanta Device Monitor, running the built-in troubleshooting tool called Doctor returns the following error message:Running checkup: Check Vanta endpoint metadata
ERROR: Vanta Device Monitor is not enrolled.
X Checkup failed. See above for what went wrong.
- 
Your company's Vanta Key <https://help.vanta.com/en/articles/11346023> (Only Vanta admins and editors have access to this information within Vanta)
 

## Procedure
- 
Verify you are getting the "Vanta Device Monitor is not enrolled" error when running the inbuilt diagnostic tool, Doctor, in your machines command prompt/terminal.
​
To run Doctor:
- 
Linux
- 
Open terminal
- 
Run this command: sudo /var/vanta/vanta-cli doctor
- 
Hit 'Return'. It may ask you for a password (use the password you have to download apps or to open your computer)
- 
Mac
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Copy/Paste sudo /usr/local/vanta/vanta-cli doctor
- 
Hit 'Return'. It may ask you for a password (use the password you have to download apps or to open your computer)​
- 
Windows
- 
Search for cmd.exe in the search bar. Right-click and select “run as administrator.”
- 
Type C:\PROGRA~1\Vanta\vanta-cli doctor and hit 'Return'
​ 
- 
Locate the company's Vanta Key. Your Admin can provide it to you.
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
Look for the phrase VANTA_KEY​
- 
Run the below command prompt in your terminal, replacing 'VANTA_KEY' with the key from the previous step, and 'YOUR_EMAIL' with the email for the device's primary user:
- 
Linux
- 
Open terminal
- 
Type sudo /var/vanta/vanta-cli register --secret="VANTA_KEY" --email="YOUR_EMAIL" and hit 'Return'.
- 
For example: sudo /var/vanta/vanta-cli register --secret="1232131231asdasd" --email="[email protected]"​
- 
Mac 
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Type sudo /usr/local/vanta/vanta-cli register --secret="VANTA_KEY" --email="YOUR_EMAIL" and hit 'Return'. 
- 
For example:
​sudo /usr/local/vanta/vanta-cli register --secret="1232131231asdasd" --email="[email protected]"​
- 
Windows 
- 
Search for cmd.exe in the search bar. Right-click and select “run as administrator.”
- 
Type C:\PROGRA~1\Vanta\vanta-cli register --secret="VANTA_KEY" --email="YOUR_EMAIL" and hit 'Return'
- 
For example:
​C:\PROGRA~1\Vanta\vanta-cli register --secret="1232131231asdasd" --email="[email protected]"

## Images

- none
