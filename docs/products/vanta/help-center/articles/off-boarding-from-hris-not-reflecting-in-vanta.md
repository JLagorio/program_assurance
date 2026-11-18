# Off-boarding from HRIS not Reflecting in Vanta

Source: https://help.vanta.com/en/articles/11346034-off-boarding-from-hris-not-reflecting-in-vanta
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Sometimes, an administrator off-boards <https://help.vanta.com/en/articles/11345609> a user in their identity provider, and the changes do not reflect in Vanta, even after waiting a couple of hours. This is often caused by an active HR account linked to the user profile, causing them to retain their active employee status. Administrators can remediate this by either terminating the user in their HR system to trigger the offboarding or un-linking the HR Profile from the user's Vanta account.
 

## Solution A: Terminate the user within your HRIS
- 
Head into your connected HR Information System
- 
Terminate or Mark the user as inactive; wording and specific instructions vary depending on your connected HR System; it is best to check their documentation on how to do this.
- 
Once completed, changes should reflect in Vanta within an hour, and the user should enter an off-boarding state.
 

## Solution B: Unlink the HR Account from their Vanta Profile
- 
On the People page <https://app.vanta.com/people>, click on the button with three dots (right side), then select Manager HR Data
- 
Click on the Linked tab on the Merge HR data pop-up box. Scroll down until you find the desired user. Under the Link to Person column, you should see the name and email of the person the account is currently tied to

If you don't see this information, the user never had an HR account linked to their profile, and something else is causing the offboarding issues. Please reach out to [email protected] with a screenshot of this page and the user status in your identity provider. 
- 
If there is a name and email in that field, that is what is expected; you can now click the drop-down menu under LINK TO PERSON 
- 
And then click the first option, X Clear, to unlink that HR Profile from the User
- 
Scroll down and click the purple Save button to have the changes take effect
- 
The profile should now move to an offboarding state after an hour. Be sure to mark the HR User as out of scope if you choose to leave the account active.

## Images

- none
