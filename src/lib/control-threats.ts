import {
  ATTACK_FRAMEWORK,
  itemReference,
  propList,
  propText,
  type FrameworkControlLink,
  type FrameworkItem,
} from "./frameworks";
import type { CounteringApproach, TechniqueMitigation, ThreatTactic } from "./risk-threats";

/*
 * The threats a control counters, in ATT&CK's words. Appendix F of NIST SP 800-160 Vol. 2 Rev. 1
 * prints, for each ATT&CK technique, the mitigations and the controls that counter it, with the
 * cyber resiliency approaches each control works through and its effects on the adversary. Read
 * from the control's side, that is one line a technique: the tactics it is printed under, the
 * mitigations, the approaches and the effects. The reads are in frameworks.ts (the appendix's
 * `mitigates` links narrowed to the control); this module regroups them.
 */

/** An ATT&CK technique a control counters, once over every tactic's table. */
export type CounteredTechnique = {
  /** The technique's item, in the reading of the appendix the links came from: its preview's record. */
  id: string;
  /** The ATT&CK identifier: "T1133". */
  code: string;
  title: string;
  /** The tactics whose tables print the control against it, in the order of the appendix's tables. */
  tactics: ThreatTactic[];
  /** The mitigations whose rows print the control: ATT&CK's own, then the appendix's candidates. */
  mitigations: TechniqueMitigation[];
  /** The approaches the control counters it through, in the order first printed. */
  approaches: CounteringApproach[];
  /** The effects on the adversary those rows print, in the order of Table F-1. */
  effects: string[];
};

/** A place in the publication, or an identifier (`T1557.002`), compares number by number. */
const comparePlace = new Intl.Collator("en", { numeric: true }).compare;
const LAST = Number.MAX_SAFE_INTEGER;

/**
 * The techniques a control counters, in the order of their identifiers, from the appendix's rows
 * for it (`useFrameworkControlLinks(ATTACK_FRAMEWORK, { controlIds: [id], relation: "mitigates" })`).
 * A technique that sits under several tactics is printed in each one's table: it is listed once,
 * with every tactic, mitigation, approach and effect those rows print. `attack` names the tactics
 * and the mitigations and orders the tactics and the effects (the framework's `tactic`,
 * `mitigation`, `candidate-mitigation` and `effect` items); `approaches` names the approaches (the
 * cyber resiliency framework's `approach` items). What a list lacks reads as its code.
 */
export function controlThreats(
  links: readonly FrameworkControlLink[],
  vocabulary: {
    attack: readonly Pick<FrameworkItem, "code" | "kind" | "title" | "ordinal">[];
    approaches: readonly Pick<FrameworkItem, "code" | "title">[];
  },
): CounteredTechnique[] {
  const attack = new Map(vocabulary.attack.map((item) => [item.code, item]));
  const approachTitles = new Map(vocabulary.approaches.map((item) => [item.code, item.title]));
  const effectPlace = new Map(
    vocabulary.attack
      .filter((item) => item.kind === "effect")
      .map((item) => [item.title, item.ordinal]),
  );
  const techniques = new Map<string, CounteredTechnique>();
  const printed = links
    .filter((link) => link.relation === "mitigates")
    .sort((a, b) => comparePlace(a.source_identifier, b.source_identifier));
  for (const link of printed) {
    const technique = techniques.get(link.item_code) ?? {
      id: link.item_id,
      code: link.item_code,
      title: link.item_title,
      tactics: [],
      mitigations: [],
      approaches: [],
      effects: [],
    };
    techniques.set(link.item_code, technique);
    const tactic = propText(link.props, "tactic");
    if (tactic && !technique.tactics.some((held) => held.code === tactic))
      technique.tactics.push({ code: tactic, title: attack.get(tactic)?.title ?? tactic });
    const mitigation = propText(link.props, "mitigation");
    if (mitigation && !technique.mitigations.some((held) => held.code === mitigation)) {
      const item = attack.get(mitigation);
      technique.mitigations.push({
        code: mitigation,
        title: item?.title ?? mitigation,
        candidate: item ? item.kind === "candidate-mitigation" : mitigation.startsWith("CM"),
      });
    }
    for (const reference of propList(link.props, "approaches")) {
      const { code } = itemReference(reference, ATTACK_FRAMEWORK);
      if (!technique.approaches.some((held) => held.code === code))
        technique.approaches.push({ code, title: approachTitles.get(code) ?? code });
    }
    for (const effect of propList(link.props, "effects"))
      if (!technique.effects.includes(effect)) technique.effects.push(effect);
  }
  const tacticPlace = (tactic: ThreatTactic) => attack.get(tactic.code)?.ordinal ?? LAST;
  const effectAt = (effect: string) => effectPlace.get(effect) ?? LAST;
  for (const technique of techniques.values()) {
    // Stable: what the vocabulary does not name keeps the order it was printed in, after the rest.
    technique.tactics.sort((a, b) => tacticPlace(a) - tacticPlace(b));
    technique.effects.sort((a, b) => effectAt(a) - effectAt(b));
    technique.mitigations.sort(
      (a, b) => Number(a.candidate) - Number(b.candidate) || comparePlace(a.code, b.code),
    );
  }
  return [...techniques.values()].sort((a, b) => comparePlace(a.code, b.code));
}

/**
 * How many risks name each ATT&CK technique, by the technique's identifier. A risk's link keeps
 * the item it was made from, and an item's id changes when the appendix is read again while its
 * code does not: `items` gives the code of every item the links name, and a link whose item is
 * not among them is passed over. A risk that names a technique twice, through two readings, counts
 * once.
 */
export function risksByTechnique(
  links: readonly { risk_id: string; framework_item_id: string }[],
  items: readonly { id: string; code: string }[],
): Map<string, number> {
  const codes = new Map(items.map((item) => [item.id, item.code]));
  const risks = new Map<string, Set<string>>();
  for (const link of links) {
    const code = codes.get(link.framework_item_id);
    if (!code) continue;
    const named = risks.get(code) ?? new Set<string>();
    risks.set(code, named);
    named.add(link.risk_id);
  }
  return new Map([...risks].map(([code, named]) => [code, named.size]));
}
