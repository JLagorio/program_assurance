# Connecting Vanta & 1Password Device Trust (Kolide)

Source: https://help.vanta.com/en/articles/12417797-connecting-vanta-1password-device-trust-kolide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta integrates with 1Password Device Trust (Kolide) to sync device compliance data and support automated device trust monitoring. By pulling real-time device posture information, Vanta helps ensure that only compliant devices retain access to company systems, simplifying device access reviews and supporting compliance requirements.
 
Estimated setup time: Less than 5 minutes
 

## How It Works
1Password Device Trust (Kolide) is a device trust and compliance platform that ensures devices meet your organization's security policies before granting access to applications and resources. Vanta offers Access integration capabilities for this service to sync 1Password Device Trust (Kolide) device compliance data on an hourly schedule.
 

## Use Cases
Connecting 1Password Device Trust (Kolide) will allow users to perform the following compliance tests:
- 
Check device compliance status as reported by 1Password Device Trust (Kolide)
- 
Verify that only compliant devices have access to organizational resources
- 
Monitor device posture and security policy adherence
- 
Support compliance requirements with accurate employee data
 

## Requirements
- 
You need an Administrator account in order to access 1Password Device Trust (Kolide) Admin console
- 
Antivirus (AV) tests are not supported on macOS or Linux
- 
Password Manager (PM) does not support any operating system tests
 

## Connect the Integration
- 
To connect, go to the Integrations page, click Add integration, and search for 1Password Device Trust (Kolide). For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
​
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893065088/4ddc4001b03b3befc90fe7cd3861/Search+for+integrations.png?expires=1794967200&signature=04c4373f7830b01f5ab769661ca3215895296808312647cc5786559df14d80dc&req=dSguFcl4mIFXUfMW1HO4zdLN9tSjxOLqIBsSGtnvoe%2BWBdYX%2F3H1qQpjhgbR%0AbzZF%0A>
- 
Click Connect to open a modal to insert your API token to Vanta. This will redirect you to a guided flow view to connect 1Password Device Trust (Kolide).
​
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893075973/b1861d5f58f812f817262fd7adeb/Connect+integration.png?expires=1794967200&signature=51f55c843b950197289d5f4baf1cb088ed5a3e70483ec3d7d9e686daa6e20862&req=dSguFcl5mIhYWvMW1HO4zWVMn%2BZyfL5zjqE9pBEOV1Ca8j3GvG2qGADVM16Y%0AXhOn%0A>
 
- 
Vanta will prompt an input form to request your API key, as we need one with appropriate permissions in order to authenticate against the 1Password Device Trust (Kolide) API and perform requests through the device compliance API.
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893078800/39173bc4aad41bffc596323bcbc8/Enter+API+key.png?expires=1794967200&signature=0667959e4126b4cf24b1e73d6c7ac787d67aeb5f8179a9dcc3c6158cc74309c6&req=dSguFcl5lYlfWfMW1HO4zXbIlo4%2FWgusRCYdMoxrrsqzoPNJgd9DdUjmLYtN%0AXGac%0A>
 
- 
If you don't have an API token that follows these constraints from beforehand, you can create a new one through the Settings of your profile → API Tokens section in your 1Password Device Trust (Kolide) dashboard.
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893109225/8dddc7893c7d125cea903d967a8d/Kolide+settings.png?expires=1794967200&signature=33b45a697cff6297f3cb1128a9c1d73b2b57da8873192d4f49e09442e80b64b7&req=dSguFch%2BlINdXPMW1HO4zf1E0J5Qo7C3GHUa%2FaBt%2BMHc9GyKl8Yi%2BJjGNCAR%0AO9gc%0A>
 
