# Custom Device Connections

Source: https://help.drata.com/en/articles/12014143-custom-device-connections
Collection: Understand the Drata Platform › Connections › Custom Connections and Tests
Updated: 2026-09-17
Fetched: 2026-11-22

## Article text

If your organization uses a tool or system that Drata doesn’t currently integrate with, you can still automate evidence collection. With Custom Device Connections, you can send structured JSON data pulled from an MDM or IT Inventory system, whether cloud-based, on-premises, or proprietary, directly into Drata.

Custom Device Connections is a subset of functionality from CCT (Custom Connections and Tests) streamlined to mimic Drata’s internal MDM test logic.

- The data provided in the schema allows you to pre-map evidence for the ‘Device’ category of tests.

## Complete workflow overview

Here’s how to connect an external system to Drata and to provide device data:

1. Create a Custom Device Connection
   Connect your external system.
2. Submit Evidence
   Submit your first dataset to confirm your connection and schema are working correctly.
3. Automate Data Syncs
   Set up a recurring data submission process using a tool like Make.com, Tines, or a scheduled script (such as a cron job). This ensures evidence is collected continuously without manual effort.
4. Review Results and Link to Controls
   View pass/fail results and manage exceptions.

## Prerequisites

- Availability: Custom Device Connections are available on the Advanced and Enterprise plans.

### Limitations

- The third-party platform configuration as well as the automation of the workflow and its cadence is set by the customer. This is NOT a standard integration.
- The use of custom device connections requires developers to access the API and manually build into the workflow. The time required varies based on the complexity of each organization's configuration.
- The cadence and how data is pulled and pushed into Drata is determined and manually initiated by the customers.

## Set Up a Custom Device Connection

1. In the left navigation panel, select Connections.
2. Ensure you are on the tab for your available connections.
3. Filter by **MDM** category of connections.
4. Connect the **Custom Device Connection**
5. Enter a name for your device connection.
6. **API key**: Choose to create an API key or utilize an existing API key.
   - Create an API key (Recommended approach): The required scopes are already applied.
   - Use existing API key: Ensure your API key has the required scopes:
      1. Read Data
      2. Add Data
      3. Update Data
      4. Delete Data

**Device Schema Data**

Unlike Custom Connections, the Custom Device Connections already has a schema that the Drata API expects for submitted Device data. This can be reviewed in more detail on our [developer page](https://developers.drata.com/openapi/reference/v2/tag/Devices/#tag/Devices/operation/DevicesPublicV2Controller_createDeviceForCustomConnection).

For your convenience, here is an example of sample data with the schema you will need to conform to:

```
{

        personnelId: 1,
        alias: 'danielm-01',
        antivirusEnabled: true,
        antivirusExplanation: {
          antivirusApps: [
            'Crowdstrike windows sensor'
          ]
        },
        appList: [
          {
            name: 'Microsoft Defender Antivirus',
            version: '1.421.12.0',
            description: 'Microsoft Defender Antivirus'
          }
        ],
        autoUpdateEnabled: true,
        autoUpdateExplanation: 'Disabled',
        browserExtensions: [
          {
            name: 'Microsoft Defender Antivirus',
            version: '1.421.12.0',
            description: 'Microsoft Defender Antivirus'
          }
        ],
        externalId: 'aaaaaaaa-bbbb-0000-cccc-dddddddddddd',
        firewallEnabled: true,
        firewallExplanation: 'On',
        passwordManagerEnabled: true,
        encryptionEnabled: true,
        encryptionExplanation: {
          bootPartitionEncryptionDetails: {
            partitionFileVault2Percent: 100,
            partitionFileVault2State: 'ENCRYPTED',
            partitionName: 'Macintosh HD (Boot Partition)'
          }
        },
        model: 'Mac16,1',
        serialNumber: 'BKH8RXT4T9',
        macAddress: '01-23-45-67-89-AB',
        passwordManagerExplanation: {
          passwordManagerApps: ['1password']
        },
        platformName: 'MACOS',
        platformVersion: 'string',
        screenLockEnabled: true,
        screenLockExplanation: 'ScreenLock delay is immediate',
        screenLockTime: 15,
        windowsServices: [
          {
            description: 'Security feature that monitors and controls network traffic entering and exiting the device',
            name: 'Windows Firewall',
            startType: 'Automatic',
            status: 'Running'
          }
        ]
      }
```

Drata monitoring tests will pass or fail based on the values of the fields “screenLockEnabled”, “autoUpdateEnabled”, “passwordManagerEnabled”, “encryptionEnabled”, and “antivirusEnabled”. The "Explanation" fields will provide more description information for your auditor to review that justified the pass or fail status of the tests.

Every other field is passed back to help identify the device in the Drata Asset register.

Do note that Drata currently requires every device to be linked to a personnel who will be designated as the Owner of each device. To properly link the device to the right user, you will need to query the owner with the API endpoints for [‘Find Personnel](https://developers.drata.com/openapi/reference/v2/tag/Devices/#tag/Devices/operation/DevicesPublicV2Controller_createDeviceForCustomConnection)’.

## Related articles

- [Test 64: Malware Detection Software Installed](test-64-malware-detection-software-installed.md)
- [JumpCloud Integration Guide (MDM)](jumpcloud-integration-guide-mdm.md)
- [Hexnode UEM (Windows) Integration Guide](hexnode-uem-windows-integration-guide.md)
- [Part 1: Custom Connections and Tests](part-1-custom-connections-and-tests.md)
- [Multi-Device Support](multi-device-support.md)
