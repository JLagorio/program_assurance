# ServiceNow Integration - Instance Setup Guide

Source: https://help.vanta.com/en/articles/11345624-servicenow-integration-instance-setup-guide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

⚠️Vanta's ServiceNow integration supports connecting one ServiceNow instance per Vanta account. If your organization uses multiple ServiceNow tenants, only one can be linked at a time. Please connect the instance that contains the users and tasks you'd like Vanta to monitor.
 

## Purpose
- 
ServiceNow exposes a REST API for inbound integrations <https://www.servicenow.com/docs/r/platform-security/authentication/t_ActivateOAuth.html> and requires setting up an authentication schema within a ServiceNow Instance to allow client applications to use the API (such as Vanta in this case).
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762676/470aee25b1574063a20bf9877591/15025721746708?expires=1794967200&signature=497a9003033ee9abf26e786189489ed5a341e7899cdd760371d6aca842813a02&req=dSUmEM54n4dYX%2FMW1HO4zb7yqPECXkzWYVbTnHD7GBrgYfEBxgR6En18iFwo%0ADnT051f4lVGQIFOq48w%3D%0A>
- 
This document provides a step-by-step guide to configure your ServiceNow instance properly and connect it to Vanta.
 

## Pre-requisites
- 
This document assumes that you already have a Tokyo Release ServiceNow Instance assigned and working and that you also have the OAuth plugin activated in your instance (You can enable it by following the steps mentioned in this document <https://www.servicenow.com/docs/r/platform-security/authentication/t_ActivateOAuth.html>.
 

## Create An OAuth Application
- 
ServiceNow allows you to set up basic authentication or create an OAuth endpoint in your instance to allow Vanta to access the API.
- 
Since setting up an OAuth Endpoint is more secure, we’ll explain how to create one for Vanta in ServiceNow.
- 
From your ServiceNow Development Dashboard, go to All > System OAuth > Application Registry tab and click on it
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762673/07a22df66eead6e050911d9644a9/15025762377876?expires=1794967200&signature=fa51c7f1664149ea8f12719383598621269c292d07ba735b305436df7aedc981&req=dSUmEM54n4dYWvMW1HO4zRDDkoNsDTPTJGVrBJJiKnZlkskCGciCiyIFs7fP%0AY%2Bg0uA2rHbpVM7RjYKE%3D%0A>
- 
It will redirect you to a list of all your OAuth endpoints, where you can create a new OAuth endpoint by clicking on the New button
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762671/a48c190efcb0c98ab97b21140f1b/15025766125460?expires=1794967200&signature=ddc3bc327f2766da7ab7c72b3a4d2bedbd52c9337cd8743156816bd40658588b&req=dSUmEM54n4dYWPMW1HO4zcge9nGqrAttSEHzhYk%2F6fWNOMYkTHXsiQcDsh1g%0ABuYzVYhfajXLi7KHZ%2Bc%3D%0A>
- 
Before setting up your new OAuth Endpoint, pick the New Inbound Integration Experience options from the new prompt
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2204249761/d010696cf0222b706bac0f13cab4/image.png?expires=1794967200&signature=82489261eaa916c465c4c32fa0fff57a9490d261caef2bda8a9a51c46c0cadc4&req=diInEst6lIZZWPMW1HO4zVUSm4j%2BMIvpoSDzlpi3zy420yTmzSvzI0smqBIN%0A2ILi%0A>
- 
Next you will click New Integration
​
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2204254417/39be4239dd0ce0762af9578e7494/image.png?expires=1794967200&signature=129e85ab581600a915bd5d5b8385d8e95db2797d2fa5ad5c6d3ba7eb3ac7f6b3&req=diInEst7mYVeXvMW1HO4ze4ReK0H3XBxeONtLXt0LLVDacobwqEBswsqvKfo%0AyZKP%0A>
 
- 
Then you will need to select OAuth - Authorization code grant
​
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2204262705/d1c7e76af701a4f7526f14e840c9/image.png?expires=1794967200&signature=a80bfe3def2264ed43e43af4cdfde5747f1e29cf2cd55fd960318a92d4dcd428&req=diInEst4n4ZfXPMW1HO4zdvC3rIkYEqaDzgI0%2FOblMHlMz%2BxtZGVgzpxEiRj%0A1D2B%0A>
- 
A new screen to configure your new OAuth Application will appear. You can fill most of it as you want, setting the Redirect URL to the https://api.vanta.com/auth/o/callback/servicenow/oauth_redirect.do <https://api.vanta.com/auth/o/callback/servicenow/oauth_redirect.do> URL and setting Auth scope to useraccount and click Save
​
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2204274941/adea33f02c76dc6240c3e3ee8b6f/image.png?expires=1794967200&signature=38eade2e882d9d1aa39e87ae18d88931887f95530540e48c2c5fd2aee4f1dc1e&req=diInEst5mYhbWPMW1HO4zclyUjBpomDy3FwSnsKQjIcd8rDDUVCpSVoQWN0i%0Ajzun%0A>
- 
That should generate the OAuth Endpoint correctly, with the Client ID and Secret you need to link ServiceNow to Vanta
- 
The other input you need is the name of your ServiceNow Instance, which can be found in the URL of your Development Dashboard since all ServiceNow instances follow the next naming convention for them: https://<INSTANCE <https://<INSTANCE> NAME>.service-now.com, where the <INSTANCE NAME> in your Dashboard's URL your ServiceNow Instance Name.
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762705/ccd0979c18b41bf17bf84b267991/15025909015572?expires=1794967200&signature=0252d6b876636228310d518e08eee0f8ef9ec39c53b11ee2442e0421f02788eb&req=dSUmEM54n4ZfXPMW1HO4zV1D1%2B8Ch5T%2F3NCsrHNmayaeZr77FhU1NLGkBvdk%0AhmAxMm82Em6nsUOLj%2FU%3D%0A>
- 
With that info, you can finally link your ServiceNow Instance to Vanta by passing your Instance Name and your OAuth Endpoint credentials
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762708/58679b96a745bbb622d6ca672657/15025944734228?expires=1794967200&signature=ebe4c2e4b034213c79eee4ee2a6e301742c0a417f90f2d9da2c4b7444ec74c9b&req=dSUmEM54n4ZfUfMW1HO4zVsd44N09nL%2BxMY22LR7rGhgt76x%2FXydgt3RQdAt%0AihsTw245L34E0Uzdlhc%3D%0A>

## Optional Steps
Even though the previous steps are good enough to get the ServiceNow integration to work, ServiceNow doesn't set any API restriction or scoping for their instances by default.
Instead, it provides the REST API Access Policies feature <https://docs.servicenow.com/bundle/tokyo-platform-security/page/integrate/authentication/concept/inbound-authentication-profile.html> to restrict access to its API. It’s divided into mechanisms, but these are what we think they’re appropriate for the ServiceNow Integration:
- 
Authentication Profile <https://docs.servicenow.com/bundle/tokyo-platform-security/page/integrate/authentication/task/create-authentication-profile.html>: defines an authentication method and a set of authentication policies
- 
Access Policy <https://docs.servicenow.com/bundle/tokyo-platform-security/page/integrate/authentication/task/create-api-access-policy.html>: restricts API access through a given authentication profile
- 
Auth Scope <https://docs.servicenow.com/bundle/tokyo-platform-security/page/administer/security/concept/rest-api-auth-scope.html>: defines permission scopes for an API
At Vanta, we recommend setting up these features in your ServiceNow Instance because they’ll restrict your API to the core endpoints Vanta needs. However, it’s not necessary for the integration to work; it takes a lot of effort to set up properly and might conflict with any other configuration you may have in your ServiceNow Instance, so that’s why these steps are optional.
ℹ️ Note: ServiceNow's OAuth is ACL-scoped, not token-scoped. This means that when Vanta's integration capabilities expand — such as requiring access to new tables or write permissions — you won't need to re-authenticate with Vanta. Instead, you'll need to review and update the ACLs in your ServiceNow instance to grant access to the relevant tables and fields.
 

## Create An Authentication Profile
Creating an Authentication Profile allows you to define an authentication method for your ServiceNow Instance. Previously, we defined an OAuth Endpoint for the integration, so we’ll want to set up an Authentication Profile that only authenticates clients through OAuth.
- 
Go to All > System Web Services > API Access Policies > Inbound Authentication Profile tab from your ServiceNow Developer Dashboard to do that.
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762722/515ed8a21951166b895c1f5b51be/15025962598932?expires=1794967200&signature=092bbdb9ede3a1d8c4daf61c44080a19d2830d3c4d68732ba82a8df748c65869&req=dSUmEM54n4ZdW%2FMW1HO4zZMuLESUQFZf8ng0iSi%2FopMuSZ5sS%2BBBPy3AtRH6%0AhutrfSV6VLSbLCYFl30%3D%0A>
- 
You’ll be redirected to your list of Authentication Profiles, where you can create a new Authentication Profile by clicking the New button
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762724/c543b647f281556d0b4045cdf125/15025951263892?expires=1794967200&signature=22b282d075da637d83967a802f1dc74be31bd6814a077561908d64b0768d48f7&req=dSUmEM54n4ZdXfMW1HO4zY07nyOOrH4oxPEzYBpSQe2WNGIJKYTbG6XWyast%0Afq5bSoHiI%2B4d8z73piQ%3D%0A>
- 
You’ll be asked what kind of profile you want. Pick the Create Standard HTTP Authentication Profile option
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762731/d1814056dd76d962e946475625b9/15026020661140?expires=1794967200&signature=f14ec0d768bc5f355934c829cade896aadd9c445a8261254d6d3f552988a8e1d&req=dSUmEM54n4ZcWPMW1HO4zfMeVrDNE4hulsU2XFFAaswjaQz0hU3VvIY9%2Fxt8%0Ak6f%2FYFAyEM429tiylIc%3D%0A>
- 
Finally, you can set up your Authentication Profile as you want now. Make sure you choose the OAuth Type, your previously created OAuth endpoint as the OAuth Entity, and Global Locking Policy as the Authentication Policy
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762730/68f205148fb446a5ea5df5a221b7/15026061048084?expires=1794967200&signature=a2e40438b9b632b38d9f5a3c0ca2df6045425654146514e71f6c86cdb0b7036f&req=dSUmEM54n4ZcWfMW1HO4zbL65oEgpUks2P81wcVUhVoLeVx7rBhADkY96hrg%0AKsUwd1BiMUUi6a%2FM0j8%3D%0A>

## Create An Access Policy for Table API
With the previous Authentication Profile we defined, we’ll be able to define an Access Policy that will enforce specific API requests through OAuth only.
- 
To create an Access Policy, go to All > System Web Services > API Access Policies > REST API Access Policies tab from your ServiceNow Developer Dashboard
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762743/2e8b8e2d9e52881cc3f3f1ec39fa/15026108502292?expires=1794967200&signature=7a181deb9ecc4781a263361bfad559d5b48f9dbd339c344e709be3a0fcdce49f&req=dSUmEM54n4ZbWvMW1HO4zaxWmYP3UA59%2BINxn%2BjFzvZzeCbL6WEi7SfpRM5h%0AT%2Fi0bcieiwhTTs%2BXdS4%3D%0A>
- 
You’ll be redirected to your list of Access Policies, where you can create a new Access Policy by clicking the New button
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762741/805002c3d27363a2bb3456725d3b/15026124011412?expires=1794967200&signature=4f077b37da869c73396d3f6a6aba232d82640576f5a61aa709ab20ecb0aac01e&req=dSUmEM54n4ZbWPMW1HO4zWVp9NQ5X4QP3JzEe7OOrdo726DL35Vmg2OLTTCC%0AK8Nn4qTQKa944bya9FQ%3D%0A>
Vanta requires the following access to the Table API:
- 
Read access to fetch users, tasks, and attachment metadata (including the sys_attachment table, used for attachment metadata and downloads)
- 
Write access to the comments field on the task table, to sync comments back to ServiceNow
We'll set up the new Access Policy to enforce the Table API to be accessed through OAuth only.
- 
You’ll need to pick the Table API from the REST API dropdown, check the Apply policy to all methods, versions and resources in the API, and choose your previously created Authentication Profile as an Inbound Authentication Profile
[image 16]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762745/1d3d5809e6a4d3de5160bbeda294/15026126723732?expires=1794967200&signature=efc80f3fad2d535ab7b460c4e70a1579460e9d2b9001a2930c447f89d859e68d&req=dSUmEM54n4ZbXPMW1HO4zUG1HHyDsICIlTbSmxloQhclVUVfodePQqSZF2K4%0ADP7sE8lSQ2UzbTWmcDk%3D%0A>
- 
That should create a new Access Policy in your Dashboard.
[image 17]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762749/89032dff8ef83315c05f9f6e07da/15026162894996?expires=1794967200&signature=79fc17f5dea68d2f252f8e2c2f8d6d25e0009ed5106c9c52125d5b952d9e4219&req=dSUmEM54n4ZbUPMW1HO4zQLswdGGrLk0dFh4uUBkWoRDBM%2FcAUoIXaoxAUeG%0AyI6hR%2F2EeLkTAD3%2FNrw%3D%0A>
- 
If it was set up correctly, you should be able to make requests to the Table API through OAuth without issues
[image 18]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762760/252ce51eb691831eb5549c1fd8b3/15026164792340?expires=1794967200&signature=f7946806e5f693ba9df028f8867a76a8090a58e5beefc1aa44be4d00389a264b&req=dSUmEM54n4ZZWfMW1HO4zbG7HnJzpPMVqXQdchGzhIvnMf%2F5Ouz3X0MRVUw7%0AXXSyMZ8dLd3ifkpzx9g%3D%0A>
- 
Using other authentication methods like Basic Auth should fail because the Access Policy doesn’t have a Basic Auth Authentication Profile set for the Table API:
[image 19]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762766/f933345aaa9c7dcd4b977490af9d/15026188775316?expires=1794967200&signature=120c4cb866263bc7326ebafb297485680818bf8a247ca6b671f45dd29ea198a6&req=dSUmEM54n4ZZX%2FMW1HO4zV3UkIxGW8PGzFdllIBtZTy73b1G8x7ctUZGSG5x%0AaSN4cHMRsmNrC9IQ5Rk%3D%0A>
- 
Consider that this Access Policy only takes effect for Table API requests. Other APIs will work fine with whatever Authentication Profile you set up because an Access Policy wasn’t set up for them
[image 20]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762762/73f628673fcd2428097d19a31a83/15026191209236?expires=1794967200&signature=a71da000da791300a9733db14df4003ec7ecc624085bcf21eeca41c428f35498&req=dSUmEM54n4ZZW%2FMW1HO4zeas1drk2phqont07lR2iS8vje4CVayvjZUg4sIQ%0A8b2IIMjdaiPME8X79Ls%3D%0A>

## Create Auth Scopes
We’ve managed to enforce client requests to use OAuth for the Table API, but we haven’t added read-only restrictions yet. ServiceNow allows scoping permissions for its APIs to ensure that OAuth client tokens can only access the APIs they have permission to.
 
We'll create Auth Scopes to grant Vanta tokens the appropriate read and write access to the Table API.
- 
To create an Auth Scope, go to All > System Web Services > API Auth Scopes > REST API Auth Scope tab from your ServiceNow Developer Dashboard
[image 21]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762770/14e2ab276eef9695c7c9cac41dd3/15026222685460?expires=1794967200&signature=9513e108ddc0b65fe55fbb79b1a5fd02a7a326ac61910d270b29f86f5d6d7b8d&req=dSUmEM54n4ZYWfMW1HO4zdDjbvK%2BWsPK8NLROpefiG31N697hEmb1C2Ad0XZ%0AZfwHBPGOcNk8RV7AcG0%3D%0A>
- 
You’ll be redirected to your list of REST API Auth Scopes, where you can create a new scope by clicking on the New button.
[image 22]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762782/6a0c160a1d87f1197d773aac0cd0/15026249047700?expires=1794967200&signature=6cd702190b3ec91e4be8fd4b3c7d35c05e023c971a8315190001f8d14f130959&req=dSUmEM54n4ZXW%2FMW1HO4zZX5iQxf6rdhoCmUyQpQ93nYRI6kjZSi5g6ViEz3%0Agm95CUzT0pPFs9TAw3I%3D%0A>
We’ll need to create two auth scopes. One is for read access to the Table API, and the other is for write access to the Table API.
Once redirected to the next page, we can create a new REST API Auth Scope.
- 
For the Read Access Scope, we have to choose the Table API REST API, only check the Apply auth scope to all versions in the API checkbox, and pick the /now/table/{tableName} Resource. We’ll also need to create an Auth Scope, which can take any name you want, but it’ll be linked to the REST API Auth Scope we’ll create now (We call it table_api_read below).
[image 23]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762777/8018edbbc7552137addeebd21883/15026252518420?expires=1794967200&signature=c4b66ee073d8e8f05d0369a3c99c5cc7497793eab02a174af0859a0cddcef0de&req=dSUmEM54n4ZYXvMW1HO4zYjmuZ0Om6QCowxe6T0i6PPMOdJSwEBsXEgoA2c8%0ABdEmCwaOE%2FYKEAYPmXk%3D%0A>
- 
That should create the Read Access Auth Scope for the Table API. Now, we’ll create the Write Access Auth Scope for the Table API by clicking on the New button again
[image 24]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762783/bc926ff05f1faa3000e6c865c2af/15026326181140?expires=1794967200&signature=fdd0cd9c96975d4e77a9857c61ef49f1f27f29ac1060cc473e9e57d3b4e0db14&req=dSUmEM54n4ZXWvMW1HO4zWOn%2BcQZ1W%2BFP0Z9N5Qgo22%2BebcHBWO8SdzoBygs%0AUKxoQ5IQvXvI0WXZA2E%3D%0A>
- 
For the Write Access Scope, we have to choose the Table API REST API, check the Apply auth scope to all http methods in this API, Apply auth scope to all versions in the API checkbox and pick the /now/table/{tableName} Resource and Apply auth scope to all resources in this API checkboxes. We’ll also need to create an Auth Scope, which can take any name you want, but it’ll be linked to the REST API Auth Scope we’ll create now (We call it table_api_write below)
[image 25]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762791/63442b28370497fb6c81bd5ae846/15026351356948?expires=1794967200&signature=41140e47a588e196c920259c5e2fc9e519b478de31dc231a4d4747dad92ea8f0&req=dSUmEM54n4ZWWPMW1HO4zX0P%2BAxqIVNOMEt3j6yu9%2FzKG2Phoy8JdtqnBkTM%0A6qnlInzZe%2BLKEc0Xb3I%3D%0A>
- 
That should create the Write Auth Scope for the Table API
[image 26]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762802/dd0e5cc9fb4edcd764f26e37533a/15026353591444?expires=1794967200&signature=9689012d7f63d3051688f4303cc73c78a66bb6efc3edd17f2ebe2284e534fdd0&req=dSUmEM54n4lfW%2FMW1HO4zdyIOhg28Te93JsNcWJSWBsQ6168BYGvowWpjN11%0Ab8Q4fDJ7UTFbzuQw%2F3g%3D%0A>
 
- 
For the Auth Scopes to take effect, we need to link them to an OAuth Application. Locate your previously created OAuth Application and add both the table_api_read and table_api_write Auth Scopes to it.
- 
table_api_read enables Vanta to read users, tasks, and attachment metadata from the Table API.
- 
table_api_write enables Vanta to write comments back to task records in ServiceNow. Without this scope, comment sync-back will not work.
[image 27]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762818/a89e601c4e03e8db30d33e3d868b/15026441705748?expires=1794967200&signature=4379d5e3067a3928609899db7f9cbdc39b31d7fcd9a3dd73f35f6182db0ccf5e&req=dSUmEM54n4leUfMW1HO4zZcEONdksY53VKaXk2l1c1NIbsqoEjX99mHJRLb%2B%0ANORa4yJe1BLxoM0ir4E%3D%0A>
- 
If it was set up correctly, you should be able to make both GET and POST requests to the Table API through OAuth.
[image 28]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762813/c6a305006e04b0e8af19b369ae73/15026449044372?expires=1794967200&signature=62f54f4d2e49556149d9b3a42156720bb81b2a7e5b9e544202fa0914675727fe&req=dSUmEM54n4leWvMW1HO4zVTdxUTZoYuPRkSa7qj2m1O0Mo18WF8foDHotpdJ%0AX7l1XTaY1ZP9JcldiLk%3D%0A>
- 
But API requests to other APIs will work fine because they don’t have Auth Scopes created for them in your Instance
[image 29]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762819/d89edea70fa84c3347daa5fc3e6f/15026481398676?expires=1794967200&signature=7a5ad13dc4e2207f3554b5a4ce98479d5d6446f07adcaf36a32d81a880244132&req=dSUmEM54n4leUPMW1HO4zaK9uYbhJOgHLeDT7wEg0U7vooklA1%2Fu5WGu1B1U%0AaUARxN%2FahVzOF9YX3ew%3D%0A>
- 
That’s how to set up API restrictions for ServiceNow, at least to prevent POST, PUT and DELETE requests to the Table API.
- 
Ideally, you would need to create REST API Auth Scopes for each ServiceNow REST API (including new APIs you create) and only assign the Read Table API permission to Vanta’s OAuth endpoint. But as stated previously, that requires an Auth Scope for each API endpoint, which is a lot of work to do and it’s not necessary to make the integration work. That’s why these steps are optional.

## Images

- [image 01] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--01.png
- [image 02] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--02.png
- [image 03] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--03.png
- [image 04] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--04.png
- [image 05] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--05.png
- [image 06] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--06.png
- [image 07] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--07.png
- [image 08] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--08.png
- [image 09] ../../images/ux/integrations/servicenow-integration-instance-setup-guide--09.png
- [image 10] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--10.png
- [image 11] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--11.png
- [image 12] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--12.png
- [image 13] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--13.png
- [image 14] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--14.png
- [image 15] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--15.png
- [image 16] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--16.png
- [image 17] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--17.png
- [image 18] ../../images/documentation/servicenow-integration-instance-setup-guide--18.png
- [image 19] ../../images/documentation/servicenow-integration-instance-setup-guide--19.png
- [image 20] ../../images/documentation/servicenow-integration-instance-setup-guide--20.png
- [image 21] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--21.png
- [image 22] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--22.png
- [image 23] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--23.png
- [image 24] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--24.png
- [image 25] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--25.png
- [image 26] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--26.png
- [image 27] ../../images/integrations/servicenow/servicenow-integration-instance-setup-guide--27.png
- [image 28] ../../images/documentation/servicenow-integration-instance-setup-guide--28.png
- [image 29] ../../images/documentation/servicenow-integration-instance-setup-guide--29.png
