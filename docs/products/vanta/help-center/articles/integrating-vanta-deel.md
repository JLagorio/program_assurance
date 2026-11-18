# Integrating Vanta & Deel

Source: https://help.vanta.com/en/articles/11345675-integrating-vanta-deel
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

Vanta connects to Deel through their SCIM API, which is currently in a beta state, and customers need to have organization tokens available.

## Obtaining your Deel API Token
- 
In your Deel dashboard, From the top navigation menu select Hub, then Services
- 
Click on API tile to access the developer centre
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761507/8f04af96d3c7a52ffd484e1f78c4/32625989652500?expires=1794967200&signature=88b31ba3b6af470ea9eebd9dcfe52d4eaa91376f40799e6ae0428fdb7cbe38dd&req=dSUmEM54nIRfXvMW1HO4zRvxV7D8dwpeGb1kpPN9wCresA5%2BOXOXGAAitJdR%0AXq2xhBwx54VihbK7rCY%3D%0A>
- 
Select API Access & Sandbox. Ensure Organization Tokens is selected and click Generate New Token
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761509/83a21c470ebbce95e3321a3de2e0/32625953336980?expires=1794967200&signature=44a94bc6ca3bb77a4570b25d1a770310cc4c7109621a4dbe3cb4c5d30e51e03a&req=dSUmEM54nIRfUPMW1HO4zbx3X3nvljjBpA4jRyziHkY000M0I1iF4HPcw1HA%0Ae7dLd3tqtz3XtrN4xZg%3D%0A>
- 
Type a label to identify your token and click Next. 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761508/b8db5734d7dfb7f753616b651cc1/-Oa5-eCJf2IB56PGl3DedsdpMey5VI0dbV3hUFCOIgxOO1DpG0W29-6v15RSjC5JcChyZ9FqmHydIPeiCq78oOBzq6purbkFby4smkONBUtMrOllwA3K_qYmlugwRpHdrhBwzqUoJ802IuWlHjxXu_8?expires=1794967200&signature=abacbf36ac0c58eeed747158c077c6be2062bed1fae1e3fb4bc88626783871a4&req=dSUmEM54nIRfUfMW1HO4zZAi%2B0YmkuEtehcLvDPSxwDl%2FIlBwnbaZMZcmeVa%0AhZd2%2BlEmzewxXiQFB6o%3D%0A>
- 
Under the scopes, select People and select the Users:read scope, and then click Generate.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761505/c37cd8bfb52552ba2a8f74f5b13b/32625989654932?expires=1794967200&signature=fd2dc4649e7b512e7161d542b7e803b67226ba3cd0900c4621a066f58416a72c&req=dSUmEM54nIRfXPMW1HO4ze6BymxRpjVEj9wp6Mm1HLM32GnX9m9u%2B1FCm1ZM%0A9oCVwUOJNoIrKxN8G%2B4%3D%0A>
- 
Copy your token (you will need to paste this into Vanta)
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761517/7cb17d628e37072d1cc58b07c8f7/99yxQvDvM1EcyyMK7h1Dyu9BWi179tZ73xOwsxjV61fpJC7Q3cr6GHh_lbDKDPF7WvYfmY_um3eLBEE6CYMvAAgQqDv4nyPwTlHZoT5nYv5kBOPZnSzKpWKgfG7Sq7lN-cMoW_3IpLkCvPt28HFl60g?expires=1794967200&signature=994a346159e71b198232e82d06b218431ffafa4eb8058799191bb5c5674d7e4b&req=dSUmEM54nIReXvMW1HO4zWdsXXZPI%2BXZm5Bpt9IeO1diKOFDCPvckihXcEBA%0A%2FqYHV8CUCNVLXUSPlLU%3D%0A>

## Integrating with Deel
- 
In Vanta, go to the Integrations page, click Add integration, and search for Deel. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect.
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761519/82c60fad245b4f28ed6606fdc841/27503274040724?expires=1794967200&signature=d5e9bbf959a9c797c336e57a979cbf5fe8d368e09a5fd90ccb41f7a90f34c040&req=dSUmEM54nIReUPMW1HO4zY5yXgG6giqh6l2I909LeZsGlUSWu41GR59tMc%2BN%0ACiqSsQy6qd1rorngYJI%3D%0A>
- 
Then, you can fill out your API token with the Organization Token you generated in the previous steps.
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761518/be8f35c4c282027e6b6e25790a4b/nuxDxjKHoDw6_6lAOrujLHvBdbnESp-V20-P8xRsrdnPazQZL1o58V9crEx6iMFmbwelwr4X-97NgZWAtp2F6wdGywkFo6Tg83iIrbM2vcxfO9Fs1WA2ATofBAQU9ir14zhVCubopBL8x7nzeMqAb4c?expires=1794967200&signature=5b55e0d503912fdc3e294cebca72a888a7255c5e6c0abc52c7cc18251652ecb3&req=dSUmEM54nIReUfMW1HO4zb5dNN8V0hNCn0gmz7cAUVVojiLRJCHtiGlnWiht%0APIpqbaJ69UdFq4XaWjA%3D%0A>

## Images

- [image 01] ../../images/integrations/deel/integrating-vanta-deel--01.png
- [image 02] ../../images/integrations/deel/integrating-vanta-deel--02.png
- [image 03] ../../images/integrations/deel/integrating-vanta-deel--03.png
- [image 04] ../../images/integrations/deel/integrating-vanta-deel--04.png
- [image 05] ../../images/integrations/deel/integrating-vanta-deel--05.png
- [image 06] ../../images/ux/integrations/integrating-vanta-deel--06.png
- [image 07] ../../images/integrations/deel/integrating-vanta-deel--07.png
