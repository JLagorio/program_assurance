# TPRM Agent: Trust Center Document Collection

Source: https://help.drata.com/en/articles/16892971-tprm-agent-trust-center-document-collection
Collection: Understand the Drata Platform › Vendors › TPRM Agent
Updated: 2026-11-03
Fetched: 2026-11-22
Description: Learn how the TPRM Agent collects security documentation from a vendor's trust center — public documents immediately, and confidential documents once the vendor grants you access.

## Article text

Many vendors publish their security posture on a trust center. Some documents are public; others are confidential and sit behind an access request that someone at the vendor has to approve. Rather than making you visit the site, request access, wait, download files, and upload them into Drata by hand, the agent does that work as part of the security review. It collects whatever is public right away, submits the access request on your behalf, and re-runs the assessment once the vendor approves it.

This matters because access requests are the slowest part of a vendor review. Waiting on a vendor administrator can take days, and a review that can't start until then is a review that sits. Collecting public documents first means you get a first-pass assessment in minutes and only revisit it when the fuller picture arrives.

After following this article, you'll be able to:

- Add a trust center URL to a vendor so the agent can find it
- Choose the right URL, including for vendors with several products
- Understand how the agent collects public documents before any access is granted
- Request trust center access from within Drata, or supply an access link you already have
- Complete the access process and re-run the assessment with the full document set
- Tell the difference between a gap in the vendor's controls and a gap in what they've disclosed

---

## Which trust centers the agent works with

The agent isn't limited to a particular trust center provider. It works with hosted trust centers and self-hosted ones alike — including, for example:

- **SafeBase trust centers** (a Drata product)
- **Vanta trust centers**
- **Conveyor trust centers**
- **Self-hosted trust centers**

These are illustrative rather than a complete list. If your vendor publishes a trust center somewhere else, add its URL and let the agent try — the core flow is the same wherever the trust center lives: the agent finds it, collects what's public, and helps you get access to the rest. Where a provider's experience differs, this article says so.

---

## Setup

Ensure the vendor's **Trust Center URL** is populated in their vendor profile.

### Make sure the URL is the trust center, not a marketing page

A common mistake is entering a security marketing page rather than the trust center itself. Marketing pages describe a vendor's security program but don't contain the compliance documents the agent needs.

- ❌ `https://drata.com/security` — describes security information, no documents
- ✅ `https://trust.drata.com/` — the actual trust center

If the page you're about to paste doesn't list downloadable documents and certifications, it's probably not the trust center.

### SafeBase: vendors with multiple products

If the vendor has multiple products on SafeBase, include the product-specific URL to target just that product.

- For example: `https://trust.drata.com/?product=safebase`
- If no product is specified, the agent collects documents from the vendor's default product.
- Single-product trust centers — those without a product selector in the upper-right corner — don't need a product-specific URL.

**Note:** If a vendor offers multiple products and you need to evaluate them separately, set up each product as a separate vendor in Drata.

You can also add vendors from the **Prospective vendors** search, which automatically separates each SafeBase product into its own vendor entry with the correct trust center link.

**Expected outcome:** The vendor profile shows a Trust Center URL. When you start a security review for that vendor, the agent's checklist includes a **Get access to trust center** step.

---

## How it works

When a vendor has a trust center URL, the security review gains a document collection stage. The agent's checklist shows seven steps rather than the usual six:

1. Review and confirm criteria
2. **Get access to trust center**
3. Collect documents
4. Process documents
5. Assess vendor against criteria
6. Review residual risk
7. Finalize review and generate report

The **Get access to trust center** step appears only for vendors with a trust center URL. Vendors without one follow the standard six-step review.

Once the review starts, the agent finds the trust center and tells you what it can do:

> *I found the vendor's trust center. I can request access for you, or you can paste an access link if you already have one — those usually arrive by email.*

From here you have three paths, and you can combine them:

- **Request trust center access** — have the agent submit the access request for you
- **I have an access link** — supply a link the vendor already sent you
- **Assess public docs only** — don't wait; assess what's publicly available now

**Expected outcome:** The agent confirms it found the vendor's trust center and offers the access options above. Public document collection can begin without any action from you.

---

## Requesting trust center access

You can request access from the chat panel without leaving Drata.

1. Select **Request trust center access**.
2. Complete the **Request access** dialog. It explains that you're providing your information so the vendor can review your request.
3. Select **Submit request**, or **Back** to return without requesting.

### Why the form looks different for different vendors

**The agent asks for whatever that vendor's trust center requires.** Access requirements are set in two layers: the trust center provider defines a baseline, and the vendor can customize it further. So the form varies not just between providers, but between two vendors using the same provider.

In practice that ranges from minimal to fairly detailed:

