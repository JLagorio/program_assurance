# Connecting Vanta & Microsoft Intune (GCC High)

Source: https://help.vanta.com/en/articles/13346035-connecting-vanta-microsoft-intune-gcc-high
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Endpoint and Device Management (MDM)
Fetched: 2026-11-17

## Article text

This article covers connecting Vanta to Microsoft Endpoint Manager (Intune) GCC High for device management and monitoring. This integration is specifically for organizations using Intune in Azure Government cloud environments (GCC High).
- 
What it does: Monitors Windows and MacOS devices, pulls device and app information, and runs continuous security tests to ensure compliant configuration
- 
Who it's for: Endpoint Manager Administrators working with Azure Government cloud tenants
- 
Estimated setup time: Less than 10 minutes 

## Requirements
- 
Must be a Vanta admin
- 
Must be an Endpoint Manager Administrator
- 
Access to Intune admin center (GCC High) <https://intune.microsoft.us/?ref=AdminCenter#home>
- 
Full Intune permissions (verify via "My permissions" in admin center)
- 
Organization must be using Azure Government cloud for GCC High tenants
​
Important Note: This integration is for GCC High environments only. If you're using commercial Intune, please refer to the standard Intune integration guide <https://help.vanta.com/en/articles/11345786-connecting-vanta-microsoft-endpoint-manager-intune-mdm>.
 

## Overview
To connect Microsoft Endpoint Manager GCC High to Vanta, you will:
- 
Navigate to the integration in Vanta
- 
Authenticate with Azure Government credentials
- 
Grant required permissions
- 
Configure device setup grace period
 

## Connect the integration
Follow these steps to connect Vanta to Microsoft Endpoint Manager GCC High:
 

### 1. Navigate to Integrations in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Intune. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>. 

### 2. Initiate the connection
- 
Click Connect
- 
Select "Connect Intune GCC High"
- 
Verify your admin status in the confirmation dialog
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1922326503/7d6f3c7742766c085a16784c6b56/c2e8cfbb-ba96-4373-ae9f-d5c250fbf888?expires=1794967200&signature=d5ba19952d01ee20bc95cd3aea8dd7508ea244b42bceddcff86978a8e7daca5f&req=dSklFMp8m4RfWvMW1HO4zYn2icRphaz55N5y2fTEFDA%2FyC8tDoawJ2al5ZKM%0AH0Mw0xOqvCdztq1TXlI%3D%0A>
 

### 3. Authenticate with Azure Government
- 
Log in with your Azure Government administrator credentials
- 
The login will use https://login.microsoftonline.us <https://login.microsoftonline.us> (Azure Government cloud)
- 
Accept the required permissions when prompted
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1922327128/d8ee5d79b0687e857bc8c487dab4/1c7e669c-6866-426e-bc3b-111f9adb6072?expires=1794967200&signature=d6d2f7413bdc5461ccae310889e6214be054a5719921ff745fafd04f420e089f&req=dSklFMp8moBdUfMW1HO4zRVxdEytqK2v0AC%2Biot0S4NpmG9%2F0QAGaTQhr7iE%0AhOdnfRvsvKlM5jZOt8Y%3D%0A>
 

### 4. Configure device setup grace period
- 
Set the grace period for newly enrolled devices (default: 3 hours)
- 
This prevents false alerts while devices are being initially configured
- 
New computers will not trigger test failures until after this period
- 
Note: If multiple MDM integrations are connected, any change made here to the computer setup time will be applied to all MDM integrations.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1922327564/82c8c012c865bf96277fa94d5fa5/4e541575-89c7-4ce0-8131-de49aca36ccc?expires=1794967200&signature=48f62b9546ddbb3dff017dcb7215a7d1b860023b976865364a2af13b608902a0&req=dSklFMp8moRZXfMW1HO4zUxvZvXo8uzMv305Y9FFFJUN9lNDejpxXxZupGZp%0Ap5%2FSM9CbL%2FVfqrSE1Kg%3D%0A>
 

