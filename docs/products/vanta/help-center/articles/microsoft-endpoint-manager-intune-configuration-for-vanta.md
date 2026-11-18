# Microsoft Endpoint Manager (Intune) - Configuration for Vanta

Source: https://help.vanta.com/en/articles/11345788-microsoft-endpoint-manager-intune-configuration-for-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

When using Intune (formerly Microsoft Endpoint Manager), Vanta will only read in compliance policies and will not read in configuration profiles. Shown below is how to properly configure compliance policies for Vanta.
 

## Screenlock
- 
For Windows devices - the attached compliance policy must contain the following system security settings:
- 
Require a password to unlock mobile devices = Require
- 
Maximum minutes of inactive before password is required = 1 hour (Note: this setting must be less than or equal to 1 hour)
- 
Require password when device returns from idle state = Require
- 
Note:"Mobile devices" or "Mobile" in this context includes Laptops, Smartphones, Tablets, etc.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766319/75dedf62bdfefdfe37d6f5ef1fb6/5856978646420?expires=1794967200&signature=ec79d7b8c21c04cba454645ab3ea1832917584c21e27e3121786af748b08c919&req=dSUmEM54m4JeUPMW1HO4zU%2BsLRwbrkS7cVb4M6xeVq%2BYWhkj402wghRYUPPC%0AsRcfIdtb4vC1aW7QwH0%3D%0A>
- 
For MacOS devices- the attached compliance policy must contain the following settings:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766320/2fc8ef182a651f99891671a1e745/18582070540436?expires=1794967200&signature=17e06253c21b6b7fde09e82bcc77645dff21ef774aa4c77bb61a608c46552189&req=dSUmEM54m4JdWfMW1HO4zWuPihDw%2FTCf5E1uNRL1lXWXyIZiha2fAs9vblVL%0AUgh0Iuy1Ssx0H7dnDVQ%3D%0A>
 

## Hard Disk Encryption
Vanta looks at information provided on the hardware section of a device:
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766321/539e8bd7c4d27b4e9b9e37f77a54/15561908352532?expires=1794967200&signature=b3c3c596b94ab268ba0b7c55c2ac36f9cc93b0ef005cdeceab80f8b3a0659ed6&req=dSUmEM54m4JdWPMW1HO4zS%2FPMvy0MpNeiHFQvtT7xFbhgDZ2i4memDeuvxxT%0AcLT5Jwr9Y0lQ5y3M3h0%3D%0A>
 
If Encrypted is set to "Yes", Vanta will say that the device is encrypted.
You can ensure that devices are encrypted by attaching a compliance policy that contains the system security setting Require encryption of data storage on device:
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766322/b2d04a8dc8b38f19da216e3f3b69/4646741476116?expires=1794967200&signature=b5c477a94eb66a6aa350b25e06cfbb87795a4db071c0cf9fe5a63f666e9a153e&req=dSUmEM54m4JdW%2FMW1HO4zW4ThoVmyTBaOSpCJ664uKYvNPga%2B4yhNeomnvCW%0Ay63UIX%2BqmtUswlEkx7k%3D%0A>
 

## Password Manager
- 
Vanta will recognize the Password Manager is installed on the machine provided it is one of our supported Password Managers <https://help.vanta.com/en/articles/11346116> AND it appears in the Discovered Apps list
​
- 
Applications appearing only in the Managed Apps list are not detected by Vanta:
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766337/084fb7447947ffaf6aeee173d78b/4646446471828?expires=1794967200&signature=eba86f35dfd629b5fb71bbe610861c623c18dd2ddaf974a993adfca1fd169a5d&req=dSUmEM54m4JcXvMW1HO4zXeCvydEIdZ1uBQ9UomIWnaOQiJbEtfFzKFGJN%2FR%0A9dJJzaVW%2BUidBFAvETc%3D%0A>
 

## Antivirus
There are two ways Vanta will recognize antivirus is installed on the machine:
​
1. One of our supported antivirus applications <https://help.vanta.com/en/articles/11346109> is installed on the machine and available in the Discovered Apps list as mentioned above.
​
Or
​
2. The attached compliance policy requires antivirus to be installed (Windows Only):
 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766339/cdeb29b64e03e46a6ef1557b006d/4646624757268?expires=1794967200&signature=71a0aa764bda4cdfe30e44cbfcc5e73e2eff3b9c9f0728290177ac286e0ebf6e&req=dSUmEM54m4JcUPMW1HO4zVh%2FMsIVsDYo9dXSk6FuwzMwidx%2FZUS3ff9gdfOV%0ANme3e8%2F%2FpSEhv9VwTKw%3D%0A>
 

## Troubleshooting
- 
Check that settings for antivirus and screenlock are set in compliance policies and not in configuration profiles.
- 
Ensure that any devices that aren't reporting correctly are attached to the correct compliance policy.
- 
Ensure that the device is compliant with the compliance policy and\or not in a "not evaluated" state.
- 
If a device is showing for the incorrect user, note that Vanta will use the "enrolled by" field for the device to determine owner. This is due to a limitation of Microsoft's Graph API as it only shows "enrolled by" and not the "primary user."

## Images

- [image 01] ../../images/integrations/microsoft/microsoft-endpoint-manager-intune-configuration-for-vanta--01.png
- [image 02] ../../images/integrations/microsoft/microsoft-endpoint-manager-intune-configuration-for-vanta--02.png
- [image 03] ../../images/integrations/microsoft/microsoft-endpoint-manager-intune-configuration-for-vanta--03.png
- [image 04] ../../images/integrations/microsoft/microsoft-endpoint-manager-intune-configuration-for-vanta--04.png
- [image 05] ../../images/integrations/microsoft/microsoft-endpoint-manager-intune-configuration-for-vanta--05.png
- [image 06] ../../images/integrations/microsoft/microsoft-endpoint-manager-intune-configuration-for-vanta--06.png
