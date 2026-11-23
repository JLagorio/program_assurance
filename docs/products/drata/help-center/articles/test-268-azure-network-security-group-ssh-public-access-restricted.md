# Test 268: Azure Network Security Group SSH Public Access Restricted

Source: https://help.drata.com/en/articles/9828856-test-268-azure-network-security-group-ssh-public-access-restricted
Collection: Monitoring Test Guidance
Updated: 2025-01-13
Fetched: 2026-11-22
Description: Drata validates that no network security groups in Azure have inbound rules that allow unrestricted access to SSH port (22).

## Article text

The potential security problem with using SSH over the Internet is that attackers can use various brute force techniques to gain access to Azure Virtual Machines. Once the attackers gain access, they can use a virtual machine as a launch point for compromising other machines on the Azure Virtual Network or even attack networked devices outside of Azure.

**Note**: Only available for Azure.

## ASSOCIATED DRATA CONTROL

This test is part of the **Access to Remote Server Administration Ports Restricted** control (DCF-73) that network security controls are in place to restrict public access to remote server administration ports (e.g., SSH, RDP) to authorized IP addresses or address ranges only.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more of your Azure network security groups allow public SSH access, the test will fail.

### STEPS TO REMEDIATE

Where SSH is not explicitly required and narrowly configured for resources attached to the Network Security Group, internet-level access to your Azure resources should be restricted or eliminated.

For internal access to relevant resources, configure an encrypted network tunnel such as: ExpressRoute, Site-to-site VPN, or Point-to-site VPN.

**Note: **SSH access from the internet is not enabled by default.

## Center for Internet Security (CIS)

This is a test that aligns with the Center for Internet Security’s (CIS) benchmarks for Microsoft Azure, providing prescriptive guidance to establish a secure baseline configuration for Azure environments. These benchmarks are developed through a global, consensus-driven process involving cybersecurity experts to help organizations strengthen their defenses against potential threats in the cloud.

## Related articles

- [Test 220: AWS RDS Public Access Restricted](test-220-aws-rds-public-access-restricted.md)
- [Test 291: AWS Security Groups HTTP Access Restricted](test-291-aws-security-groups-http-access-restricted.md)
- [Test 246: Azure Log Alert for Create or Update Network Security Group](test-246-azure-log-alert-for-create-or-update-network-security-group.md)
- [Test 247: Azure Log Alert for Delete Network Security Group](test-247-azure-log-alert-for-delete-network-security-group.md)
- [Test 253: Azure Storage Accounts Accessed Via Private Endpoints](test-253-azure-storage-accounts-accessed-via-private-endpoints.md)
