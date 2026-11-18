# Connecting Vanta & GitLab Self-Managed instance

Source: https://help.vanta.com/en/articles/11345748-connecting-vanta-gitlab-self-managed-instance
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

The GitLab integration allows you to connect both Cloud & Self-Managed types of GitLab instances.
- 
For Gitlab Cloud, please see Connecting Vanta & GitLab Cloud <https:/help.vanta.com/en/articles/11345717>
Please Note: We make fetches every 6 hours.

## Prerequisites
- 
Verify that you are an owner of the GitLab group you wish for Vanta to scan.
- 
GitLab versions 18.x, 17.x, 16.x, 15.x and 14.x series are eligible for API v4 support

## Procedure
- 
In Vanta, go to the Integrations page, click Add integration, and search for GitLab. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect
- 
On the next page, select Self-Managed, then click next.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762854/a991fd15abc3872e3fa78d840221/23038161056276?expires=1794967200&signature=5a91346d1ce98e075c803284d45bd69692154f0549090198bb751f398cf0cde9&req=dSUmEM54n4laXfMW1HO4zXhUsAfuTyeO6uimosc40QNyT3C8n0o770h8yArC%0AIGZr%2FRhHt61Tbi2gslM%3D%0A>
- 
If you have IP restrictions enforced, allow Vanta's IP to access your GitLab instance. Vanta will access your infrastructure at the following CIDR range: 34.227.127.165/32
- 
Enter the HTTPS URL for your GitLab instance. Note: The Self-Managed GitLab integration is only supported at a subdomain.
- 
Click Next
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762851/734d352504fa0a226c025db394d4/23038161060884?expires=1794967200&signature=8f285bbc3083091b5c3e7a228e41549aca5033f2a4ff6e426774415f02a1fe77&req=dSUmEM54n4laWPMW1HO4zXHW%2B%2Bp4I%2Bx3v6%2BhsszDSnTu1%2F0RRWCMEP%2BXHONG%0A52FOu1u2VaxroHYBXMg%3D%0A>