| **A vendor asking for little** | **A vendor asking for more** |
|---|---|
| Business email, company name (optional) | First name, last name, business email, phone, job title, company name |

Some trust centers also require you to accept their terms before they'll consider the request.

There's nothing to configure on your side — the agent reads the requirements and builds the form to match.

Two things stay consistent:

- **Your business email is pre-filled and can't be changed.** It comes from your Drata account, which is how the vendor's approval reaches you rather than a shared mailbox.
- **Other fields pre-populate where Drata knows the answer** — your name, job title, and company, for example — so most requests are a quick review rather than a form to fill in from scratch.

**Expected outcome:** The access request is submitted with the information that vendor's trust center requires, and the agent confirms what it sent. Document collection continues with public documents while you wait for the vendor's decision.

---

## Using an access link you already have

If the vendor has already granted you access — or sent you an access link directly — you don't need to submit a new request.

1. Select **I have an access link**, then **Provide access details**.
2. Paste the link into the **Access link** field that appears in the chat panel.
3. Select **Submit**, or **Cancel** to go back.

The agent uses the link to reach the confidential documents and collect them into the review.

This is useful when someone else on your team already has access, when the vendor sent a link outside Drata, or when you requested access before starting the review in Drata.

**Expected outcome:** The agent collects the confidential documents using the link you supplied, without waiting on a new access request, and the assessment runs against the full document set.

---

## Completing access for SafeBase trust centers

SafeBase trust centers add a few steps between the vendor's approval and the documents reaching Drata. Here's the whole path.

### The access email

When the vendor approves your request, you receive an email from their trust center, branded with the vendor's logo and footed with *"[Vendor]'s Trust Center is powered by SafeBase."*

The email:

- **Explains what access gives you** — after accessing, you'll be able to view certificates, download confidential documents, and review standard security questionnaires. You can also subscribe to receive future updates on the vendor's security program.
- **Warns that the link is single-use.** For security reasons, the link is valid for a single login and expires after one day.
- **Gives two instructions**, which describe the handoff back to Drata:
   1. Go to the vendor's trust center.
   2. After a brief moment, you'll be redirected back to the Vendor Profile in Drata with additional access.
- **Includes an access button** labeled **Access the [Vendor] Trust Center**.

**Note:** If the link has expired, request access again from Drata to trigger a fresh email.

### Signing in to SafeBase

The link takes you to a SafeBase sign-in screen — *Sign in to continue to SafeBase by Drata*. Enter your **email address** and select **Continue**, or use **Continue with Google**.

Use the same email address the agent submitted with your request. A different address won't be matched to the approved request.

### Accepting the trust center terms

On first arrival you'll see a short welcome dialog — *Welcome to [Vendor]'s Trust Center. By proceeding, you agree to the platform's Terms of Use.* Select **Let's Go** to continue.

If your access is covered by an NDA, the trust center displays a reminder that you're viewing it under NDA.

## Returning to Drata

Because the agent started this review, the trust center recognizes it and offers to send you back:

**Pick up your review in Drata VRM** — *It looks like you started your review in Drata VRM. Go back to VRM to continue.*

Select **Go to Drata VRM** to return to the vendor's profile in Drata with your new access applied. ("Drata VRM" is Drata's vendor risk management area — the same place you started.)

**Expected outcome:** The vendor's **Trust Center** tab in Drata shows that access has been granted, along with how long it lasts — the duration is set by the vendor, so check the tab rather than assuming a fixed period.

---

## Re-running the assessment with the full document set

Once access is granted, the agent picks the review back up.

For SafeBase trust centers you'll see a message explaining what changed:

> *The vendor has approved your access request! The previous assessment ran using public documents only, so I'll collect the full set of documents now and re-run the assessment with everything available.*

Select **Run assessment**. The agent collects the complete document set and begins processing. You'll see status messages as it works:

- **Collecting documents** — *This may take a few minutes. This page will update to show the latest status.*
- **Processing documents** — *This may take a few minutes. This page will update to show the latest status.*

Everything lands in the review's **Reports and documents** tab, where each file shows its state as the agent works through it: **Processing**, then **Ready for review**. Where the agent finds exceptions inside a report, the row says so — for example, *Review 9 exceptions found* — so you can go straight to the passages that matter.

Because the agent re-evaluates every criterion against the full set, criteria that were previously inconclusive for lack of evidence may resolve to met, partially met, or not met.

**Expected outcome:** The review's **Reports and documents** tab lists the full set of trust center documents with their processing status, and the assessment results reflect both public and confidential documents rather than public documents alone.

---

## Assess with public documents only

Some trust center documents sit behind an access request that a vendor administrator has to approve, which can take time or be declined. Rather than waiting, the agent collects whatever is public and lets you assess immediately.