- 
Click Create New Key to open the following modal to configure your new API token (there is no need to add any special write permission).
​
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893111788/478bf493a8e7ba9cc8861d3d15b9/Kolide+API+key.png?expires=1794967200&signature=e0c154c7434012978ff23f9ed6c481081d05ef97086068043f3e44b3b4daffa1&req=dSguFch%2FnIZXUfMW1HO4ze88Na6nrTtWFT4qGL%2BWiDM7LDKW3CjS56b8k%2Foe%0AaYmq%0A>
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893113680/82b8a325de0df7cc8d1966c43865/Kolide+create+new+key.png?expires=1794967200&signature=aa4ca692f2af5414e89fddbeb35b40b50dee1dea6a75a3c0498cc065c5ee966a&req=dSguFch%2FnodXWfMW1HO4zWMknShlwrWslt4sUUXuSZGuTKTvCVN7WMmAx640%0AUEGd%0A>
 
- 
Click Save at the bottom of the modal to generate the API token in your 1Password Device Trust (Kolide) dashboard.
​
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893116898/64405b5adeb1beedb57c0f6a569b/Kolide+API+token+created.png?expires=1794967200&signature=917932ff4a2298aa902f705970561c6f24a36e847a3e5df764043a6f8a9fe1f3&req=dSguFch%2Fm4lWUfMW1HO4zZtnfQ1sa6a9Qx0zj3aWlblRaMeucsEC3BhzPP5Z%0Ad7BO%0A>
 
- 
Copy the API token into Vanta and click the Validate and Store button to submit your 1Password Device Trust (Kolide) credentials to Vanta. If everything worked properly, you should see a popup confirming that the integration was connected successfully.
​
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893122009/fc6d0acf59326150dbb08d2d99c0/Add+API+key+into+Vanta.png?expires=1794967200&signature=f42ba977e03acdabead247ec886303e10ca7721ff8a34f1b281fc6c87091e49c&req=dSguFch8n4FfUPMW1HO4zcmp0u%2B6qKdMeksP6khQNZf73dICpxB9nSYl8Jgv%0Akuew%0A>
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1893123039/eefff87d4bbb2c13a11d7e32081e/Success+toast.png?expires=1794967200&signature=72d28bc6502556128fcdc3b2c6282b7d48634e3539115d712286b0110f28ecc0&req=dSguFch8noFcUPMW1HO4zbQh1zjm5QDOX1nROxo3iCMyAAzP7xoEuIOZo6HW%0Af6aL%0A>
 

## Permissions
Vanta only accesses the following data from your 1Password Device Trust (Kolide) account:
 
Vanta can view:
- 
Data about your devices
- 
Device compliance status and details
- 
Device posture information
Vanta can update:
- 
Nothing (Vanta does not have write permissions)
 

## Kolide Help Center
- 
1Password Device Trust (Kolide) Documentation <https://help.kolide.com/docs/about-kolide>
- 
1Password Device Trust (Kolide) API Documentation <https://kolide.com/docs/developers/api>
 

## Frequently Asked Questions

### Invalid API token
- 
This can happen if the input API token is incorrect and prevents Vanta from authenticating against 1Password Device Trust (Kolide). 
- 
Review that the API token is valid or create a new one with the right permissions in the developer section on your 1Password Device Trust (Kolide) profile.

### Supported compliance checks
- 
Supported
- 
Anti-virus for Windows and MacOS
- 
Screen-lock for any operating system
- 
HDD Encryption for any operating system
- 
Unsupported
- 
Anti-virus not support for Linux (Manuel evidence required)

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-1password-device-trust-kolide--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-1password-device-trust-kolide--02.png
- [image 03] ../../images/integrations/1password-device-trust/connecting-vanta-1password-device-trust-kolide--03.png
- [image 04] ../../images/integrations/1password-device-trust/connecting-vanta-1password-device-trust-kolide--04.png
- [image 05] ../../images/integrations/1password-device-trust/connecting-vanta-1password-device-trust-kolide--05.png
- [image 06] ../../images/integrations/1password-device-trust/connecting-vanta-1password-device-trust-kolide--06.png
- [image 07] ../../images/integrations/1password-device-trust/connecting-vanta-1password-device-trust-kolide--07.png
- [image 08] ../../images/ux/integrations/connecting-vanta-1password-device-trust-kolide--08.png
- [image 09] ../../images/integrations/1password-device-trust/connecting-vanta-1password-device-trust-kolide--09.png
