# Residual Risk in Security Reviews

Source: https://help.drata.com/en/articles/16810588-residual-risk-in-security-reviews
Collection: Understand the Drata Platform › Risk
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Residual Risk in Security Reviews
Learn how the TPRM Agent calculates a residual risk recommendation for a vendor, how to review the scoring behind it, and how to adjust and save the rating.

## Article text

This article explains residual risk in Drata security reviews — what it measures, how the TPRM Agent calculates its recommendation, and how you review, adjust, and save the rating.

Residual risk is the risk remaining for a vendor after evaluating its security posture. Where **inherent risk** describes how much risk a vendor could pose based on what they do for you, residual risk describes how much risk is left once you've looked at the evidence of what controls they actually have in place.

After the agent finishes assessing a vendor against your criteria, it recommends a residual risk rating and shows you exactly how it got there: which criteria were weighted most heavily, how much each gap contributed, and where the resulting score falls on your risk scale. Rather than asking you to form a judgment from a long list of findings, the agent converts those findings into a single defensible number — and shows its work so you can check it, challenge it, or override it.

This matters because residual risk is usually the hardest part of a vendor review to justify later. Reviewers often set it by feel, which makes it inconsistent between vendors and hard to defend to an auditor. A transparent, weighted calculation gives you a rating you can explain — and a clear signal when the evidence isn't strong enough to support one at all.

**Note:** Residual risk scoring is part of the security review workflow.

---

## Where residual risk fits in the review

Residual risk is the fifth of the six steps the TPRM Agent works through in a security review:

1. Review and confirm criteria
2. Collect documents
3. Process documents
4. Assess vendor against criteria
5. **Review residual risk**
6. Finalize review and generate report

The agent can only recommend a residual risk once the assessment is complete, because the recommendation is calculated directly from the criterion results. Until then, the review header shows **Residual risk: Unscored**.

Saving a residual risk advances the review to the follow-up questionnaire step.

**Expected outcome:** You can locate the **Review residual risk** step in the Drata AI panel checklist, and the review header shows **Residual risk: Unscored** until a rating is saved.

---

## Review the recommendation

When the assessment finishes, the agent posts a **Recommended residual risk** card in the Drata AI panel.

The card contains:

- **Residual risk** — a dropdown pre-filled with the agent's recommended level
- **Save** — accept the rating as shown
- **Review residual risk** — open the full scoring breakdown before deciding

You can accept the recommendation directly with **Save**, but reviewing the breakdown first is worth the extra step — it tells you how much evidence the rating actually rests on.

**Expected outcome:** A **Recommended residual risk** card appears in the Drata AI panel with a pre-filled rating and both **Save** and **Review residual risk** available.

---

## Open the scoring breakdown

Select **Review residual risk** to open the **Residual risk** dialog, titled *Risk remaining for [Vendor] after evaluating its security posture*.

The dialog contains four things:

1. **A narrative summary** — the agent's explanation of the rating in plain language: which control areas are strengths, which partially met gaps offset them, and how many criteria were inconclusive and therefore excluded from the score.
2. **Agent reasoning** — an expandable section containing the band scale, a one-line statement of what share of criteria the severity-weighted gaps account for, and a **how scoring works** link.
3. **A per-criterion scoring table** — every conclusive criterion with its **Criterion** name, **Severity**, **Status**, and **Points**.
4. **The totals** — **Result**, **Total possible points**, and **Share of possible points**.

Close the dialog with **Cancel** to leave the rating unchanged, or use **Save residual risk** to apply it.

**Expected outcome:** The **Residual risk** dialog is open and shows a narrative summary, the agent's reasoning, a scoring table listing each conclusive criterion, and the three totals at the bottom of the table.

---

## How the score is calculated

Each criterion contributes points based on two things: how heavily it's weighted, and how large the gap is. Points represent gaps, not credit — **a higher score means a worse outcome**.

### Severity sets the weight

Severity is configured on each criterion and tells Drata how important that criterion is relative to others at the same risk level.

| **Severity** | **Weight** |
|---|---|
| Low | 1 |
| Medium | 2 |
| High | 3 |

### Status sets the share of that weight counted as a gap

| **Status** | **Share of weight** | **Example at High severity (weight 3)** |
|---|---|---|
| **Met** | 0% | 0 points |
| **Partially met** | 50% | 1.5 points |
| **Not met** | 100% | 3 points |
| **Inconclusive** | Excluded from the score | — |

