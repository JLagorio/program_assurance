# Customize vendor risk levels

Source: https://help.drata.com/en/articles/18171465-customize-vendor-risk-levels
Collection: Understand the Drata Platform › Vendors
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Learn how to rename, add, and remove the risk levels Drata uses to classify your vendors, so they match the risk framework your organization already uses.

## Article text

This article explains how to customize vendor risk levels in Drata — the scale used to classify how risky a vendor is.

Risk levels apply to both **inherent risk** (how much risk a vendor could pose, based on what they do for you) and **residual risk** (how much risk remains after evaluating their security posture). Drata ships with a default scale, but you can rename the levels, add new ones, or remove ones you don't use, up to seven levels in total.

This matters because risk terminology is rarely universal. If your risk register, your board reporting, and your vendor program all say *Tier 1* through *Tier 4*, a vendor list that says *Minor* and *Major* forces everyone to translate — and translation is where mistakes happen. Matching Drata to the language your organization already uses means a vendor's rating reads the same way everywhere.

Risk levels also do real work beyond labeling. They determine which criteria the TPRM Agent applies during a security review, and how many levels you have determines the bands used when the agent recommends a residual risk rating. Changing them is a program-level decision, not a cosmetic one — so Drata shows you exactly what's affected before you commit.

---

## Where risk levels are used

A single risk level scale is used in several places:

- **Inherent risk** on a vendor — set during vendor intake or assessed by Drata
- **Residual risk** on a vendor — recommended by the TPRM Agent after a security review
- **Criteria mapping** — each criterion is mapped to the inherent risk levels it applies to, which determines what gets assessed during a security review

Because the same scale drives all three, renaming or removing a level affects vendors and criteria together.

---

## Before you begin

Drata includes a default set of risk levels. Your current levels are listed on the vendor settings page.

A few things to know:

- You can configure **up to 7 risk levels**.
- **Unscored** is always available and can't be renamed or removed. Vendors without an assigned risk level appear as Unscored.
- Levels run from lowest to highest risk. **Colors are assigned automatically** based on a level's position in the scale and aren't configurable — as you add or remove levels, Drata adjusts the colors to keep the progression readable.
- **Existing levels can't be reordered.** Decide where a level belongs when you create it, since you can't drag it to a new position later.

---

## View your current risk levels

1. Go to **Vendors > Settings**.
2. Find the **Risk levels** section.

The section describes what risk levels do and lists your current scale with its color swatches:

> *Define and manage the risk levels used to classify your vendors. Risk levels apply to both inherent and residual risk assessments and can be fully customized to match your organization's risk framework. You may configure up to 7 levels. Vendors without an assigned risk level will appear as Unscored.*

**Expected outcome:** The Risk levels section lists Unscored followed by your configured levels in order, each with its color swatch, and an **Edit** button in the section header.

---

## Open the risk level editor

In the **Risk levels** section, select **Edit**. The **Edit risk levels** page has two panels side by side:

- **Risk levels** (left) — where you make changes. Unscored appears at the top as a fixed entry, followed by an editable row for each of your levels.
- **Preview risk levels** (right) — *Preview how vendors are distributed across your risk levels.* It shows a count of vendors at each level, split into **Inherent risk** and **Residual risk**.

The preview updates live as you edit, so you can see the effect of a change before saving it.

Select **Back to vendor settings** at any time to leave without saving.

**Expected outcome:** The Edit risk levels page is open, your current levels appear as editable rows, and the preview panel shows how many vendors sit at each level for both inherent and residual risk.

---

## Rename a risk level

Renaming is the most common customization — the scale stays the same, but the labels match your organization's vocabulary.

1. Select the name field for the level you want to rename.
2. Type the new name.
3. Repeat for any other levels.
4. Select **Save changes**.

As you type, the preview panel on the right updates to show the new name alongside its vendor counts, so you can confirm you're renaming the level you intended.

Renaming a level does **not** move any vendors or criteria. Everything assigned to that level stays assigned — only the label changes.

**Expected outcome:** The preview panel shows your new level names with unchanged vendor counts. After saving, the new names appear everywhere risk levels are displayed — vendor profiles, vendor lists, criteria, and security reviews.

---

## Add a risk level

You can insert a new level anywhere in the scale, as long as you stay within the seven-level limit.

