# Connecting Vanta & Auth0

Source: https://help.vanta.com/en/articles/11345772-connecting-vanta-auth0
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta uses an inbuilt Auth0 Management API  <https://auth0.com/docs/api/management/v2>to perform security checks for access review. You can see it under the APIs tab of your Auth0 dashboard.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765820/b1013a447806709c994862783f00/15550279191572?expires=1794967200&signature=af48f52fa4d3235eef12616c87180a9feff31ad1dfc70c560e76bc910878a970&req=dSUmEM54mIldWfMW1HO4zQI2T9r0GHCyr4pRwB1ZuAYWlksY3wHRFWjggyUe%0AOCFb8y01mm%2B8pxNdcdw%3D%0A>
To use this API, you must create an authorized machine-to-machine Application in Auth0 before integrating into Vanta. We have a step-by-step guide for this below.

## Pre-requisites
This document assumes that a pre-exisiting Auth0 account has been set up.

## Create Auth0 Application
Please look for the APIs panel and create a new application by clicking the Create Application button.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765821/3fd483aca3d756e01088f0d3274d/15550289680916?expires=1794967200&signature=a393083dac8ff20da760c1a3a1cd8eca4fa5314600367ae6c3da286605bffcff&req=dSUmEM54mIldWPMW1HO4za6bAdi3subH5R9LZMlmHeLhOYR%2Be%2B48MVLHLheJ%0A7xh760kEgrFWSJmiYOM%3D%0A>
A modal to create a new application will appear. Name your application and choose the Machine to Machine Applications application type option to create a new application in your Auth0 Dashboard.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765819/62d9e6ca30f06e3b998a9d4e424d/14553789834260?expires=1794967200&signature=6c4b7cac7e1b76e38adca7e764449b03549abea1e65bb715083c1de813541942&req=dSUmEM54mIleUPMW1HO4zUbWLSv2ADDOemZ9eE%2Bh788s5JY0fLQl5FZDVcSM%0A4kYG7DFV5XIbnMFaIwY%3D%0A>
You’ll be prompted to pick one of your authorized Auth0 APIs. Pick the Auth0 Management API option.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765816/2f3470db31f2b65ae2fa3c7f4564/14553827833364?expires=1794967200&signature=3364d39965b81df54cc072b1cfadbe3dae7559fcde17e210b511cdd7f0a5e72f&req=dSUmEM54mIleX%2FMW1HO4ze859NjPxKRJgYDftZDTExH5wgqSLyg%2FbT1bAvUJ%0AauFbsIOJyvV2qQMhIm4%3D%0A>
After picking your authorized API, you’ll have to select a set of permissions from the Permissions section to execute the endpoints Vanta requires to make the security tests.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765832/0aa649a070805c4c1b6af308daf6/14553831185428?expires=1794967200&signature=968334af4b08dc939571a2b48c7e235d244ecffce5cd16931725d4e20199852b&req=dSUmEM54mIlcW%2FMW1HO4zYg%2B0wnwTiQj%2FvmK48opqzEB8d9iWj5hxTXJo3aS%0Am5BHMAoTx6y7yX9OIWc%3D%0A>
You must pick these permissions to set up your Auth0 application properly.
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765836/a5d9d404602bac390581b1d70d9e/14553901374740?expires=1794967200&signature=daeebe32808a68392783a1c5d2add12a281b58524dcbc086d986c2ed7901c2e7&req=dSUmEM54mIlcX%2FMW1HO4zeWVlAAg7J7OlxhNRf31gSF4GVnkdFclLrESJurT%0ADEETDCOv5SaZpW1dLHs%3D%0A>
After choosing these permissions, click the Authorize button to create your application linked to the Auth0 Management API.
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765840/c92269a99005897426fca9efe545/14553904382228?expires=1794967200&signature=3ec03e1aef1c844ccb2e2cd00ab1dcb0e24ac704992bd4e94caeaeeed5a275bc&req=dSUmEM54mIlbWfMW1HO4zV9ZPZ2YNIOFAOjFtih7NvWh3icvk1pj7vaSp3ih%0AGVc3oERmUgLnSYdFxRs%3D%0A>
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765841/246a3571a3f3bdf06e57de7eac83/14553906676116?expires=1794967200&signature=23d4f600409d1ecd339541c1e8a89d7f26f0512d11c4236340ed54689312dc29&req=dSUmEM54mIlbWPMW1HO4zc4p5H%2FVw7MbnLh8ie2nEbewVWIESz38LIfKiz2x%0Avta5PcuXfEIkK%2B9jKIY%3D%0A>
With that setup, the new application should be ready to be integrated.

