# Test 4: SSL/TLS on Admin Page of Infrastructure Console

Source: https://help.drata.com/en/articles/4776882-test-4-ssl-tls-on-admin-page-of-infrastructure-console
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata inspects an HTTPS request to your company infrastructure admin console to determine the presence and status of an SSL certificate.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Require Encryption of Web-Based Admin Access **control that ensures your company uses encryption to protect user authentication and admin sessions of the internal admin tool transmitted over the Internet.

**WHAT TO DO IF A TEST FAILS**

If Drata finds that your company infrastructure admin console has an issue with its SSL/TLS configuration, it may be that a certificate has either expired or is not from a valid authority; the test will fail. The test may also fail in the case where the URL domain does not match the certificate domain.

To remediate a failed test, you will need to work with your infrastructure provider to ensure that the SSL/TLS configuration of your admin console has a valid certificate for the appropriate domain.

**STEPS FOR PASSING**

Drata performs the following URL checks when testing to validate a successful SSL/TLS connection:

- AWS - [https://aws.amazon.com](https://aws.amazon.com)
- Azure - [https://portal.azure.com](https://portal.azure.com)
- Google Cloud Platform - [https://console.cloud.google.com](https://console.cloud.google.com)

To successfully validate when using Cloudflare, please ensure the following have been connected to Drata by an Admin:

- Identity Provider
- Cloudflare

**HELPFUL RESOURCES**

- [What is SSL/TLS?](https://www.ssl.com/faqs/faq-what-is-ssl/)

## Related articles

- [Test 70: SSL/TLS Enforced on Company Website](test-70-ssl-tls-enforced-on-company-website.md)
- [Test 71: SSL/TLS Configuration has No Known Issues](test-71-ssl-tls-configuration-has-no-known-issues.md)
- [Test 72: SSL/TLS Certificate has Not Expired](test-72-ssl-tls-certificate-has-not-expired.md)
- [Test 88: MFA on Infrastructure Console](test-88-mfa-on-infrastructure-console.md)
- [Resolve SSL/TLS Compliance Testing Issues in Drata](resolve-ssl-tls-compliance-testing-issues-in-drata.md)
