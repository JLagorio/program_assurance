# Troubleshooting the Vanta Device Monitor on macOS

Source: https://help.vanta.com/en/articles/11346065-troubleshooting-the-vanta-device-monitor-on-macos
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

The Vanta Device Monitor is compatible with macOS 11 or later. Click the ‘Apple’ in the upper left corner, and select About this Mac to see what you have installed! If you do not have version 11 or later, you will need to upgrade your operating system before installing the Vanta Device Monitor.
 

## What if the macOS version is up-to-date?
Obtain the doc output using the steps below.
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
copy/paste: sudo /usr/local/vanta/vanta-cli doctor
- 
Hit enter. It will then prompt you to input a password. (This is the password you use for opening your computer or installing applications. You will not see active typing, but the text is being captured.)
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769415/2e66e0fcaf518ddc51162eb9be2a/27557019813012?expires=1794967200&signature=d7a982c466b83659588e807195a9a96e414c633476570c82c32734758616dbf3&req=dSUmEM54lIVeXPMW1HO4zUrltP%2FSzfQVjVOQRfm9dU9T6TFKFM8%2FcSzLADC5%0AuxsZmBxXXHYMihaKyGs%3D%0A>
- 
Any checks that don’t pass can provide clues about what might be wrong.
- 
If you are still unsure, please send the output to [email protected], and we will be happy to assist you.
 

## Unable to get a Doctor output?
 
This means the Vanta Device Monitor wasn’t fully installed. You’ll want to uninstall completely and retry.
- 
Copy and paste' sudo /usr/local/vanta/vanta-cli uninstall' into the terminal (similar to before, you’ll need to enter the password you use to log in to your computer or download applications).
- 
Once uninstalled, you’ll need to visit https://app.vanta.com/downloads <https://app.vanta.com/downloads> to reinstall. You should see the computer pop up on the computer’s page within a few minutes.

## Images

- [image 01] ../../images/documentation/troubleshooting-the-vanta-device-monitor-on-macos--01.png
