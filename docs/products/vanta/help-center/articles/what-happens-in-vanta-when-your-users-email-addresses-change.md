# What Happens in Vanta When Your Users' Email Addresses Change?

Source: https://help.vanta.com/en/articles/11346097-what-happens-in-vanta-when-your-users-email-addresses-change
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

## Overview
When your company changes its domain name, your users' email addresses typically change as well. What happens in Vanta depends on how those email addresses change in your identity provider (IdP). 
 

## Scenario 1: In-place email change (same IdP tenant)
If your users' email addresses are updated within your existing IdP tenant, Vanta syncs those changes automatically on the next data refresh. Vanta identifies users by their internal IdP identifier (not their email address), so no duplicate user records are created and no action is needed.
 
Example: You update all users from @oldcompany.com to @newcompany.com within your existing Google Workspace or Okta tenant. Vanta will reflect the updated email addresses after the next sync.
 

## Scenario 2: Adding a new IdP tenant for the new domain
If your company provisions a new IdP tenant for the new domain (rather than updating addresses in the existing tenant), Vanta may create duplicate user records: one tied to the old email address and one tied to the new one.
 
However, if your users' new email addresses happen to match their existing email addresses in Vanta (for example, if you kept the same addresses and only changed the IdP tenant), Vanta may automatically link the new IdP users to the existing records, avoiding duplicates.
 
If duplicates do appear, you'll need to contact [email protected] to have them merged. When submitting your request, provide both email addresses and specify which one should be kept as the primary.
ℹ️ Note on group assignments after a merge:
- 
IdP-synced groups (groups that come from your identity provider) will be automatically recalculated after the merge and should be preserved.
- 
Manually assigned groups (groups you assigned directly in Vanta) on the duplicate record may be lost during the merge. You may need to reassign them once the merge is complete.
For more detail on how merges work and what's preserved, see Having Multiple "users" in Vanta for the Same Person <https://help.vanta.com/en/articles/11345591-having-multiple-users-in-vanta-for-the-same-person>.
 

## How long do changes take to reflect?
Changes will not appear immediately. They will sync on Vanta's next scheduled data refresh from your IdP. If your changes aren't reflected within 12–24 hours of updating them in your IdP, contact [email protected] with a screenshot showing the updated email address.

## Images

- none
