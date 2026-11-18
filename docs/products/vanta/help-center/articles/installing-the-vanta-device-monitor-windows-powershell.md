# Installing the Vanta Device Monitor - Windows PowerShell

Source: https://help.vanta.com/en/articles/11345403-installing-the-vanta-device-monitor-windows-powershell
Collection: Continuous Monitoring ; Continuous Monitoring › Vanta Device Monitor
Fetched: 2026-11-17

## Article text

- 
To install the Vanta Device Monitor via PowerShell, you would first run this command to download the Vanta Mobile Device Monitor,Invoke-WebRequest -Uri https://app.vanta.com/osquery/download/windows -OutFile vanta.msi
- 
Run the following command to install and register the Vanta Device Monitor for a user. Note that you will have to replace "vantaSecret" with the key available on the computer's page, and "[email protected]" with the user's email address that exists in Vanta. Here is our guide on how to Find the Vanta key <https://help.vanta.com/en/articles/11346023> from the Unmonitored tab on the Computers page.msiexec /i vanta.msi /passive /qn VANTA_KEY=vantaSecret [email protected] VANTA_REGION="us"
- 
Here is an example PowerShell script that could be deployed to install the Vanta Device Monitor.$vantaSecret= "vanta_key"
$userEmail= "[email protected]"
$vantaRegion= "us"

try {
Invoke-WebRequest -Uri https://app.vanta.com/osquery/download/windows -OutFile vanta.msi
}
catch {
"Unable to Download the Vanta Device Monitor. Please ensure that script is being run as an administrator"
}
try {
msiexec /i vanta.msi /passive /qn VANTA_KEY=$vantaSecret VANTA_OWNER_EMAIL=$userEmail VANTA_REGION="$vantaRegion"
}
catch {
"Unable to install the Vanta Device Monitor. Please ensure that the Vanta Secret is correct"
}
Finally {
"Successfully installed the Vanta Device Monitor"
}

## Images

- none
