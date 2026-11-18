# Frequently Asked Questions: Intune

Source: https://help.vanta.com/en/articles/11346103-frequently-asked-questions-intune
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

If my customer previously used Workstation Agent and now connects Intune, will both results show up as separate machines in Vanta and the computers page? 
- 
Yes. We recommend removing the Vanta Device Monitor on an Intune machine. The employee can install it, or an admin can de-provision Intune.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1522227547/461f5073efc86b815c7b960517fa/18367731298708?expires=1794967200&signature=9334227c9d0f2fbcde8b4e72a4ad42dcb9809994975139832659869939e0ed18&req=dSUlFMt8moRbXvMW1HO4zcE1V9EYnUYYwOqh5g%2FYf342ju%2FID%2FBHWKypX283%0Am6FmSw2zVvvuP6CDnng%3D%0A>
 
 
For Windows 10, how do I let Vanta detect Antivirus through compliance policies?
- 
In Compliance Policies <https://endpoint.microsoft.com/?ref=AdminCenter#blade/Microsoft_Intune_DeviceSettings/DevicesComplianceMenu/policies>, ensure you have a policy that requires Antivirus or create one.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768623/829a6607981602d3a2052d13448e/18367772140052?expires=1794967200&signature=618d5b292a9ba59a1defbd523134989c996a4a6113c15422548d45271ec084fd&req=dSUmEM54lYddWvMW1HO4zWf3BO797KegwbUx9kti6AQYUxKL08BnOie2mfbf%0AFccHI8sojBgmB5WhkF4%3D%0A>
- 
Assign the policy to a Windows device. When that Windows device has an antivirus installed and this policy state becomes compliant or remediated, Vanta will show that the device has an Antivirus installed.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1522229291/475b2a2065b2ee011608dc5e78f4/18367772141460?expires=1794967200&signature=32c52b70693058b219a7d54a5e2889c36272545ac2c4c9c6ffe0fa51d6098616&req=dSUlFMt8lINWWPMW1HO4zagB8Pn2f0yUKj3Qr7lGsY%2B17mGtQsQ9Zz1Poe8G%0A%2BC3eXUWLTXmdJnNUNr4%3D%0A>

## Images

- [image 01] ../../images/integrations/microsoft/frequently-asked-questions-intune--01.png
- [image 02] ../../images/integrations/microsoft/frequently-asked-questions-intune--02.png
- [image 03] ../../images/integrations/microsoft/frequently-asked-questions-intune--03.png
