# Configure Iru - Screen Lock

Source: https://help.vanta.com/en/articles/11346046-configure-iru-screen-lock
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When using Iru, Vanta will look for screen lock settings enforced via a Passcode Library Item assigned to a Blueprint. This applies to both macOS and Windows devices managed by Iru.
 

## Create a passcode library item 
- 
In Iru, navigate to Library and select Add Library Item. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2399162126/a1d092654894a4f1bbde29d9fd1d/image.png?expires=1794967200&signature=018540ca5b5dc26892d6ab2b10e4e46601163fef44b86d271654ac3be4fcdf38&req=diMuH8h4n4BdX%2FMW1HO4zenbEQNyol%2BLKfN0RilWS9yeFQB03gnQbitEqMAZ%0AWXzw5UEuvMHIROK1UDw%3D%0A>
- 
Search for and select Passcode. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2399166399/6b87a92a9db4b87d6d20fd61242b/image.png?expires=1794967200&signature=6a50d9ac743e92cd1fc72f21abab1d1b817ad9ca8cc7b3f56d82826fdbd3facc&req=diMuH8h4m4JWUPMW1HO4zfkTN%2Fg61kMJvp8VcvHQQ1Fyk4QfJh%2F7KUGfDkDo%0AQwHPT4nnvkmQnr5%2FB9s%3D%0A>
- 
Click the Add and configure button. 
- 
Enter a title for the Library Item (i.e. Screen Lock Policy). 
- 
Under Install on, select the platform(s) you want to target: MacOS, Windows, or both. 
- 
Assign the Library Item to the relevant blueprints. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2399175443/a06b7fcf9582e322c6b288cd8cff/image.png?expires=1794967200&signature=0e00db63b9ce0615e0588e907c07ccc2518b451cff36961824f920b4c7cad8d5&req=diMuH8h5mIVbWvMW1HO4zUBWi1IUpsDfd9CjinYbbF9%2BoypCiGgbREBqT7AU%0AOZ1IAxZEaYQNF44M%2FLs%3D%0A>
 
 

## Configure screen lock settings 

## MacOS
- 
Configure the following settings within the Passcode Library Item: 
- 
Start screen saver after: Enable this setting and set it to 15 minutes or less. 
- 
Require after sleep/screen saver/lock: Enable this setting to require a password after the screen saver activates. 
Both settings must be configured in the same Passcode Library Item. 
 

## Windows
Configure the following setting within the Passcode Library Item: 
- 
Configure max inactivity time: Enable this setting and set it to 15 minutes or less. This forces the device to the PIN/password lock screen after the defined period of inactivity. 
 

## Assign to a Blueprint
Once the Passcode Library Item is configured, confirm it is assigned to a Blueprint that is applied to your target devices. Click Save. Vanta will detect screen lock compliance once the Library Item is active on the device.
 
⚠️ Note: The previous Screen Saver Profile method is no longer supported for macOS devices in Iru, as Apple has removed support for profile-based screen saver configuration. The Passcode Library Item is the required method for enforcing screen lock on both macOS and Windows devices going forward.

## Images

- [image 01] ../../images/integrations/kandji/configure-iru-screen-lock--01.png
- [image 02] ../../images/integrations/kandji/configure-iru-screen-lock--02.png
- [image 03] ../../images/integrations/kandji/configure-iru-screen-lock--03.png