## Creating Vanta application in your GitLab instance
- 
Create an application for Vanta to authenticate with your GitLab instance. This requires you to be the owner of the GitLab group you wish for Vanta to scan
- 
From your GitLab Group dashboard, Settings, then select Applications.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762850/79b649589439d35d65f7c8da2360/23038344089620?expires=1794967200&signature=e891f716870b59c410bd3bf41a6a43847bab3b07229522079d0372ce24486ded&req=dSUmEM54n4laWfMW1HO4zflH%2BzV3Ppy0Gc70%2BO6z%2FPostoI6BuF6X5D5JPrT%0AvXBIewBQrkaVt7k4v6Y%3D%0A>
- 
Select Add New Application
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762856/f916a9dc25fc344eab3e2d5efd7f/23038337486996?expires=1794967200&signature=1ee6379fb2178fce55f7aebc73bd4d6cc8fb6b6cc20ae923cbba848cea4f3fc3&req=dSUmEM54n4laX%2FMW1HO4zT0SlmQyajHpOx7NcvpkF4nj8KW1onhvygHro4dq%0ABYBa4WPemR3WWaOOVHM%3D%0A>
- 
Enter the information below to create the new application:
- 
Name: Vanta
- 
Redirect URI: https://api.vanta.com/auth/o/callback/gitlab <https://api.vanta.com/auth/o/callback/gitlab>
- 
Trusted: checked
- 
Confidential: checked
- 
Scopes: read_api
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762870/907cbc1cafe20dc79bf8e97f669e/23038337490068?expires=1794967200&signature=fb467d3b06306febdf23f5f00ebf489ca4d338a22e28c3ccccc17dfbc107f0b0&req=dSUmEM54n4lYWfMW1HO4zdUcIhYcKXhRDJKQT3FIjfKzRaRJRtMe0hJlpc19%0AkuX0%0A>
- 
Click Save Application to generate the OAuth credentials.
- 
Copy the Application ID and Secret.
​Note: Be sure to copy the Application ID and Secret and store them securely, as these details can not be reaccessed. Only select Continue once you have these copied and stored securely.
​
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762872/38c3efbcd2c5d18132520be2ac19/23038344094612?expires=1794967200&signature=9d31e39593a6b6c51d904f68008ab9eb8f463ec6d9bba3cd83ff4649b4ef5ead&req=dSUmEM54n4lYW%2FMW1HO4zWiNEDo6ayjDBQNh709%2FxG70GQwvJvNHn7ofNvuA%0AgRS2%0A>
- 
Navigate back to the Vanta integration connection page, and paste the Application ID & Secret copied in the previous step.
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762871/35d6136bf56310b05c173c1d450a/23038337493908?expires=1794967200&signature=339f7ef2357218b6b0d4f31e184bb648007263abb5382659a67764daec84e9e6&req=dSUmEM54n4lYWPMW1HO4zcz00yoihljJQ03FnS6qHJr6JJvcIV9mTI6%2FFOlY%0AAMUr%2FVsXRWWMgOJuWlc%3D%0A>
- 
Click Done
- 
The page will redirect to GitLab to authorize the application. Click Authorize
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762868/306a608025c5d81621cfc443303f/23038536585492?expires=1794967200&signature=516f80e5130db27af11df90f7a847e9aa226a41966482795212738e1d6eda810&req=dSUmEM54n4lZUfMW1HO4zYFghXKbuMVsVMOoDXjtT2zDfEUV3bl1KZFtW03g%0AOjDMxt8dF%2Bzg030TvZA%3D%0A>
- 
When prompted select the Gitlab group you want Vanta to scan, then click Link GitLab account
- 
Please note: Vanta is only able to connect and fetch one group and the subgroups beneath that for GitLab
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762884/1d414e9516dda8c5d02774011013/23038583901716?expires=1794967200&signature=8a042c535f080a1b85706a59de902e6b756c3b11b4a1cd798974725083b82157&req=dSUmEM54n4lXXfMW1HO4zYW0PaSUYsidjjWRB8y6DnxSo37yy5nZAa52pH67%0AnflnKaQdf0Tsh%2FE%2B%2BJs%3D%0A>
- 
GitLab is now connected.
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762886/c7ed1f719655b9adbcd6cc0cdb04/23038536589332?expires=1794967200&signature=e5c7d01ed270e1688772771fc870734ed6dc0f0472a321d421aba9b75546f877&req=dSUmEM54n4lXX%2FMW1HO4zezkmG2j%2Flv5ophCQ6FDfNWFGrBL2RowgLKaNm5G%0Agoi%2Bpsl8ctDRsu8nJcg%3D%0A>

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-gitlab-self-managed-instance--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-gitlab-self-managed-instance--02.png
- [image 03] ../../images/integrations/gitlab-self-managed-instance/connecting-vanta-gitlab-self-managed-instance--03.png
- [image 04] ../../images/integrations/gitlab-self-managed-instance/connecting-vanta-gitlab-self-managed-instance--04.png
- [image 05] ../../images/integrations/gitlab-self-managed-instance/connecting-vanta-gitlab-self-managed-instance--05.png
- [image 06] ../../images/integrations/gitlab-self-managed-instance/connecting-vanta-gitlab-self-managed-instance--06.png
- [image 07] ../../images/ux/integrations/connecting-vanta-gitlab-self-managed-instance--07.png
- [image 08] ../../images/integrations/gitlab-self-managed-instance/connecting-vanta-gitlab-self-managed-instance--08.png
- [image 09] ../../images/integrations/gitlab-self-managed-instance/connecting-vanta-gitlab-self-managed-instance--09.png
- [image 10] ../../images/integrations/gitlab-self-managed-instance/connecting-vanta-gitlab-self-managed-instance--10.png
