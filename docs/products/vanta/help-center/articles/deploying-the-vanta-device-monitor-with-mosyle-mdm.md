# Deploying the Vanta Device Monitor with Mosyle MDM

Source: https://help.vanta.com/en/articles/12489802-deploying-the-vanta-device-monitor-with-mosyle-mdm
Collection: Continuous Monitoring ; Continuous Monitoring › Vanta Device Monitor
Fetched: 2026-11-17

## Article text

Currently, Mosyle Business’s API does not provide certain device security details, such as password manager status, screen lock detection, hard drive encryption, or antivirus information. Since this data isn’t exposed through Mosyle’s API, Vanta cannot access it directly. This is expected behavior given the current scope of the integration. To help your team maintain strong device compliance, we’ve outlined a workaround that combines Mosyle with Vanta’s Device Monitor. This approach ensures you can continue monitoring key compliance requirements while we work toward deeper integration in the future.
 
Vendors often prioritize API enhancements when they hear directly from customers, reach out to your Mosyle representative using our short email template (available from your Vanta CSM.)
 

## Requirements
- 
Computers must be assigned an owner in Mosyle
- 
Computer owner must exist as a personnel on Vanta
- 
Computer owner email must match the email address of the corresponding personnel on Vanta

## Setup the Configuration Script
- 
Navigate to the Management tab and select the Custom Commands option
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1755837101/765b5a03f3d4f92908a10af2f375/Screenshot+2025-10-01+at+4_17_03%E2%80%AFPM.png?expires=1794967200&signature=bbe9e341f6f7405f119d91e3af83dbbeec7aca25fa0c7b47f0169e4a95bc3fe7&req=dSciE8F9moBfWPMW1HO4zSkzS5WpLU5RCXybkAw8Tk75Ms3WkGgmErUYiJkL%0Ar2OiYUBRQ0fxiO7kELs%3D%0A>
 
- 
Click Add new profile and fill in the following information:
- 
Profile Name (example): VDM Installation Script
- 
Select Enable Variables for this profile
- 
This will allow the installation script to access the "%Email%" variable for the selected computer (documentation <https://github.com/dooglahs/mosyle?tab=readme-ov-file#mosyle-variables>)# Check if VDM is already installed
if /usr/local/vanta/vanta-cli status; then
  echo "VDM already installed"
  exit 0
fi

# Install VDM
echo "Installing VDM for user %Email%"

VANTA_OWNER_EMAIL="%Email%" \
VANTA_KEY="ENTER_YOUR_DOMAIN_ENROLLMENT_SECRET_HERE" \
VANTA_REGION="ENTER_YOUR_REGION_HERE" \
bash -c "$(curl -L https://raw.githubusercontent.com/VantaInc/vanta-agent-scripts/main/install-macos.sh)"
 
- 
Find your domain enrollment secret and region here <https://help.vanta.com/en/articles/11346008-how-to-manually-install-the-vanta-device-monitor-on-macos-via-terminal>
Please Note: it is critical to keep the code that checks if the VDM is already installed because this script will run every time the computer starts
- 
Mosyle requires that you run the script at least once on a test computer before saving it
- 
Learn more about the setup script here <https://github.com/VantaInc/vanta-agent-scripts/blob/main/install-macos.sh>
- 
In the Execution Settings tab, select Every start up of the Mac
- 
This trigger allows VDM to be reinstalled if a user inadvertently uninstalls it
- 
Selecting Upon Enrollment only would lead to unmonitored computers 
- 
Every user sign-in or Device Info update would be more frequent than necessary
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1755837545/c98deffee6ba8fd3cdb3bd2870b7/Screenshot+2025-10-01+at+4_17_29%E2%80%AFPM.png?expires=1794967200&signature=4c8122f63f212087f5a984e2c83cee6a7eadfcff18e8facc2a22e78326d6ff86&req=dSciE8F9moRbXPMW1HO4zV8UKvDA43czs%2FJGZBkIa9gsUSp%2BTbFHNSdRhqC3%0AsUAO%0A>
 
- 
In the Profile Assignment section, select All current and future Devices or the relevant device/user group if you have that setup for your org
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1755838139/b24886c8bb44d4839c3f1c62d32c/Screenshot+2025-10-01+at+4_18_09%E2%80%AFPM.png?expires=1794967200&signature=580bb00dde277acdb8a2cee584e888c03c7e317baba191676a5f24bb6510a2e9&req=dSciE8F9lYBcUPMW1HO4zXMh77wM9cIu7DexRvGYAmNPsSFLVwmBxcfljFfj%0AeAzO%0A>
- 
Save your Profile 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1755835901/9b250dd39cc98e5d3f68cbcce5ac/Screenshot+2025-10-01+at+4_15_40%E2%80%AFPM.png?expires=1794967200&signature=c9dccca43f02eb15bf250c34b60c3107252512dd60961d6d7b22612dc2e0de90&req=dSciE8F9mIhfWPMW1HO4zWgcdEq2Offqca7TP%2F973gXw%2Bk6IRsvcnLEn0AQp%0AGVDcj1Rx3D7LHJNz79k%3D%0A>
- 
Select View Results to monitor the status of your deployment
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1755836063/0f0e162d03e7b7f1703a24c5a493/Screenshot+2025-10-01+at+4_15_50%E2%80%AFPM.png?expires=1794967200&signature=8f8be48219c33ba245824f52db30468b5859dfa8d2bf6e4dbcff86c97082f670&req=dSciE8F9m4FZWvMW1HO4zVhyu9onGHDO3z47%2BFyHGJjel47JvJnXqduPf5DT%0A%2BZzVwIb9zH1RS6WTWJc%3D%0A>
 

## Lifecycle Management Notes
- 
Because of how we have set up the installation script, a computer restart is required to trigger installation. 
- 
To uninstall the VDM, first disable the Installation script on the target computer and run the following command: sudo /usr/local/vanta/vanta-cli uninstall  (documentation <https://help.vanta.com/en/articles/11345408-uninstalling-the-vanta-device-monitor>) 
- 
If you don't disable the installation script, VDM will get reinstalled next time the computer restarts
- 
Once installed, VDM will automatically manage its own software update process.
- 
If a computer doesn't have an owner with an email that matches the personnel on Vanta, the installation script will fail.
Please note: We currently only support an automated test for malware detection for Windows devices. Linux and MacOS are not yet supported, but manual evidence can be uploaded as a Document.

## Images

- [image 01] ../../images/integrations/mosyle/deploying-the-vanta-device-monitor-with-mosyle-mdm--01.png
- [image 02] ../../images/integrations/mosyle/deploying-the-vanta-device-monitor-with-mosyle-mdm--02.png
- [image 03] ../../images/integrations/mosyle/deploying-the-vanta-device-monitor-with-mosyle-mdm--03.png
- [image 04] ../../images/integrations/mosyle/deploying-the-vanta-device-monitor-with-mosyle-mdm--04.png
- [image 05] ../../images/integrations/mosyle/deploying-the-vanta-device-monitor-with-mosyle-mdm--05.png
