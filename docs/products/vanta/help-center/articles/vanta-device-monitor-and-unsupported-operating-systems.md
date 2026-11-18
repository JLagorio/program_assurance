# Vanta Device Monitor and Unsupported Operating Systems

Source: https://help.vanta.com/en/articles/11345402-vanta-device-monitor-and-unsupported-operating-systems
Collection: Continuous Monitoring ; Continuous Monitoring › Vanta Device Monitor
Fetched: 2026-11-17

## Article text

It is essential to constantly monitor your assets and devices to better understand your security posture. Using the Vanta Device Monitor is one way you can achieve this. The information collected from the Vanta Device Monitor is then used in Vanta to help your organization stay compliant. If you have a Vanta Device Monitor installed on an unsupported operating system, a few action items are required to resume monitoring the device. View our list of supported operating systems <https://help.vanta.com/en/articles/11345400>
 

## Identifying Unmonitored Devices
- 
From the Computers Page, select the Unmonitored tab
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758244/f9697de3e002bcef96fe49f9e1d4/35184927650708?expires=1794967200&signature=6ecfb1bddbdaf644f8b8d859937e729898bb3c7b77db567243ee9b7f799c482c&req=dSUmEM57lYNbXfMW1HO4zUOBdjONLIHXU1U3alB83sUpPQ60sZRmqHIkFXSm%0AI6i6JOjCLc2XT2a67eE%3D%0A>
- 
Unmonitored devices will have a status of:
- 
OS Version Unsupported: The Vanta Device Monitor does not run on this older version of the OS
- 
OS Unsupported: The Vanta Device Monitor cannot run on this OS (for example, unsupported Linux distributions such as Fedora or Arch).
- 
No Computers Tracked: The Vanta Device Monitor or other integrated MDM is not detected on this device

## Solutions
- 
OS Unsupported: 
- 
The Vanta Device Monitor cannot run on this OS, so manual evidence will need to be provided to demonstrate that any necessary controls have been met, i.e., evidence of disk encryption, password manager use, etc. You can provide manual evidence for these devices on the documents page. This device will also need to be excluded from monitoring on the Tests <https://help.vanta.com/en/articles/11345374> page. Here is our help article on this: Deactivating Monitoring for a Resource on a Test <https://help.vanta.com/en/articles/11346051>.
- 
OS Version Unsupported
- 
This means that we support the operating system that the device is running, but it is running an outdated version that we do not yet support. Update the OS to the most recent, supported version.
- 
Once updated, the Vanta Device Monitor should start reporting and be automatically marked as Monitored. You do not need to uninstall and reinstall the Vanta Device Monitor.
- 
No Computer Monitored
- 
You will see this status when someone has been identified as a user in your Vanta instance but does not have a monitored device associated with their information. To rectify this, you can have the user install the Vanta Device Monitor on their device or add manual evidence for this device to the documents page. <https://help.vanta.com/en/articles/11345376>
- 
Vanta Device Monitor Version not Supported:
- 
The current version of Vanta Device Monitor requires an update.
- 
Follow the steps on this page <https://help.vanta.com/en/articles/11345399> to manually update the Vanta Device Monitor or use the downloadable installer. Once updated, the Vanta Device Monitor should start reporting and be automatically marked as Monitored.

## Images

- [image 01] ../../images/ux/devices/computers-page--06.png