## Link Auth0 Application to Vanta
Your new application Domain, Client Id, and Client Secret fields are necessary parameters to link your application to Vanta.
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765843/7e3cc61a921dce9ca57a1e9ad6b4/31253369655444?expires=1794967200&signature=8dc5ee9fd9ccba142b1fc52d1bfb05f8f3832f09d43a661e1323024e835e0842&req=dSUmEM54mIlbWvMW1HO4zWjKWQJ%2F2jvtnq2dqPlKKfv6BkcOZPCURNagCEOy%0AF9191i%2FM8tcFEmQCdpI%3D%0A>
You can find those fields under the Settings tab of your recently created Auth0 Application.
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765854/4ac1b4a69c446278fccc64ea3fec/14553931290900?expires=1794967200&signature=e4e8037ceef8eebaad68cf4d9d23a8d24a94f92e270eac0142007b1d68101352&req=dSUmEM54mIlaXfMW1HO4zaqd4UwO%2F7v8qQXrb8qgMwavuhWW%2BFRU2HU86hBk%0Ad2achukR3riTzjjjWV4%3D%0A>

## Set up Account Sources
There are two kinds of Auth0 accounts (we address them as account sources):
- 
Users  <https://auth0.com/docs/manage-users/user-accounts>managed by Auth0 that can be grouped into Organizations <https://auth0.com/docs/manage-users/organizations> or not:
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765856/8123f397bb380450301bada3f408/14553979354516?expires=1794967200&signature=37dbacb3610e23640ad496ddd11205a365191d1fd8235e4cc9b6bc7810213441&req=dSUmEM54mIlaX%2FMW1HO4zX3iQAM2uaOCCfybHShm8wFIBUSVSYDoUsPDaVly%0AyGkFH75ehyh9waTxveA%3D%0A>
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765866/c60513ee7da20eb4e85850daee78/14553981611540?expires=1794967200&signature=cdcfc526427a4d3ca40d5f0205a41c51d0d04acef4ce8e4ad8ad074bf3b42890&req=dSUmEM54mIlZX%2FMW1HO4zYIWuWeMit5%2BDvQtCQH54yEahXgGM3rYbJ0FgJd3%0ABs%2FFiE5Re6g4%2F7zxM5E%3D%0A>
2. Tenant Members <https://auth0.com/docs/get-started/manage-dashboard-access> with access to your Auth0 dashboard:
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765869/9960ae90bb7b2611c3b3bdd40e99/14554180123668?expires=1794967200&signature=28ac76c012a36563ed54b63fddbc1424c401c51825aa97e4f95636ebe83c01e6&req=dSUmEM54mIlZUPMW1HO4zVt%2B9SfwnEOITNqPncqOEuUr2qDEeEdSlZEng8PG%0ASNz953FzTw9MvMVU3EE%3D%0A>
After submitting your tenant credentials, Vanta allows you to pick the correct account sources based on your requirements.
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765877/a8ccf8933ccc8bfe93719ba8ada7/14554182741908?expires=1794967200&signature=49dda8d838f29bd25868047df41b728dc14174bec16a351a7aa2d927907fd69d&req=dSUmEM54mIlYXvMW1HO4zcXFCmrOXbY%2BorI4xWgCaFnDdAWW2idruoX%2B7otr%0AOML7U3Dr07DU4utLfxQ%3D%0A>
There are two options to choose from to set up your integration:
- 
Users: Pick accounts from your Auth0 tenant.
- 
All: This selects every user from your Auth0 tenant, regardless of the organization they belong to.
- 
Filtered By:
- 
Organizations: will pick users from the selected organizations from the display.
- 
Include users that don’t belong to any organization: self-explanatory.
- 
Tenant Members: this selects accounts with access to your Auth0 tenant dashboard. Currently disabled - At this time, Auth0 does not have a supported API to retrieve tenant members. Development of this feature has been proposed: https://community.auth0.com/t/management-api-support-for-managing-tenant-members/71086 <https://community.auth0.com/t/management-api-support-for-managing-tenant-members/71086>
Once your Auth0 Account Sources are set, Vanta can perform security tests on the correct set of accounts from your account.

## Images

- [image 01] ../../images/integrations/auth0/connecting-vanta-auth0--01.png
- [image 02] ../../images/integrations/auth0/connecting-vanta-auth0--02.png
- [image 03] ../../images/integrations/auth0/connecting-vanta-auth0--03.png
- [image 04] ../../images/integrations/auth0/connecting-vanta-auth0--04.png
- [image 05] ../../images/integrations/auth0/connecting-vanta-auth0--05.png
- [image 06] ../../images/documentation/connecting-vanta-auth0--06.png
- [image 07] ../../images/integrations/auth0/connecting-vanta-auth0--07.png
- [image 08] ../../images/integrations/auth0/connecting-vanta-auth0--08.png
- [image 09] ../../images/ux/integrations/connecting-vanta-auth0--09.png
- [image 10] ../../images/integrations/auth0/connecting-vanta-auth0--10.png
- [image 11] ../../images/integrations/auth0/connecting-vanta-auth0--11.png
- [image 12] ../../images/integrations/auth0/connecting-vanta-auth0--12.png
- [image 13] ../../images/integrations/auth0/connecting-vanta-auth0--13.png
- [image 14] ../../images/ux/integrations/connecting-vanta-auth0--14.png
