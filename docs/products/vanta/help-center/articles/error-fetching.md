# Error: "Fetching_Disabled" on AWS organizations inventory page

Source: https://help.vanta.com/en/articles/11346054-error-fetching
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Issue
The status of AWS accounts is shown as Fetching_Disabled on the inventory page <https://app.vanta.com/inventory#compute>
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768609/dbbef5d9ade450aa8dbd17c10d0b/15606600940308?expires=1794967200&signature=f4c80b784a9394ede46fd185d5b90a5f3bfec0c84017e113006a4b5931492737&req=dSUmEM54lYdfUPMW1HO4zWi8Y7xl8c%2Bh4YatUFkUKgCgdhkNIZ5tkk1g1jKV%0AWNO4AjRzVlBppeeuGgM%3D%0A>
 
You may also see the following error on the integrations page
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768607/9aaf854eff1196d91003bdd52e1f/15573109657236?expires=1794967200&signature=0258b16f3dc23bcd4eca85d81c2add353ac4015b957572879540853265deeaaa&req=dSUmEM54lYdfXvMW1HO4zSCNMC41CHwLhT4w%2Fc6hD2eZZCczn6nuYuc9J4fa%0AGCHcJCbg9OHRNjd8dsg%3D%0A>
 
 

## Cause
This is commonly caused by permissions in a service control policy <https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html> blocking Vanta's access to specific regions.
Example:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768610/f8a775171928648eb13e30034b2f/15699668229396?expires=1794967200&signature=c847602d22565a934e710c0b4fd80424ce761956c740b50e7e6fec9cd50d8156&req=dSUmEM54lYdeWfMW1HO4zcbS4YO69%2FCuGlw2Dp7wGkJ1zx2Gd0MmbiwPqnac%0AS8OIs36rk2ctqg59Sl8%3D%0A>
 
 

## Resolution
- 
On the Integrations page, update Vanta <https://app.vanta.com/integrations?integration-dialog=aws&flow=edit-organization&step=management-account/region-selection-management-account> only to scan regions in AWS that are not blocked by the service control policy
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768608/0858d518d3c71c4e273f62bfb48b/15571582614932?expires=1794967200&signature=b3eaa0d00e1e84358f5f74068059f2a1aef2ba4f4918c0bee18e3232d4105511&req=dSUmEM54lYdfUfMW1HO4zYB3bisp9KDVcuuo5ayo5s7OsL3Z%2BDAe2gRYHt4R%0AnX1NoguF8%2FWg3eJXRZQ%3D%0A>

## Images

- [image 01] ../../images/ux/inventory/error-fetching--01.png
- [image 02] ../../images/ux/integrations/error-fetching--02.png
- [image 03] ../../images/documentation/error-fetching--03.png
- [image 04] ../../images/ux/integrations/error-fetching--04.png
