# Connecting Vanta & LaunchDarkly

Source: https://help.vanta.com/en/articles/11345732-connecting-vanta-launchdarkly
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

By connecting your LaunchDarkly account with Vanta, Vanta can fetch user accounts in LaunchDarkly and display user accounts within Vanta under the Access page.

## Integrating with LaunchDarkly
- 
In Vanta, go to the Integrations page, click Add integration, and search for LaunchDarkly. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect.
- 
A pop-up modal will appear.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760501/906017d86f1c58ba030b4601bfab/21347849822484?expires=1794967200&signature=6a175e0e41982268cbf07b0561179e6a75dfed5046ba6dcd76c282f35e86c57c&req=dSUmEM54nYRfWPMW1HO4zepwSYUGaJwiGwrCyE9JMb3loR0je6%2FPT3oK%2FknN%0AzZeIP4dyXqOs8HpHBr0%3D%0A>
- 
The pop-up modal will ask for an API key. Keep this modal open.
- 
In a new tab, login to your LaunchDarkly account

## Obtaining your LaunchDarkly API Key
- 
From the left-hand side menu, select Account Settings
- 
Select the Authorization Tab
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760505/e9f82bc816cec073220cdfef8999/21347839592212?expires=1794967200&signature=37d117bca2170c1949873bef69bc6d689f57447c374bfa579401769d761bd5ca&req=dSUmEM54nYRfXPMW1HO4zQkQQURqRfSQjmRfHqUvXidfxmgAKEll4y26wZ0k%0AIHN2pFDJpq%2Fqt6TVWIs%3D%0A>
- 
Select Create token
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760504/d51c3cad9e2b353d27f9ec72f93b/21347807717140?expires=1794967200&signature=90e7fdca6459e70b88da675dc75716cb090bbf46cac7c7259872c5dee0d20d3f&req=dSUmEM54nYRfXfMW1HO4zXIg3d7Ne8SKyemvYQAkF%2BTrcGbzogSQD1NU2Uze%0Azr7b3RxDKwsDNSLEhPo%3D%0A>
- 
Name the API token (use a label to help you identify the purpose, such as Vanta)
- 
Select Reader from the dropdown for the Role
- 
Keep API Version as 20220603
- 
Select Save token
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760502/82a30aca9b4c36fa4dcbd9c72268/21347849826836?expires=1794967200&signature=98400a446f9e823e70e9b0be55db572a570e1dc2fae465c330eaf03f9bc7204b&req=dSUmEM54nYRfW%2FMW1HO4zZg%2Bh5lHNkUYjmOTqIeE229C%2FxD0PCkLsimZ%2BzGw%0AxzCEVnY%2FexVN81wPN0s%3D%0A>
- 
Copy the API Key that is created and paste it back into the pop-up modal in Vanta.
(It will only show you the API Key once; be sure to copy and save the token before leaving LaunchDarkly)
- 
Select Validate and Store credentials
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760520/bc38e2eceed927592f79904a6be1/21347839596948?expires=1794967200&signature=72d943c7e8e929c0b483128b2034ff3e1e8dd4f6bcb6c7ceb3c8b030575e4bd1&req=dSUmEM54nYRdWfMW1HO4zY2vkgc50kWfJBtQLVI7sFT1UzHWX4g3wp4RDAvU%0ADsp%2FYgxwHVKLZ0JmhAk%3D%0A>
- 
LaunchDarkly is now connected!
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760518/e6990d170b32c840adc28c99c3de/21347807721748?expires=1794967200&signature=277961e5f0af4523c0d06b403677da05f2dd9b53de0608f0816111495883655f&req=dSUmEM54nYReUfMW1HO4zXwJaXUWU9AfGKBvPCijG9dGOPENY%2BmMHcUXP5bo%0AlUbk01wE6FA5vNYXWI8%3D%0A>

## Configure the Scope
- 
Establish which LaunchDarkly accounts should be marked in or out of scope for your audit
[image 07]
 <https://help.vanta.com/hc/article_attachments/21347823359764>
- 
You can configure scopes later by clicking on Configure scope on the connected LaunchDarkly card from the integrations page
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760521/f21e91ceb0eb7baf09f5496cb0a5/21347839599892?expires=1794967200&signature=00e0a97f762c856456ae1465a7bc6092941812ed9c75512aafb457af7538022a&req=dSUmEM54nYRdWPMW1HO4zaunKxlwgglO1c3ktEw3yCfcr4XDb6LCyLublwig%0A54LywYfSYkGrxzNGHWc%3D%0A>

## Images

- [image 01] ../../images/integrations/launchdarkly/connecting-vanta-launchdarkly--01.png
- [image 02] ../../images/integrations/launchdarkly/connecting-vanta-launchdarkly--02.png
- [image 03] ../../images/integrations/launchdarkly/connecting-vanta-launchdarkly--03.png
- [image 04] ../../images/integrations/launchdarkly/connecting-vanta-launchdarkly--04.png
- [image 05] ../../images/integrations/launchdarkly/connecting-vanta-launchdarkly--05.png
- [image 06] ../../images/integrations/launchdarkly/connecting-vanta-launchdarkly--06.png
- [image 07] ../../images/ux/integrations/connecting-vanta-box--04.png
- [image 08] ../../images/ux/integrations/connecting-vanta-launchdarkly--08.png
