# GitHub: Quickstart

Source: https://help.vanta.com/en/articles/14844982-github-quickstart
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Version Control Systems
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 
Connect GitHub to Vanta so that code reviews, branch protection, and vulnerability alerts your team manages in GitHub automatically power your compliance tests with no manual uploads required. 
 
This guide is for: GitHub Cloud (Free, Team, or Enterprise Cloud on github.com)
 
Time to complete: ~5 minutes
 
This quickstart walks you through four phases: 
- 
Open the GitHub integration in Vanta and select your connection type (~1 min)
- 
Authorize Vanta in GitHub and select your organization (~2 min) 
- 
Choose which repositories Vanta can access (~1 min) 
- 
Confirm Dependabot is enabled in GitHub if you want vulnerability alerts (~1 min)
​
 

## Before you begin
Confirm all of the following before starting:
- 
You have a GitHub Organization account (personal accounts are not supported).
- 
You are an Organization Owner in that GitHub org.
- 
You have Vanta admin access.
- 
(If reconnecting) You have uninstalled the previous Vanta GitHub App from your org (Settings > Installed GitHub Apps > Uninstall).
- 
(Optional) If you want vulnerability scanning, confirm Dependabot is enabled in your GitHub org settings.
​
 

## Setup guide
Follow these steps to connect the integration

​Step 1: In Vanta, go to the Integrations page, click Add integration, and search for GitHub. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.

​Step 2: Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338045081/ef428a90d0495e111650a884359b/63ce0034-60fe-4a29-8ced-490cf100af68?expires=1794967200&signature=7adf2e66840d9a8c01637e666c437c40dbef022f677e4908c2f3046825b39cb1&req=diMkHsl6mIFXWPMW1HO4zcqr%2BN%2FyaJIonxlwXIchJfMaN7u4xKnIWvBZOHxV%0A%2ByCT5BKjA7ZvK6wQWmo%3D%0A>
 
Step 3: When prompted to select your GitHub type, choose GitHub Cloud.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338051379/e8a18a2ea054deee55709b68f631/087e9e08-ca9a-4857-aaaa-fe168a8cb406?expires=1794967200&signature=e64f5b8691fdd46bc12fd53e308d85a65a5cc202d507f2321698e55adcbf4d43&req=diMkHsl7nIJYUPMW1HO4zT5Z3jD0Az%2FnfPNKDOQoKfP65Uww7HyAxhgpGI%2B5%0AZxJUU%2FtiWP4LsILZgWQ%3D%0A>
ℹ️ Note: You may see additional connection options depending on your GitHub plan. For standard GitHub Cloud, select GitHub Cloud.
 
Step 4: Select the products you want Vanta to monitor with GitHub. Toggle on the products relevant to your organization, then click Next.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338054812/d6d8f302199a6c251283bba16a80/5e8b5fef-bace-43ff-a462-701ea1931551?expires=1794967200&signature=07842487e9b6322813c4da429785ed7969123eeb4374c8f22713b0ba02b80f40&req=diMkHsl7mYleW%2FMW1HO4zab5pYcv6n23PQR2e1anGSH9987kGlJN3xBZtqpq%0AUSGSwKk%2BFhk6yzexaX0%3D%0A>
 
Step 5: Choose your permission level:
- 
Read access only — Read access is used to prove branches are protected, pull requests are well-formed, and security issues closed in a timely manner.
- 
Read and write access — Write access is used for automating the tracking, assignment, and resolution of security and compliance tasks.
 
Step 6: Click Connect GitHub. A new browser tab will open and prompt you to sign into GitHub.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338055743/81c06baf66b345f9323634abd92a/a5f7ff5d-ba9d-4b59-8f35-e5c02d783177?expires=1794967200&signature=be746496dc0e7f27000eb50be2bcb2a9b1eb67edb1e751f812917d11fd9e951c&req=diMkHsl7mIZbWvMW1HO4zZAqeaZBXXH%2F7K4YCV3FM7vz6Ml7LsqRi8%2Fkfy30%0A5lemJVoCh0%2BthGJzj6g%3D%0A>
⚠️ Note: On the next screen, select your company organization — not your personal GitHub account. Installing on a personal account will cause an error and the connection will fail.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338056595/d346739c3d8f4ea0fdf743fe2c28/2184fb5d-526e-467c-a193-8f6dc221308c?expires=1794967200&signature=bedd98debb499026a89439defcbe074b189a6e0009082d072c4063a089d1e386&req=diMkHsl7m4RWXPMW1HO4zXrncX%2BhlUHNNfc3SanNca%2F4CjUdXflbz5FKPlgn%0AH8iAAK8LpfqlTmA7Om0%3D%0A>
 
Step 7: Choose repository access:
- 
All repositories (recommended) — Vanta monitors all current and future repos automatically.
- 
Only selected repositories — You choose specific repos. 
⚠️ Note: New repositories added to your org later won’t be monitored automatically. You must manually add them in GitHub.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338060856/21ce0b29696b0d61243af52cab7a/fd39090f-134e-4885-b831-4676bed016a3?expires=1794967200&signature=9bd46c1631ab29e323f08c49be5c2f9cf3ba1c2a1684d8dac4c53f00581f8803&req=diMkHsl4nYlaX%2FMW1HO4zSpBoYWyBQAzov%2Bn0Kdaz0Us%2FZ1T9fzmWYCEUXQe%0A636mQqDBFa9skcY7MjI%3D%0A>
 
