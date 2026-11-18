# Notion Task Tracker Configuration Modal

Source: https://help.vanta.com/en/articles/11345599-notion-task-tracker-configuration-modal
Collection: Team Compliance ; Team Compliance › Employee Onboarding & Offboarding
Fetched: 2026-11-17

## Article text

​Please note:
​This feature is still in Beta only. If you are interested, please reach out to our support team.
​

## Pre-requisites
There are four necessary properties that a Notion Page must have to consider it eligible for Task Tracking so Vanta can perform compliance tests appropriately on them:
- 
Tags: we read task tags to figure out if a task tracker item refers to a security task or not. For Notion tasks, we expect this to be a Multi Select <https://developers.notion.com/reference/page-property-values#multi-select> page property.
- 
Owner: we know if a task is assigned or not by checking if it has an owner. This field should be a People <https://developers.notion.com/reference/page-property-values#people> page property.
- 
Priority: we can tell how urgent a task is through this property. We expect it to be either a Select <https://developers.notion.com/reference/page-property-values#select> or a Status <https://developers.notion.com/reference/page-property-values#status> page property.
- 
Status: we can tell if a task was closed or not through this property. We expect it to be either a Select <https://developers.notion.com/reference/page-property-values#select> or a Status <https://developers.notion.com/reference/page-property-values#status> page property.
For example, it’s possible to configure the following Pages in your Notion Dashboard:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753778/c7abfcae66569c59c577e5ef1805/34110335496980?expires=1794967200&signature=fdbc77e889b73ecf0447e1b6954918a4251fa9fab15e557b8f99f54ed7dd5b7a&req=dSUmEM57noZYUfMW1HO4zUmOxBfJoAk3wYdvBXDQUeqGr9DhEGVa8qYQ3EYt%0Ayo6EsET5ZfXHsl%2FB1Fg%3D%0A>
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753782/8e7d24323f6755c50d56d83cfe5d/34110354207892?expires=1794967200&signature=9032472e254b4a84a0550e9253420189a86e0d07065992159fdc27e32cced249&req=dSUmEM57noZXW%2FMW1HO4zV3vE%2BGVSzSqkTTfKVqWnSUZP4N4JFLEVuvptoX3%0AVaT0AnO3ORAkRCLOaY4%3D%0A>
 
Task Tracker 1 page is valid for Task Tracking because it has each of the properties  listed above, whereas Task Tracker 2 page is not a valid page because it’s missing a Multi Select <https://developers.notion.com/reference/page-property-values#multi-select> property.
 
 

## Accessing the Task Tracker Configuration Modal
The Notion Task Tracker Database Mappings modal will be displayed immediately after connecting the Notion integration for the first time or editing the current connection.
- 
To open the modal at any other time, navigate to the Integrations <https://app.vanta.com/integrations> page
- 
Click the Notion integration's Manage button
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753787/8260aadcdf85be8cf944128ebad7/33831986629780?expires=1794967200&signature=d12e7cb9648b6377f58ca1efe50a1d6f352cdbca4fd2453ddf85026d076326ab&req=dSUmEM57noZXXvMW1HO4zeLsMcq29H6GM6qsZ2fQ8qM2wfsaSXI1UYB3JPBr%0AgyeY83eTOhqXWhJj7iw%3D%0A>
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753780/8420d56fe06e78757d598fadf9c2/33831970081300?expires=1794967200&signature=0137543e07c39cee6c50fc80a1bae6a448553a3998f996362c765aa9824ba658&req=dSUmEM57noZXWfMW1HO4zRuViTp6%2BvcPLbeE%2B%2FE9%2B%2BR3LpwEevURZXOopy8i%0AFoNAIi294z1w3%2FzjsY4%3D%0A>
- 
Select Edit Task Tracker Database Mappings from the dropdown
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753801/2c350c6715bcd9c9f5505988e0ff/33831970082708?expires=1794967200&signature=01d90b2fdab9280bab857e37e2d19c822c5268f07dd6a785ee1db04a87026b82&req=dSUmEM57nolfWPMW1HO4zZ0%2FyzhMJo2Q4G0FM3CBEJyTGJbu9rNybh4kffXg%0AnWwbjxwScx5Ki1AYRWc%3D%0A>
 
(We acknowledge that this is not the most intuitive experience at the moment, so we are working on implementing a better one)
 
 

## Task Tracking Configuration Modal Form

