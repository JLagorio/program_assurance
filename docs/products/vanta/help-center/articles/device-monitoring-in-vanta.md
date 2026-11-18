# Device Monitoring in Vanta

Source: https://help.vanta.com/en/articles/11345823-device-monitoring-in-vanta
Collection: Audit Readiness ; Audit Readiness › Security Posture Best Practices
Fetched: 2026-11-17

## Article text

## What is device monitoring?
To build a strong security and compliance foundation, organizations need to be able to view, manage, and secure devices, such as laptops and desktops. Through Vanta, you can monitor your company’s computers, track every employee who has a laptop that is observed, and ensure your company’s computers are secure. Companies typically monitor their devices through Mobile Device Management (MDM) software. For customers without an MDM, Vanta offers the Vanta Device Monitor as a lightweight device monitoring tool. 
 

## What does the “Require device monitoring” task track?
When the “Require device monitoring” task is assigned to an employee, it tracks that the employee has a computer that is monitored in Vanta (either through the Vanta Device Monitor or an integrated MDM). The task will automatically pass if the employee owns a computer in Vanta. You can view all the computers in your account, along with their owners, on the Computers Page.
 

## Assigning the “Require device monitoring” task to personnel
Assign device monitoring tasks to your employees by adding the task to the relevant group(s) <https://help.vanta.com/en/articles/11345600>. Then:
- 
Using Vanta Device Monitor: Within the device monitoring task, select “Prompt employees to install the Vanta Device Monitor”. If this option is selected, employees with this task can log in to Vanta and install the Vanta Device Monitor on their computer. Once they do so, the computer will appear in Vanta, and the task will be completed.
- 
Using MDM: Select “Don't prompt employees to install the Vanta Device Monitor”. If this option is selected, employees assigned to this task will be required to have a computer monitored by your Mobile Device Management (MDM), and they will not be able to download the Vanta Device Monitor.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2454940463/5489e60df79e1609090c38bb86a8/image.png?expires=1794967200&signature=d4285788285ef1d93f1c6e29d8d827822629235493a93baa1d16ed3e2a857f68&req=diQiEsB6nYVZWvMW1HO4zYa1oxflEkaw3XJX%2BIpG7PNVOcPBI1Qe0UTA%2BrB%2B%0AIZdVitQFJuKGtrL8qY8%3D%0A>
 
 | 
We recommend monitoring the computers for all your employees. In some cases, companies use contractors who don’t want their computers to be monitored. If this occurs for you, you can assign this task to full-time employees only by creating a group of full-time employees and assigning the task to that group.

## What information does Vanta track for each computer?
Once a computer is in Vanta, we track the following information on the Computers Page. Each of these statuses is required for compliance:
- 
Antivirus installed: This status tracks whether antivirus software is deployed on the computer. Vanta determines this by checking whether the computer installed one of the antivirus software on this list <https://help.vanta.com/en/articles/11346109>. Learn more about how Vanta detects Iru <https://help.vanta.com/en/articles/11345999-configure-iru-antivirus-and-password-manager>, JumpCloud <https://help.vanta.com/en/articles/11345779>, and Microsoft Intune <https://help.vanta.comb/en/articles/11345838> antivirus.
- 
Hard drive encrypted: This status checks whether the computer’s hard drive is encrypted. Learn more <https://help.vanta.com/en/articles/11345839>.
- 
Screenlock enabled: This status checks whether the computer has screen lock enabled after at most 60 minutes of idle time. Learn more about screen lock for MacOS <https://help.vanta.com/en/articles/11345842> and Windows <https://help.vanta.com/en/articles/11345843>.
- 
Password manager installed: This status checks whether the computer has a supported password manager <https://help.vanta.com/en/articles/11346116> installed. Vanta determines this by looking at the apps installed on the computer. If the Vanta Device Monitoror JumpCloud MDM monitors the computer, we will also check Chrome extensions on the computer.

[image 02]

 

## Using the Vanta Device Monitor
- 
The Vanta Device Monitor is a lightweight program designed to run in the background of your computer, monitoring it for standard compliance requirements. It uses OSQuery to detect specific settings and applications installed on devices. It has a minimal performance impact: once you install the app and register your device, you shouldn’t notice any difference. Learn more <https://help.vanta.com/en/articles/11345407>.
- 
The Vanta Device Monitor is ready to use with your Vanta account; no additional configuration is required.
- 
To prompt your personnel to install the Vanta Device Monitor on their computers, assign them the 'Require device monitoring' task with the' Prompt employees to enable the Vanta Device Monitor' option.

## Integrating an MDM with Vanta
If Vanta supports <https://www.vanta.com/integrations?filters=MDM> your Mobile Device Management (MDM), you can integrate it with your account from the Integrations Page <https://app.vanta.com/integrations?state=available&servicecategory=MOBILE_DEVICE_MANAGEMENT_TOOL>.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2454943594/429a33fabef5e801a7e6f15a1078/image.png?expires=1794967200&signature=8fd37a8d5acecb725f04a66dd2dc60a3f3850049772311cc53f34be1807fc677&req=diQiEsB6noRWXfMW1HO4zat4K7aZjHlRqbyYiD0opnSaJq5HPd5hMmLcc%2FZD%0AAAlsL2j%2FLStQkbltN%2FQ%3D%0A>

## Should I use the Vanta Device Monitor or a Mobile Device Management (MDM) solution?
The Vanta Device Monitor is a lightweight software recommended for smaller companies (fewer than 75 devices). For larger companies, we recommend purchasing an MDM with additional features, such as enforcing security policies and managing device configurations. Learn more <https://www.vanta.com/resources/mobile-device-management-101-why-it-matters-and-how-to-deploy>.
 

## Viewing your company computers
The Computers Page lists all of your company’s computers. It also lists each computer’s owner, how it is monitored, its operating system, and the statuses above <https://help.vanta.com/en/articles/11345380>.
​
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2454945430/07fedbeed788cbf3b6ed5a8f1232/image.png?expires=1794967200&signature=65fdc0aeaaa4b588a28d9e6bf00538a403c03b540846e246f50050e72e9480a4&req=diQiEsB6mIVcWfMW1HO4zWWHZ3keQqHah%2BcW2V2QLObqzVYaRRuP7yyC3k2x%0A10rJ3wxZXEFGCPWIXtc%3D%0A>

## Images

- [image 01] ../../images/ux/personnel/device-monitoring-in-vanta--01.png
- [image 02] ../../images/ux/devices/device-monitoring-in-vanta--02.png
- [image 03] ../../images/ux/integrations/device-monitoring-in-vanta--03.png
- [image 04] ../../images/ux/devices/device-monitoring-in-vanta--04.png
