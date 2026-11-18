# Why isn't someone passing for KnowBe4 security awareness training?

Source: https://help.vanta.com/en/articles/11345916-why-isn-t-someone-passing-for-knowbe4-security-awareness-training
Collection: Team Compliance ; Team Compliance › Vanta Security & Privacy Training
Fetched: 2026-11-17

## Article text

Users are utilizing KnowBe4 for Security Awareness Training (SAT), which integrates with Vanta to track the completion of the training and compliance. Employees who are confirmed to have completed the SAT in KnowBe4 are flagged in Vanta as not having completed the SAT.
 

## Causes
- 
Users do not have the correct KnowBe4 campaign configured in their Integration profile
- 
Employee's emails do not match between KnowBe4 and Vanta, this will make it so the training cannot be linked to the proper profile in Vanta.
- 
Training not fully completed - Users must complete 100% of all modules in the KnowBe4 campaign for the training to sync to Vanta as complete. Partial progress (e.g., completing 3 of 4 modules) will not be marked as complete in Vanta.
 

## Resolution
Users do not have the correct KnowBe4 Campaign configured
- 
Review Integrations by checking Integrations <https://app.vanta.com/integrations?state=connected> > KnowBe4 > Manage > Edit <https://app.vanta.com/integrations?integration-dialog=knowbe4&flow=edit> > Add campaign
​
​
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1965489623/480bf1868e4022ff77e5288900b2/17493708613140?expires=1794967200&signature=746accd9f3315ebfd498f466edb78c650ea37bb465801f76cc122ee139ef78cd&req=dSkhE812lIddWvMW1HO4zas%2FRc2ckvr8ob0vLGD9%2FpVL1WXg%2BBC5Oq%2F0ZdS1%0AWF6l%0A>
 
- 
After the campaign is configured, the users should reflect as passing their security awareness training in Vanta.
Mismatched emails - to update an email in KnowBe4 so it matches its counterpart in Vanta:
- 
Log into KnowBe4, navigate to the Users tab
​
​
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1965496716/bf09a03a3042eea0c931f23d09f4/Screenshot+2026-01-20+at+10_00_54%E2%80%AFAM.png?expires=1794967200&signature=ee484cb70b9339311c58c63295c95800297f10b7eb60e2aa50cbac273cdb98fe&req=dSkhE813m4ZeX%2FMW1HO4zWbrGPQyRw%2Bc2WRovRd7QAyir8Kf4IokHi2xJ6Gt%0AfYUC%0A>

​
- 
Select the dropdown arrow next to that user, click edit
​
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1965498158/fc67eb21fb6d954ad29f1ea7803a/Screenshot+2026-01-20+at+9_56_44%E2%80%AFAM.png?expires=1794967200&signature=98fd89a56325cab874bee0088893bfbee78178790b449fefc708a405df10100c&req=dSkhE813lYBaUfMW1HO4zSa6n9r7fU7uCNHvxr%2FFoUErBZRqrxmVZBu%2BUyT%2B%0AHTVN%0A>

​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1965501085/7480a4ea90da48c12fcbd94df605/Screenshot+2026-01-20+at+9_58_24%E2%80%AFAM.png?expires=1794967200&signature=886d1c45019e61c39dd32ad91b7086097be94deef56757d841c38d32d321e906&req=dSkhE8x%2BnIFXXPMW1HO4zQIhemtvDbWe6IBbiAcg5SRX6qZ%2FnhxKmhBRh0Xz%0AfxnF%0A>
 
- 
Once updated, click update user at the bottom of the page
- 
Once updated, the completed training should appear for that user in Vanta shortly after.
Training not fully completed 
- 
Check the employee's actual module-level progress in KnowBe4 (not just their enrollment status in the campaign)
- 
All modules within the assigned campaign must show 100% completion for Vanta to sync the training as complete
- 
Once the employee completes the remaining modules in KnowBe4, Vanta will sync the completion status and the user will pass the training requirement

## Images

- [image 01] ../../images/ux/integrations/why-isn-t-someone-passing-for-knowbe4-security-awareness-training--01.png
- [image 02] ../../images/integrations/knowbe4/why-isn-t-someone-passing-for-knowbe4-security-awareness-training--02.png
- [image 03] ../../images/integrations/knowbe4/why-isn-t-someone-passing-for-knowbe4-security-awareness-training--03.png
- [image 04] ../../images/integrations/knowbe4/why-isn-t-someone-passing-for-knowbe4-security-awareness-training--04.png
