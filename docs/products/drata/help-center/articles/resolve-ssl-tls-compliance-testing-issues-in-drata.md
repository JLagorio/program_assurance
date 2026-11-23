# Resolve SSL/TLS Compliance Testing Issues in Drata

Source: https://help.drata.com/en/articles/12402142-resolve-ssl-tls-compliance-testing-issues-in-drata
Collection: Understand the Drata Platform › Monitoring
Updated: 2025-09-24
Fetched: 2026-11-22

## Article text

Drata’s SSL/TLS compliance tests confirm that your organization’s web servers use secure encryption and follow industry best practices. This guide explains how to configure DNS, server, and network settings so your SSL/TLS tests pass consistently.

## Prerequisites

- **Drata Roles:** To manage or re-run SSL/TLS compliance tests, you’ll need the **Control Manager** or **Admin** role.
- **Workspace awareness:** These tests are **not workspace-aware** (they apply at the organization level).

## Step 1: Verify DNS Configuration

- **Allow time for propagation**
   - After updating DNS (A/AAAA/CNAME or, if applicable, TXT records), allow up to **24 hours** for changes to propagate.
   - If you use a CA that relies on **DNS-01 validation** (such as Let’s Encrypt), validation will complete automatically once records are live.
- **Remove outdated TXT records**
   - Delete unused or legacy TXT records to avoid conflicts.

If DNS is correct, no further action is needed — Drata’s checks will succeed once propagation is complete.

## Step 2: Confirm HTTP → HTTPS Redirection

- Make sure **port 80 (HTTP)** is open and redirects traffic to **port 443 (HTTPS)** with a **permanent redirect** (e.g., 301 or 308).
- This ensures Drata can connect and confirm your HTTPS endpoint.

## Step 3: Review Firewall, CDN, and Security Rules

- **Allow Drata’s scanners**
   - Add Drata’s scanner IP ranges to your **firewall, WAF, CDN, or security proxy allowlist**.
   - Check for blocking rules (bot protection, geo-blocking, rate limits) that may interfere with Drata.

## Step 4: Verify Accessibility

- **Quick check with curl**
   - Run: `curl -I -L http://yourdomain`
   - You should see a final `200 OK` response from `https://yourdomain`.
- This confirms Drata can follow the HTTP → HTTPS redirect and access the secured endpoint.

## Step 5: Maintain Consistency

To avoid intermittent failures:

- Keep your domain pointed to the correct server.
- Renew SSL/TLS certificates before expiration.
- Ensure configured endpoints (production, or staging/CDN if you’ve explicitly added them in Drata) are always reachable.

## Step 6: Check Status in Drata

1. Go to the **Monitoring** page.
2. Open the SSL/TLS test.
3. Review validation details (certificate, port redirection, DNS resolution).

## Related Resources

- [Test 70: SSL/TLS Enforced on Company Website](test-70-ssl-tls-enforced-on-company-website.md)
- [Test 71: SSL/TLS Configuration Has No Known Issues](test-71-ssl-tls-configuration-has-no-known-issues.md)
- [Test 72: SSL/TLS Certificate Has Not Expired](test-72-ssl-tls-certificate-has-not-expired.md)
- [Test 4: SSL/TLS on Admin Page of Infrastructure Console](test-4-ssl-tls-on-admin-page-of-infrastructure-console.md)
- [Dratabot & IP Allowlisting](dratabot.md)

## Related articles

- [Test 70: SSL/TLS Enforced on Company Website](test-70-ssl-tls-enforced-on-company-website.md)
- [Test 71: SSL/TLS Configuration has No Known Issues](test-71-ssl-tls-configuration-has-no-known-issues.md)
- [Test 72: SSL/TLS Certificate has Not Expired](test-72-ssl-tls-certificate-has-not-expired.md)
- [Test 4: SSL/TLS on Admin Page of Infrastructure Console](test-4-ssl-tls-on-admin-page-of-infrastructure-console.md)
- [Test 269: Azure App Service Web App Redirects HTTP Traffic to HTTPS](test-269-azure-app-service-web-app-redirects-http-traffic-to-https.md)
