# How to pass the IMDSv1 is disabled on EC2 Instances Test with Autoscaling Group

Source: https://help.vanta.com/en/articles/11345860-how-to-pass-the-imdsv1-is-disabled-on-ec2-instances-test-with-autoscaling-group
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

To comply with security best practices, the IMDSv1 must be disabled on your EC2 instances. If your test flags the autoscaling group, you’ll need to modify the launch template to ensure the Metadata version is set to "V2 only." Follow these steps to update your launch template via the AWS dashboard:
- 
Navigate to AWS Console: Go to Launch Templates.
- 
Modify the Launch Template: Select your current template to edit.
- 
Update Metadata Version:
- 
Under Advanced Details, locate the Metadata version setting.
- 
Select V2 only (token required).
 
By making these changes, your EC2 instances will be configured to use IMDSv2, enhancing the security of your environment.

## Images

- none
