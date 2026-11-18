# Remediation Options for  Intrusion detection system notifications configured (AWS)

Source: https://help.vanta.com/en/articles/11346087-remediation-options-for-intrusion-detection-system-notifications-configured-aws
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

The  Intrusion detection system notifications configured (AWS) <https://app.vanta.com/monitors#aws-guardduty-notifications-enabled> test requires that a cloudwatch event rule exist to notify administrators of Guard Duty events. This must be set up for every region where a VPC exists by following the instructions linked here <https://help.vanta.com/en/articles/11346007>.
​
​
If it does not make sense for Guard Duty to be enabled for the region flagged on the test page, you can deactivate monitoring for the region  <https://help.vanta.com/en/articles/11346051>on the test page.
Removing the region from scope <https://help.vanta.com/en/articles/11345625> is another way to remediate a flagged part from that page, but only do this if there are no resources in that region that should be in scope. 
​
​

## Additional Resources
- 
How to deactivate a test <https://help.vanta.com/en/articles/11345549>
- 
How to remove an AWS region from Vanta <https://help.vanta.com/en/articles/11345625>

## Images

- none