Step 8: Click Install. The flow will redirect back to Vanta with GitHub showing as Connected. 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338064525/2e8a120df9f4f2aafd409514393a/46a5c978-1f31-4f6f-ba1d-b477797b2808?expires=1794967200&signature=ed76a30403d9b8badca0134c15955f26a2f3c163423459b11f79d3fdaee8e7c7&req=diMkHsl4mYRdXPMW1HO4zTTQ%2FEUK4mMDms4pk83hdSN9zIqSkwt0T4LPu6on%0ARWAGjiXTQdbfn%2BpHmpA%3D%0A>
 
 
 

## Verify your connection 
Confirm the connection with these steps. 
- 
GitHub should be listed under the Connected tab on your Vanta Integrations page.
- 
In GitHub, go to your org’s Settings > Installed GitHub Apps. Confirm Vanta is listed.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338076936/aaf45684ff06524f7ff9ceb9982a/5be2f6e3-e632-4204-a49b-5b5091e3f677?expires=1794967200&signature=edd75b021c4cc2358bc55941a0320970e8bd3060daf7ed84d6577e56dcb8c198&req=diMkHsl5m4hcX%2FMW1HO4zVw20RkbEsAGzA%2FKdXHv%2Bq%2BQYoMGK6BytoPVZ12L%0A1I6ppAyRxvMN6An%2FyP4%3D%0A>
- 
Vanta will begin syncing your repositories, org members, merged pull requests, and Dependabot vulnerability alerts.
- 
Initial sync may take several hours. This is normal; no action is needed.
 
 

## (Optional) Set your production branch
By default, Vanta evaluates your repository's default branch for compliance tests. If your production branch has a different name, you can tell Vanta which branch to use.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338069164/64431fe41402e19d198e052cdd7e/26532576-3f40-4629-a982-2903c0d09d3c?expires=1794967200&signature=4ed50a4811d77800519aa339a82a1364e7923d955b0a70a707ec13b8a14dd6fc&req=diMkHsl4lIBZXfMW1HO4zX1yBrIkqDfWpGWiI99A8wfg4be0l35AUo6eCXk0%0AmAD2uyI8R3BrdjcHtig%3D%0A>
To set a production branch:
- 
Go to your GitHub organization Settings.
- 
Go to Custom properties under the Repository category:
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338072573/db559c239ac0db051655405b3699/85b707b9-e792-4d79-a7b2-806fb24d8908?expires=1794967200&signature=08785e397b6a921ae0e9cb0580f624c388ce8d282def6333e0f07dab3476f1d2&req=diMkHsl5n4RYWvMW1HO4zchq5m80Ex7Na4ok%2FvolMvMcGib7CLvKR4jkKYMp%0AjCBYDB7kYM8LJZ64WcE%3D%0A>
- 
Click New Property.
- 
For Name, enter: vanta_production_branch_name.
- 
For Type, select Text.
- 
(Optional) Check Require this property for all repositories and set a default value for your production branch. 
- 
You can also set this property per repository by clicking Set values on the Custom Properties page. 
This can be set at the org level (applies to all repos) or per individual repository.
 
 

## Troubleshooting

### Error: The connection to GitHub failed because you installed the integration to a personal profile 
- 
Likely cause: You installed the Vanta GitHub App on a personal GitHub account instead of an organization.
- 
Fix: Return to GitHub, uninstall the Vanta app from your personal account (Settings > Applications > Installed GitHub Apps > Vanta > Uninstall), then restart the connection in Vanta and select your company organization.
 

### Repositories are not appearing in Vanta
- 
Likely cause: You selected Only selected repositories during setup and the repos you want are not included.
- 
Fix: In GitHub, go to your org settings > Installed GitHub Apps > Vanta > Repository access. Add the missing repositories, or switch to All repositories.
 

### Tests are still failing after I fixed my branch protection rules
- 
Likely cause: Vanta syncs periodically, not in real time. Initial data sync may take several hours. Exact timing depends on the size of your organization.
- 
Fix: Wait and then check the test status again.
 
 

## Additional resources
For troubleshooting and advanced configuration (including how branch protection tests work and how GitHub Rulesets interact with Vanta), see the full setup instructions and reference documentation in the GitHub: Integration Guide <https://help.vanta.com/en/articles/14845240-github-integration-guide>. 
 
For issues not covered here, contact Vanta Support.

## Images

- [image 01] ../../images/ux/integrations/github-integration-guide--01.png
- [image 02] ../../images/ux/integrations/github-quickstart--02.png
- [image 03] ../../images/ux/integrations/github-quickstart--03.png
- [image 04] ../../images/ux/integrations/github-quickstart--04.png
- [image 05] ../../images/integrations/github/github-quickstart--05.png
- [image 06] ../../images/integrations/github/github-quickstart--06.png
- [image 07] ../../images/ux/integrations/github-quickstart--07.png
- [image 08] ../../images/integrations/github/github-quickstart--08.png
- [image 09] ../../images/ux/integrations/github-quickstart--09.png
- [image 10] ../../images/integrations/github/github-quickstart--10.png
