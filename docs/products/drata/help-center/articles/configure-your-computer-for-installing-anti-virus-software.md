# Configure your computer for installing  Anti-Virus Software

Source: https://help.drata.com/en/articles/4675835-configure-your-computer-for-installing-anti-virus-software
Collection: Personnel Management › Device Compliance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Protect your system from malware (Test: Malware Detection Software Installed – Test 64)

## Article text

Installing and using antivirus (AV) software is crucial for protecting your system from malware and other threats. Ask your IT administrator or manager which AV solution is the chosen provider for your company. Failure to complete these steps will result in failing [Test: Malware Detection Software Installed (Test 64)](test-64-malware-detection-software-installed.md) for your personnel.

Your company may have specific guidance on how to use anti-virus software. Verify with your IT and compliance teams.

## Prerequisites

- Ensure your computer is running macOS Monterey 12 or later.
- If you utilize EDR connections (such as [SentinelOne](sentinelone-edr-integration-guide.md)), Drata sources Antivirus compliance *exclusively* from the EDR data. It does not fall back to the Drata Agent/MDM AV signal for that device.

## Install supported AV software

Install one of the supported antivirus software options listed below. If your antivirus software is not listed, contact our team for potential support options.

### Supported Antivirus Software

- Avast
- Avira
- Bitdefender
- Comodo Antivirus
- Clam AntiVirus
- Crowdstrike
- Cybereason next-generation antivirus (ngav)
- Cyberinc isla
- Cylance smart antivirus
- Deeparmor
- Dell endpoint security suite enterprise
- ESET NOD32 Antivirus Business Edition for Linux
- Fireeye endpoint security
- FortiClient
- Gravityzone elite
- Gravityzone ultra
- IBM proventia
- Malwarebytes
- Mcafee mvision endpoint
- Mcafee livesafe
- Mcafee small business
- Menlo security
- NANO Antivirus
- Netgear Antivirus
- Reve antivirus
- Secpod saner
- Secureit pro
- SentinelOne
- Sophos
- Spamfighter
- SpamTitan
- Splunk insights for ransomware
- Total defense anti-virus
- Trend micro interscan viruswall
- Trend micro apex one
- Verizon security & privacy multi-device
- Microsoft defender
- Zonealarm

For Windows and Mac, the Drata Agent verifies if you have installed one of the supported software options to pass the antivirus software compliance check.

## Configure MacOS without the supported antivirus software

> **ℹ️ Note**: If you haven't installed a supported antivirus software option, follow the requirements below.
>
> ---
>
> If you have already downloaded a supported antivirus software, you do not need to follow the requirements below.

These items should be enabled by default on macOS, but we recommend double-checking their configuration.

**Enable XProtect:**

1. Select the Apple icon in the top-left corner and choose **System Settings **from the dropdown menu.
2. Select **Software Update**.
3. Select the **Advanced** button (depending on your macOS version, you might see an "i" inside a circle instead).
4. Ensure that either "Install system data files and security updates" or "Install Security Responses and system files" option is selected.
5. Ensure to save your changes and close **System Settings**.

**Enable Gatekeeper:**

1. Click the **Apple menu ()** in the top-left corner and select **System Settings**.
2. Select **Privacy & Security** in the left sidebar.
3. Scroll down to the **Security** section.
4. Under **"Allow applications downloaded from"**, select **App Store and Known Developers** *(or **App Store and identified developers** on older macOS versions)*.
   - The exact phrase differs depending on the macOS version.
   - If prompted, use Touch ID or enter your password to confirm.
5. Close **System Settings**.

If you fail the antivirus check, it means neither XProtect nor Gatekeeper was enabled, and no supported antivirus application was found.

**Troubleshoot for XProtect: **

If the test continues to fail after enabling these items, try disabling and re-enabling either "Install system data files and security updates" or "Install Security Responses and system files" option.

## External resources

Anti-Virus software for Ubuntu users

- [https://help.ubuntu.com/community/Antivirus](https://help.ubuntu.com/community/Antivirus)
- [https://www.avast.com/business/products/linux-antivirus](https://www.avast.com/business/products/linux-antivirus) (cost associated)
- [http://www.clamav.net/](http://www.clamav.net/) (free)

## Related articles

- [Test 64: Malware Detection Software Installed](test-64-malware-detection-software-installed.md)
- [Drata Agent not reporting system updates](drata-agent-not-reporting-system-updates.md)
- [Computer Configuration via Windows OS](computer-configuration-via-windows-os.md)
- [Computer Configuration via Ubuntu Linux](computer-configuration-via-ubuntu-linux.md)
- [Install the Drata Agent](install-the-drata-agent.md)
