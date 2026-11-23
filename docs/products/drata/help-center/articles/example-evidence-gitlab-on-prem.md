# Example Evidence Gitlab On-Prem

Source: https://help.drata.com/en/articles/8709228-example-evidence-gitlab-on-prem
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

Below is a list of the tests that we normally conduct for Gitlab and the examples of evidence that will need to be uploaded for an audit:

**[MFA on Version Control](test-87-mfa-on-version-control-system.md)** - Associated control DCF-67 MFA on Accounts

Evidence here would be a screenshot showing all human users in your on-prem Gitlab have MFA enabled, or a screenshot of any settings that enforce MFA for all users, such as SSO required, etc.

**[Employees Have Unique Version Control Accounts](test-97-employees-have-unique-version-control-accounts.md)** - Associated control DCF-71 Unique Accounts Used and Only Authorized Employees Access Version Control - Associated control DCF-4 Version Control System

Evidence here could be a listing of all users with access to your on-prem Gitlab where each user is mapped to an employee or contractor. Putting together this list can also serve as the 'Authorization' piece, since the compliance person creating this document is essentially performing a review in order to put this together.

**[Version Control Accounts Removed Properly](test-94-version-control-accounts-removed-properly.md)** - Associated control DCF-70 Terminated Personnel Access Revoked Timely

Evidence would be screenshots showing that access to your on-prem Gitlab was revoked from terminated employees or contractors within the SLA defined in the System Access Control Policy.

**[Version Control System is Used](test-5-a-version-control-system-is-being-used.md)** - Associated control DCF-4 Version Control System

A screenshot should be provided showing that Gitlab is being used for version control. A dedicated screenshot would not be needed, as the other screenshots discussed here can fulfill this purpose.

**[Production Code Changes Are Restricted - Associated control DCF-6 Production Changes Restricted. Evidence could be a list of screenshots of users that have 'Merge' access within Gitlab. 
Note: this control only applies if code being Merged to the default branch in Gitlab triggers their automation to deploy the changes to Production.](test-9-production-code-changes-restricted.md)**

**[Formal Code Review Process](test-8-formal-code-review-process.md)** - Associated control DCF-5 Change Review Process

Evidence would be a list of all changes within the observation period along with evidence to show that each change was peer reviewed or a screenshot of the settings on the relevant repositories that shows code review is enforced.

**[Only Authorized Employees Change Code - Associated control DCF-4 Version Control System. Evidence would be a list of users that have 'Write' access within Gitlab and that those users are authorized/approved.](test-7-only-authorized-employees-change-code.md)**

## Related articles

- [GitLab Integration Guide](gitlab-integration-guide.md)
- [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)
- [Example Evidence for Not Monitored Controls (HIPAA)](example-evidence-for-not-monitored-controls-hipaa.md)
- [Example Evidence for Not Monitored Controls (NIST 800-171 Rev 3)](example-evidence-for-not-monitored-controls-nist-800-171-rev-3.md)
- [Example Evidence for Not Monitored Controls (Essential Eight)](example-evidence-for-not-monitored-controls-essential-eight.md)
