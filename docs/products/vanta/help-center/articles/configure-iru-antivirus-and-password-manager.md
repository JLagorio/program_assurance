# Configure Iru - Antivirus and Password manager

Source: https://help.vanta.com/en/articles/11345999-configure-iru-antivirus-and-password-manager
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When using Iru, Vanta uses device details, Library Item data, and the device's Applications list to identify supported antivirus and password manager software.
 
Iru EDR is an Iru Library Item. When it is configured for a managed device, Vanta recognizes it as the antivirus signal for that device. Vanta also recognizes supported antivirus and password manager applications that appear in the device's Applications list.
 

## Procedure
- 
Vanta recognizes a supported antivirus solution <https://help.vanta.com/en/articles/11346109> or a supported password manager application <https://help.vanta.com/en/articles/11346116> when the required data is reported by Iru.
- 
For Iru EDR, Vanta uses the Iru EDR Library Item configured for the managed device.
- 
For other supported antivirus and password manager products, Vanta checks the device's Applications list.

## Configure Iru EDR
Configure the Iru EDR Library Item for the managed devices you want Vanta to evaluate. Make sure the Iru integration is connected and has access to the Library Item data.  After Iru reports the Library Item and device details to Vanta, Vanta can use Iru EDR as the antivirus signal for the device.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2576529839/88548457f5f04d09c79415f58828/image.png?expires=1794967200&signature=381a0bcf1f11f7079ff5efb4d74901f1e4c3d3a344c2fa9aa0841aed59b6b3be&req=diUgEMx8lIlcUPMW1HO4zchIJsMiZyUl%2FN2vkKUIZ8oBHgvFvvVZSgyBiR81%0Ahy%2FFssou9315Az9iQoU%3D%0A>
 
 

## Things to Note
- 
Iru currently does not expose XProtect as a detected application. Vanta cannot automatically detect XProtect on devices using Iru. You may provide manual evidence that XProtect is enabled on each device, subject to your auditor's requirements. 
- 
For any questions, reach out to us at [email protected] and we will be happy to guide you.

## Images

- [image 01] ../../images/integrations/kandji/configure-iru-antivirus-and-password-manager--01.png
