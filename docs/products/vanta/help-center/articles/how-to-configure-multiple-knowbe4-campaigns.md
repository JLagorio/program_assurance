# How to configure multiple KnowBe4 campaigns

Source: https://help.vanta.com/en/articles/11345915-how-to-configure-multiple-knowbe4-campaigns
Collection: Team Compliance ; Team Compliance › Vanta Security & Privacy Training
Fetched: 2026-11-17

## Article text

You can connect multiple KnowBe4 training campaigns to Vanta and map each campaign to the security training requirements it should fulfill. 
 
 

## Prerequisites
When Vanta evaluates whether an employee has completed a given training type, it looks at the KnowBe4 campaign(s) you’ve mapped to that training type.
- 
You can map one KnowBe4 campaign to multiple training types (using the training type checkboxes). 
- 
If you map multiple KnowBe4 campaigns to the same training type, the employee must complete all of the campaigns mapped to that training type in order to be marked complete for that requirement in Vanta. (So in general, we recommend mapping only one campaign per training type unless you intentionally want to require multiple trainings.) 
KnowBe4 campaigns pulled into Vanta can include both active and inactive campaigns. 
 
 

## Procedure
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2062959196/f20129d547437c26031d69b8c1c9/image.png?expires=1794967200&signature=317f0e2a6d2d3392df26cf1455b17088cf03728fcb75f71b3be64dea6a31b359&req=diAhFMB7lIBWX%2FMW1HO4zY7Oo7TVSCrX1i%2BED2i0E9ci69V5D7upasuRUd6y%0AUMrIOaWCTNxZswOBEUk%3D%0A>
To add multiple campaigns:
- 
Navigate to Integrations in Vanta.
- 
Find KnowBe4 and click Manage > Edit.
- 
Click + Add another campaign.
- 
Select the KnowBe4 campaign from the dropdown.
- 
Select the trainings the campaign should fulfill (for example: General Security Awareness, HIPAA, PCI DSS, etc.).
- 
Click Save.
Once saved, Vanta will use that campaign (and its completion status in KnowBe4) when determining whether employees meet the mapped training requirement(s).
 
 

## FAQ

### What happens if we delete a campaign?
 
This depends on where you delete it:
- 
If you delete the campaign in KnowBe4: Vanta will no longer be able to sync that campaign going forward. If that campaign was mapped to a training type in Vanta, employees may start showing as incomplete for that training type (because Vanta can’t count a campaign that no longer exists in KnowBe4).
- 
If you remove/unmap the campaign in Vanta: Vanta will stop using that campaign to satisfy the mapped training requirement(s). If it was the only campaign mapped to a given training type, employees may appear incomplete until they complete whatever campaign is now mapped for that training type.
- 
If you want to preserve historical visibility, consider keeping prior-year campaigns available in KnowBe4 as inactive rather than deleting them outright (Vanta can pull inactive campaigns).
 
 

### What if multiple campaigns are selected for the same training?
 
If multiple KnowBe4 campaigns are mapped to the same training type (for example, multiple campaigns mapped to “General Security Awareness”), employees must complete every mapped campaign to be marked complete for that training type in Vanta.
 
If your intent is “any one of these campaigns should count,” the current behavior will feel stricter than expected—best practice is to map only one campaign per training type. 
 
 

### If we have a new annual campaign each year in KnowBe4, how do we set this up?
 
Because Vanta’s security awareness training requirement is annual/recurring by default, it’s common to run a new KnowBe4 campaign each year. 

A recommended approach:
- 
Create your new annual campaign in KnowBe4.
- 
In Vanta, go to Integrations > KnowBe4 > Manage > Edit.
- 
Map the new campaign to the appropriate training type (e.g., General Security Awareness).
- 
Remove/unmap the old campaign from that same training type so employees are not required to complete both campaigns for the same requirement.
Also note: Vanta’s KnowBe4 support is best aligned to annual recurring campaigns; mapping a monthly campaign can cause the requirement to reset every month.

## Images

- [image 01] ../../images/ux/integrations/how-to-configure-multiple-knowbe4-campaigns--01.png
