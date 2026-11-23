# Test 102: Public SSH Denied

Source: https://help.drata.com/en/articles/4776976-test-102-public-ssh-denied
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects all virtual assets to determine if security groups allow SSH access to public (0.0.0.0/0)

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Denial of Public SSH **control that ensures no public SSH is allowed to virtualized assets.

**WHAT TO DO IF A TEST FAILS**

If Drata finds one or more security groups that allow public SSH access the test will fail. With a failed test you will receive a list of groups that allow public SSH access.

To remediate a failed test, you will need to adjust the security group configuration to disallow public SSH on the reported groups.

**STEPS FOR PASSING**

To ensure a validated state when testing for denial of public SSH, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **AWS - Security Groups** | 1. Within AWS, navigate to Security Groups<br>2. Edit a Security Group<br>3. Click on "Edit inbound rules"<br>4. Verify that when the Type is 'SSH,' Source is NOT set to: ALL "0.0.0.0/0" or "::/0"<br>5. Save if making any changes<br>- Note that this test will only fail if violating security group rules are set up in a region with active network interfaces<br>- Note that this test will pass if the "Source" value is another security group<br>- Note that this test will not pass if the "Source" value is a specific CIDR range |
| **GCP - VPC Network** | Within GCP, you will need to verify that either no firewalls are set up or that there are not any configured firewall rules that allow public SSH access. |

**HELPFUL RESOURCES**

- [Building Policies Within Drata](https://help.drata.com/en/articles/4826936-policy-builder)

## Related articles

- [Test 68: Customer Data is Encrypted at Rest](test-68-customer-data-is-encrypted-at-rest.md)
- [Test 119: Firewall Default Disallows Traffic](test-119-firewall-default-disallows-traffic.md)
- [Test 122: Web Application Firewall in Place](test-122-web-application-firewall-in-place.md)
- [Test 104: Cloud Storage Public Access Disabled](test-104-cloud-storage-public-access-disabled.md)
- [Test 268: Azure Network Security Group SSH Public Access Restricted](test-268-azure-network-security-group-ssh-public-access-restricted.md)
