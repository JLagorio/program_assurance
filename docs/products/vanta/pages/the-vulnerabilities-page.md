# The Vulnerabilities page

Source: https://help.vanta.com/en/articles/11345382-the-vulnerabilities-page
Fetched: 2026-11-17

## Purpose

- High-level overview of the vulnerabilities detected, remediated or ignored on servers and containers, pulled from connected scanners, tracked against remediation SLAs.

## Layout

- Page header: title "Findings by asset"; sentence "Monitor 3rd party vulnerabilities and ensure compliance with SLAs. Learn more."; at the end Refresh and a download icon button.
- Left sub-navigation (inside the page): Findings by asset, Findings by vulnerability, Deactivated, History.
- Summary cards (two, side by side):
  - "Asset scan coverage by source": warning row "You have 18 unscanned assets" with View; then one line per source with a count (Amazon Web Services (AWS) 9, Azure 1).
  - "Asset SLA status": Overdue 9, Due soon 2, Due later 0, OK 17, each with a coloured icon.
- Filters: Search; Source, Severity, Asset type, Vulnerability status, SLA status, Account/Organization.
- Table (Findings by asset): IDENTIFIER (link; account and region under it, e.g. "551547446260: us-west-2"), SOURCES (logo), ASSET TYPE, VULNERABILITY STATUS (top severity chip + "+N more" chip), SLA STATUS (cut off; calendar icon + "Ov…").
- Findings by vulnerability columns (article): Identifier, Source, CVEs, CVE severity, Assets (count of assets it is found on), Due date (from SLAs), First Seen / Last Seen, Available Fix.
- Findings by vulnerability visuals (article): Vulnerabilities by severity level; SLA tracking.

## How you get here / where it leads

- → the Vulnerabilities page (nav path not stated in the article).
- → Findings by asset ↔ Findings by vulnerability ↔ Deactivated (ignored vulnerabilities, article 11345565) ↔ History (SLA misses and on-time remediations).
- → Settings (account header) > Features > Assets: SLA settings and available integrations.
- → "You have 18 unscanned assets" > View (the unscanned list, inferred).
- → an asset identifier link (the asset's findings, inferred).
- → How Vanta Calculates Vulnerability SLAs (article 11951321); Managing SLAs (article 11346006).

## Actions

- Refresh; download (export, inferred).
- Search; filter by Source, Severity, Asset type, Vulnerability status, SLA status, Account/Organization.
- View (unscanned assets).
- Ignore a vulnerability (moves it to Deactivated).
- Create SLAs or use Vanta's recommendations.

## States and numbers

- SLA status buckets: Overdue, Due soon, Due later, OK.
- Severity chips seen: 8 Critical (+493 more), 784 High (+1499 more), 244 High (+650 more), 10 Critical (+111 more).
- Asset types seen: Server, Container repository.
- 27 scanner sources listed in the article (13 Penetration Testing & Scanning through Tenable).

## Vocabulary

- Vulnerability, finding, asset, source, scanner, CVE, CVE severity.
- Findings by asset, Findings by vulnerability, Deactivated, ignored, History.
- SLA, SLA status, Due date, First Seen, Last Seen, Available Fix, unscanned assets, scan coverage.

## Screenshots

- `the-vulnerabilities-page-01.png`: Findings by asset with coverage-by-source and SLA-status cards over the asset table.

## For Program Assurance

- Two pivots of one data set (by asset, by vulnerability) as sub-views, plus Deactivated and History, fit the CVE and SBOM registers.
- Lead with coverage ("18 unscanned assets" + View) and SLA buckets as counts before the table: the gap and the clock come first.
- A severity cell as "worst chip + N more" keeps one line per asset.
