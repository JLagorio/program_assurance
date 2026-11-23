# How to Handle Device Compliance for Chromebooks

Source: https://help.drata.com/en/articles/6297654-how-to-handle-device-compliance-for-chromebooks
Collection: Personnel Management › Device Compliance
Updated: 2026-08-25
Fetched: 2026-11-22

## Article text

Chromebooks have a number of built-in security features that make them an attractive option for a business. These security features, being enabled automatically, can make it difficult to show an auditor that certain security controls have been implemented. One example would be hard drive encryption. On a Windows laptop, you can demonstrate this by showing that BitLocker has been enabled. On a Chromebook, demonstrating this can be difficult. It is enabled automatically, and there is no real way to demonstrate this. So what do you do?

Our approach at Drata is to leverage this document on the security features of Chromebooks: [https://services.google.com/fh/files/misc/chrome_enterprise_security_one_pager.pdf](https://services.google.com/fh/files/misc/chrome_enterprise_security_one_pager.pdf)

Drata checks workstations for the following five items:

- Hard Drive Encryption
- Anti-Virus/Anti-Malware
- Screensaver Lock with 15 Minute Timeout
- Automatic Updates
- Password Manager

Examining the whitepaper listed above, by default, Chromebooks satisfy hard drive encryption. Chromebooks can be made to satisfy Screensaver Lock with a 15 Minute Timeout and a Password Manager by adjusting the settings on the device and installing a password manager from the Google Chrome Web Store. Chromebooks also support automatic updates by default; however, this feature can be disabled. The final item is Anti-Virus/Anti-Malware, which Chromebooks have limited support for. However, the whitepaper makes a case for Chromebooks not requiring anti-virus/anti-malware due to other controls in place, such as application sandboxing, a read-only operating system, and verified boot to detect operating system tampering. We recommend leveraging a third-party anti-virus solution for Chromebooks. However, if you feel the default protections are enough for your Chromebooks, we recommend reaching out to your auditor to make sure they agree.

The whitepaper listed above can be used to satisfy hard drive encryption out of the box.

For automatic updates, you should submit a screenshot of the Auto-Updates setting: [https://support.google.com/chrome/a/answer/3168106?hl=en#zippy=](https://support.google.com/chrome/a/answer/3168106?hl=en#zippy=)

For screensaver lock, not all Chromebooks support this feature. However, if your Chromebook does, you can submit a screenshot of the settings discussed here: [https://support.google.com/chromebook/answer/12212810?hl=en&ref_topic=2586066](https://support.google.com/chromebook/answer/12212810?hl=en&ref_topic=2586066). If your manufacturer does not support this feature, it is best that you speak to your auditor about how to handle this. Most auditors will not have an issue with this, but it is better to make them aware of it up front to prevent any potential issues.

For anti-virus, if you utilize a third-party anti-virus solution, you should submit screenshots of the solution. If you and your auditor have determined that an additional solution is not needed, you should leverage the whitepaper above.

For the password manager, we recommend downloading a password manager from the Chrome Web Store and submitting a screenshot of this application.

How you specifically want to handle this is up to you. If you only have a few users who use Chromebooks, it makes more sense to have the individual users upload that one-pager to the relevant device checks when they log into Drata and provide screenshots for the remaining settings. If all of your employees are using Chromebooks, we can bulk upload the one-pager to all users on the Drata side to the relevant device checks. Please reach out to your account manager to get a list of any information they need to perform this bulk upload, such as employee name. However, these users will still be required to upload screenshots showing that the remaining settings have been configured correctly when they log into the platform.

**Important Note:**

If your organization mainly uses Chromebooks, we recommend enabling the Google Admin MDM feature of Google Workspace: [https://support.google.com/a/answer/7400753?hl=en](https://support.google.com/a/answer/7400753?hl=en). This will allow your organization to ensure that users’ devices are appropriately configured.

## Related articles

- [Drata Agent not reporting system updates](drata-agent-not-reporting-system-updates.md)
- [Hexnode UEM (Windows) Integration Guide](hexnode-uem-windows-integration-guide.md)
- [How do Bring Your Own Device (BYOD) Devices Affect my Audit?](how-do-bring-your-own-device-byod-devices-affect-my-audit.md)
- [1Password Device Trust (Kolide) Integration Guide](1password-device-trust-kolide-integration-guide.md)
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