## Selected Notion Pages display
- 
The modal will list all of the selected pages during connection and determine if these are eligible to be a valid Page or not.
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753805/07515bd448cd6f063e0d38bbd7ed/33831970083476?expires=1794967200&signature=f7f3699f63c720c5537f8b0ac27679f3b6c6a7d6085a9a030a57f58e7c26d83f&req=dSUmEM57nolfXPMW1HO4zeEvPZ%2FHdc08zvXkZKxMJ4EwAwTQUi9nKGOjD4Ho%0AAmgJC8oEa9jWhafVZas%3D%0A>
- 
By clicking the checkbox to the left of the page name, Vanta will scope in that page to fetch task tracker items from it. 
- 
Please note: The page will be disabled for selection if it does not have all of the eligible properties listed above.
- 
To open a new tab in your browser to the selected page, click the chainlink icon next to its name
​

## Edit Notion Page Mappings
- 
Click the pencil icon to the right of the page name to display a set of dropdowns that will map the selected page properties to our internal task tracker item schema.
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753806/d6e41e1714ad37856bab1738724a/33831970086548?expires=1794967200&signature=1eb2b57fcc13aa11d17d09980cae4eaf4484351d1efa371c131208ce0ec25ddd&req=dSUmEM57nolfX%2FMW1HO4zRx6SLzTwY%2B9wKPaluUXQ%2FldlAqOekil7xZADmj5%0AcCSNnJH%2BSctwURvnxUE%3D%0A>
- 
You’ll need to click that pencil icon on each database you want to edit in order to edit its property mappings (Again: not the most intuitive design, but it will be improved later).
 

### Tags Field Mapping Dropdown
This will display the available Multi Select <https://developers.notion.com/reference/page-property-values#multi-select> properties for the selected page:
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753802/f8b4f33e5c8a0b411beb2c6c826d/33831986638740?expires=1794967200&signature=dfe9ce283df41ff1a29deaba34cbe6bfb5abdd28665e1091ff6a077bbb84e92d&req=dSUmEM57nolfW%2FMW1HO4zS3A86aEKmRbsZCCUZfKFHREWHtD7OdXHYUittWa%0AXe3RRJpPavlGQPZ8Gcc%3D%0A>
You should select the field where you store the tags for your task tracking items.
​
​

### Owner Field Mapping Dropdown
This will display the available People <https://developers.notion.com/reference/page-property-values#people> properties for the selected page:
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753820/9ff94e5495a39b22451fbe4f30c9/33831970088596?expires=1794967200&signature=613c3037f2eda5caf87265fadda99d1cf57e9bf387d2f496567a7ab1c38cc9cb&req=dSUmEM57noldWfMW1HO4zXqJjewDWk3WFBtYpTLSHPpMr%2BrJWiCfg3AtW31N%0A5hmlq4l17BFHRwTn0vo%3D%0A>
You should select the field where you store the owner/s of a given tracking item.
​
​

### Priority Field Mapping Dropdown
This will display the available Select <https://developers.notion.com/reference/page-property-values#select> or a Status <https://developers.notion.com/reference/page-property-values#status> properties for the selected page:
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753826/37373d7624cfcd2083b75fafea96/33831986643988?expires=1794967200&signature=62861c34ed16677444ceb4e010c8659b517b588b2849347b32bd0de5c727c095&req=dSUmEM57noldX%2FMW1HO4zaqvrpuxJXeHxUams1IXKQ8j8GJVxT4ksP9ZN1GT%0AnbGJWF6iYj8iBLJThJY%3D%0A>
 You should select the field where you store the priority for your tracking items.
 
After this, you will need to configure the priority values for each priority level that Vanta manages:
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753823/4e495168c434a19d5729a7e97433/33831986645396?expires=1794967200&signature=ad5608ed46e0a122d74e7e64598fedea13d9c7c81fc9213a4aa49cc1fe7e8b03&req=dSUmEM57noldWvMW1HO4zclr0E4YFpwD7kDXVWXTLSAQFS3UvY6qnUHY8%2BmO%0AVxc0d%2FwNqRWLUutWTpM%3D%0A>
 
Note that the values will change based on the property selected and the options available for it.
​
​

