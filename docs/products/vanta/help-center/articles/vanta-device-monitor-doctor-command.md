# Vanta Device Monitor: Doctor Command

Source: https://help.vanta.com/en/articles/11345972-vanta-device-monitor-doctor-command
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

This guide provides instructions on how to retrieve diagnostic information for the Vanta Device Monitor installed on a user's device, which can be supplied to Support.
 

## Procedure

## Windows
- 
Search for cmd.exe in the search bar. Right-click and select Run as administrator
- 
Run this command:C:\PROGRA~1\Vanta\vanta-cli doctor
- 
Press Return. It may ask you for a password (use the password you have to download apps or to open your computer)
- 
Please share a copy of the full output
 

## MacOS
- 
Open terminal (easiest way is cmd + space bar & search for terminal)
- 
Run this command:sudo /usr/local/vanta/vanta-cli doctor
- 
Hit Return. It may ask you for a password (use the password you have to download apps or to open your computer)
- 
Please share a copy of the full output
​

## Linux
- 
Open terminal
- 
Run this command:sudo /var/vanta/vanta-cli doctor
- 
Hit Return. It may ask you for a password (use the password you have to download apps or to open your computer)
- 
Please share a copy of the full output
 

## Common Issues:
The older versions of the Windows Vanta Device Monitor (Previous to 2.3.1) used a different path for running the commands. If the above command does not work on your Windows device, try following the steps below.
 

## Windows Vanta Device Monitor Previous to 2.3.1
- 
Search for cmd.exe in the search bar. Right-click and select “run as administrator.”
- 
TypeC:\ProgramData\Vanta\vanta-cli doctor
- 
Press 'Return'. It may ask you for a password (use the password you have to download apps or to open your computer)
- 
Please share a copy of the full output.

## Images

- none
