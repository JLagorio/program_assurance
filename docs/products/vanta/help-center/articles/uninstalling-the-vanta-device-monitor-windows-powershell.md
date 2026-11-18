# Uninstalling the Vanta Device Monitor: Windows PowerShell

Source: https://help.vanta.com/en/articles/11345404-uninstalling-the-vanta-device-monitor-windows-powershell
Collection: Continuous Monitoring ; Continuous Monitoring › Vanta Device Monitor
Fetched: 2026-11-17

## Article text

There may be a time when you need to uninstall the Vanta Device Monitor from Windows machines. To avoid uninstall failures caused by “files in use,” (1) stop the Device Monitor first, then (2)deactivate it (so the computer is removed from your Vanta Computers dashboard), and then (3) uninstall it from the machine.
 

## Prerequisites
- 
Run PowerShell as an Administrator on the device you’re uninstalling from.
- 
You’ll need your organization’s Vanta key for the deactivate step. If you don’t have it, follow the steps in Find the Vanta key <https://help.vanta.com/en/articles/11346023-find-the-vanta-key>.
 

## 1. Stop the Device Monitor
Stopping the Device Monitor first helps prevent uninstall errors caused by locked files.
 
Run:& "C:\Program Files\Vanta\vanta-cli.exe" stop
Start-Sleep -Seconds 5
 
If you still see “exclusive access” / “files in use” errors, make sure any Vanta-related processes are terminated. then try again. For example: autoupdater.exe, launcher.exe, lorca.exe, metalauncher.exe, osqueryd.exe, vanta-agent.exe, vanta-cli.exe, vanta.exe
 
 

## 2. Deactivate (remove the computer from Vanta)
Deactivating removes the computer from your Vanta instance/Computers dashboard.
 
1. Set your key:$VantaKey = "your_vanta_key"
 
2. Deactivate:& "C:\Program Files\Vanta\vanta-cli.exe" deactivate --secret=$VantaKey
 
 

## 3. Uninstall the application (PowerShell)
 

### PowerShell Script Example (for versions 2.14.0 and above)
 $VantaKey = "your_vanta_key"

try {
    & "C:\Program Files\Vanta\vanta-cli.exe" deactivate --secret=$VantaKey
}
catch {
    "Unable to deactivate the Vanta Device Monitor, continuing with uninstall..."
}

try {
    & "C:\Program Files\Vanta\vanta-cli.exe" stop
    Start-Sleep -Seconds 5
}
catch {
    "Unable to stop Vanta service, this may cause uninstall issues."
}

try {
    $application = Get-WmiObject -Class Win32_Product -Filter "Name = 'Vanta Device Monitor'"
    $productCode = $application.IdentifyingNumber
    $process = Start-Process msiexec.exe -ArgumentList "/x `"$productCode`" /passive /qn /norestart" -Wait -PassThru
}
catch {
    "Unable to uninstall the Vanta Device Monitor, please reach out to support."
    exit 1
}
finally {
    "Vanta Device Monitor Successfully Deactivated and Uninstalled"
}
 
 
 

### PowerShell Script Example (for versions below 2.14.0)
 $VantaKey = "your_vanta_key"

try {
    & "C:\Program Files\Vanta\vanta-cli.exe" deactivate --secret=$VantaKey
}
catch {
    "Unable to deactivate the Vanta Device Monitor, continuing with uninstall..."
}

try {
    & "C:\Program Files\Vanta\vanta-cli.exe" stop
    Start-Sleep -Seconds 5
}
catch {
    "Unable to stop Vanta service, this may cause uninstall issues."
}

try {
    $application = Get-WmiObject -Class Win32_Product -Filter "Name = 'Vanta Agent'"
    $productCode = $application.IdentifyingNumber
    $process = Start-Process msiexec.exe -ArgumentList "/x `"$productCode`" /passive /qn /norestart" -Wait -PassThru
}
catch {
    "Unable to uninstall the Vanta Device Monitor, please reach out to support."
    exit 1
}
finally {
    "Vanta Device Monitor Successfully Deactivated and Uninstalled"
}

## Images

- none
