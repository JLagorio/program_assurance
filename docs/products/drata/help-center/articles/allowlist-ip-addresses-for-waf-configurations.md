# Allowlist IP Addresses for WAF Configurations

Source: https://help.drata.com/en/articles/14049634-allowlist-ip-addresses-for-waf-configurations
Collection: Understand the Drata Platform › Connections
Updated: 2026-03-12
Fetched: 2026-11-22

## Article text

If your organization uses a **Web Application Firewall (WAF)** or firewall, you may need to allowlist specific IP addresses to enable certain integrations (such as **1Password **or other access review connections).

Allowlisting these IPs ensures traffic can pass between **Drata and the connected application**.

## IP addresses to allowlist

Add the following IP addresses to your WAF or firewall allowlist.

### EU

```
34.249.109.57
46.51.152.189
52.51.165.231
18.169.58.64
18.135.210.22
13.40.58.44
```

### US

```
35.175.11.132
52.5.1.25
54.221.239.152
```

### Note

These IP addresses may change occasionally. If your organization uses strict network rules, review this article periodically to ensure your configuration remains up to date.

## Related articles

- [Ashby Integration Guide](ashby-integration-guide.md)
- [Leapsome Integration Guide](leapsome-integration-guide.md)
- [Qlik Integration Guide](qlik-integration-guide.md)
- [OpenAI Integration Guide](openai-integration-guide.md)
- [Dropbox Sign Integration Guide](dropbox-sign-integration-guide.md)
