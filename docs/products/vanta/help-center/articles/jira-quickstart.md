# Jira: Quickstart

Source: https://help.vanta.com/en/articles/14323221-jira-quickstart
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Workflow and Ticketing Tools
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 
Connect Jira to Vanta so that security work your team tracks in Jira automatically counts as compliance evidence with no manual uploads required.
Note: This guide covers Jira Cloud only. 
ℹ️ Note: This guide covers the new Jira connection experience. If you click Connect and see a side drawer with a Link Jira window instead of a Jira listing page, see the Jira Integration Guide <https://help.vanta.com/en/articles/14441707-jira-integration-guide> for the earlier connection steps.
 
 
What you'll do (~10 minutes total)
- 
Allow user-installed apps in Atlassian admin (~2 min)
- 
Connect Jira in Vanta, select your features, and sign in to Atlassian (~4 min)
- 
Set your sync filters and label your Jira issues (~4 min)
 

## Before you begin
Confirm the following before starting: 
- 
You have admin access to Vanta
- 
Your Atlassian account has the Browse users and groups global permission and Browse Projects permission on the projects you want Vanta to monitor
- 
Your Atlassian organization allows user-installed apps (see Step 1)
💡 Tip: For production use, connect with a dedicated service account instead of a personal account. See the Jira Integration Guide <https://help.vanta.com/en/articles/14441707-jira-integration-guide> for details.
 

## Step 1: Allow user installed apps in Atlassian 

## 
Note: This setting requires Atlassian Organization Admin access. If your organization blocks user-installed apps, the Accept button during the Atlassian approval step will be unavailable and the connection cannot be completed.
- 
Go to admin.atlassian.com.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223216399/c1c3dc8ffa1ac1118deedd5317d8/25f3ba75-6f3b-4151-b954-7d578c082294?expires=1794967200&signature=16ea6e143adde1ea6bcc5c7888c8e245c7de58d50c8aa74c251b9ea8c34e182c&req=diIlFct%2Fm4JWUPMW1HO4zQO9ynRRz%2Bb0hcQ1Lfm9cZkD04784eKicYF%2BUofF%0AqEWbfu0Ostas3t%2FJqaM%3D%0A>
- 
Select your organization.
- 
Expand apps → Sites, then select your site.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223216850/583bce97ff6a7b50bdd6031a6c65/00937d41-3934-4254-9add-8748a10886e2?expires=1794967200&signature=a3774f9b9c7a67ccbf4264e30f8d3560c0914993273aa984e887d187eaee171d&req=diIlFct%2Fm4laWfMW1HO4zeBm%2BWamSeybmJW%2FK0HskqIUV481stH6TXwAch8r%0AXcnbAvvBwIa0%2BlWIC6k%3D%0A>
- 
Click Connected apps → Settings.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223218567/231d3458613db793e0bd495ab728/d04edf3b-9c76-4de6-afc9-2ec9bc4cd6a3?expires=1794967200&signature=e64f6ca3b669db07fa9338d66771c045279ff2b08ec940ad5a496e45b73aacd9&req=diIlFct%2FlYRZXvMW1HO4zQcM47dTmYv2HubR2Bn%2B6B8WuS5GCN8w2%2FnfLiPk%0AVh4rjQ7OK%2FtCD6q7lLI%3D%0A>
- 
Set User Installed Apps to Allowed. (In some versions of Atlassian, this appears as turning off Block user apps.)
- 
Click Save.
Note: Navigation options may vary depending on your Atlassian version. The goal is to locate Connected Apps → Settings under your organization's site. For example, if you’re on Atlassian’s improved user management experience, go to Products → Select your site → Connected apps → Settings instead. 
 
 
 
 

## Step 2: Connect Jira and select features in Vanta 

## 
- 
In Vanta, go to the Integrations page, click Add integration, and search for Jira. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
On the Jira listing page, click Connect. This opens the connection guide. 
- 
On the Select features screen, access reviews are always on. Choose what else you want Vanta to do with Jira: 
- 
Task tracking: Track the Jira work items your team uses for security and incident work, and whether they're resolved within your SLAs. 
- 
Task creation: Create Jira work items from Vanta to track remediation work. Turn this on if you want to create Jira work items directly from Vanta tests. Vanta asks for write permissions only if it's on. 
- 
Click Save.
ℹ️ Note: If you have Advanced Vendor Risk Management, Vanta may also ask whether to create procurement requests from Jira work items. This is optional. See the Jira Integration Guide for details.
 

