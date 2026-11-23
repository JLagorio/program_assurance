# SafeBase Integration for TPRM Reviews

Source: https://help.drata.com/en/articles/14446304-safebase-integration-for-tprm-reviews
Collection: Understand the Drata Platform › Vendors
Updated: 2026-07-22
Fetched: 2026-11-22
Description: Learn how to add a vendor’s SafeBase Trust Center in Drata so the TPRM Agent can automatically collect documentation and streamline security reviews.

## Article text

If a vendor has an active SafeBase Trust Center, the TPRM Agent can automatically collect documentation on your behalf, significantly speeding up the review process.

**Note:** This article covers how to add SafeBase Trust Center to your vendors for the purpose of security reviews using the TPRM Agent. To learn more about the Agent’s capabilities, visit [Getting Started with the TPRM Agent.](legacy-tprm-agent-create-a-criteria.md)

## Setup

- Ensure the vendor's **Trust Center URL** is populated in their vendor profile. If the vendor has multiple products on SafeBase, include the product-specific URL.
- You can also add vendors from the **Prospective Vendors** search, which automatically separates each SafeBase product into its own vendor entry with the correct Trust Center link.

**Note:** If a vendor offers multiple products and you need to evaluate them separately, each product should be set up as a separate vendor in Drata.

## How it works

When you create a security review for a vendor with a linked Trust Center:

1. **Access check.** The agent checks whether you already have access to the vendor's Trust Center.
2. **If approved:** You'll be prompted to let the agent automatically collect all available documents from the Trust Center. Once collected and processed, the assessment starts automatically.
3. **If not yet approved:** The Agent doesn't wait on you. It automatically collects any **publicly available** documents from the vendor's Trust Center — no access is required — and lets you run a first-pass assessment right away. You can also click **Request Trust Center Access** in the agent panel at any time to request the private documents in parallel.
   - You may need to fill out required fields (e.g., job title, company name) depending on the Trust Center's configuration.
   - The access request is sent on your behalf, using your email address.
   - Once the vendor's Trust Center admin approves the request, you need to check your email to click on the access granted link on the Trust Center.
   - Once you do this, you’ll be redirected to the TPRM agent where it can automatically collect documents, process them, and run the assessment.
4. **If denied:** You can still proceed by uploading documents manually, sending a questionnaire or utilize a public-documents-only assessment (see below).

Even when a vendor is on SafeBase, you always have the option to upload documents manually or send a questionnaire. The Trust Center integration is an additional convenience, not a requirement.

## Assess with public documents only

Some Trust Center documents are gated behind an access request that a vendor admin has to approve — which can take time or be denied. Rather than waiting, the TPRM Agent automatically collects whatever is **publicly available** on the Trust Center and lets you start the assessment immediately.

**What happens:**

1. When you start or open a review, the Agent begins collecting public Trust Center documents right away. No access is required for this step.
2. Once collected, the Agent confirms how many public documents it found (for example, *"I collected 8 public documents from the vendor's trust center"*) and flags that **this assessment is based on public documents only**.
3. Click **Confirm criteria** to run the assessment now using only the public documents, or click **Request Trust Center Access** first if you'd rather wait for the full document set.
4. While the assessment runs, a **Public docs only** tag appears next to the progress indicator so it's clear the results reflect public documents alone.

**Note:** Gaps caused by missing private documents typically show up as **Inconclusive** rather than **Not Met** — this helps you tell the difference between "the vendor hasn't disclosed this yet" and "the vendor doesn't meet this criterion."

### Adding private documents later

Once the vendor's Trust Center admin approves your access request (or if you already had access), click **Request Trust Center Access**, complete any required fields, and re-run the assessment in the same review. The Agent will re-evaluate all criteria using both the public and private documents for a complete result.

## Next Steps

Learn how to conduct a [security review with TPRM agent](conducting-a-security-review-legacy.md).

## Related articles

- [Conducting a Security Review (Legacy)](conducting-a-security-review-legacy.md)
- [Automate Recurring Vendor Reviews with the TPRM Agent](automate-recurring-vendor-reviews-with-the-tprm-agent.md)
- [SafeBase Trust Center integration in Drata TPRM](safebase-trust-center-integration-in-drata-tprm.md)
- [Training Video: Conducting an End-to-End Vendor Review with the Drata TPRM Agent (New Experience)](training-video-conducting-an-end-to-end-vendor-review-with-the-drata-tprm-agent-new-experience.md)
- [TPRM Agent: Trust Center Document Collection](tprm-agent-trust-center-document-collection.md)