### Task Closed Field Mapping Dropdown
This will also display the available Select <https://developers.notion.com/reference/page-property-values#select> or a Status <https://developers.notion.com/reference/page-property-values#status> properties for the selected page:
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753824/20ff7067d5615cae7ec301f366e6/33831986647316?expires=1794967200&signature=c4a94bbb59debf352ed4683d9c5820ab9d989ee23e6d128a14bffcb05d7a6c89&req=dSUmEM57noldXfMW1HO4zYgqQhOlAq7n2CLLcMTvnn1mNv0y3dPq99m3PKsw%0Acbr9gMKWDNoZyuDljDE%3D%0A>
 You should select the field where you store the status for your tracking items.
 
After that, you will need to configure the status to consider your task tracking items as closed/solved:
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753830/804ed1cb799cd1b0c72919cc9592/33831970096148?expires=1794967200&signature=1d644ca3eaf2af00f0627087790f721f7b1cbe6caede3c409db1f3871159fc80&req=dSUmEM57nolcWfMW1HO4zRdjMnqv%2BjKDBzYL4FH7v5kPQzB4Y9Uz7F5DjMZd%0A9uSBWCfwpD1TXX2VFpE%3D%0A>
 
 

## Submitting Notion Page Mappings
- 
Once you’re done configuring each of your selected Notion pages' properties, you can submit your configuration mappings by clicking the Update Mappings button
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753842/10cbe27b01b87e112e882fb611e4/33831986654484?expires=1794967200&signature=1a5411ded5d775a8cb22a4ab88e7940d8a511872a02cc0a5a7ab2d92d5822a0b&req=dSUmEM57nolbW%2FMW1HO4zTbwYbGpVfaeXu28gXk5avEbfWmA%2FWxaH7O8Nlet%0Au21Lls1BfquA3HtvCHM%3D%0A>
- 
Next time Vanta polls your task tracking items from Notion, Vanta will read your configuration and process your task tracking items appropriately regardless of how you configure your Task Tracking pages.
 
- 
Please keep in mind that if you change or delete any of the selected page properties in Notion structurally (for example, changing a Status field for a Select field), it might break the integration fetches as well, so be sure to keep everything in sync.
 

## Enable Databases Mappings Toggle
- 
At the top of the Notion Task Tracker Database Mappings modal you will see the following toggle:
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753841/15dfb5681f9837a7783535999ae2/33831986657428?expires=1794967200&signature=0c1354d06717dbd6f2d44deb2f983b3ea54a321aa69c1d6a319d4b5e991c43ea&req=dSUmEM57nolbWPMW1HO4zbD7v2CEo3wdzdshG15QWRK2dbQX%2FDY4iUl6E3TQ%0AYeMeKDX4nCI39qqXRrE%3D%0A>
 
- 
Currently, we make an educated guess to determine which Notion pages are valid for Task Tracking.
- 
By toggling this on, Vanta will read your Task Tracking Configuration as set through this modal the next time we fetch your Notion Task Tracking items.
- 
If you find the new Task Tracking Configuration is not working properly, turning this switch off should revert to the previous implementation.

## Images

- [image 01] ../../images/integrations/notion/notion-task-tracker-configuration-modal--01.png
- [image 02] ../../images/integrations/notion/notion-task-tracker-configuration-modal--02.png
- [image 03] ../../images/ux/integrations/notion-task-tracker-configuration-modal--03.png
- [image 04] ../../images/ux/integrations/notion-task-tracker-configuration-modal--04.png
- [image 05] ../../images/ux/integrations/notion-task-tracker-configuration-modal--05.png
- [image 06] ../../images/ux/integrations/notion-task-tracker-configuration-modal--06.png
- [image 07] ../../images/ux/integrations/notion-task-tracker-configuration-modal--07.png
- [image 08] ../../images/ux/integrations/notion-task-tracker-configuration-modal--08.png
- [image 09] ../../images/ux/integrations/notion-task-tracker-configuration-modal--09.png
- [image 10] ../../images/ux/integrations/notion-task-tracker-configuration-modal--10.png
- [image 11] ../../images/ux/integrations/notion-task-tracker-configuration-modal--11.png
- [image 12] ../../images/ux/integrations/notion-task-tracker-configuration-modal--12.png
- [image 13] ../../images/ux/integrations/notion-task-tracker-configuration-modal--13.png
- [image 14] ../../images/ux/integrations/notion-task-tracker-configuration-modal--14.png
- [image 15] ../../images/ux/integrations/notion-task-tracker-configuration-modal--15.png