1. Select **Insert risk level** at the position where you want the new level. These links appear above, between, and below your existing levels, so the new level lands exactly where you want it in the order.
2. A new empty row appears. Type a name for it.
3. Select **Save changes**.

Until you name it, the new level shows in the preview panel as an unnamed level with zero vendors. That's expected — a new level starts empty, and you assign vendors and criteria to it afterward.

**Choose the position carefully.** Levels can't be reordered after they're created, so the **Insert risk level** link you select is what fixes the new level's place in the scale. If you get it wrong, you'll need to remove the level and insert a new one in the right position.

**Expected outcome:** The new level appears in the correct position in both the editor and the preview panel, with zero vendors at both inherent and residual risk. After saving, it becomes available in the risk level dropdowns on vendors and criteria.

---

## Remove a risk level

Removing a level is the one change that can't be made in isolation, because vendors and criteria may currently be using it. Drata won't orphan them — it asks you where they should go first.

1. Select the **Delete risk level** icon on the row you want to remove.
2. If anything is currently assigned to that level, the **Re-assign vendors and criteria** dialog opens. It tells you what's affected — for example, *18 vendors are currently assigned to High* and *135 criteria are currently mapped to High* — and asks where each group should go:
   - **Re-assign [N] vendors to** — choose a new **inherent risk level** for vendors whose *inherent* risk is set to the level being removed
   - **Re-assign [N] vendors to** — choose a new **residual risk level** for vendors whose *residual* risk is set to it
   - **Re-assign [N] criteria to** — choose a new **criteria risk level** for criteria mapped to it
3. Select **Re-assign**, or **Cancel** to keep the level.
4. Select **Save changes** to commit.

The three groups are handled separately because a vendor can sit at one level for inherent risk and a different one for residual risk. The counts won't always add up the way you'd expect — a total of 18 vendors might be 17 at inherent risk plus 1 at residual risk.

**Important:** Re-assignment is a bulk change to your vendor records and criteria mappings. Because criteria mapping determines what the TPRM Agent assesses, re-assigning criteria changes which criteria apply to vendors at the destination level. Review the counts before confirming.

**Expected outcome:** The level is removed from the scale, and every vendor and criterion that used it now sits at the level you chose. The preview panel reflects the new distribution, and the destination level's vendor and criteria counts have increased accordingly.

### Re-assigning more precisely first

The **Re-assign vendors and criteria** dialog sends each group to a single destination level. That's fine when everything should land in the same place, but it's blunt if the vendors or criteria at that level really belong at different levels.

If you'd rather control the distribution, move things yourself before deleting the level. The table bulk actions are the quickest way to do this.

**Vendors — use the bulk actions on the Current vendors table**

1. Go to **Vendors > Current** and filter the table to the risk level you're about to remove.
2. Select the vendors you want to move. Use the header checkbox to select the page, or **Select all** to take the entire filtered set.
3. From the bulk action bar, choose the action you need:
   - **More > Update residual risk** — set a residual risk level directly for the selected vendors. The dialog confirms how many vendors it will update and lets you pick the level.
   - **Assess inherent risk** — re-run Drata's assessment against your inherent risk guidance for the selected vendors. This assigns levels based on that guidance rather than letting you pick one, so use it when you want Drata to re-derive the rating rather than set it by hand.

**Note:** The inherent risk assessment is available with Drata TPRM. Without it, set inherent risk manually on each vendor or through the bulk vendor import.

Work through one destination level at a time: filter, select, update, repeat.

**Criteria — use the bulk actions on the Criteria page**

Go to **Vendors > Criteria**, select the criteria you want to move, and use the **Assign inherent risk** bulk action to map them to the levels you choose. See [TPRM Agent: Create a Criteria](legacy-tprm-agent-create-a-criteria.md).

**Other options**

You can also update vendors individually from their profiles, or use the bulk vendor import on the Current vendors page (**Add vendor > Add/update in bulk**), which supports risk level fields. See [Add a vendor or prospective vendor](add-a-prospective-vendor.md).

Once nothing is left at the level, deleting it skips the re-assignment step entirely.

**Expected outcome:** Vendors and criteria sit at the levels you chose individually rather than all moving to one destination, and the level you're removing shows zero vendors and zero criteria in the preview panel before you delete it.

---

## What changing risk levels affects

Risk levels aren't just labels, so it's worth knowing what moves when you change them.

