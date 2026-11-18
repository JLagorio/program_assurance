# Gitlab users from the project level are not being shown on the access page

Source: https://help.vanta.com/en/articles/11345881-gitlab-users-from-the-project-level-are-not-being-shown-on-the-access-page
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

An administrator may notice after connecting Gitlab, and checking the Access Page, they notice that the users added at the group level are listed, but those added at the project level are not listed. This is not a bug and is expected behavior.
 
At the moment Vanta only calls groups/[group]/members to pull users for the access page. We do not look anywhere else unfortunately. You would need to either move the users to the group level, or you would need to manually provide evidence for these project level users. You can reach out to your auditor to confirm exactly what they would want to see as manual evidence.
 
You can also reach out to us to file a feature request on your behalf so you are notified if a change is ever made.
Please Note: We make fetches every 6 hours.

## Images

- none
