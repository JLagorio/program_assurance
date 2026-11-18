# Connecting Vanta & 1Password

Source: https://help.vanta.com/en/articles/11345741-connecting-vanta-1password
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Connecting Vanta & 1Password
We connect to 1Password through their SCIM API, making read-only calls. To enable the 1Password SCIM feature, you must have a Business Account and set up a SCIM Bridge in your infrastructure. Currently, we don't support Google Workspaces. This is because Google Workspace does not support Vanta's SCIM protocol to connect with 1Password.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761483/01ea96cecedc2bb7512f35b34e13/17133769303572?expires=1794967200&signature=d545812119be2eddc13b94a44a31f1011ef82630a17442aef1e7c60502289480&req=dSUmEM54nIVXWvMW1HO4za%2BKCMpy0hbOQo9v%2BNounEFGdUDKFNs2KRcOp6qo%0A6LX3m9uHlPtPbADjiQc%3D%0A>
The SCIM bridge is a service deployed on your infrastructure that allows 1Password to convert SCIM commands to encryption key-based operations. Here is more information about why a SCIM bridge is necessary. <https://blog.1password.com/1password-scim-bridge-explained/>
Before you can set up your SCIM bridge, you'll need the following:
- 
Administrator access in your 1Password Business account.
- 
A platform to deploy the SCIM bridge on. (Such as Google Cloud Platform, DigitalOcean, or your infrastructure).
- 
A public DNS record to point to the location of your SCIM bridge. For example, scim.example.com.

## Deploying your SCIM bridge
Once you have all the requirements:
- 
Sign in <https://start.1password.com/> to your account on 1Password.
- 
Click Integrations <https://start.1password.com/integrations/directory/> in the sidebar.
- 
Choose your identity provider from the User Provisioning section.
- 
Follow the onscreen instructions to generate the credentials on your SCIM bridge.
- 
Deploy your SCIM bridge.
After you complete the setup process, you'll get a scimsession file and bearer token. Make sure to save them both in 1Password. Here are some helpful examples of SCIM bridge deployment options: https://github.com/1Password/scim-examples/ <https://github.com/1Password/scim-examples/>.

## Testing your SCIM bridge
You can check if the SCIM bridge was correctly deployed by:
- 
Going to your custom SCIM domain (for example, scim.example.com).
- 
Login in with your credentials.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761485/fcb474c2f46b52aacff526eb327c/17133805821076?expires=1794967200&signature=d463b3f8c1663c19a395d6fd914efc75e8c8f5f70a38278623308a120ede6e79&req=dSUmEM54nIVXXPMW1HO4zRBKPD%2FKDtYBuYk75Hk062jKxc17v%2BTTtcx%2BWzBa%0AffOPHLEBxkeuySD0IeY%3D%0A>
- 
There, you will see your 1Password SCIM Bridge status page. There you can:
- 
Check any problems the SCIM bridge has found.
- 
Download logs that contain detailed activity information.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761482/01d824892d3cc872d49c095032c1/17133831719444?expires=1794967200&signature=a63d775c78e7b14ed65b1accc7f7be680d7bd6faee3ec83833d846e15ade93f9&req=dSUmEM54nIVXW%2FMW1HO4zULhq6mZyB4u68RbaRq5bF7E7lhHdbO43Y1s%2FOTf%0AZTmJGYj5KdCkB2odxFU%3D%0A>

## Integrating with 1Password
- 
In Vanta, go to the Integrations page, click Add integration, and search for 1Password. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect.
- 
Then you can fill out your credentials. Your SCIM bridge URL is where you deploy the bridge (for example, https://scim.example.com <https://scim.example.com>), and the SCIM bearer token is the one you saved during your SCIM bridge deployment.

## Images

- [image 01] ../../images/documentation/connecting-vanta-1password--01.png
- [image 02] ../../images/integrations/1password/connecting-vanta-1password--02.png
- [image 03] ../../images/integrations/1password/connecting-vanta-1password--03.png