## How to find your Atlassian site URL: 
Note:  You may have a different version of Atlassian which may cause variation in the following setup steps or website screenshots.
- 
Click on the 4-square icon in Atlassian
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223282460/ac1a67a7a3eda31de5d775ec22c7/4a1a03fe-d903-4999-b3de-708704024305?expires=1794967200&signature=4cecb922a78c66bacf51d63afd82f00876bdaa80ee35f998be34b29adeed02b8&req=diIlFct2n4VZWfMW1HO4zceQiDCOtyMwt0swmzoj9rMPnqhIaD%2BEBc01EKxN%0AHYtbxvOwISLNA0L7JRw%3D%0A>
- 
Expand Jira
- 
Select the organization you want to connect
 

## Step 3: Sign in to Atlassian and choose your site 

## 
- 
Click Connect. Vanta sends you to Atlassian. 
- 
Sign in, select your Jira site from the dropdown, and review the requested permissions. 
- 
Click Accept. Atlassian returns you to Vanta automatically. 
- 
On the Choose Jira site screen, select the site you want Vanta to monitor, then click Save.
ℹ️ Note: Each connection monitors one Jira site. To monitor more than one site, add each as a separate Jira connection.
 
 
 
 

## Step 4: Set your sync filter

## 
On the Set sync filters screen, choose which Jira work items Vanta tracks in the projects your Atlassian account can browse, including matching work items created later. For each category, Vanta tracks the work items that match any of the labels or the JQL you set.
- 
Enter at least one label for Security, Incident management, and Incident resolution. Vanta suggests security, incident-management, and incident-resolution, or you can type your own. 
- 
Access offboarding is optional. Leave it empty to skip it. 
- 
Labels are case-sensitive and can't contain spaces, quotes, or backslashes. A label entered as Security won't match security. 
- 
Prefer JQL? Select Use JQL instead of labels for that category and enter a query. Leave out ORDER BY, because Vanta sorts results itself and won't save a query that includes it. 
- 
Click Save. You'll see "You're connected."
You can change these filters later from the integration settings.
 
 
 

## Step 5: Label your security issues in Jira

## 
Vanta tracks Jira issues that carry the Security labels you entered in Step 4. Add the same label, exactly as you typed it, to any issue you want Vanta to pick up as compliance evidence.
 
Add this label to any issue you want Vanta to pick up as compliance evidence.
- 
Open an issue in Jira
- 
In the Labels field, add your security label (for example, security).
- 
Repeat for any other issues you want Vanta to track 
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223306231/b5019b65e57463cdf9852082cc80/6505308e-9db9-4543-9d36-6c5127ecfe4f?expires=1794967200&signature=2be4f2811d808b0cb5d56cf0f5b262d84a5e202d82ef2bda3aa9ef831a737d1d&req=diIlFcp%2Bm4NcWPMW1HO4zXtAzrSv91TjuAdM2BCj80hE23ZYzx4TCoIsN5c6%0AVpAUDZVJHGqBDBTfkQY%3D%0A>
 
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223306232/336a0fbf100856229a1f900c253a/8441eee6-5ccf-4c3b-a5bd-9ddcc4760341?expires=1794967200&signature=7cf7e77314d0ed0c9aa9805f20d67acfedf0a33082757ae37b4789dbf30b8bc1&req=diIlFcp%2Bm4NcW%2FMW1HO4zfBZ%2FB2LJVYfw5ZoGW%2FetUvPXa5%2FDClFZ0Y9otih%0AVbrCRLaHgkfmHxxbsdI%3D%0A>
 
 
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223306233/f030f07328eac9b8f4aa7d24e938/87790cff-60eb-428b-b600-0d9e76717129?expires=1794967200&signature=a7a35169507d5ac1ccf3b762683beb88e47bf28919732b2a6f6d7f231745a801&req=diIlFcp%2Bm4NcWvMW1HO4zc%2BhY2xSQLFWMfnoZNE3YfNHbZ6DTyvKuVI6W8CF%0AgtuE170%2BF7sYlRDAhow%3D%0A>
 | 
Tip: You can add the security label to issues in bulk using Jira's bulk edit feature. You can also add it to new issues going forward as part of your team's workflow.
- 
Need to change your labels? Edit the connection from Integrations → Jira → Settings, then click the three dots next to the connection and select Edit. See the Jira Integration Guide <https://help.vanta.com/en/articles/14441707-jira-integration-guide> for details.
 
 
 
 

## Step 6: Verify tasks are appearing in Vanta

