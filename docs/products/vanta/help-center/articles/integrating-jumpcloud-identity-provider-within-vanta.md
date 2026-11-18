# Integrating JumpCloud Identity Provider within Vanta

Source: https://help.vanta.com/en/articles/11345658-integrating-jumpcloud-identity-provider-within-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

## Connecting the Integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for JumpCloud. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.)
- 
Click Connect
- 
Toggle on Identity Provider
- 
You may also toggle on MDM if you want to use that part of the JumpCloud integration
- 
Click Next
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766000/28b8e2e23b96b544841e38bf2afc/23737591990804?expires=1794966300&signature=9412c30fd959fddb4e0e5d0e94dc626f31f9184e768362795a3f8efc6d7f42aa&req=dSUmEM54m4FfWfMW1HO4zQNqIizvphmi%2Fs3PjzcNWq8%2BP95UjQ2Tsd%2Bpk0nb%0AlDCuucsdrcg60LvJKwM%3D%0A>

## Create the SSO Application in JumpCloud
- 
Log in to the JumpCloud admin console: https://console.jumpcloud.com/login/admin <https://console.jumpcloud.com/login/admin>
- 
Click on your profile circle (top right) -> My API Key
- 
Click on the API Key to copy it and paste it into Vanta
- 
Click on SSO Applications on the left navigation panel
- 
Click on + Add New Application
- 
Search for Vanta and select it
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765995/d3a5248d8e67b27d4629dfc86538/23737591999252?expires=1794966300&signature=19b539c2039d843585c5aaa19c39ee12eb305b1202dc790b9f1537ef6459ede5&req=dSUmEM54mIhWXPMW1HO4zU92M81PiQYqdVdTCCH8KTxsUkz3U2qXv4WaetM%2F%0AYlR65cq1RoW7%2BE%2B%2BOA0%3D%0A>
- 
Click Next
- 
Optionally enter a description and then click Save Application
- 
Back on the applications page, click on the newly created Vanta application
- 
Click on the SSO tab
- 
Change the ACS URLs (0) to the ACS (Consumer) URL provided by Vanta’s setup. It should look something like this: https://app.vanta.com/auth/login/jumpcloud/callback?domainId=YOUR_DOMAIN_ID <https://app.vanta.com/auth/login/jumpcloud/callback?domainId=YOUR_DOMAIN_ID>
- 
If you are in the EU only, change the following fields to be EU
- 
SP Entity ID: https://app.eu.vanta.com/sso/saml <https://app.eu.vanta.com/sso/saml> for EU
- 
Copy the App ID. The App ID can be found in the URL
- 
https://console.jumpcloud.com/#/applications/ <https://console.jumpcloud.com/#/applications/>YOUR_APP_ID_HERE/details
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1842720662/d141b4982eef252f17baea7a3fe1/image.png?expires=1794966300&signature=c61e229c3095de492e6bed9b90bbc6837ebbcb65d19ae57974df872c6f1ba1ca&req=dSgjFM58nYdZW%2FMW1HO4zQvHcoyIBMt764xrggp8btVR8I8hzdl1%2FFqrR7T1%0A0U%2Bf%0A>
 
- 
In Vanta, select Edit Configuration in the Identity Provider Configuration section. Paste in the App ID copied earlier
- 
Click Save

## Connect the Integration in Vanta
- 
Click Validate and store in Vanta
- 
Refresh your Vanta page
- 
If you see JumpCloud Connected on the Settings -> Login and security page you've successfully integrated the SSO function
- 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1842723117/07df2c97d8e1f51de66f505772e3/image.png?expires=1794966300&signature=40324786cfce70353d8e1d190d8b46ad0148bf895fd114cd326f111bad798af1&req=dSgjFM58noBeXvMW1HO4zc89%2Fwi5rXjeg0O0nBi9ns1LUcSU8NTJ5V3shQY7%0AnmHn%0A>

## Images

- [image 01] ../../images/ux/integrations/integrating-jumpcloud-identity-provider-within-vanta--01.png
- [image 02] ../../images/integrations/jumpcloud/integrating-jumpcloud-identity-provider-within-vanta--02.png
- [image 03] ../../images/integrations/jumpcloud/integrating-jumpcloud-identity-provider-within-vanta--03.png
- [image 04] ../../images/ux/settings/integrating-jumpcloud-identity-provider-within-vanta--04.png
