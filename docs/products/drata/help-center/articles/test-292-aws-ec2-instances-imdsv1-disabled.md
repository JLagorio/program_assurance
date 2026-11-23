# Test 292: AWS EC2 Instances IMDSv1 Disabled

Source: https://help.drata.com/en/articles/9828799-test-292-aws-ec2-instances-imdsv1-disabled
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that active AWS EC2 instances have Instance MetaData Service Version 1 (IMDSv1) disabled.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Baseline Configuration and Hardening Standards **control (DCF-12) that ensures your company has identified and documented baseline security configuration standards for all system components in accordance with industry-accepted hardening standards or vendor recommendations. These standards are reviewed periodically and updated as needed (e.g., when vulnerabilities are identified) and verified to be in place before or immediately after a production system component is installed or modified (e.g., through infrastructure as code, configuration checklists, etc.).

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more active AWS EC2 instances have Instance MetaData Service v1 (IMDSv1) enabled, which is vulnerable to server side request forgery (SSRF) attacks, the test will fail.

## STEPS TO REMEDIATE

### For Standalone EC2 Instances (Not in an ASG)

1. Sign into the AWS Management Console and navigate to the EC2 dashboard.
2. Select an instance to modify that is failing this test.
3. Choose 'Instance Settings' > 'Modify Instance Metadata Options'.
4. In the 'Modify Instance Metadata Options' dialog box, set 'Metadata version' to 'IMDSv2,' set 'Http tokens' to 'required,' and optionally, configure 'Http endpoint' to 'enabled' if it's not already.
5. Save changes and repeat for each failing EC2 instance.

### For EC2 Instances Managed by Auto Scaling Groups (ASG)

1. **Sign In and navigate to ASG Settings**
   - Sign into the **AWS Management Console**.
   - Go to **EC2 → Auto Scaling Groups**.
   - Select the relevant **Auto Scaling Group (ASG)**.
2. **Modify the Launch Template**
   - In the **Launch Template **section, choose **Actions → Modify Launch Template**, or create a new version.
   - In the launch template editor, under **Metadata Options**, set:
      - **Metadata version**: `IMDSv2`
      - **HTTP Tokens**: required
      - **HTTP Endpoint**: enabled (optional)
   - Save the new launch template version.
3. **Update the ASG to Use the New Launch Template Version**
   - ⚠️ This step is **required**. Without it, the ASG will continue launching instances with the previous configuration.
   - In the same ASG, go to the **Launch Template **section and select **Edit**.
   - Select the new version of the launch template.
   - Save your changes.
4. **Start an Instance Refresh**
   - While still in the ASG, go to the **Instance refresh** tab.
   - Select **Start instance refresh**.
   - Under **Desired Configuration**, select the correct launch template version.
   - Confirm and start the refresh.
   - 💡 This will replace existing instances in batches using the updated launch template configuration.
5. **Verify Compliance**
   - Confirm new instances use **IMDSv2 only**.
   - Re-run the Drata test to ensure it passes.

## Related articles

- [Test 118: Infrastructure Instance CPU Monitored](test-118-infrastructure-instance-cpu-monitored.md)
- [Test 233: AWS VPC Default Security Groups Restrict All Traffic](test-233-aws-vpc-default-security-groups-restrict-all-traffic.md)
- [Test 219: AWS RDS Auto Minor Version Upgrade](test-219-aws-rds-auto-minor-version-upgrade.md)
- [Test 220: AWS RDS Public Access Restricted](test-220-aws-rds-public-access-restricted.md)
- [Test 290: AWS Database Writes I/O Monitored](test-290-aws-database-writes-i-o-monitored.md)
