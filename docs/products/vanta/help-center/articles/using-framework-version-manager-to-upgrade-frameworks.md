# Using Framework Version Manager to Upgrade Frameworks

Source: https://help.vanta.com/en/articles/12097721-using-framework-version-manager-to-upgrade-frameworks
Collection: Security Frameworks ; Security Frameworks › Frameworks
Fetched: 2026-11-17

## Article text

Keeping compliance frameworks up to date can often feel complicated and time-consuming. Framework Version Manager (FVM) in Vanta takes the hassle out of upgrades by guiding you through the process and preserving the work you’ve already done. Whether you’re part of a lean security team or managing a large compliance program, FVM ensures your efforts aren’t lost while giving you a clear view of what has changed.
 
With FVM, all evidence, controls, and customizations are carried over automatically. You can preview old and new framework versions side-by-side, choose the right time to upgrade, and stay aware of deprecation timelines—all with full transparency. And since FVM is included on every Vanta plan, you can keep your frameworks current without worrying about extra costs or add-ons.
 

## How It Works
- 
Navigate to your framework page in Vanta and select View New Version when an upgrade is available
- 
Review the differences between the current and new framework versions in a side-by-side comparison
- 
Start the guided upgrade workflow to migrate your applicable work from the old version to the new one
- 
FVM automatically transfers evidence, controls, custom fields, comments, and mapping to the new version (based on your selections)
- 
Resolve any conflicts that arise from many-to-one mapping or deprecated sections
 

## Fields You Can Migrate
- 
Owners
- 
Notes
- 
Comments
- 
Control history
- 
Custom fields
- 
Custom mappings
- 
Risk scenario mappings
 

## Migrating After You’ve Started Using the New Version
If you’ve already started using the new framework version, your existing work is preserved. Some migrated fields may override the values in the new version:
- 
Owner: New controls are assigned to the old owners.
Please note: If multiple old controls map to one new control with different owners, this creates a conflict you’ll need to resolve manually.
- 
Custom fields: Same rules as Owners
- 
Notes, Comments, Control history: Migrated from old controls. For many-to-one mappings, notes and comments are merged. If new controls already have notes, they are overwritten.
Please note: If you want to preserve comments or notes from the new version, copy them before migrating, since they may be overwritten.
- 
Custom evidence, test, and risk scenario mappings: Transferred from the old version unless you already created new mappings in the upgraded framework.
Please note: If you previously removed mappings from the old framework, those mappings will reappear in the new version. You will need to remove them again.
- 
Custom controls:
- 
If mapped to a new section, they migrate automatically
- 
If their section is deprecated, they appear in the conflict resolution workflow where you can choose to remap or discard
All other work, like uploaded evidence and tests, remains untouched.
 

## FAQs
What happens if multiple owners exist for merged controls?
Conflicts must be resolved manually in the upgrade workflow.
 
Can I revert to the old version?
The old version remains accessible until its deprecation timeline is complete.

## Images

- none
