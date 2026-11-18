# Connecting Vanta & Heroku

Source: https://help.vanta.com/en/articles/11345743-connecting-vanta-heroku
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

We support connecting Heroku as one of your Cloud Providers. You can use Vanta to Monitor your App instances hosted on Heroku through this integration. Please take a look below for steps on how to connect.
 

## Connecting Via OAuth
- 
Vanta connects to your Heroku account via OAuth
- 
Click Connect to Heroku to get started
- 
It will take you to the Heroku login page and request that you sign in. Once you do, you're taken back to Vanta
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1823424213/c850eb71981cd905d51121e94b15/heroku-oauth-signin.png?expires=1794967200&signature=be98f53a85263ccea50411fdaf6d3a5fd698b122efa51c8755dc2fa9b4678e18&req=dSglFc18mYNeWvMW1HO4zZwdu156hlsoqCu5j5sYGD4jMjk2gTZI7WnX6RIt%0AV4HAjgfZFMQ3mLWC4Mo%3D%0A>
 
- 
If you sign in on a different tab before connecting in Vanta, the connection is instant.
 

## Adding Heroku Apps
- 
Once authenticated, you'll be taken to a resource selection prompt where you will decide which Heroku apps you want Vanta to have access to
- 
The default choice is to Monitor all Apps
- 
Uncheck this if you select Apps to monitor manually
- 
Once you've selected the apps you want to monitor, Click save to finalize the connection.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1823415602/2df42b27d4e50d010b9b7057dce7/add-heroku-apps.png?expires=1794967200&signature=ae4fdb267251a5bbbfe37bead060fcb9839e49d2b23a60f7a5da7390cb2d4699&req=dSglFc1%2FmIdfW%2FMW1HO4zV8G5McCEh%2F6nDxnsoPTA9kwPCTC1FIsf1nzBTpI%0ATZD6%2FLoxNfKyt8g91Pw%3D%0A>
 

## Connection Completed
- 
Once you save the connection, you should see a pop up indicating everything was successful
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1823425817/38c1bb20a3f2b54131a50e07f10b/Screenshot+2025-11-11+at+9_59_58%E2%80%AFam.png?expires=1794967200&signature=4f0bc8284b37e543f40c5c5ac55d76e5ac479b9d682ad16154c0c6bdeb181f00&req=dSglFc18mIleXvMW1HO4zSviXkqUflBUNILVNcr6v1bvlIB77KaoEmRyZ0Ez%0AiFfQa%2BYV0rEZGoZ5TVI%3D%0A>
- 
You may now view the resources scoped on the connection.
Please note that MFA on Heroku can't come through unless the customer is using an Enterprise version
 

## Common Issues
- 
The 'Add Heroku Apps' section does not display any results, and no resources are visible
Confirm third-party OAuth access to the Heroku Platform API is enabled in the Settings tab of the Enterprise Team. See this Heroku article  <https://devcenter.heroku.com/articles/manage-enterprise-team#compliance-feature-limiting-access-to-apps-via-oauth>for instructions on how to check this.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761902/1eb9240679901deb44c1e35743b7/19867449829652?expires=1794967200&signature=130d90408ce290268a30556eb571b0d4b417614ce6c2ba988e440c7a421cb183&req=dSUmEM54nIhfW%2FMW1HO4zQRyIgh%2Far6cuKlDdAcOjFxJGWNl4FTCJrYoLiEB%0Af3Xu0F9tXbjVvbksza8%3D%0A>

## Images

- [image 01] ../../images/integrations/heroku/connecting-vanta-heroku--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-heroku--02.png
- [image 03] ../../images/integrations/heroku/connecting-vanta-heroku--03.png
- [image 04] ../../images/integrations/heroku/connecting-vanta-heroku--04.png