### 5. Configure compliance policies for Vanta monitoring
- 
For Vanta to detect screenlock settings, antivirus status, and other security configurations, you must configure compliance policies in Microsoft Endpoint Manager. Without these policies, Vanta's monitoring capabilities will be limited. 
- 
Review the required compliance policy settings in our configuration guide: Microsoft Endpoint Manager - Configuration for Vanta <https://help.vanta.com/en/articles/11345788-microsoft-endpoint-manager-intune-configuration-for-vanta>
 

### 6. Confirm successful connection
- 
Verify that the integration status shows "Connected"
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1922300803/11b24ac935d3f0358a1b0d176353/0a80d068-84b4-4e47-91cf-f211d9f12aad?expires=1794967200&signature=4214b4f323bb91bced2f5660fecd8e9f232e3618b2007cfba414cce9a57ee219&req=dSklFMp%2BnYlfWvMW1HO4zSJps4nYM7Xw%2FEHlV4w1UWnF5CGLv3IdfAaZ5VHH%0AHdQ2yX%2B%2FcTDwbjg7vsM%3D%0A>
 
 

## Permissions
Vanta requires the following permissions to monitor your Intune GCC High environment:
 | 
Permission | 
Description | 
Use cases
 | 
DeviceManagementManagedDevices.Read.All | 
Allows the app to read the properties of devices managed by Microsoft Intune, without a signed-in user. | 
With this main permission, Vanta can pull in device info, such as hardware details or installed applications.
 | 
DeviceManagementConfiguration.Read.All | 
Allows the app to read properties of Microsoft Intune-managed device configuration and device compliance policies and their assignment to groups, without a signed-in user. | 
With this permission, Vanta can pull in screenlock and antivirus settings.
Vanta has read-only access and cannot modify your Intune configuration, devices, or policies.
 
 

## Monitored resources
 | 
Resource Type | 
Windows | 
macOS | 
Linux | 
iOS | 
Android
 | 
Device Monitoring | 
✅ | 
✅ | 
✅ | 
❌ | 
❌
 | 
Screenlock Settings | 
✅ | 
✅ | 
❌ | 
❌ | 
❌
 | 
Antivirus Detection | 
✅ | 
✅ | 
❌ | 
❌ | 
❌
 | 
Password Manager | 
✅ | 
✅ | 
❌ | 
❌ | 
❌
✅ Supported
❌ Not supported
 
Note on Linux: For Linux device support with Microsoft Endpoint Manager (Intune), see the related article: Linux and Microsoft Endpoint Manager (Intune) <https://help.vanta.com/en/articles/11345914-linux-and-microsoft-endpoint-manager-intune>
 

### Cannot monitor
- 
Non-Corporate devices:  Intune collects the phone numbers, app inventory, and UDIDs of corporate-owned devices. Devices that aren't corporate-owned won't report UDID or installed apps, so Vanta won't be able to define a solid identity or run installed software checks on these devices.
- 
No browser extensions. Like our other MDM integrations, we don't have easy access to see what extensions are installed in an employee's browser(s). One way this could be done in the future is w/ device policies — but that would check for enforcement rather than detecting an actual installation.

### Important considerations
- 
Weekly app scans: Because Intune only scans and reports hardware and software inventory once every 7 days, app updates will also report updates at this cadence in Vanta.
- 
Proper licensing: Users can enroll their corporate devices only if they have an Intune license.
- 
Compliance vs Configuration Policies: When using Microsoft Endpoint Manager, Vanta will only read in compliance policies and will not read in configuration profiles. See our set up guide for instructions on how to configure compliance policies for Vanta: Microsoft Endpoint Manager - Configuration for Vanta <https://help.vanta.com/en/articles/11345788-microsoft-endpoint-manager-intune-configuration-for-vanta>.
- 
Password manager and AV detection. Unlike other MDM providers for MacOS, Microsoft does not provide us with bundle identifiers for MacOS apps. As a fallback, we determine if an app is a password manager or an AV by its app name, which can be less precise.
- 
For antivirus, Vanta also checks to see if a device has a compliance policy enforced that requires antivirus.
 

