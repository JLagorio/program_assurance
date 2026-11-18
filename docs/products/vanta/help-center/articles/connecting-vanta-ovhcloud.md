# Connecting Vanta & OVHcloud

Source: https://help.vanta.com/en/articles/11345616-connecting-vanta-ovhcloud
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

## Integrating with OVHcloud
- 
In Vanta, go to the Integrations page, click Add integration, and search for OVHcloud. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect
- 
Choose the region where your OVHcloud account is hosted
- 
Click on the provided link to generate your keys. This link is region-specific, so ensure you select the correct region in the previous step
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759475/14a4faed67871044010ee5d605ef/23362652791572?expires=1794967200&signature=7703b924ec36d02ae3a2e066663afc1bf2eb3ca5ace7e6aa5303b07748725036&req=dSUmEM57lIVYXPMW1HO4zaLG225b%2FFAeWr6cxqylasdhPrYb19aqgvSdUSWF%0A7C%2FA1DXjIwmENMvbGfU%3D%0A>
- 
A new tab will open, prompting you to log in with your OVHcloud credentials.
- 
Once logged in, you'll be asked to fill in a form with a name, description, validity time, rights, and restricted IPs
- 
We suggest using "Vanta" for the Application name field, adding descriptive details, and setting the Validity time to unlimited.
- 
In the Rights section, ensure that you include an entry with the GET method set to ' /me/identity/user ' and another entry with the GET method set to ' /me/identity/user/* '
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759467/f75d7bbc73327f70a9122250092f/23329532985108?expires=1794967200&signature=e62365d75d79bee525641db4c3716ae23f47b1a4fc4a8266c78e598f5026c47a&req=dSUmEM57lIVZXvMW1HO4zQJ8E6yPztWkjok2gDbil60t6cYzVj%2BPGUJJOiPU%0AaZQG5EuM4XY8OQ72h%2Bg%3D%0A>
- 
Click on Create
- 
Your three keys will be generated. We recommend storing these keys in a secure location for future reference
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759468/f86a183b6ad61c3e83489010a4bb/23329532987924?expires=1794967200&signature=070fc06a0960c71e8a99a40439d51072c288a13c94cbf93eadf89b4c4e08e65a&req=dSUmEM57lIVZUfMW1HO4zSo40rpANGhMd0BNDzlmXuol6%2B1%2Fiq0pcAaKjaIx%0A%2FATAPYqiFKphxxictsw%3D%0A>
- 
Copy and paste these keys into Vanta and click on Validate and Store

## Managing API keys from OVHcloud console
If you've previously created an application named "Vanta" and need to regenerate your keys, you may encounter an 'Application already exists' error. This happens because the application name must be unique within your OVHcloud account.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759469/8e19677de8fbfb0f2ce75c0aed74/23329509899924?expires=1794967200&signature=02fcbb2badef987f06dcd4a7f1188a518de208dfada187d96e9608c48833e9be&req=dSUmEM57lIVZUPMW1HO4zX99RtqVEXRisiM9S0sBvD5V7JmVGKP4Ct6lNlxk%0AHLbJsHeQlkHx426R%2BpY%3D%0A>

## To resolve this
- 
Delete your previous application using the OVHcloud console. Access the console via one of these links, depending on your region, and log in using the top-right corner button:
- 
OVHcloud US <https://api.us.ovhcloud.com/console/>
- 
OVHcloud EU <https://eu.api.ovh.com/console/>
- 
OVHcloud CA <https://ca.api.ovh.com/console/>
- 
Use to retrieve all of your application IDs`/me/api/application` GET endpoint 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759494/31374241c15654ba8ed586868ab3/23329532990228?expires=1794967200&signature=000881e2094fab8ff1cd848948379e7d9a8a76ca95d8b68acb281b4b5d814125&req=dSUmEM57lIVWXfMW1HO4zTmy%2BbPflYu%2FNe8KTvT92MKXFqEqoO0x9cK9M5Fd%0AcQzNNXh0hH5vWCG6rL8%3D%0A>
- 
Verify the correct applicationId using:`/me/api/application/{applicationId}` GET endpoint
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759487/104d92a96d9391cec3a4a5190a21/23329509906068?expires=1794967200&signature=8daf6aee90b456e106461ee92ba70c94766935b5b17c73700c0e87c0c0210641&req=dSUmEM57lIVXXvMW1HO4zWPADqkBphlEwa%2BAkIyCpgowegp%2BHoCqTk4H9j98%0APKS%2BPHfn%2B6fEEcI6lEI%3D%0A>
- 
Once you've confirmed the applicationId, delete the application using the `/me/api/application/{applicationId}` DELETE endpoint
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759489/8f144cee57af44cc8b9a66c7d23a/23329532992660?expires=1794967200&signature=eeace7565876590b27c91de0f0b48a42a3317bd825cb369e96b1119f26adcdb3&req=dSUmEM57lIVXUPMW1HO4zWkQ4x4UMVMTyby2WX7ahEbvZAPP%2BBlyNydljCeb%0A9mGI%2BKjkCVTO%2B7mFx5c%3D%0A>
- 
Now that you have deleted the previous application, you can regenerate your keys. To connect the OVHcloud integration successfully, follow the steps outlined earlier in this article.

## Images

- [image 01] ../../images/integrations/ovhcloud/connecting-vanta-ovhcloud--01.png
- [image 02] ../../images/integrations/ovhcloud/connecting-vanta-ovhcloud--02.png
- [image 03] ../../images/integrations/ovhcloud/connecting-vanta-ovhcloud--03.png
- [image 04] ../../images/integrations/ovhcloud/connecting-vanta-ovhcloud--04.png
- [image 05] ../../images/integrations/ovhcloud/connecting-vanta-ovhcloud--05.png
- [image 06] ../../images/integrations/ovhcloud/connecting-vanta-ovhcloud--06.png
- [image 07] ../../images/integrations/ovhcloud/connecting-vanta-ovhcloud--07.png
