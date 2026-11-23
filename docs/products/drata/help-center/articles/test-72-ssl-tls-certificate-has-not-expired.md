# Test 72: SSL/TLS Certificate has Not Expired

Source: https://help.drata.com/en/articles/4776839-test-72-ssl-tls-certificate-has-not-expired
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata makes a request to your company website to inspect its SSL/TLS configurations and determine if the SSL certificate is expired.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **SSL/TLS Enforced **control that ensures all connections to your company web application from users are encrypted and using SSL/TLS. Drata will confirm that your SSL certificate is valid and has not expired.

**WHAT DOMAINS/URLS ARE CHECKED**

Company domain and product URL specified in Drata. The Drata company domain may not include the `http` or `https` protocol, or the `www` subdomain. This means Drata is testing the SSL certificate on that domain specifically.

**WHAT IT DOES**

Looks at the expiration date on the SSL certificate for the domains/urls above.

**WHY ARE WE TESTING THIS?**

Certificates need to be renewed periodically. This helps ensure that the certificate was obtained by an authorized owner of the website.

**WHAT TO CHECK IF IT FAILS**

Click the lock in the browser and click on the Certificate details to inspect the **Expires** field.

**STEPS TO REMEDIATE**

1. Renew the certificate with your SSL/TLS provider and install the new certificate on your web server or load balancer.
2. Navigate to the Settings > Company page in Drata
3. Enter the URL for your Company Website in the Product URL field

**HELPFUL RESOURCES**

- [Why is HTTP not secure?](https://www.cloudflare.com/learning/ssl/why-is-http-not-secure/)
- [What is SSL/TLS?](https://www.ssl.com/faqs/faq-what-is-ssl/)
- [Switching from HTTP to HTTPS](https://www.smashingmagazine.com/2017/06/guide-switching-http-https/)

## Related articles

- [Test 70: SSL/TLS Enforced on Company Website](test-70-ssl-tls-enforced-on-company-website.md)
- [Test 71: SSL/TLS Configuration has No Known Issues](test-71-ssl-tls-configuration-has-no-known-issues.md)
- [Test 106: Has a Backup Policy](test-106-has-a-backup-policy.md)
- [Test 4: SSL/TLS on Admin Page of Infrastructure Console](test-4-ssl-tls-on-admin-page-of-infrastructure-console.md)
- [Resolve SSL/TLS Compliance Testing Issues in Drata](resolve-ssl-tls-compliance-testing-issues-in-drata.md)