## 
- 
In Vanta, navigate to Tests and filter the All resource monitoring tab by integration. 
- 
Select Jira as the integration filter. 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223312904/c313ee7f420c626dfc606f48dd47/ecbea6c6-4dd0-4c09-9f09-098bd4ca81a3?expires=1794967200&signature=9d65051c10a4ac8b1b49f16dfc295508c372154433831f75f71edf369db30259&req=diIlFcp%2Fn4hfXfMW1HO4zXvGsY20%2FaLNWoxWjuaXX1SWCL1Uex5ycRGM9832%0AtCwjpaswmTdbmtynfno%3D%0A>
- 
Then click on any security-related test that appears (e.g. a test that tracks whether security issues are resolved within your SLA). 
- 
You’ll land on the results tab by default. 
- 
If Jira issues with your configured label are being pulled in, you’ll see them listed under a header like “{18} issues need remediation.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223315899/f685a2a05160ba549d4f437cf57a/c7f21d16-864e-4f1d-94a5-bb87e8b62390?expires=1794967200&signature=065fed3c2f294ba6e985d79703c647c9890c27d54c06d595fad7b335166c0154&req=diIlFcp%2FmIlWUPMW1HO4zYfY2VAR5geMDFhnYpF88pokBwhWycUzOQbFGgj8%0ACr9JiO%2Fc1uibsbpFwYg%3D%0A>
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223315901/d15276b8a77ecda27d0ba3ee88b1/c3a22ff6-3ce5-426d-b30f-36c170b5dc75?expires=1794967200&signature=414d976c1aff3c31aae57919a021952fff00037763c30e0882ebefe8cffdab01&req=diIlFcp%2FmIhfWPMW1HO4zctMnxsVfB%2BSwgKmXSI%2FaZROJ59ANAaJBB729eWZ%0A7zkA%2F78CtkMqrcKzIog%3D%0A>
 | 
Don't see anything yet? Sync is not instant. Most issues appear within 1-2 hours of connecting, though it can take longer for very large Jira instances. 
 
 
 

## You’re connected
Once your Jira issues are appearing in Vanta, your integration is working. From here, your team can continue working in Jira as normal. Vanta will now sync matching Jira issues automatically. No further action needed. 
 
 

## Troubleshooting

### Accept button is unavailable during setup 
- 
Likely cause: Your Atlassian organization blocks user-installed apps. 
- 
Fix: Return to your Atlassian admin console and confirm User Installed Apps is set to Allowed (in some versions, turn off Block user apps), then retry the connection. 

### Vanta says the connected account can't browse users, groups, or projects 
- 
Likely cause: The Atlassian account you signed in with is missing a permission. -
- 
Fix: Grant the account the Browse users and groups global permission and Browse Projects on at least one project you want Vanta to monitor, then try again. You can also choose a different Jira site or reconnect with a different account. 

### Tasks are not appearing in Vanta after setup 
- 
Likely cause: The label on the Jira issue doesn't exactly match the label you entered in Step 4. Labels are case-sensitive. 
- 
Fix: Confirm the label is in the Labels field on the Jira issue (not a comment or the description) and matches your sync filter exactly. Allow a few hours for the initial sync to complete. 

### My JQL query won't save 
- 
Likely cause: The query contains ORDER BY, or Jira can't parse it. 
- 
Fix: Remove ORDER BY (Vanta sorts results itself) and check the query for syntax errors.
 

## Additional resources 
To create Jira issues directly from Vanta tests or configure advanced settings, see the Jira Integration Guide <https://help.vanta.com/en/articles/14441707-jira-integration-guide>. 
 
For issues not covered here, Contact Vanta Support or refer to the troubleshooting section of the full guide <https://help.vanta.com/en/articles/14441707-jira-integration-guide>.

## Images

- [image 01] ../../images/integrations/jira/jira-integration-guide--05.png
- [image 02] ../../images/integrations/jira/jira-integration-guide--06.png
- [image 03] ../../images/integrations/jira/jira-integration-guide--07.png
- [image 04] ../../images/integrations/jira/jira-integration-guide--13.png
- [image 05] ../../images/integrations/jira/jira-integration-guide--15.png
- [image 06] ../../images/integrations/jira/jira-integration-guide--16.png
- [image 07] ../../images/integrations/jira/jira-integration-guide--17.png
- [image 08] ../../images/ux/tests/jira-quickstart--08.png
- [image 09] ../../images/ux/tests/jira-quickstart--09.png
- [image 10] ../../images/ux/tests/jira-quickstart--10.png
