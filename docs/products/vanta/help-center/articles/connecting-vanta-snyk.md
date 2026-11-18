# Connecting Vanta & Snyk

Source: https://help.vanta.com/en/articles/11345783-connecting-vanta-snyk
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Using the Vanta and Snyk integration, Vanta will collect projects and vulnerabilities from Snyk and display them under a new tab on the vulnerabilities page. You’ll be alerted if new vulnerabilities are added as well as if any of your vulnerabilities are approaching SLAs, so you can track remediation!

## Prerequisites
- 
In order to access the Snyk API, an Enterpise plan is required.

## Procedure
- 
Verify that your current Snyk plan supports Rich API
- 
To connect, go to the Integrations page and search for Snyk. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764316/e6f9066b44da5db012f91f68e182/12618204555796?expires=1794967200&signature=59c99c296c9fffc986e5e8a49e32cf2bd0db69339ba61272b1af4f3812bc9b1e&req=dSUmEM54mYJeX%2FMW1HO4zcG2L%2BJXRVyJWGra3h9HL8XNwZ439KfbuGqz9iws%0A7KUkwpuNL5sji%2BQJ0YE%3D%0A>
- 
After clicking connect, the following pop-up will appear
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764317/86aefc15bd6f654410878fb9005e/31087309658644?expires=1794967200&signature=2cdb5e533b3cdc80412a7ae780c1365bd59570542654e25918567209df0e4d5f&req=dSUmEM54mYJeXvMW1HO4zcdIXKJB4VARPi191XWfvjsH7OMRU9azXCCsTw6T%0Aw7Cduc2AUSl7y19sYoo%3D%0A>
- 
Add the API token <https://docs.snyk.io/snyk-api-info/authentication-for-api> from your Snyk account
- 
Select the correct Organization you want to integrate with Vanta
- 
Alternatively, you may provide the API token from a service account <https://docs.snyk.io/user-and-group-management/structure-account-for-high-application-performance/service-accounts>
- 
For every API Request, a Service Account is necessary to generate a token with the correct permissions. Ideally, users should have a Group Viewer token to have read-only access to all Snyk API Endpoints
- 
Ensure you are in the correct Snyk Group and Organization
- 
Select Validate and Store

## Snyk Groups & Organizations
- 
Snyk can segment its user base into Groups, and these groups can also be divided into Organizations.
- 
You can choose how you would like to filter your resources by selecting Manage followed by Edit groups and organizations 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764318/7b9ba625a8d040192a7cd8c55bb0/25983561768852?expires=1794967200&signature=6844aa096a5e411786f9641ef6be6cc172e46e0b12e2df302ec3d61f1a3046b8&req=dSUmEM54mYJeUfMW1HO4zSU53xVe%2BmZRHhahILkKjYdVuwbRFkK6Lm5TNNPf%0AhIK6R7DRPhQSOaXISu0%3D%0A>
- 
Choose how you would like to filter your resources, and select Save
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764337/10017daae221d9721ca3d03fe7eb/25983561783572?expires=1794967200&signature=11cc0fab34cac736b5435fdca430c26a3cf41d072e8b4a37b0b4bddca18781bd&req=dSUmEM54mYJcXvMW1HO4zRVWcCjhPzypn4clg9kfEpASJ3ZDLdvarz2F97ki%0AkedLBe46yMNISG4aMds%3D%0A>

## Images

- [image 01] ../../images/integrations/snyk/connecting-vanta-snyk--01.png
- [image 02] ../../images/integrations/snyk/connecting-vanta-snyk--02.png
- [image 03] ../../images/integrations/snyk/connecting-vanta-snyk--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-snyk--04.png