A Medium-severity criterion (weight 2) that is partially met contributes 1 point. The same criterion fully met contributes 0. A High-severity criterion (weight 3) that is not met contributes the full 3.

### The totals

- **Result** — the sum of points across all conclusive criteria.
- **Total possible points** — the sum of the weights of those same criteria, which is what the result would be if every one of them were not met.
- **Share of possible points** — Result ÷ Total possible points, as a percentage.

For example, a **Result** of 19.5 against **Total possible points** of 56 gives a **Share of possible points** of 35%.

### How the percentage maps to a risk level

Drata divides the 0–100% range evenly across the number of risk levels your organization has configured, using the same levels you use for inherent risk.

Drata includes five risk levels out of the box, which produces five 20% bands:

| **Band** | **Range** |
|---|---|
| Insignificant | 0%–20% |
| Minor | 20%–40% |
| Moderate | 40%–60% |
| Major | 60%–80% |
| Critical | 80%–100% |

A 35% share falls in the **Minor** band.

Risk levels are customizable. If you've changed the number of levels your organization uses, the ranges are divided evenly across that number instead — the bands are not fixed at 20% each, and the level names shown in your reviews will be your own.

**Expected outcome:** You can trace any criterion in the scoring table from its severity and status to its points value, add those points to reach the **Result**, and see why the **Share of possible points** lands in the band the agent recommended.

---

### Adjust and save the rating

You are never bound to the agent's recommendation.

1. In the **Residual risk** dropdown — either on the chat card or in the dialog — select the level you want to record.
2. Select **Save residual risk** in the dialog, or **Save** on the chat card.

The rating is applied to the review immediately.

**Expected outcome:** The review header shows your chosen level in the **Residual risk** field in place of **Unscored**, the **Review residual risk** step is checked in the Drata AI panel with today's date, and the review advances to the follow-up questionnaire step.

---

## Recalculate after changing criterion statuses

The score is calculated from the criterion statuses at the time you open the dialog. If you override a status — marking an inconclusive criterion as met, or a partially met criterion as not met — the score changes.

1. Change the criterion statuses in the assessment table. You can edit a single criterion from its detail view, or select several rows and use the bulk actions to **Mark as met**, **Mark as partially met**, **Mark as inconclusive**, or **Mark as not met**.
2. Re-open **Review residual risk**.
3. Confirm the new **Result**, **Share of possible points**, and recommended band.
4. Save the rating.

Adding new documents and re-running the assessment has the same effect: criteria that were inconclusive may resolve to met, partially met, or not met, and each newly conclusive criterion enters the calculation.

**Expected outcome:** The scoring table reflects your updated statuses, the **Result** and **Share of possible points** have changed accordingly, and the recommended band matches the new percentage. Criteria you marked inconclusive have dropped out of the table entirely.

---

## When the agent withholds a recommendation

If too many criteria came back inconclusive, the agent will not recommend a residual risk at all.

This is intentional. Inconclusive criteria are excluded from the calculation, so when too many are excluded, the remaining criteria aren't a large enough sample for the resulting percentage to mean anything. Rather than present a confident-looking number built on thin evidence, the agent withholds the recommendation and tells you it couldn't determine enough of the criteria.

**How this differs from a normal result:** instead of a pre-filled rating in the **Recommended residual risk** card, you'll see a message explaining that too many criteria could not be determined, and the review will not carry a residual risk until you act.

To resolve it, do one of the following:

- **Add more documentation and re-run the assessment.** This is usually the better path — it resolves the inconclusive criteria rather than working around them. Upload the missing documents to **Reports and Documents**, then re-run.
- **Send the follow-up questionnaire** to collect the missing evidence from the vendor, then let the agent re-assess when they respond.
- **Change which criteria are in scope** and run the assessment again, removing criteria that don't apply to this vendor.
- **Set the residual risk manually**, if you have context the agent didn't have access to.

**Expected outcome:** After re-running with better documentation or a revised criteria set, the agent produces a residual risk recommendation with a scoring table. If you set the rating manually instead, the review header shows your chosen level and the workflow continues — but the score behind it will not appear in the report.

---

### When residual risk exceeds inherent risk

At the other end, if the residual risk lands higher than the vendor's inherent risk, the agent flags it:

