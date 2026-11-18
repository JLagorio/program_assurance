# Vanta & Basecamp Integration

Source: https://help.vanta.com/en/articles/11345746-vanta-basecamp-integration
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Basecamp allows customers to connect tools like Vanta using OAuth2 <https://marketplace.zoom.us/docs/api-reference/using-zoom-apis#using-oauth-20>. By connecting your Basecamp account with Vanta, Vanta can make API calls as the app, allowing you to monitor user access and create tickets straight from Vanta into Basecamp.

## Prerequisites
Vanta leverages Merge, a third-party platform, to pull your data from Basecamp. See their documentation <https://docs.merge.dev/integrations/ticketing/basecamp/provider-interactions> for details on the API interactions used

## Procedure
- 
In Vanta, go to the Integrations page, click Add integration, and search for Basecamp. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>. Click on Connect
- 
In the pop-up model, select whether you want to enable read and write access or only read. 
​Note: Write access is required to create tickets within Vanta to Basecamp
- 
Click on Connect BaseCamp
​
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762115/b2bf5b93a0a12008717f1a3de086/15521053185044?expires=1794967200&signature=6fd8243efcbd5e1f63116503d7ca5b451b7ebe7370b1f4466fb94ab08723335b&req=dSUmEM54n4BeXPMW1HO4zQ44LgFrtXjeYHM%2BZPfQ1cWKJKdeSjEWpSfBWUf4%0AeOh3%2FsG%2B98ZBRZHuuOc%3D%0A>
- 
A popup module is displayed, allowing you to review the requested permissions. Ensure it reflects your selection (Read Only or Read and Write) and then hit Continue
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762105/8ae4af23e60db1f7f05d70768de6/15521049626132?expires=1794967200&signature=472568a0ecda4c35dbc6e6aa5870b79170d238795fd18786cf00397b04df9a0a&req=dSUmEM54n4BfXPMW1HO4zeYp0J2%2Bu1kEPspXm9Qb8vJ9izVjqvSsSsQ90sWm%0APUMT9HkSfA87pNXhLBw%3D%0A>
- 
Follow the instructions presented in the module to enter your basecamp subdomain, then click Submit.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762108/b847157c4f5e26f89fd0484210b2/15521193070100?expires=1794967200&signature=e18560f5b559c58b50dae8fe0119c2806219d8d4fe6dea0100be563be30014f9&req=dSUmEM54n4BfUfMW1HO4zX6peoeqZkjBNN3BRprxarl9V94qkHfimFoRIAHq%0A%2BsTSX3AhDabVRU8tzRo%3D%0A>
- 
Next, you will be asked to authorize at the BaseCamp website. Click Open window to be redirected
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762135/71083fa8f79f9f3282b828dee44d/15521237109396?expires=1794967200&signature=9a5154bdef3c64ee41e060a175fdacf87df2716c8b18621add7fef32b24e47c2&req=dSUmEM54n4BcXPMW1HO4zaNKZAGWW7iZZT0BXnkfIxN63BcAaZ%2BxX2haUCPm%0AJat1yynkOPgw5f6ntN8%3D%0A>
- 
At the BaseCamp Website you will be prompted to allow access to Merge and Vanta to connect to us. Click "Yes, I'll allow access" to continue
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762123/f9f52e023e7221fa8f8d18571791/15521308176020?expires=1794967200&signature=e019aa95a914a9cb12f505de1d737d5261eee455442069851699f0b705496252&req=dSUmEM54n4BdWvMW1HO4zUdJndgQw9RebeTJvh%2FPc8KtiJA6RpuzlRHnRZ6G%0AYl88PLALyKXwPnNvBNQ%3D%0A>
- 
You will be redirected back to Vanta with a message that says it is setting up the integration
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762125/c059fde4848531fe051c93f75517/15521338755092?expires=1794967200&signature=c5dfec76a096928f33add3bbeb0d9f8ebfce760503b69bef84aba1cc3995cb5c&req=dSUmEM54n4BdXPMW1HO4za1lXF901znzUBRnCGplQ5sUnIwGYUggGUn%2B%2BHgo%0AlvJp3yDCtRaEMM%2FhA0w%3D%0A>
- 
The message should then update to a success message
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762131/c748ff4e8344321869c2622c7494/15521394302100?expires=1794967200&signature=678e7e2b9f44de6e2ac2367e5cc78ad6b9c7d9b3030a5cff4551859ead085470&req=dSUmEM54n4BcWPMW1HO4zazpAfP%2FnLM42CJ61JxRVy%2BsEi5x8bkh9wSkU2p9%0Azo%2F2OxACeK%2BiY%2Fns6a0%3D%0A>
- 
You will then need to hit continue a few more times until you reach the successful Vanta modal below
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762138/4d063878bbe9d6ea97d8d22a8bc4/15521440024468?expires=1794967200&signature=a757ba0bb643b57e5ec3fec71369fa137f38351da1536078c4866dcb2ee6e437&req=dSUmEM54n4BcUfMW1HO4zWw7BrzfPPWQXD84wBCv%2BGCQJX2HJi424N0JqjO5%0AyZTfRpFE9R7CGpUB0oE%3D%0A>
- 
From now on, you can manage the connection on the Vanta Integrations page
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762139/a16cfe37cfabb838f9dd7a483c4e/15521451580180?expires=1794967200&signature=c4886b13c8e713ea98258bc48ca62ea6ba6facd896c088d32883c54199188827&req=dSUmEM54n4BcUPMW1HO4zZhEQIhUc15iFPQXB6DqQlxVFccfXzsCxa0VjgL1%0AGXQ21IUK6o%2FdN%2Fie4xQ%3D%0A>

## Images

- [image 01] ../../images/integrations/basecamp/vanta-basecamp-integration--01.png
- [image 02] ../../images/integrations/basecamp/vanta-basecamp-integration--02.png
- [image 03] ../../images/integrations/basecamp/vanta-basecamp-integration--03.png
- [image 04] ../../images/integrations/basecamp/vanta-basecamp-integration--04.png
- [image 05] ../../images/integrations/basecamp/vanta-basecamp-integration--05.png
- [image 06] ../../images/integrations/basecamp/vanta-basecamp-integration--06.png
- [image 07] ../../images/integrations/basecamp/vanta-basecamp-integration--07.png
- [image 08] ../../images/integrations/basecamp/vanta-basecamp-integration--08.png
- [image 09] ../../images/integrations/basecamp/vanta-basecamp-integration--09.png
