# Capture Agent Device Logs (macOS)

Source: https://help.drata.com/en/articles/14328618-capture-agent-device-logs-macos
Collection: Personnel Management › Drata Agent
Updated: 2026-03-30
Fetched: 2026-11-22

## Article text

If you are experiencing issues with the Drata agent, follow these steps to collect diagnostics and retrieve the necessary log files for support.

## Step 1: Generate the Diagnostics

1. Open the **Drata Agent** from your menu bar.
2. Hold down the **Option (⌥)** key on your keyboard and click on the Drata icon/menu.
3. Select **Save Diagnostics** from the dropdown menu.

## Step 2:  Locate the Log Files

To find the generated logs, you’ll need to navigate to a hidden folder on your Mac:

1. Open **Finder** (click the smiley face icon in your Dock).
2. In the top menu bar, click **Go** > **Go to Folder...**
   - *Pro Tip: You can also press **Cmd (⌘) + Shift + G** on your keyboard.*
3. Copy and paste the following path into the search box and press **Enter**: `~/Library/Logs/drata-agent/`

## Step 3: Send the Logs

1. A folder will open containing a file named **main.log**.
2. Attach this file to your support ticket.

**Privacy Note:** These logs primarily contain system configuration and agent performance data required for troubleshooting. They do not include your browsing history, keystrokes, or the contents of your personal files or documents.

## Related articles

- [How does the Drata agent work?](how-does-the-drata-agent-work.md)
- [Drata Agent not reporting system updates](drata-agent-not-reporting-system-updates.md)
- [Hexnode UEM (macOS) Integration Guide](hexnode-uem-macos-integration-guide.md)
- [Drata Agent Installation Link](drata-agent-installation-link.md)
- [Install the Drata Agent](install-the-drata-agent.md)
