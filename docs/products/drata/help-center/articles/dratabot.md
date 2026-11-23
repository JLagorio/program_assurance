# Dratabot

Source: https://help.drata.com/en/articles/5411182-dratabot
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-09-15
Fetched: 2026-11-22
Description: How to verify the Dratabot

## Article text

## Overview

Dratabot is the automated system that substantiates security compliance within an organization. It is important to note that the Dratabot does not try to connect to systems that it does not have permission to access, so there is no need to allow or deny access in robots.txt. There may be some systems that it might be helpful or required to explicitly add Dratabot to an allow list. For these cases, the User-Agent string can be used as well as the reverse DNS validation method described below.

## How Dratabot accesses your site

Most of the assertions performed by Dratabot are made by calling 3rd-party APIs. There are some assertions, however, that make requests to an organizations web site. For example, the Dratabot will connect to [https://app.drata.com](https://app.drata.com/) to verify that the SSL certificate is valid and using strong ciphers.

## Verifying Dratabot

The following is the list of IP addresses that Dratabot is using:

North America:

- 54.190.125.76
- 35.83.232.49
- 35.164.233.77
- 44.230.111.50
- 3.132.55.182
- 3.16.197.217
- 3.18.141.25
- 35.83.80.119
- 18.119.62.253

Europe:

- 18.196.253.2
- 3.73.237.1
- 3.64.113.104
- 46.51.157.29
- 52.50.71.20
- 52.211.226.244
- 18.193.229.148
- 52.210.236.236

APAC:

- 13.239.191.9
- 3.105.164.211
- 54.66.177.145
- 16.51.144.163
- 16.51.96.18
- 16.26.10.156
- 13.210.104.129
- 16.50.132.11

It is recommended to verify authenticity of Dratabot requests by performing a reverse DNS lookup by using the `host` command and confirm that the domain name is `dratabot.com`. This will ensure that the connecting IP claiming to be Dratabot is official.

## User-Agent string

```
Dratabot (+https://dratabot.com)
```

## Reverse DNS Validation

A request (in your access logs) from Dratabot can be verified by performing a reverse DNS lookup using the `host` command. The domain name from the `host` output should be `dratabot.com`. Then do a forward DNS lookup on the domain name from the previous command and confirm that the IP addresses match.

**Example:**

```
~ host 54.190.125.76
76.125.190.54.in-addr.arpa domain name pointer autopilot-54-190-125-76.dratabot.com.
~ host autopilot-54-190-125-76.dratabot.com
autopilot-54-190-125-76.dratabot.com has address 54.190.125.76
```

---

Powered by [drata.com](https://drata.com)

## Related articles

- [Test 71: SSL/TLS Configuration has No Known Issues](test-71-ssl-tls-configuration-has-no-known-issues.md)
- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [Example Evidence for Not Monitored Controls (CIS 8.1)](example-evidence-for-not-monitored-controls-cis-8-1.md)
- [Connecting Private Git via AWS PrivateLink](connecting-private-git-via-aws-privatelink.md)