**Residual exceeds inherent risk** — Residual (Critical-Strategic) is higher than inherent (Moderate-Standard) — raise the inherent risk and rerun the assessment, or revisit which criteria are in scope.

This is a warning, not a block — you can still save the rating.

**What the warning means:** inherent risk determines which criteria are brought into scope for the assessment. If the vendor's residual risk is higher than its inherent risk, the vendor was probably classified too low, which means the assessment may have used a criteria set that was too narrow for the risk this vendor actually carries. The two ratings are telling you contradictory things about the same vendor.

To resolve it:

- **Raise the vendor's inherent risk and re-run the assessment**, so the vendor is evaluated against the criteria appropriate to its actual risk level.
- **Revisit which criteria are in scope**, if the criteria set rather than the classification is what's off.
- **Add more documentation and re-assess**, if the high residual score is driven mainly by missing evidence rather than genuine control failures.

**Expected outcome:** After raising the inherent risk and re-running, the assessment uses the appropriate criteria set and the warning no longer appears. If you save the rating without resolving the mismatch, the review records a residual risk above the vendor's inherent risk and the warning remains visible.

---

### Tips for a defensible residual risk rating

- **Resolve inconclusive criteria before scoring.** Inconclusive results are excluded from the calculation, so every one you resolve makes the score more representative — and too many will cause the agent to withhold its recommendation entirely.
- **Keep severity current on your criteria.** Severity drives the weighting behind the whole score. Criteria left at a default or stale severity will skew the result. Manage severity at **Vendors > Criteria**.
- **Check the scoring table before accepting a recommendation.** A rating built on a handful of conclusive criteria deserves more scrutiny than one built on most of the set.
- **Keep inherent risk accurate.** Inherent risk determines which criteria are assessed, so an inaccurate classification produces a residual score against the wrong criteria set.
- **Record your reasoning when you override.** If you set a rating that differs from the agent's recommendation, capture why in an internal note or observation so the decision is explainable later.

---

### FAQ

**What's the difference between inherent risk and residual risk?** Inherent risk describes how much risk a vendor could pose based on what they do for you and what data they touch. Residual risk describes how much risk remains after evaluating the evidence of the controls they actually have in place.

**Does a higher residual risk score mean the vendor is doing better?** No — the opposite. Points represent gaps, so a higher score and a higher percentage mean more residual risk.

**How does severity affect the score?** Severity sets each criterion's weight: Low is 1, Medium is 2, High is 3. Status then determines how much of that weight counts as a gap — Met contributes 0%, Partially met 50%, and Not met the full weight.

**Why are inconclusive criteria excluded from the score?** Because the documentation didn't contain enough information to determine whether the requirements were met, an inconclusive result isn't evidence of either a gap or a control. Including them either way would distort the score.

**Why didn't the agent recommend a residual risk?** Too many criteria came back inconclusive. Add documentation and re-run, adjust which criteria are in scope, or set the rating manually.

**Are the residual risk bands always 25% wide? No. Drata divides the 0–100% range evenly across however many risk levels your organization has configured. Four risk levels produce 25% bands; a different number produces different ranges.**

**Can I change the residual risk after saving it?** Yes. Re-open **Review residual risk**, choose a different level, and save again. If the review has already been finalized, select **Re-open review** first.

**Does the residual risk rating appear in the final report?** Yes. The saved residual risk is part of the completed review record, alongside your decision, observations, internal notes, and the full criteria results table.

**Where do I configure severity and risk levels?** Manage criteria and their severity at **Vendors > Criteria**. To adjust agent behavior, go to **Vendors > Settings** and select **Edit TPRM Agent**.

---

🎓 **Want to learn more?** Dive deeper into this topic and see it in action. Check out our dedicated Vendors course at the [Drata Academy](https://academy.drata.com/risks-vendor-management).

## Related articles

- [Terminology Updates: Inherent and Residual Risk in Vendor Risk Management](terminology-updates-inherent-and-residual-risk-in-vendor-risk-management.md)
- [Conducting a Security Review (Legacy)](conducting-a-security-review-legacy.md)
- [Training Video: Conducting an End-to-End Vendor Review with the Drata TPRM Agent (New Experience)](training-video-conducting-an-end-to-end-vendor-review-with-the-drata-tprm-agent-new-experience.md)
- [TPRM Agent: Create a Criteria](tprm-agent-create-a-criteria.md)
- [Conducting a Security Review](conducting-a-security-review.md)
