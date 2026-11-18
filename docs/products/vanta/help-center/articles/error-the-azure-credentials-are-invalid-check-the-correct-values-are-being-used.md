# Error: “The Azure credentials are invalid. Check the correct values are being used”

Source: https://help.vanta.com/en/articles/11346024-error-the-azure-credentials-are-invalid-check-the-correct-values-are-being-used
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

## Cause
One of the most common reasons for this is an invalid client secret being provided. This leads to Vanta 401 errors when attempting to access the token. To resolve this, administrators must ensure the secret being added to Vanta is the client's secret value, not the client's secret ID for the failing subscription.
 

## Resolution
- 
You must delete the current key by going to the Vanta App Registration you created when connecting the integration. Search for App Registration in the search bar and select it under Services.
​
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767101/66d41ed05f702a9554aa32abebe8/12279764715668?expires=1794967200&signature=979c27d6fcf60ed6824915fa3d0717fd44fb937b4ccfd2da632aa2b0f087a1d0&req=dSUmEM54moBfWPMW1HO4zRPmtoqMM5larqgrFk8yQxMFxUpcsb3Bj7RBkcXk%0AHXik%0A>
 
- 
Scroll down, select the Vanta App, click Certificates & Secrets, and then delete the existing key. 
​
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767109/d82110375026c0a32b15f6f169b6/upload_12034562581320295840?expires=1794967200&signature=f153df110c73c762ac2fa2d0ccc19164cf3366d6dd96209948aef137d8e91c15&req=dSUmEM54moBfUPMW1HO4zStJYOGI4Y5loUFZZEPkhrW%2B4bctHye6Oy2jvg4y%0AuELN%0A>
 
- 
Once that is complete, generate a new secret by clicking + New client secret 
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767115/9f0e0f3ce953a40021779b3e3f7d/upload_9311167898800319356?expires=1794967200&signature=60811af9fc7547783283b1b41844ce97c0fadb715b7cd187d9caa42de6fb34d0&req=dSUmEM54moBeXPMW1HO4zSUjENqVkY3gyE9%2B0t2%2BGB4TgjjSqYEu0pJp%2BZ3d%0AQdNqBsz2Q%2BZ8ROErRZE%3D%0A>
 
- 
Once the new secret is generated, do not leave this page! You WILL NOT be able to see the value again, so please leave this page open. Otherwise, you will need to generate a new key. 
- 
Wait at least five minutes and up to 15, then head back into Vanta and attempt to connect the integration again. Steps to update the existing subscription can be viewed here: How to Update Expired Azure Client Secret <https://help.vanta.com/en/articles/11345906>
- 
On the second step, when prompted by Vanta, copy the client secret value from this page and enter it
- 
If the integration continues to fail, it is likely another error; please write to Vanta support and mention you tried the steps in this article.

## Images

- [image 01] ../../images/integrations/azure/error-the-azure-credentials-are-invalid-check-the-correct-values-are-being-used--01.png
- [image 02] ../../images/integrations/azure/error-the-azure-credentials-are-invalid-check-the-correct-values-are-being-used--02.png
- [image 03] ../../images/integrations/azure/error-the-azure-credentials-are-invalid-check-the-correct-values-are-being-used--03.png
