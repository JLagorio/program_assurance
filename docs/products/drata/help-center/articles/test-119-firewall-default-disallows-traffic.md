# Test 119: Firewall Default Disallows Traffic

Source: https://help.drata.com/en/articles/4777002-test-119-firewall-default-disallows-traffic
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company firewall configuration files to determine if they are configured to deny all traffic not explicitly allowed.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Firewalls **control that ensures your company uses configurations that ensure only approved networking ports and protocols are implemented, including firewalls.

**WHAT TO DO IF A TEST FAILS**

If Drata finds that the default ruleset for the perimeter firewall allows all traffic the test will fail.

To remediate a failed test, you will need to configure the default ruleset for the perimeter firewall to deny all traffic then explicitly allow the ports needed.

**STEPS FOR PASSING**

To ensure a validated state when testing firewall traffic prevention, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **Atlas - Projects** | 1. From your project dashboard, choose Network Access<br>2. Click ADD IP ADDRESS<br>3. Enter any IP address that is NOT 0.0.0.0/0 |
| **AWS - Security Groups** | 1. Within AWS, edit the Security Group<br>2. In the actions button - Click on Edit "Edit inbound rules"<br>3. Ensure that "Type" is not set to  "ALL traffic"<br>- Note that this test will pass if the "Source" value is another security group<br>- Note that this test will not pass if the "Source" value is a specific CIDR range |
| **GCP - Security Groups** | 1. Within GCP -> VPC Network -> Firewall<br>2. Create Firewall Rule<br>3. Set a name<br>4. Logs: off<br>5. Set a network<br>6. Priority: 1000<br>7. Direction of traffic: Ingress<br>8. Action on match: Allow<br>9. Targets: Specified target tags<br>10. Target tags: ex 'tag'<br>11. Source Filter: IP ranges<br>12. Source IP ranges: Enter any IP address that is NOT 0.0.0.0/0<br>13. Second source filter: None<br>14. Protocols and ports: Specified protocols and ports, and provide values as needed |

## Related articles

- [Test 71: SSL/TLS Configuration has No Known Issues](test-71-ssl-tls-configuration-has-no-known-issues.md)
- [Test 102: Public SSH Denied](test-102-public-ssh-denied.md)
- [Test 122: Web Application Firewall in Place](test-122-web-application-firewall-in-place.md)
- [Test 130: Load Balancer Used](test-130-load-balancer-used.md)
- [Test 227: AWS Network ACLs Public Remote Server Administration Access Restricted](test-227-aws-network-acls-public-remote-server-administration-access-restricted.md)
