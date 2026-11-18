# How to fix "ASSUME_ROLE" warning from AWS Organization

Source: https://help.vanta.com/en/articles/11346027-how-to-fix-assume
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When using the AWS Organization integration workflow, you might be seeing a warning in the Inventory page, AWS Organization, for certain accounts labeled "ASSUME_ROLE." This indicates that your AWS child account is missing the proper vanta-auditor role required.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767206/30a55c885fd38a8f4a0516fe20ea/12132935605908?expires=1794967200&signature=4cee86941326a1271bf4f2a2edb67f9b8277e6f913d6cb406870ab206189152c&req=dSUmEM54moNfX%2FMW1HO4zaH8LXPoIyDEq28eoSDxe1%2FnIoW7zV%2FsnN3AvVM%2F%0APoG2uDzufNdJ01S9kOU%3D%0A>
 

## Procedure
- 
Navigate to IAM for the connected AWS management account
- 
Locate the role and policy that were created for the vanta integration (role is typically named "vanta-auditor" and policy typically "vantaAdditionalPermissions")
- 
The same role needs to be created in the subaccounts with VantaAdditionalPermissions policy as well as the SecurityAudit policy attached
- 
Ensure that the trust relationship is set up the same way as well. These IDs will be the same for all of your connected accounts:
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1942031839/4066e589cd29385a652363bddcf2/15388612782100?expires=1794967200&signature=fb56915ab1fea67771915e369791f14e58a85d4679a2970d95856f97e60e9677&req=dSkjFMl9nIlcUPMW1HO4zR4RVzDenU%2BcSPvpdM1ovijlOYsjA0f%2BL33ReiVc%0AyIzLGuJZT9DkbEgs16A%3D%0A>

## Images

- [image 01] ../../images/ux/inventory/how-to-fix-assume--01.png
- [image 02] ../../images/integrations/aws/how-to-fix-assume--02.png
