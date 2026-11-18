# Troubleshooting the Vanta Device Monitor on Linux Machines

Source: https://help.vanta.com/en/articles/11346064-troubleshooting-the-vanta-device-monitor-on-linux-machines
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

⚠️ Note: This article applies only to devices running the Vanta Device Monitor (VDM) agent installed directly on the machine. If your devices are managed through an MDM integration such as JumpCloud, Jamf, or Kandji, this article does not apply. Please refer to the relevant MDM integration article for supported operating systems, detection capabilities, and troubleshooting guidance.

## Before you begin: Linux detection scope
On Linux devices, the Vanta Device Monitor can only perform checks for HD Encryption. Antivirus, Password Managers, and Screen Lock are not currently detectable on Linux via the Vanta Device Monitor. If you are troubleshooting Antivirus, Password Managers, or Screen Lock on a Linux device, you will need to use an MDM integration (such as JumpCloud). See the relevant integration article for its detection capabilities..
 
What version of Linux are you installing on?
- 
Vanta Device Monitor currently only supports specific Debian variants. Go here for more details <https://help.vanta.com/en/articles/11345400>. The Vanta Device Monitor does not currently support SELinux, Gentoo, Arch, Fedora, and other similar operating systems. If you are curious if the Linux version you have installed will work, email us at [email protected]
I am receiving the error "curl: (23) Failure writing output to destination"
- 
This could be because the version of CURL in your OS image is from the Snap Store instead of the Apt repository. Removing the current version of CURL and then reinstalling it via the APT repository should resolve this issue.
Have you run the Doctor Command? 
- 
The Vanta Device Monitor features a built-in troubleshooting tool called Doctor, which helps identify common issues. 
- 
In terminal, run the command 'sudo /var/vanta/vanta-cli doctor' and see the output. 
- 
Green checks mean the checks passed. Anything missing a check could be an indication of what needs attention to get the Vanta Device Monitor working. If you need further assistance, please send the output to [email protected].
​
What does the Vanta Device Monitor monitor for Linux?
- 
Currently, the Vanta Device Monitor is able to perform checks for HD Encryption only. Antivirus, Password Managers, and Screen Lock are not presently detectable on Linux devices.

## Images

- none
