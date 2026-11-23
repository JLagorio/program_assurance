# Test 227: AWS Network ACLs Public Remote Server Administration Access Restricted

Source: https://help.drata.com/en/articles/9828735-test-227-aws-network-acls-public-remote-server-administration-access-restricted
Collection: Monitoring Test Guidance
Updated: 2026-07-29
Fetched: 2026-11-22

## Article text

Drata validates that no network access control lists (NACLs) allow unrestricted ingress access (source 0.0.0.0/0) to remote server administration ports, such as port 22 and port 3389, by checking each NACL’s inbound rules.

The Network Access Control List (NACL) function provides stateless filtering of ingress and egress network traffic to AWS resources. It is recommended that you ensure that no NACL allows unrestricted ingress access to remote server administration ports, such as SSH to port 22 and RDP to port 3389, using either the TDP (6), UDP (17) or ALL (-1) protocols.

Public access to remote server administration ports, such as 22 and 3389, increases resource attack surface and unnecessarily raises the risk of resource compromise.

## ASSOCIATED DRATA CONTROL

This test is part of the **Access to Remote Server Administration Ports Restricted** control (DCF-73) that network security controls are in place to restrict public access to remote server administration ports (e.g., SSH, RDP) to authorized IP addresses or address ranges only.

## WHAT TO DO IF A TEST FAILS

If Drata find that one or more network access control lists (NACLs) allows unrestricted ingress access (0.0.0.0/0) to remote server administration ports (22 or 3389), the test will fail.

Public access to remote server administration ports, such as 22 and 3389, increases resource attack surface and unnecessarily raises the risk of resource compromise.

## STEPS TO REMEDIATE

Under the "Network ACLs" from the AWS Management Console:

1. Select the NACL that is failing this test and review its inbound allow and deny rules.
2. Make sure that ports 22 and 3389 are not allowing unrestricted access from undefined sources.
   - When reviewing allow and deny rules, note that AWS evaluates rules in their numerical order.

### Configuring AWS NACLs to Pass Security Tests

To pass this test, your Network ACL (NACL) must not allow public (`0.0.0.0/0` or `::/0`) access to SSH (port 22) or RDP (port 3389) over any protocol.

1. Required deny rules for public traffic
   - If your NACL includes any inbound rule that allows public traffic from `0.0.0.0/0`, first add **four explicit inbound DENY rules** with lower rule numbers (which gives them higher priority):
      - **TCP**, port **22**, source `0.0.0.0/0`, action **DENY**
      - **TCP**, port **3389**, source `0.0.0.0/0`, action **DENY**
      - **UDP**, port **22**, source `0.0.0.0/0`, action **DENY**
      - **UDP**, port **3389**, source `0.0.0.0/0`, action **DENY**
   - *Note: If your environment uses IPv6, you should also create these rules using the source `::/0`.*
2. Allow rules for SSH or RDP
   - If you **do** have inbound **ALLOW** rules on ports 22 or 3389:
      - Do **not** allow them from `0.0.0.0/0` or `::/0`.
      - Restrict the "Source" to **trusted IPs or CIDR ranges only**, such as your company VPN or office IP addresses.
3. If you use “All traffic” (Protocol = -1)
   - If you use a broad inbound **allow-all** rule (e.g., `All traffic, protocol = -1, source 0.0.0.0/0, ALLOW`), you must still configure the **same four DENY rules listed above** with lower rule numbers.
   - Because AWS evaluates rules in order, the NACL will hit your "Deny" rules for ports 22/3389 first and block that traffic before it ever reaches your "Allow All" rule.

---

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 119: Firewall Default Disallows Traffic](test-119-firewall-default-disallows-traffic.md)
- [Test 228: AWS Security Groups Restrict Public RDP Access](test-228-aws-security-groups-restrict-public-rdp-access.md)
- [Test 233: AWS VPC Default Security Groups Restrict All Traffic](test-233-aws-vpc-default-security-groups-restrict-all-traffic.md)
- [Test 220: AWS RDS Public Access Restricted](test-220-aws-rds-public-access-restricted.md)
- [Test 291: AWS Security Groups HTTP Access Restricted](test-291-aws-security-groups-http-access-restricted.md)
