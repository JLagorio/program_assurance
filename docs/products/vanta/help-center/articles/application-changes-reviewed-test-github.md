# Application Changes Reviewed Test (GitHub)

Source: https://help.vanta.com/en/articles/11345528-application-changes-reviewed-test-github
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This test <https://app.vanta.com/tests/code-review-application-config> ensures that pull requests are reviewed prior to getting merged into the branch used for your application. This article explains how to set this up properly for GitHub.
To set this up properly for Vanta to recognize, follow these steps:
- 
Navigate to the Settings tab of the repository you would like to implement this for
- 
Select the Branches option under the Code and automation section
- 
Select Edit for the branch for which you would like to make this change. To see which branch Vanta is looking at for this test, see the "Troubleshooting" section of this article below
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769076/c0efb1c204444576ea06394e32d7/22862037934996?expires=1794967200&signature=90658c9aef32ead689576030d74ddc6f63e06d93a6bf745f56928f1485e69d50&req=dSUmEM54lIFYX%2FMW1HO4zUGplQn9MKABH%2BmjWwpQxDxqzdqDtnNCFCG9jH8c%0APFUH4kw3598w3zmeuOY%3D%0A>
- 
Ensure that Require a pull request before merging is checked
- 
Check Require approvals
- 
Ensure the Required number of approvals before merging is set to 1 or greater
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769077/d415dae903580f7a81b656529b07/22862242002068?expires=1794967200&signature=fdaef7ebb5cbb0cc6debe2179a276dca6f7c0dfc94554b7ebc14c5fd23bd1266&req=dSUmEM54lIFYXvMW1HO4zcb5O76Qzr7p8vp%2FCHRiDWJh4QZfh2fP5QFm8GZu%0AqWyh%0A>

## Troubleshooting
- 
To determine which branch Vanta is looking at for this test, you will want to check if you've set the "vanta_production_branch_name" custom property at the organization level. This was optional when setting up the integration initially:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769072/32f95a8aed1aca9d81e13bb046a2/22862037941012?expires=1794967200&signature=9ed158f11f7139cb272604fc1ff8006358f6247fc71f7a8da7f94d97f6a0b829&req=dSUmEM54lIFYW%2FMW1HO4zdsRxYmsVcoSt%2B%2BM%2BhyfdWPSIm%2BqopZleQTHBP2E%0AF1oEykLRdUKBrBJxcd0%3D%0A>
To check this in GitHub, follow these steps
- 
Navigate to the settings page for your organization
- 
Select the Custom properties option under the Repository category:
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769075/98997703fdde5c31dfbd91e9c608/22862037947796?expires=1794967200&signature=7dc3d9ff6eec12cbd02ed18829fd436dc19810123b76ae014731d1d02813a34e&req=dSUmEM54lIFYXPMW1HO4zbmdCguo6h4X%2Bs6zWe%2FaX2IvMM6gWrfq%2FtK4xz1Z%0Alguh%0A>
- 
If a custom property is set, Vanta will look exclusively at that branch for the required approvals. While a default value is set at the creation of this property, you can update the property per repository by selecting Set values. If you only rely on the default branch or would rather have Vanta look at the default branch for these repositories, you can delete the Custom property entirely, and Vanta will look at the Default branch.
- 
You can also see which branches Vanta is looking at by exporting test data for the test. To do this, navigate to the Evidence tab <https://app.vanta.com/tests/code-review-application-config?tab=source-data> (formerly called Source Data), scroll down to the Full test results section, and click the export button on the right:
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769090/5633c408acdc97a4584ccb04cc15/35078840032148?expires=1794967200&signature=381075764a21362a44bdba773314aa2e67189783455a3bd774378186ea781166&req=dSUmEM54lIFWWfMW1HO4zfwbDYvOWQMN%2BFhCSpi7NyK%2FKqbG12A2PdyXrEKJ%0ABf7F%0A>

The branch names appear in the defaultBranch and productionBranch columns:
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769091/93463cee864958bd7e644f2232a4/22862043890836?expires=1794967200&signature=a1bd47920551a0baeef0e37fc72393fc4067a5f7e95a22e45fa38dc17ba95137&req=dSUmEM54lIFWWPMW1HO4zVGDHXdDLZFQBHMEXgF0%2FTsmU7nPcTPopy%2B6iVb2%0AQvT1%0A>
- 
If a productionBranch is listed for the repository, Vanta is only looking at this branch for the test. Removing the custom property in GitHub will allow the test to only look at the defaultBranch value.

## Images

- [image 01] ../../images/integrations/github/application-changes-reviewed-test-github--01.png
- [image 02] ../../images/integrations/github/application-changes-reviewed-test-github--02.png
- [image 03] ../../images/ux/integrations/application-changes-reviewed-test-github--03.png
- [image 04] ../../images/integrations/github/application-changes-reviewed-test-github--04.png
- [image 05] ../../images/ux/tests/application-changes-reviewed-test-github--05.png
- [image 06] ../../images/documentation/application-changes-reviewed-test-github--06.png
