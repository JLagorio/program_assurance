# Custom fields and formulas to represent the FAIR model

Source: https://help.drata.com/en/articles/11593525-custom-fields-and-formulas-to-represent-the-fair-model
Collection: Enhancing your workflow › Custom Fields and Formulas
Updated: 2026-07-01
Fetched: 2026-11-22
Description: Using Drata’s custom fields and formulas to represent the FAIR model in Risk Management

## Article text

## Purpose

This article explains how to configure the FAIR model in Drata’s **Risk Management** module using **custom fields** and **custom formulas**.

Custom fields and formulas are available in both:

- Risk Management Standard
- Risk Management Pro

To complete this setup, you must have **Admin** permissions in Drata.

### What is the FAIR model?

The FAIR model (Factor Analysis of Information Risk) is a widely adopted framework for quantifying cybersecurity and operational risk in financial terms.

FAIR breaks risk into two major components:

- **Loss Event Frequency (LEF)**
- **Loss Magnitude (Primary + Secondary)**

This helps organizations move from subjective risk scoring to data-driven, business-aligned decision making.

Learn more from the FAIR Institute: [https://www.fairinstitute.org](https://www.fairinstitute.org)

## Set up the FAIR model in Drata

In Drata, each FAIR input is represented as either:

- a **Custom Field**, or
- a **Custom Formula**

You will first create the FAIR fields, then use them to build formulas. If you’re new to Custom Fields, refer to: [Custom Fields Overview](custom-fields-overview.md).

## Step 1: Create FAIR custom fields

Go to your Settings page to create a custom field. Each FAIR field should be created under:

- **Location:** Risks
- **Section:** Assessment

Create a new custom field, and structure it in the following way:

### FAIR 1

| **Field Title** | FAIR 1:How often have you experienced security incidents related to these assets in the past year? Answer: Events / Year |
|---|---|
| **Field Description** | None (0 events/year) <br>Rarely (0.5 events/year) <br>Occasionally (1.5 events/year) <br>Frequently (4 events/year) <br>Very frequently (6+ events/year) |
| **Field Type** | Drop down (numbers) |
| **Drop-down Options** | - `0`<br>- `0.5`<br>- `1.5`<br>- `4`<br>- `6` |
| **Placement** | Location = Risks, Section = Assessment |

It’s up to you if you want to make these fields required in order to edit a risk.

### Additional FAIR fields

Create the remaining FAIR fields using the following configurations:

- [FAIR 2: Based on industry reports, how common are these types of threat events in your sector? (Rare 0.5 - Extremely Common 1.5)](#h_766aaf5fd5)
- [FAIR 3: What percentage of attempted attacks are typically successful? Enter the % of the attacks based on historical data](#h_855d4e2f5f)
- [FAIR 4: What are the MINIMUM direct costs ($) associated with a typical security incident](#h_a31ffa5509)
- [FAIR 5: What are the MAXIMUM direct costs ($) associated with a typical security incident](#h_6233b350fe)
- [FAIR 6: Estimate the potential indirect MINIMUM costs ($) from a security incident](#h_28d5052888)
- [FAIR 7: Estimate the potential indirect MAXIMUM costs ($) from a security incident](#h_6996da4317)
- [FAIR 8: How likely are you to face severe consequences such as regulatory fines or significant reputational damage due to these incidents?](#h_cf83033c80)

---

#### FAIR 2

| **Field name** | FAIR 2**:** Based on industry reports, how common are these types of threat events in your sector? (Rare 0.5 - Extremely Common 1.5) |
|---|---|
| **Field description** | Very rare (0.5 factor)<br>Uncommon (0.75 factor)<br>Common (1.0 factor)<br>Very common (1.25 factor)<br>Extremely common (1.5 factor) |
| **Field type** | Drop down (numbers) |
| **Drop-down options** | - `0.5`<br>- `0.75`<br>- `1.0`<br>- `1.25`<br>- `1.5` |

---

#### FAIR 3

| **Field name** | FAIR 3: What percentage of attempted attacks are typically successful? Enter the % of the attacks based on historical data. |
|---|---|
| **Field description** | Enter the percentage of the attacks based on historical data. |
| **Field type** | Number |

---

#### FAIR 4

| **Field name** | FAIR 4**: **What are the MINIMUM direct costs ($) associated with a typical security incident (system repairs, data recovery, downtime)? |
|---|---|
| **Field description** | *(optional)* |
| **Field type** | Currency |

---

#### FAIR 5

| **Field name** | FAIR 5: What are the MAXIMUM direct costs ($) associated with a typical security incident (system repairs, data recovery, downtime)? |
|---|---|
| **Field description** | *(optional)* |
| **Field type** | Currency |

---

#### FAIR 6

| **Field name** | FAIR 6: Estimate the potential indirect MINIMUM costs ($) from a security incident (legal fees, fines, reputational damage). |
|---|---|
| **Field description** | *(optional)* |
| **Field type** | Currency |

---

#### FAIR 7

| **Field name** | FAIR 7: Estimate the potential indirect MAXIMUM costs ($) from a security incident (legal fees, fines, reputational damage). |
|---|---|
| **Field description** | *(optional)* |
| **Field type** | Currency |

---

#### FAIR 8

| **Field name** | FAIR 8: How likely are you to face severe consequences such as regulatory fines or significant reputational damage due to these incidents? (Very Unlikely 0.1 - Very Likely 1.0) |
|---|---|
| **Field description** | Very unlikely (factor = 0.1)<br>Unlikely (factor = 0.25)<br>Possible (factor = 0.5) Likely (factor = 0.75)<br>Very likely (factor = 1.0) |
| **Field type** | Drop down (numbers) |
| **Drop-down options** | - `0.1`<br>- `0.25`<br>- `0.5`<br>- `0.75`<br>- `1.0` |

---

## Create FAIR formulas

Next, you’ll create custom formulas to represent the FAIR model.

All formulas should also be placed under:

- **Location:** Risks
- **Section:** Assessment

Here’s what each of them will look like in Drata once you’re done:

### Loss event frequency (LEF)

**Loss event frequency (LEF):** FAIR 1 * FAIR 2 * FAIR 3 /100

| **Formula name** | Loss event frequency (LEF) |
|---|---|
| **Formula description** | *(optional)* |
| **Formula** | ( FAIR 1 * FAIR 2 * FAIR 3) / 100 |

### Primary Loss Magnitude (PLM)

**Primary Loss Magnitude (PLM):** (FAIR 4 + FAIR 5) / 2

| **Formula name** | Primary Loss Magnitude (PLM) |
|---|---|
| **Formula description** | *(optional)* |
| **Formula** | (FAIR 4 + FAIR 5) / 2 |

### Secondary Loss Magnitude (SLM)

**Secondary Loss Magnitude (SLM):** (FAIR 6 + FAIR 7)/2* FAIR 8

| **Formula name** | Secondary Loss Magnitude (SLM) |
|---|---|
| **Formula description** | *(optional)* |
| **Formula** | (FAIR 6 + FAIR 7)/2* FAIR 8 |

### Annual Loss Expectancy (ALE)

**Annual Loss Expectancy (ALE):** LEF * (PLM + SLM)

| **Formula name** | Annual Loss Expectancy (ALE) |
|---|---|
| **Formula description** | *(optional)* |
| **Formula** | LEF * (PLM + SLM) |

## Related articles

- [Import Risk in Bulk (New Experience)](import-risk-in-bulk-new-experience.md)
- [Custom Fields Overview](custom-fields-overview.md)
