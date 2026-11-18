# Setting Up and Using the Vanta Slack App

Source: https://help.vanta.com/en/articles/11345744-setting-up-and-using-the-vanta-slack-app
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

The Vanta Slack app brings the Vanta Agent and Vanta notifications right into Slack. Once connected, you can message the agent or mention @Vanta to get answers or take action on your security and compliance program, and get notified in channels or DMs when something needs your attention.
 
 

## Required Slack permissions
When connecting Vanta to Slack, your IT team may need to approve the integration. If your organization requires IT approval before installing Slack apps, share these permissions with them prior to beginning setup. For details on how Vanta handles your data, see our Privacy Policy <https://www.vanta.com/legal/privacy>.
 

### Bot scopes
 
These scopes control what the @Vanta app can access:
 | 
Permission | 
Description
 | 
channels:join | 
Join public channels in a workspace
 | 
channels:manage | 
Manage public channels it has been added to and create new ones
 | 
channels:history | 
View messages and content in public channels it has been added to
 | 
channels:read | 
View basic information about public channels
 | 
chat:write | 
Send messages as @Vanta
 | 
chat:write.public | 
Send messages to channels @Vanta isn't a member of
 | 
files:write | 
Upload, edit, and delete files
 | 
files:read | 
View files shared in channels and conversations that @Vanta has been added to
 | 
im:write | 
Start direct messages with people
 | 
im:history | 
View messages in direct messages with @Vanta
 | 
reactions:write | 
Add and edit emoji reactions
 | 
reactions:read | 
View emoji reactions in channels and conversations that @Vanta has been added to
 | 
commands | 
Add shortcuts and/or slash commands
 | 
groups:read | 
View basic information about private channels it has been added to
 | 
mpim:read | 
View basic information about group DMs it has been added to
 | 
usergroups:read | 
View user groups in a workspace
 | 
users:read | 
View people in a workspace
 | 
users:read.email | 
View email addresses of people in a workspace
 | 
app_mentions:read | 
Allows the Vanta app to view messages that directly mention the bot in conversations where the app is present.
 | 
assistant:write | 
Show a live status while @Vanta works on a response
 

### User scopes
 
These scopes access user data and act on behalf of the user who authorizes them:
 | 
Permission | 
Description
 | 
canvases:read | 
View canvases a user can access
 | 
channels:history | 
View messages and content in a user's public channels
 | 
channels:read | 
View basic information about a user's public channels
 | 
chat:write | 
Send messages on a user's behalf
 | 
groups:read | 
View basic information about a user's private channels
 | 
im:read | 
View basic information about a user's direct messages
 | 
im:write | 
Start direct messages on a user's behalf
 | 
mpim:read | 
View basic information about a user's group DMs
 | 
mpim:write | 
Start group DMs on a user's behalf
 | 
search:read.files | 
Search files a user can access
 | 
search:read.im | 
Search a user's direct messages
 | 
search:read.public | 
Search content in public channels
 | 
search:read.users | 
Search people in a workspace
 | 
users:read | 
View people in a workspace
 | 
users:read.email | 
View email addresses of people in a workspace
 
ℹ️ Note: Connected the Vanta Slack app before Oct 30th? To use the Vanta Agent, an admin needs to disconnect and reconnect the Vanta Slack app so it gets the new permissions above. Your notification settings remain the same.
 
 

## Connecting Vanta & Slack
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2800999132/462acf5fca37c255bc91c518bcf2/image.png?expires=1794967200&signature=3c8d8fa32e82b3df8107cab99e76ff2ddc73c551a00db3702d8737f7fa49f42f&req=dignFsB3lIBcW%2FMW1HO4zQPGDt5tqrXgjORLTaAuSgJKjtNI9VCrD9GnaWW4%0ABZ3%2BusYLe3AalH9SP14%3D%0A>
 
To connect Slack:
- 
In Vanta, go to Integrations, search for Slack, and select Connect.
- 
Follow the instructions to connect and allow Vanta to access Slack.
- 
Once connected, the Vanta Agent is ready to use in your Slack workspace. Learn more 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2801034669/c3d01969c99e9e2e38a919ee934f/image.png?expires=1794967200&signature=ad104477a629affa107486c0bab00e7803995aa3e1027cfdbbd9c394228ae2dc&req=dignF8l9mYdZUPMW1HO4zXrtVzODb5vAGZXtZvtrD2bHQjyGWNJPSmzsupto%0AEPbtVDI55zyZDKr1v28%3D%0A>
 
To set up notifications:
- 
From the Integrations page, search for Slack and open the integration.
- 
On the Notifications page, scroll to Slack. Each tab is a notification category that sends to one channel.
- 
Select the pencil icon next to Slack channel.
- 
Choose a channel and select Save.
- 
Turn on the notifications you want for that tab. Changes save automatically.
​
ℹ️ Note: If you don't see a channel in the available list, it may be a private channel. Learn more
 
 

## Vanta Agent in Slack
Ask the Vanta Agent questions or have it take action on your security and compliance program. It uses your Vanta access and asks before making any change.
- 
Direct message: Message the Vanta app directly. The agent replies in the same conversation.
- 
Channels: Mention @Vanta in a channel. Only you see the answer. To share it with the channel, select Share message to thread.
Vanta Agent responses are generated by AI and may occasionally be inaccurate. Conversations in Slack are separate from your chats in the Vanta app. On any Slack plan, you can message the agent directly or mention @Vanta in a channel. Opening the agent from Slack’s agent panel requires a paid Slack plan.
 
 

## Private channels
Private channels in Slack will need the Vanta app added to the channel before it can be configured in Vanta.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2801042227/f7f9dff51d927c9f66c5aaba8f67/image.png?expires=1794967200&signature=460e60d9a44d408503d2026fc5298ae2c4e25e7d32d15c58053bc32f8f865b98&req=dignF8l6n4NdXvMW1HO4zVVfwwxOaFM6UVEKOIevcc65shYG4qJYZCZ4LnBL%0AracvuGVFI4DauVxfTqw%3D%0A>
- 
Go to the private Slack channel that you would like to use for Vanta notifications.
- 
Type @vanta and select the Vanta App.
- 
Once selected, add them to the channel by hitting enter.
- 
On the Notifications page, you can now add this newly configured private channel and configure preferences on behalf of your entire company.

## Images

- [image 01] ../../images/ux/integrations/setting-up-and-using-the-vanta-slack-app--01.png
- [image 02] ../../images/ux/notifications/setting-up-and-using-the-vanta-slack-app--02.png
- [image 03] ../../images/integrations/slack/setting-up-and-using-the-vanta-slack-app--03.png