1. When you start or open a review, the agent begins collecting public trust center documents right away. No access is required.
2. Select **Assess public docs only** to proceed without waiting, or request access first if you'd rather have the full set.
3. Once collected, the agent confirms what it found and flags that the assessment is based on public documents only.
4. While the assessment runs, a **Public docs only** tag appears next to the progress indicator, so it's clear the results reflect public documents alone.

**Note:** Gaps caused by missing confidential documents typically show up as **Inconclusive** rather than **Not Met**. This lets you tell the difference between *the vendor hasn't disclosed this yet* and *the vendor doesn't meet this criterion*.

**Expected outcome:** You have a completed first-pass assessment within minutes of starting the review, labeled **Public docs only**, with undisclosed criteria marked Inconclusive rather than Not Met.

---

## Adding individual documents from the Trust Center tab

For vendors with a SafeBase trust center, the vendor profile gains a **Trust Center** tab, where you can pull in specific documents yourself.

1. Open the vendor's **Trust Center** tab in Drata.
2. Scroll to the **Documents** section, which lists what the trust center publishes — policies, reports, network diagrams, and audit documents.
3. Select the add control beside a document to include it in your review.

The tab also surfaces the vendor's **Introduction** and their **Compliance** badges — the frameworks and certifications they claim, such as SOC 2 Type 2, PCI DSS, and NIST CSF.

**Expected outcome:** The documents you selected appear in the review's **Reports and documents** tab and are included the next time the assessment runs.

---

## If access is denied or you'd rather not wait

The trust center integration is a convenience, not a requirement. You can always:

- **Upload documents manually** to the review's **Reports and documents** tab
- **Send a questionnaire** through Drata and let the agent assess the responses
- **Proceed with the public-documents-only assessment** and finalize on that basis, noting the limitation in your review rationale

**Expected outcome:** The review can be completed and finalized whether or not trust center access was granted.

---

## FAQ

**Which trust centers does the agent work with?** It isn't limited to specific providers. SafeBase, Vanta, Conveyor, and self-hosted trust centers all work, and those are examples rather than a complete list. If your vendor's trust center is hosted elsewhere, add the URL and let the agent try.

**My vendor's trust center provider isn't listed. Will it still work?** Most likely. The providers named in this article are illustrative. What matters is that the URL points at a real trust center with documents on it, not a marketing page.

**How do I know I've got the trust center URL and not a marketing page?** The trust center lists downloadable documents and certifications. A page that only describes the vendor's security program is a marketing page and won't give the agent anything to assess.

**Which URL should I use for a vendor with several products on SafeBase?** The product-specific URL — for example, [https://trust.drata.com/?product=safebase](https://trust.drata.com/?product=safebase). Without one, the agent collects from the vendor's default product.

**Do I have to wait for access before assessing?** No. The agent collects public documents and lets you assess immediately, then re-runs with the full set once access is granted.

**Why does the access request ask for different information for different vendors?** Because access requirements are set by the trust center provider and can be further customized by the vendor. Two vendors on the same provider can ask for different things. The agent reads the requirements and builds the form to match, pre-filling what Drata already knows.

**Can I change the email address on an access request?** No. It's taken from your Drata account so the vendor's approval reaches you directly.

**Who does the access request come from?** You. Drata submits it on your behalf using your email address, so the vendor's approval notification arrives in your inbox.

**I already have access. Do I need to request it again?** No. Select **I have an access link**, then **Provide access details**, and paste the link the vendor sent you into the **Access link** field.

**The access link in my SafeBase email didn't work.** Those links are valid for a single login and expire after one day. Request access again from Drata to get a fresh link.

**Why are some criteria Inconclusive rather than Not Met?** Inconclusive means the documentation didn't contain enough information to determine the answer — common when only public documents were available. Not Met means the documentation shows the requirement isn't satisfied. Re-running with confidential documents usually resolves inconclusive results.

---

## Next steps

Learn how to conduct a [security review with the TPRM Agent](conducting-a-security-review-legacy.md).

## Related articles

- [SafeBase Integration for TPRM Reviews](safebase-integration-for-tprm-reviews.md)
- [Conducting a Security Review (Legacy)](conducting-a-security-review-legacy.md)
- [Automate Recurring Vendor Reviews with the TPRM Agent](automate-recurring-vendor-reviews-with-the-tprm-agent.md)
- [SafeBase Trust Center integration in Drata TPRM](safebase-trust-center-integration-in-drata-tprm.md)
- [Training Video: Conducting an End-to-End Vendor Review with the Drata TPRM Agent (New Experience)](training-video-conducting-an-end-to-end-vendor-review-with-the-drata-tprm-agent-new-experience.md)
