# Azure VM showing "No actionable vulnerabilities" message on Vulnerabilities Page

Source: https://help.vanta.com/en/articles/11345617-azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

If you are an administrator and notice that there are Virtual Machines from Azure whose vulnerabilities do not show on the Vulnerabilities page in Vanta and instead show "No actionable vulnerabilities"

## Troubleshooting
On the vulnerabilities page, search for the name of the server and verify the status shows 'No actionable vulnerabilities":
​
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760346/4c7fb202a2c48194a6bbb1575b31/22366425937044?expires=1794967200&signature=3a5854322c4c8daa1cfd451abbf45d6689019534bbcfe1db999fd0324879a716&req=dSUmEM54nYJbX%2FMW1HO4zR8JEZ40oB9Hr4AkWOGSmi0QnNbj1fWEM5a2XkB6%0A%2FV8hrLVvUweypo%2BvUOQ%3D%0A>
If you believe this is a mistake, please go into Azure to verify if the information Vanta is currently fetching about the server from Defender is accurate. You can do this by following the steps below:
- 
Click the name of the server in question under the identifier column (From Vanta):
​
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760343/96ad97343c0d47b967bf30fba9a8/22366441549972?expires=1794967200&signature=5b4979cac3347eb03c686e0bd0fb9200ef18e769a6fcee74e615c928dc5214c8&req=dSUmEM54nYJbWvMW1HO4zYBqWM7nc4bPQ08OaprBk4CzImfoBsntWLqsxvtZ%0APiyY%0A>
- 
This will take you to resource in Azure; on that new page that opened up, scroll down and click Microsoft Defender for Cloud under the Security header in the left-hand menu:
​
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760352/f0a43985bc13a1c568b0ad1346f2/22366425940756?expires=1794967200&signature=70cb8629a8ec072a01bb33dc27d7d8ee5c02b5d5515044f606d6c6b43da54c54&req=dSUmEM54nYJaW%2FMW1HO4zWESUlufYwqKusG6oww7XqUk99%2BICDh3ZWYxFQmQ%0A3aox%0A>
- 
Select "View additional recommendations in Defender for Cloud >" highlighted below in pink: 
​
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760345/61a05c04a458584d010ed4f11b43/22366441552276?expires=1794967200&signature=c370cb74526151b47cdb72cbc72c310df0a118c99da1edff34f62191de14aa46&req=dSUmEM54nYJbXPMW1HO4zTG40EREPeSnNZ170hfN15jpOHkfVMTMt4ZDa3y%2B%0AZEcC%0A>
Note: Recommendations that are not related to packages/applications are not tracked by Vanta and will not show on the vulnerabilities page. Examples include IP Address blocking, Port Management, etc... :
​
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760358/56d69d217e9930c3261e569f2aae/22366425944724?expires=1794967200&signature=6e69fc207b2ba0b1c86d79974a7c8c641e8b447af3d8a22ced37edc15727bace&req=dSUmEM54nYJaUfMW1HO4zVBtsBEGIyRyAQpBXU2BUSd4VDp8ZeYTOtzArH0F%0A1xbyst96eoScZxiOUSM%3D%0A>

​
- 
You will be at the Secure Score recommendations tab by default, select the All Recommendations tab (the tab next to it):
​
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760359/7ea7255ee7c6d7767c7db5ca6bcf/22366425946260?expires=1794967200&signature=fc350a1b115b6df3774258adef4098c15353fab1a91775d7532645fc3b72b7d0&req=dSUmEM54nYJaUPMW1HO4za6x82I13o0mG5hBa%2BsAEyThdmcU8ufI8KSJ151D%0AaGpG%0A>
- 
Now in the search bar, search for "Machines should have vulnerability findings resolved":
​
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760368/3d82bc93890d6f65a61f0e476a1e/22366441556372?expires=1794967200&signature=fe63343589694839611a457e05b940e19d95640b8119a8158c134f5299762a6e&req=dSUmEM54nYJZUfMW1HO4zU9UAhwSo2pcKNQvdBeSMDm32fDR180%2BNOFMt6eg%0AQQBY%0A>
- 
The status should even say Completed with 0 of X virtual machines unhealthy, where X is the total number of VMs that exist on that subscription: 
​
​
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760381/67c47c61920251f95a1b12706443/22366425949076?expires=1794967200&signature=cc8cf086c52818dacddc01d1bae923549309139ef6b93465625e8059e4ab6c13&req=dSUmEM54nYJXWPMW1HO4zSTfrsdE6qP4mpFDjNUEgLBYdno9%2FbJf7CeIC04r%0AbM8n%0A>
- 
Clicking into it, you should see there are "No unhealthy resources found"
​
​
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760384/d9295e9afdf65362ca51d0ff4bd5/22366441561236?expires=1794967200&signature=75800ad28d380bb90bfebb958d725acd2f3a732204eb874d4002e00f5754bbc7&req=dSUmEM54nYJXXfMW1HO4zT%2Bi0N%2Fkd4pUO2kQi5Upj5W96hLBTuv%2F6EY6ZOo%2B%0AOHfF%0A>
- 
If this is what you see, then there are no findings for the server which is why Vanta shows no scan found.
Note: If you use Microsoft Defender Vulnerability Management (MDVM) and this shows vulnerabilities, this is not supported at the moment, you can write into Support to check on the progress of this feature being added.  
​

## Final Steps
If you instead see a list of vulnerabilities for packages/applications, and it is not from Microsoft Defender Vulnerability Management (MDVM), please forward us a screenshot from the Machines that should have a vulnerability assessment solution page to further investigate this as there may be a syncing issue. We also suggest checking your integrations page to ensure your Azure integration has no errors.

## Images

- [image 01] ../../images/ux/vulnerabilities/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--01.png
- [image 02] ../../images/ux/vulnerabilities/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--02.png
- [image 03] ../../images/integrations/azure/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--03.png
- [image 04] ../../images/integrations/azure/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--04.png
- [image 05] ../../images/integrations/azure/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--05.png
- [image 06] ../../images/integrations/azure/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--06.png
- [image 07] ../../images/integrations/azure/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--07.png
- [image 08] ../../images/integrations/azure/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--08.png
- [image 09] ../../images/integrations/azure/azure-vm-showing-no-actionable-vulnerabilities-message-on-vulnerabilities-page--09.png
