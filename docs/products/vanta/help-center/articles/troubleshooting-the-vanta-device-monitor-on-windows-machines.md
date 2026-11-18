# Troubleshooting the Vanta Device Monitor on Windows Machines

Source: https://help.vanta.com/en/articles/11346063-troubleshooting-the-vanta-device-monitor-on-windows-machines
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

What version of Windows are you installing? 
- 
Please see the Supported operating systems <https://help.vanta.com/en/articles/11345400> guide for the Vanta Device Monitor.
Did you install it as Admin? 
- 
The Vanta Device Monitor requires Admin permissions to install. If you are unsure, try right-clicking on the installation package and selecting 'Run as Administrator'.
Do you have a default browser set? 
- 
Sometimes the installer will get stuck and end prematurely if there is no default browser. This can be solved by ensuring that your default browser is set (Chrome is preferred). The installer must open a browser window to complete the registration, and the process may time out if no default browser is available.
 
If you encounter issues installing the Vanta Device Monitor, your device’s security protection software may be blocking the installation. Try the following steps before attempting to install:
 
Temporarily disable security protection 
- 
Temporarily turn off any active security or antivirus protection on your device prior to installation.
- 
Once the Vanta Device Monitor has been successfully installed, you can re-enable your security protection.
- 
Note: Only disable security software briefly and ensure it is turned back on immediately after installation completes.
 
Still having issues? 
- 
The Vanta Device Monitor has a built-in troubleshooting tool called the doctor. It runs checks for common issues and helps you easily identify the problem.
To run the doctor:
- 
Search for cmd.exe in the search bar. Right-click and select “Run as Administrator.”
- 
Type the command  C:\PROGRA~1\Vanta\vanta-cli doctor and press 'Return' to enter
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769300/80f3e730a59541e15f84db6db024/23293650408852?expires=1794967200&signature=0126c52f2b4b7c9b216877cd3192ebde7323bae99c3774f2da1e967ffa65eed7&req=dSUmEM54lIJfWfMW1HO4zeU2JrXclYxF%2FRjfcy2uSob5YDN0OIlzAXOaJs4L%0AbMURp9q5IxZ0wZglt9k%3D%0A>
 
If there are any issues, they will be reported in the doctor output.
 
If you have any further questions, please send the full output to [email protected].

## Images

- [image 01] ../../images/documentation/troubleshooting-the-vanta-device-monitor-on-windows-machines--01.png