**Criteria scoping.** Each criterion is mapped to the inherent risk levels it applies to. Removing a level and re-assigning its criteria changes which criteria the TPRM Agent uses when assessing vendors at the destination level. See [TPRM Agent: Create a Criteria](legacy-tprm-agent-create-a-criteria.md).

**Residual risk banding.** When the TPRM Agent recommends a residual risk rating, it divides the 0–100% scoring range evenly across however many levels you have configured. Five levels produce 20% bands; four produce 25%. **Adding or removing a level changes the band widths, which can change the rating a given score maps to.** See [Residual Risk in Security Reviews](conducting-a-security-review-legacy.md).

**Existing vendor ratings.** Renaming leaves ratings untouched. Removing a level moves them to wherever you re-assign.

**Expected outcome:** You can predict the downstream effect of a risk level change before making it — particularly whether it will shift residual risk bands or alter which criteria get assessed.

---

## Tips

- **Rename before you restructure.** If your goal is just to match internal vocabulary, renaming achieves it without touching a single vendor or criterion.
- **Check the preview before saving.** The vendor counts tell you how much is riding on a level. A level with hundreds of vendors deserves more thought than an empty one.
- **Empty a level before deleting it.** If its vendors and criteria belong at different destinations, filter the Current vendors table to that level and move them in batches with the bulk actions. Deleting an empty level is a clean, one-step change with nothing to re-assign.
- **Think about band widths before adding or removing levels.** Changing the number of levels changes how residual risk scores map to ratings.
- **Agree the scale once.** Because risk levels drive criteria scoping and residual risk banding — and because levels can't be reordered after creation — frequent changes make historical reviews harder to compare. Settle the scale with your risk and procurement teams, then leave it alone.
- **Use Unscored deliberately.** It's the catch-all for vendors that haven't been assessed yet — a useful filter for finding gaps in your program.

---

## FAQ

**How many risk levels can I have?** Up to seven. Unscored is always available in addition, for vendors without an assigned level.

**Can I rename or delete Unscored?** No. Unscored is fixed and always present.

**Does renaming a level move any vendors?** No. Renaming changes the label only — every vendor and criterion stays where it was.

**What happens to vendors at a level I delete?** Drata asks where to re-assign them before the deletion takes effect, separately for inherent risk, residual risk, and criteria.

**Can I split the re-assignment across several levels instead of one?** Not from the dialog — it sends each group to a single destination. To distribute them, move the vendors and criteria first: filter the Current vendors table and use **More > Update residual risk**, use **Assign inherent risk** on the Criteria page, then delete the level once nothing is assigned to it.

**Can I bulk-set inherent risk to a specific level from the vendors table?** Not directly. The table's **Assess inherent risk** action re-runs Drata's assessment against your inherent risk guidance and assigns levels from that, rather than setting a level you choose. To set inherent risk by hand, edit vendors individually or use the bulk vendor import.

**I don't see Assess inherent risk on the vendors table.** The inherent risk assessment is available with Drata TPRM. Without it, you set inherent risk manually rather than having Drata assess it. Everything else in this article — renaming, adding, and removing risk levels — works either way.

**Why don't the vendor counts in the re-assign dialog add up?** Because a vendor can sit at one level for inherent risk and a different one for residual risk. The dialog counts each assignment separately.

**Can I reorder existing levels?** No. A level's position is set when you create it and can't be changed afterward. Use **Insert risk level** to place a *new* level exactly where you want it. If an existing level is in the wrong position, remove it — re-assigning its vendors and criteria — and insert a replacement in the right place.

**Can I change the color of a risk level?** No. Colors are assigned automatically based on each level's position in the scale, and they adjust as you add or remove levels.

**Will changing risk levels affect past security reviews?** Renaming updates the label shown. Removing a level re-assigns the affected vendors and criteria, so review records will reflect the destination level.

**Does changing the number of levels affect residual risk ratings?** Yes. The agent divides the 0–100% residual risk range evenly across your configured levels, so changing the count changes the band widths.

## Related articles

- [Terminology Updates: Inherent and Residual Risk in Vendor Risk Management](terminology-updates-inherent-and-residual-risk-in-vendor-risk-management.md)
- [Residual Risk in Security Reviews](residual-risk-in-security-reviews.md)
- [Add a vendor or prospective vendor](add-a-vendor-or-prospective-vendor.md)
- [TPRM Agent: Create a Criteria](tprm-agent-create-a-criteria.md)
