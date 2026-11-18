# Register the Vanta Device Monitor to a Person

Source: https://help.vanta.com/en/articles/11346029-register-the-vanta-device-monitor-to-a-person
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

There are a few common reasons why a user may need to register their device manually;
- 
If an install fails prematurely before they can sign in and register their Vanta Device Monitor, leaving their device without an owner.
- 
If an email field is not passed during an MDM install.
- 
If the Vanta Device Monitor is already installed on the device but registered to a different email address
In such cases, the administrator or end user can manually register the Vanta Device Monitor using one of the steps listed below.
 

## Prerequisites
- 
Administrator access to the computer
- 
Administrator access to Vanta

## Method 1: Register Command
The First method involves the end user registering their device using the terminal or command prompt. This method requires them to have sudo or administrator privileges on the device. 
​
​Mac OS Specific Instructions
- 
Have the user open Terminal (the most straightforward way to find it is cmd+space bar "terminal"):
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767229/cbaefd62d0d5640ff48102df411d/11995407323668?expires=1794967200&signature=f5e03bf9017cda255858255d07077791e2e01ad562737962b38ddec1ae774c90&req=dSUmEM54moNdUPMW1HO4zTcU7KFChVdMOD7NaL3Z7Hr%2BibqtnYVp7q1flPK7%0Angnr%0A>
 
- 
Next, have the user copy and paste the code below into the Terminal:
​sudo /usr/local/vanta/vanta-cli register
- 
Hit 'Return'. It may prompt you to input a password. This is the password used for logging into the computer or installing applications. You will not see active typing, but the text is being captured. Continue to enter the password as usual and press Return
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767230/c7779cb1979ca68359b9687c0265/11995560866324?expires=1794967200&signature=86b6e9216eddbbcfe65d43faec21894b0e6e5b1273ed726babfb8a391d540449&req=dSUmEM54moNcWfMW1HO4zbg4HjTKsWf0QoEsxpspftHbUAmD8s9khRtzjE7H%0Az60C%0A>
 
- 
A browser window should open, prompting the user to sign in with their Vanta-associated email; after successful sign-in, the device should be registered to that email.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767242/f1fd7f511e135be25ba3ab0a2aa6/28262037061012?expires=1794967200&signature=cc4d370cc137ed16c0c7314f8285da8d5cb6a430f06c05a1f27f485602d92c83&req=dSUmEM54moNbW%2FMW1HO4zZEGnsjCHL32b7yKco0fYvejFGr7vbTpts4q2Jsc%0AEKFyzSky0m6%2BGtuuuqo%3D%0A>
 
Windows 10/11 Specific Instructions: 
- 
Have the user open the command prompt as an administrator. They can do this by pressing Start, searching for the command prompt, then right-clicking, and clicking Run as administrator:
​
Windows 11
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767233/c901788f4c54c553b1a0c5fe1ca3/11995586073876?expires=1794967200&signature=cbdbc105bd6b50401e851643fce805263833b5c1905b58435e9a97732d1db4b0&req=dSUmEM54moNcWvMW1HO4zQXFa5F6X%2FIzzywniThAdVNCmVrd%2BteWnjKJwOuU%0AwiB0%0A>

​Windows 10
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767257/3591f26fb8928f23066724b65a19/upload_9595234099781305080?expires=1794967200&signature=63c67c5eab48d8d8f4e04bda9c8c7c93846c75b9db90f84e2e3de69281629a63&req=dSUmEM54moNaXvMW1HO4zWWaaJ413BIRtWySXj6ZmC9HV3znPhgQBK%2FTVRFW%0AbY5h%0A>
- 
Next, have the user copy and paste the code below into the command prompt and press enter:
​
​C:\PROGRA~1\Vanta\vanta-cli register
​
This will cause additional text to print on the command line; this is expected 
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767249/efe04ee4c04b63ce0746a636dbf3/11995826452372?expires=1794967200&signature=9e532a77cda8c93f3745aef81e351c56dafe7063e811b054ac09772e69c52c30&req=dSUmEM54moNbUPMW1HO4zVOuyDlnxVMnX6MJy8eCTyU67oBOoWCoVPMd4a2N%0AlXX%2B%0A>
 
- 
A new browser window should open after a few seconds, prompting the user to sign in to complete registering the Vanta Device Monitor:
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767261/b7cefc54a763a33c5b2b4846a093/28262037061012?expires=1794967200&signature=e1750026cf1c7520d202676c4b632903c8d46869caf492f1022298bea43387f2&req=dSUmEM54moNZWPMW1HO4zcPEkuqUxCiUesHpAGZDcQ2gsEEv0EEV8183M1dR%0AybdTYB2FUlq1PyHHTp8%3D%0A>
 

## Method 2: Manually assigning owners on the Inventory page
The second method involves a Vanta admin navigating to the Inventory Page <https://app.vanta.com/inventory#employee-computers-agent> to manually assign a device owner. The device must have been previously registered to your organization with the Vanta Device Monitor to use this method.
- 
From the inventory page, select the Computers <https://app.vanta.com/inventory#employee-computers-agent> section
- 
Navigate to the device you wish to reassign
- 
Hover over the current owner's name, then click the pencil icon to activate the dropdown options.
- 
The dropdown will include the names of all active users. Scroll or use the search box to select the correct device owner.

## Images

- [image 01] ../../images/documentation/register-the-vanta-device-monitor-to-a-person--01.png
- [image 02] ../../images/documentation/register-the-vanta-device-monitor-to-a-person--02.png
- [image 03] ../../images/ux/other/register-the-vanta-device-monitor-to-a-person--03.png
- [image 04] ../../images/documentation/register-the-vanta-device-monitor-to-a-person--04.png
- [image 05] ../../images/documentation/manually-install-the-vanta-device-monitor-on-windows--01.png
- [image 06] ../../images/documentation/register-the-vanta-device-monitor-to-a-person--06.png
- [image 07] ../../images/ux/other/register-the-vanta-device-monitor-to-a-person--03.png
