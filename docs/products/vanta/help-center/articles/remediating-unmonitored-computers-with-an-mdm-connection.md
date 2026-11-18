# Remediating Unmonitored Computers with an MDM Connection

Source: https://help.vanta.com/en/articles/11346039-remediating-unmonitored-computers-with-an-mdm-connection
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

If your Computers are shown as unmonitored, but you have successfully integrated an MDM with Vanta, follow these instructions for remediation.
 

## Connect your MDM system
- 
If you haven't done so already, connect your MDM provider to Vanta on the integrations page <https://app.vanta.com/integrations>. Computers should be reflected here within an hour of appearing in your MDM dashboard.
- 
For MDMs that offer multiple services, such as Rippling, check the settings to confirm the MDM tool has been enabled. If the toggle is greyed out, this means Vanta will only recognize devices that have been previously connected to your Vanta Instance or have the Vanta Device Monitor installed
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767734/3267eb4ed2951aee8d7ade16e6fa/15287857490964?expires=1794967200&signature=ef6ab1474dd7c96c9695f4dbfc92900ba24ab96d2f638cc2a148ea3453bf0e70&req=dSUmEM54moZcXfMW1HO4zVLoFrLhx2V%2F%2FYFnXXbYb9cQbFw80yCFDG6hH0jP%0AKCw2F%2BNpRdAgn%2FwQpys%3D%0A>
 

## Vanta Device Monitor
- 
Use the Send Reminder menu to send employees an installation reminder email, or direct your team to visit the download page at https://app.vanta.com/downloads <https://app.vanta.com/downloads>.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767736/73a02805014571b4b71eb8441c40/27570257938708?expires=1794967200&signature=e5c1dd3b2e7f538c4e6a87b5f25afeb35c8e3008e9511d71d1e73f9f048b1abd&req=dSUmEM54moZcX%2FMW1HO4zR4f%2BdtkkoWI1jt8c4cK1nGmmSFB365YvDLEz37Z%0A8%2FvxN4j75hFfRp2kONk%3D%0A>
 
 

## Use your MDM system to install the Vanta Device Monitor via script
- 
You can deploy the Vanta Device Monitor on your MDM-provisioned computers by using the script we provide on the unmonitored section of the computers page <https://app.vanta.com/computers?tab=unmonitored>
- 
After the Device Monitor is installed, assign the computer an account within Vanta from the inventory  <https://app.vanta.com/inventory#mac>page by having the employee click on the toolbar icon and select Register Vanta Device Monitor
- 
This requires the unique Vanta key for your company, which must be obtained from an administrator if you do not already have access to Vanta. We are unable to give it to you since the key is confidential information. The Vanta key must be obtained by your administrator from this site's computers page and given to you. Here's how your admin can retrieve the Vanta key:
- 
Visit the Computers page -> Unmonitored tab <https://app.vanta.com/computers?tab=unmonitored>
- 
Select 'View setup instructions'
- 
Select 'Option 3: MDM and Vanta Device Monitor'
- 
Follow the direction for Windows
macOSVANTA_KEY="uniqueVantaKey" bash -c "$(curl -L https://raw.githubusercontent.com/VantaInc/vanta-agent-scripts/main/beta/install-macos.sh)"
Alternatively, to automatically register employee computers, capture the employee's email address and provide it when running our download and register script.VANTA_OWNER_EMAIL="[email protected]" VANTA_KEY="uniqueVantaKey" bash -c "$(curl -L https://raw.githubusercontent.com/VantaInc/vanta-agent-scripts/main/beta/install-macos.sh)"
 
LinuxVANTA_KEY="uniqueVantaKey" bash -c "$(curl -L https://raw.githubusercontent.com/VantaInc/vanta-agent-scripts/main/beta/install-linux.sh)"
Alternatively, to automatically register employee computers, capture the employee's email address and provide it when running our download and register script.VANTA_OWNER_EMAIL="[email protected]" VANTA_KEY="uniqueVantaKey" bash -c "$(curl -L https://raw.githubusercontent.com/VantaInc/vanta-agent-scripts/main/beta/install-linux.sh)"
 
For Windows:
# Open cmd.exe as an administrator
# Download the current version of the installercurl -Lo vanta.msi https://app.vanta.com/osquery/download/windows
# Run silent installation. In the command below, replace "[email protected]" with the employee's email address and "uniqueVantaKey" with the Vanta key provided by your adminmsiexec /i vanta.msi /passive /qn 
VANTA_KEY="uniqueVantaKey" 
VANTA_OWNER_EMAIL="[email protected]"
# If there are any issues, you can get more logs in `./vanta.log` by adding the following flags.msiexec /l*v vanta.log /i vanta.msi /passive /qn
Please send this file to [email protected] if you're encountering continual installation issues.
# Remove the installerdel vanta.msi

## Images

- [image 01] ../../images/ux/integrations/remediating-unmonitored-computers-with-an-mdm-connection--01.png
- [image 02] ../../images/ux/devices/remediating-unmonitored-computers-with-an-mdm-connection--02.png