## Related articles
- 
Connecting Vanta to Microsoft Endpoint Manager (Intune) - Commercial <https://help.vanta.com/en/articles/11345786-connecting-vanta-microsoft-endpoint-manager-intune-mdm>
- 
Microsoft Endpoint Manager (Intune) - Configuration for Vanta <https://help.vanta.com/en/articles/11345788-microsoft-endpoint-manager-intune-configuration-for-vanta>
- 
Device Monitoring in Vanta <https://help.vanta.com/en/articles/11345823-device-monitoring-in-vanta>
- 
Linux and Microsoft Endpoint Manager (Intune) <https://help.vanta.com/en/articles/11345914-linux-and-microsoft-endpoint-manager-intune>
- 
How to re-connect Microsoft Endpoint Manager to enable assigning users by the  primary user field <https://help.vanta.com/en/articles/11345941-how-to-re-connect-microsoft-endpoint-manager-to-enable-assigning-users-by-the-primary-user-field>
- 
How to Remove Devices from Vanta for Microsoft Endpoint Manager (Intune) <https://help.vanta.com/en/articles/11345965-how-to-remove-devices-from-vanta-for-microsoft-endpoint-manager-intune>
 

## FAQ

### Device not appearing in Vanta after connection
- 
Verify the device is enrolled in Intune GCC High and appears in the Microsoft Endpoint Manager admin center at https://intune.microsoft.us <https://intune.microsoft.us>
- 
Check that the device has checked in recently (within 7 days)
- 
Ensure the device is within your configured scope in Vanta
 

### Permission issues or authentication failures
- 
Verify that your Azure Government account has full Intune Administrator permissions
- 
Check "My permissions" in the Endpoint Manager admin center
- 
Confirm that the Vanta integration app registration has the required permissions in your Azure Government tenant
- 
Re-authenticate the connection if permissions were recently modified
- 
Ensure you're logging in to the correct Azure Government tenant
 

### Tests failing immediately after device enrollment
- 
Check your configured grace period setting (default: 3 hours)
- 
Newly enrolled devices need time for initial policy application
- 
Consider extending the grace period if your policy deployment takes longer
- 
Verify that policies are correctly configured in Intune and assigned to the device
 

### Application not detected on devices
- 
Remember that app inventory updates follow Intune's 7-day cycle, not Vanta's 4-hour sync
- 
Verify the application is installed and appears in the Intune admin center
- 
For MacOS, ensure the app name matches exactly (detection uses app names, not bundle identifiers)
- 
Wait up to 7 days for new applications to appear in Vanta
 

### Difference between GCC High and commercial Intune integration
- 
GCC High uses Azure Government cloud infrastructure (endpoint.microsoft.us, graph.microsoft.us)
- 
Commercial Intune uses standard Azure endpoints (endpoint.microsoft.com, graph.microsoft.com)
- 
You must use the correct integration for your environment type
- 
The app registrations and authentication flows are separate between the two clouds
 

### How often does data refresh?
- 
Device metadata: Every 4 hours
- 
Application inventory: Follows Intune's 7-day cycle
- 
Compliance status: Every 4 hours
 

### Can I monitor mobile devices?
- 
No, this integration only supports Windows and MacOS devices
- 
iOS and Android devices cannot be monitored through this integration

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-microsoft-intune-gcc-high--01.png
- [image 02] ../../images/integrations/microsoft-intune/connecting-vanta-microsoft-intune-gcc-high--02.png
- [image 03] ../../images/integrations/microsoft-intune/connecting-vanta-microsoft-intune-gcc-high--03.png
- [image 04] ../../images/integrations/microsoft-intune/connecting-vanta-microsoft-intune-gcc-high--04.png
