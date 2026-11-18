# Best Practices: Migrating your Security Program to Vanta

Source: https://help.vanta.com/en/articles/11951507-best-practices-migrating-your-security-program-to-vanta
Fetched: 2026-11-17

**Purpose**: a 12-step checklist for moving from another compliance platform into Vanta while keeping the compliance posture and turning on automated monitoring and evidence collection. No screenshots in the article.

## The steps

1. Users: invite the administrators of the previous tool.
2. Integrations page: connect cloud providers, identity providers, device management, ticketing and others.
3. Documents: upload policies and attestations, background checks, vendor due diligence, training records, SOC 2 / pen test / audit reports, historical audit evidence (as needed).
4. Tests page: review engineering test results; many failures may mean the integration scope (connected cloud accounts, repositories) needs adjusting.
5. Policies and Documents: re-upload current policy documents and background check confirmations so they are monitored.
6. Policy management: for policy tests that do not map from the old tool, deactivate monitoring for unmatched tests, or re-upload and relink documents.
7. Personnel and Access pages: match individuals to their accounts (supports least privilege).
8. Security awareness training: import completion records, or run a new round through Vanta's onboarding workflow (recommended); if not importing, disable monitoring for those tests to avoid false alerts.
9. Vendors: transfer vendor profiles by hand; upload SOC 2 reports, questionnaires and risk materials.
10. Risk: upload the prior risk assessment as a document, or complete a new one in the Risk Assessment Workflow (recommended).
11. Tests: compare test and control coverage against the previous tool.
12. Final walkthrough: review every section, confirm data transferred, upload remaining evidence.

## Layout

No screenshots. Pages named: Integrations, Documents, Tests, Policies, Personnel, Access, onboarding page (pending security tasks), Vendors, Risk Assessment.

## Flow edges

- Users (invite admins) → Integrations → Tests (review failures) → Integrations (adjust scope)
- Documents → Policies (relink) → Tests (deactivate unmatched)
- Personnel ↔ Access (match accounts)
- onboarding page (training) → Tests
- Vendors (profiles + documents) → risk register (third-party)
- Risk Assessment Workflow → risk register
- Tests (coverage review) → final walkthrough

## Actions

Invite · Connect integrations · Upload documents · Review test results · Adjust integration scope · Re-upload / relink · Deactivate monitoring · Match users to accounts · Export/upload training records · Disable monitoring · Upload vendor documents · Complete risk assessment · Review test coverage

## Vocabulary

integrations · automated monitoring · evidence collection · Documents · tests page · policy-based tests · deactivate monitoring · Personnel · Access · least privilege · security awareness training · third-party risk register · Risk Assessment Workflow · test coverage

## Screenshots

None in the article.

## For Program Assurance

- A migration checklist that ends in "compare coverage with the previous tool" is a useful closing check after importing an existing SSP and POA&M (inferred).
- Evidence that cannot be mapped is not left failing: its monitor is deactivated with a stated reason, so the dashboard stays honest.
- Re-running a process in the tool (new risk assessment, new training round) is recommended over importing stale results, which suggests an RMF tool should mark imported artifacts as such (inferred).
