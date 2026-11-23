# SafeBase Trust Center integration in Drata TPRM

Source: https://help.drata.com/en/articles/15453390-safebase-trust-center-integration-in-drata-tprm
Collection: Understand the Drata Platform › Vendors
Updated: 2026-10-27
Fetched: 2026-11-22

## Article text

Drata integrates with SafeBase to surface vendor Trust Centers directly in your vendor profiles and security reviews. When a vendor has a SafeBase Trust Center, you can view their public security posture, request access to private documents, and let the TPRM Agent use Trust Center content to complete assessments — all without leaving Drata.

## Add a Trust Center URL to a vendor

You can add a vendor's SafeBase Trust Center URL when adding a new vendor or by editing an existing vendor's details.

### Search for a vendor by Trust Center

When adding a vendor, the **Vendor name** field doubles as a Trust Center search. Type at least three characters to trigger the search, which returns up to seven matching vendors at a time. Selecting a result automatically populates the vendor name and Trust Center URL.

Each result card shows:

- **Vendor logo** – A circular icon on the left side of the card.
- **Vendor | Product name** – The primary line, displayed as *Vendor | Product* (for example, *Drata | SafeBase*).
- **Website URL** – The vendor’s website displayed below the name as a secondary line (for example, [https://drata.com](https://drata.com)). Use this to confirm you are selecting the correct vendor before adding.
- **Vendor name format** – Search results use the format *Vendor | Product* (for example, *Drata | SafeBase*). Each product on a Trust Center appears as a distinct vendor in the search results. Vendors added this way can be safely renamed after they are added.
- **Trust Center URL** – When a product is selected from search, its Trust Center URL is auto-populated and includes a product-specific suffix (for example, /?product=Safebase). This links the vendor directly to that product’s Trust Center view.
- **Opt-out** – If a vendor doesn’t appear in search results, they may have opted out of being discoverable in Drata TPRM. You can still add the vendor manually and enter their Trust Center URL, or ask your vendor contact about their discoverability settings.
- **Adding a vendor manually** – If the vendor you want is not in the search results, simply continue typing the vendor name to add it manually. You can then enter the Trust Center URL directly in the **Trust Center URL** field.- **Opt-out remediation** – If a vendor has opted out of being discoverable within Drata TPRM, ask your vendor contact to enable discoverability for their Trust Center in SafeBase.

## Add a new vendor

1. Go to **Vendors → Current** and select **Add vendor**.
2. In **Step 1: Vendor details**, enter the vendor's Trust Center URL in the **Trust Center URL** field.
3. Complete the remaining steps and save.

## For an existing vendor

1. Open the vendor's profile.
2. In the **Vendor details** section of the **Overview** tab, select **Edit**.
3. Enter or update the **Trust Center URL** and save.

## Accepted URL formats

Drata recognizes the following formats when matching a Trust Center URL:

- [https://trust.example.com](https://trust.example.com)
- [https://trust.example.com/](https://trust.example.com/)
- [https://trust.example.com](https://trust.example.com)?
- [https://trust.example.com/](https://trust.example.com/)?
- trust.example.com

| 💡  Drata normalizes these variations automatically, so any of the formats above will match the same Trust Center. |
|---|

Once a Trust Center URL is saved, a SafeBase icon appears next to the vendor name in both the **Current Vendors** and **Prospective Vendors** tables. Clicking the icon takes you directly to the vendor’s Trust Center URL.

## View a vendor's Trust Center

Once a Trust Center URL is saved, a **Trust Center** tab appears on the vendor's profile. This tab embeds the vendor's SafeBase Trust Center directly in Drata.

### Public information

By default, the Trust Center tab shows the vendor's publicly available security posture, which can include:

- Compliance certifications (for example, SOC 2, ISO 27001, HIPAA)
- Security policies and documentation
- Subprocessor lists
- Risk profile details (data access level, hosting, recovery objectives, and more)
- Security grades

A banner at the top of the tab confirms: **"You are viewing public information that [vendor] has made available to everyone."**

### Request access to private documents

If the vendor shares additional documentation with reviewers, a **Request access** button appears alongside the public information banner. Clicking it opens the SafeBase-powered access request flow, where you provide your name, work email, company name, and agree to the vendor's Trust Center terms.

All access controls, NDA requirements, and approvals are enforced by SafeBase — the same requirements that apply when accessing the Trust Center directly via its URL.

| ⚠️  Some vendors may choose to limit or restrict their Trust Center's visibility within Drata TPRM. Depending on the vendor's settings, you may see public content only with no option to request private documents, or you may not be able to view the Trust Center at all. If you need access and cannot request it through Drata, contact the vendor directly. |
|---|

## Trust Center content in security reviews

When you start a security review for a vendor with a Trust Center URL, the TPRM Agent can use Trust Center documents — certifications, policies, reports — alongside questionnaire responses to complete the assessment.

Inside the review, you can also browse Trust Center content directly to inform your evaluation and **add specific documents** to include in your review record.

|💡 For the TPRM Agent to analyze private Trust Center documents, access must be granted through the Request access flow before the review begins. |

## Troubleshooting

### Missing Trust Center Tab

- Check whether the vendor has moved their Trust Center off SafeBase. If they have, the tab no longer appears in Drata. Visit the vendor’s Trust Center directly, download the compliance documents you need (for example, SOC 2 reports), and upload them to the vendor’s profile under the Documents tab.
- Check that the Trust Center URL is saved on the vendor (Overview tab > Vendor details > Edit), and re-save it as the full https:// address.
- If the tab still doesn’t appear, contact Support with the vendor name and Trust Center URL.

## Related articles

- [Automate recurring vendor reviews with the TPRM Agent (New Experience)](automate-recurring-vendor-reviews-with-the-tprm-agent.md)
- [Internal Notes and Observations in Security Reviews (New Experience)](internal-notes-and-observations-in-security-reviews-new-experience.md)
- [Add a prospective vendor (New Experience)](add-a-prospective-vendor.md)

## Related articles

- [Drata Evidence Library Sync](drata-evidence-library-sync.md)
- [SafeBase Integration for TPRM Reviews](safebase-integration-for-tprm-reviews.md)
- [Automate Recurring Vendor Reviews with the TPRM Agent](automate-recurring-vendor-reviews-with-the-tprm-agent.md)
- [TPRM Agent Autonomy Settings](tprm-agent-autonomy-settings.md)
- [TPRM Agent: Trust Center Document Collection](tprm-agent-trust-center-document-collection.md)
