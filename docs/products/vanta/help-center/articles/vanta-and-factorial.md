# Vanta and Factorial

Source: https://help.vanta.com/en/articles/11345669-vanta-and-factorial
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

Factorial allows customers to connect tools like Vanta using an API Token. By connecting your Factorial account with Vanta, Vanta is able to make API calls as the app, allowing you to connect to find people and use onboarding/offboarding dates from your HR system.

## Prerequisites
- 
Vanta leverages Merge, a third-party platform, to pull in your data from Factorial. See their documentation <https://docs.merge.dev/integrations/hris/factorial/provider-interactions> for details on the API interactions used.

## Procedure
- 
In Vanta, go to the Integrations page, click Add integration, and search for Factorial. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761086/5ead3c731095c4afd39115ba545f/18781239848596?expires=1794967200&signature=aaf01866177ad49ea07ed5cb2b32a99840eae9246004b344e5f59c97a4957655&req=dSUmEM54nIFXX%2FMW1HO4zZGqOiC9C6Azph2GkIBiqo6I82KhIsaE6JaHqc2P%0A18f85GihuqE6b8df0IY%3D%0A>
- 
A pop-up will display letting you know that we use Merge.dev a third-party platform to pull in your data from Factorial.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761085/0865b2694cd3b6fe312695d1723b/18781273891220?expires=1794967200&signature=38717f8e81524700ae636dcd5d3552f40c53430d84363f6c90e1b58704c0435f&req=dSUmEM54nIFXXPMW1HO4zZdEvA6JM0JJVVdxkmmaeJM4HjxqOSonKNseGxcu%0AMz6WGY8mG%2B7AXAStdAQ%3D%0A>
- 
A popup module displays, allowing you to review the requested permissions. After reviewing the affected read data, click on continue.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761083/5e9aa83aa5b1adc6019a04a84639/18781253092628?expires=1794967200&signature=b5d2483b3d0ebd897042012f72851bfc7b508d62d23da8d356d4859fdddf98a7&req=dSUmEM54nIFXWvMW1HO4zTVhXf%2FjF%2F618z6zZ2KJqhqYii4NxOfgCFhb5MLZ%0As7bQgmO8WnkqwIFBX5s%3D%0A>
- 
After hitting next, you will then be prompted to open a window to the Factorials website and sign in with an administrator user.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761082/54a3ff54452f51b8e889cb05224a/18781277726484?expires=1794967200&signature=d5d05becbb308a9dc7a3bb7d06604c31c196f62251a656c040e0f41444522c29&req=dSUmEM54nIFXW%2FMW1HO4zSJ8hBCmjQxYguSE8h%2FgpmkyDkGIMgAW8NkOs5e5%0ADGHn%2FFmXM7uPMAkork0%3D%0A>
- 
After logging in on Factorials' website, you should be redirected back to Vanta and see a screen that says Merge is setting up the integration with Vanta.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761114/edd1293077f6931c083f8a5592b6/18781383417748?expires=1794967200&signature=21548af48f5b348c5bfd98adc707b3e6fd616a26c70c015d6bc6120228052def&req=dSUmEM54nIBeXfMW1HO4zcDe10zNRLOJ2KS8Gl5k176ul9X%2F8OnyUXAcWNjC%0AOpkRu7reo%2FEgMi0secU%3D%0A>
- 
You should then see a "Connected to Factorial" message after a few moments.
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761109/2274bf82a09c24873ad2143d5ad9/18781347115412?expires=1794967200&signature=5e40d2f7c4303532bd95e0b0a050424323ba4780be9b3d36a0893b9a07edfa49&req=dSUmEM54nIBfUPMW1HO4zSx5vEI70EdhksVTtkRsIL%2FKwF5iCu7AYHS4Bz0B%0Ar2Kyg9%2Bi1qIFvAnzQ6M%3D%0A>
- 
On the next screen, the connection window will confirm that the permissions are available for the user who connected the integration.
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761106/44193c66f2dcadf937887addc84c/18781312317332?expires=1794967200&signature=632b446be842ac4dea5796a45f0e21876dd35b738284e0cee8bac29eaa40adc8&req=dSUmEM54nIBfX%2FMW1HO4zQJ1rTS%2Fe1ejeaKS6Mk8esfS2xu7D%2BfcAtOPGUAq%0AkXVs09eb69Zpa6AkQDY%3D%0A>
- 
If the user can successfully access the required data, the next screen will show a date-scoping window. This will determine how far back Vanta will import users. If you are in audit, it is important to at least set the date to the beginning of your audit period.
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761116/7f4e52cfecf0dd99e0c5ad782c9e/18781381338772?expires=1794967200&signature=53ce82287b49e630670746742911202c4cf12960617a06209b873a36c70a1737&req=dSUmEM54nIBeX%2FMW1HO4zSTbaEPoPV4SXGzrn39NuOQzY0HWNT3p7v8uz819%0AQtrcpKknhUau%2FdwodNg%3D%0A>
- 
Once you hit continue, you will be presented with a "Factorial Connected!" screen. From here, you can configure additional scope on the imported users if necessary.
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761134/f640c6dbd68b112523f0a1657be4/18781358497556?expires=1794967200&signature=792e0d11d174d0b903b2c1c7320832c4fd255366089710c4ad7ef927cfdce418&req=dSUmEM54nIBcXfMW1HO4zc0IeOLBLz4kF49B6JSc%2BuCGUqSyNMbxzmtglZI1%0Ax5IwyiAGkZt1Kgspft8%3D%0A>

## Images

- [image 01] ../../images/integrations/factorial/vanta-and-factorial--01.png
- [image 02] ../../images/integrations/factorial/vanta-and-factorial--02.png
- [image 03] ../../images/integrations/factorial/vanta-and-factorial--03.png
- [image 04] ../../images/integrations/factorial/vanta-and-factorial--04.png
- [image 05] ../../images/integrations/and-charthop/vanta-and-charthop-integration--06.png
- [image 06] ../../images/integrations/factorial/vanta-and-factorial--06.png
- [image 07] ../../images/integrations/factorial/vanta-and-factorial--07.png
- [image 08] ../../images/integrations/factorial/vanta-and-factorial--08.png
- [image 09] ../../images/integrations/factorial/vanta-and-factorial--09.png
