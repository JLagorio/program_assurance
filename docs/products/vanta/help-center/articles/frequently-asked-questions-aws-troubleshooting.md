# Frequently Asked Questions: AWS Troubleshooting

Source: https://help.vanta.com/en/articles/11346058-frequently-asked-questions-aws-troubleshooting
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

No Scan found the issue
- 
Check permissions in AWS
- 
Check for the VantaAdditionalPermissions policy to make sure they have the following permissions"inspector2:BatchGet*",

"inspector2:Get*",

"inspector2:Describe*",

"inspector2:List*"
 
Permission checks out, but vulnerabilities are still not picked up
- 
Verify that Inspector is running against the instance
- 
Go to Inspector then Account Management and select Instances
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768861/bee4a8ab4df3ec2efe2c78e07ad3/13279042952596?expires=1794967200&signature=e930d65bf721fd7e03277d24017e2ac2b8de7ad4e879656b587b6c9143cc5c25&req=dSUmEM54lYlZWPMW1HO4zaINtZJddQOWjwJpE%2FPjdGxzbNEgYDVXCc2jwZgg%0AWw9GYfwqVeMsAgka3Tk%3D%0A>
 
- 
The status should be under Running; if not, you must fix the complaints before Inspector runs. We can pick up the Inspector for the instance once Inspector runs.
 
S3 server access logs enabled failing
- 
Download the test data. Ensure your Cloud Trail's bucketName is one of the S3 buckets in the list. If not, link it to the existing S3 bucket in that account or connect the account where the S3 bucket lives to Vanta

## Images

- [image 01] ../../images/integrations/aws/frequently-asked-questions-aws-troubleshooting--01.png
