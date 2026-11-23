# Resolving Drata Agent Startup, Auto-Update, and Permission Errors

Source: https://help.drata.com/en/articles/18185336-resolving-drata-agent-startup-auto-update-and-permission-errors
Collection: Understand the Drata Platform › Troubleshooting
Updated: 2026-11-03
Fetched: 2026-11-22
Description: Learn how to troubleshoot and resolve common Drata Agent startup crashes, JavaScript errors, OSStatus alerts, and repeated auto-update failures caused by incorrect file or directory permissions.

## Article text

## Overview

When the Drata Agent is deployed via administrative or Mobile Device Management (MDM) tools, application files and directories may inherit restricted system-level permissions. If the active local user lacks **Read and Write (RW)** access, the agent cannot write logs, update local state files, or replace binary packages during updates.

## Symptoms

- **Repeated Update Alerts:** The Drata Agent attempts an automatic update every hour, fails, and generates repeated failure notifications.
- **Launch Failures / Crashes:** The application crashes immediately upon opening, often presenting generic JavaScript error popups or macOS `OSStatus` execution errors.

## Prerequisites & Critical File Paths

The user running the Drata Agent must have **Read and Write (RW)** access to the application bundle/installation directory and its active data files:

| **Platform** | **Component** | **Default Path** | **Required Access** |
|---|---|---|---|
| **macOS** | Application Bundle | `/Applications/Drata Agent.app` (including all sub-packages/contents) | Read & Write (Recursive) |
| **macOS** | Application Data | `~/Library/Application Support/drata-agent/` (`app-data.json`, `main.log`) | Read & Write |
| **Windows** | Installation Folder | `%LocalAppData%\Programs\drata-agent\` | Read & Write / Modify |
| **Windows** | Application Data | `%AppData%\drata-agent\` (`app-data.json`, `main.log`) | Read & Write / Modify |

*(Refer to internal documentation: **Agent File Locations** for custom deployment paths.)*

## Diagnostic Steps: Confirming Permissions

### macOS

Auto-update failures frequently occur when permissions on the top-level application wrapper differ from the internal package contents.

#### Method 1: GUI Inspection

1. Open **Finder** and navigate to the **Applications** folder.
2. Right-click **Drata Agent.app** and select **Get Info** (`Cmd + I`). Expand the **Sharing & Permissions** section at the bottom to check current user permissions.
3. Right-click **Drata Agent.app** and select **Show Package Contents**.
4. Highlight the **Contents** folder and press `Cmd + I`.
5. Verify whether the `Contents` folder matches the top-level app permissions. If the internal package has restricted access (e.g., Read Only), auto-updates will fail.

#### Method 2: Terminal Inspection

Run the following commands in Terminal to compare wrapper and inner bundle permissions:

Bash

```
ls -ld /Applications/Drata\ Agent.app ls -l /Applications/Drata\ Agent.app
```

*Expected Output:* Both the application directory and the `Contents` folder should display read, write, and execute permissions (`drwxr-xr-x` or `drwxrwxr-x`) assigned to the active user or their primary administrative group.

## Resolution Procedures

### macOS Resolution

If permissions are misaligned or read-only, cascade ownership and write permissions across the entire package bundle.

#### Step 1: Set Base Permissions via GUI

1. In **Finder**, go to `/Applications`.
2. Select **Drata Agent.app** and press `Cmd + I`.
3. Unlock the yellow padlock in the bottom right corner with an administrator password.
4. Set the logged-in user to **Read & Write**.

#### Step 2: Propagate Recursively via Terminal

To apply these permissions through all nested subdirectories and binaries:

1. Open **Terminal**.
2. Run the following command to cascade the base bundle’s octal permissions recursively:
   Bash
   ```
sudo chmod -R `stat -f '%A' /Applications/Drata\ Agent.app` /Applications/Drata\ Agent.app
   ```
3. Run the following command to cascade ownership recursively:
   Bash
   ```
sudo chown -R `stat -f '%Su:%Sg' /Applications/Drata\ Agent.app` /Applications/Drata\ Agent.app
   ```
4. Restart the Drata Agent.

**Note for MDM Administrators:** If your MDM solution or endpoint manager runs periodic enforcement policies, package reinstalls or compliance scripts may reset these permissions. Ensure your deployment script explicitly provisions the `/Applications/Drata Agent.app` folder with the target user as owner.

### Windows Resolution

Ensure the active Windows user account has full **Modify** rights to both the executable directory and the working data files.

#### Step 1: Update Application Data Files (`app-data.json` & `main.log`)

1. Press `Win + R`, paste `%AppData%\drata-agent`, and hit **Enter**.
2. Right-click `app-data.json` and select **Properties**.
3. Select the **Security** tab and click **Edit**.
4. Select the current user account and check the **Allow** box for **Modify** (ensuring **Read**, **Write**, and **Read & execute** are also enabled).
5. Click **Apply**, then **OK**.
6. Repeat steps 2–5 for `main.log`.

#### Step 2: Update Application Installation Folder

1. Press `Win + R`, paste `%LocalAppData%\Programs`, and hit **Enter**.
2. Locate the `drata-agent` folder.
3. Right-click the `drata-agent` folder and select **Properties**.
4. Go to the **Security** tab and select **Edit**.
5. Select the logged-in user account, check **Allow** for **Modify**, and apply changes.
6. Relaunch the Drata Agent.

## Related articles

- [How does the Drata agent work?](how-does-the-drata-agent-work.md)
- [Install the Drata Agent](install-the-drata-agent.md)
