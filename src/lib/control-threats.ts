import {
  ATTACK_FRAMEWORK,
  ATTACK_FRAMEWORKS,
  itemReference,
  propList,
  propText,
  type FrameworkControlLink,
  type FrameworkItem,
} from "./frameworks";
import type { CounteringApproach, TechniqueMitigation, ThreatTactic } from "./risk-threats";

/*
 * The threats a control counters, in ATT&CK's words. Appendix F of NIST SP 800-160 Vol. 2 Rev. 1
 * prints, for each ATT&CK for Enterprise technique, the mitigations and the controls that counter
 * it, with the cyber resiliency approaches each control works through and its effects on the
 * adversary, and Appendix G does the same for ATT&CK for ICS. Read from the control's side, that is
 * one line a technique: the tactics it is printed under, the mitigations, the approaches and the
 * effects. The reads are in frameworks.ts (the appendices' `mitigates` links narrowed to the
 * control); this module regroups them.
 */

/** An ATT&CK technique a control counters, once over every tactic's table. */
export type CounteredTechnique = {
  /** The technique's item, in the reading of the appendix the links came from: its preview's record. */
  id: string;
  /** The ATT&CK identifier: "T1133", or "T0819" in ATT&CK for ICS. */
  code: string;
  title: string;
  /** The framework that prints it: Appendix F's for ATT&CK for Enterprise, Appendix G's for ICS. */
  framework: string;
  /** The tactics whose tables print the control against it, in the order of the appendix's tables. */
  tactics: ThreatTactic[];
  /** The mitigations whose rows print the control: ATT&CK's own, then the appendix's candidates. */
  mitigations: TechniqueMitigation[];
  /** The approaches the control counters it through, in the order first printed. */
  approaches: CounteringApproach[];
  /** The effects on the adversary those rows print, in the order of Table F-1. */
  effects: string[];
};

/** An item of the ATT&CK vocabulary: a tactic, a mitigation, a candidate mitigation, an effect. */
export type AttackVocabularyItem = Pick<FrameworkItem, "code" | "kind" | "title" | "ordinal"> & {
  /** The framework that holds it; a tactic's code, its name, may stand in both. */
  framework_code?: string | undefined;
};

/** A place in the publication, or an identifier (`T1557.002`), compares number by number. */
const comparePlace = new Intl.Collator("en", { numeric: true }).compare;
const LAST = Number.MAX_SAFE_INTEGER;

/** Where a framework's techniques stand among both appendices': Enterprise, then ICS. */
export function matrixPlace(framework: string | null | undefined): number {
  const place = ATTACK_FRAMEWORKS.indexOf(framework ?? "");
  return place === -1 ? ATTACK_FRAMEWORKS.length : place;
}

/**
 * The ATT&CK vocabulary named by framework and code: a tactic's code is its name, and both
 * appendices print an Initial Access, so an item is looked up in the framework that prints the
 * row first, and only then by its code alone, as a mitigation's identifier names it in one
 * framework only.
 */
export function attackVocabulary(items: readonly AttackVocabularyItem[]) {
  const scoped = new Map<string, AttackVocabularyItem>();
  const byCode = new Map<string, AttackVocabularyItem>();
  for (const item of items) {
    scoped.set(`${item.framework_code ?? ""} ${item.code}`, item);
    if (!byCode.has(item.code)) byCode.set(item.code, item);
  }
  return (framework: string | null | undefined, code: string) =>
    scoped.get(`${framework ?? ""} ${code}`) ?? byCode.get(code);
}

/**
 * The techniques a control counters, ATT&CK for Enterprise's first and then ATT&CK for ICS's, each
 * in the order of their identifiers, from the appendices' rows for it
 * (`useFrameworkControlLinks(ATTACK_FRAMEWORKS, { controlIds: [id], relation: "mitigates" })`). A
 * technique that sits under several tactics is printed in each one's table: it is listed once,
 * with every tactic, mitigation, approach and effect those rows print. `attack` names the tactics
 * and the mitigations and orders the tactics and the effects (both frameworks' `tactic`,
 * `mitigation` and `candidate-mitigation` items, and Table F-1's `effect` items); `approaches`
 * names the approaches (the cyber resiliency framework's `approach` items). What a list lacks
 * reads as its code.
 */
export function controlThreats(
  links: readonly FrameworkControlLink[],
  vocabulary: {
    attack: readonly AttackVocabularyItem[];
    approaches: readonly Pick<FrameworkItem, "code" | "title">[];
  },
): CounteredTechnique[] {
  const named = attackVocabulary(vocabulary.attack);
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
    const framework = link.framework_code ?? ATTACK_FRAMEWORK;
    const key = `${framework} ${link.item_code}`;
    const technique = techniques.get(key) ?? {
      id: link.item_id,
      code: link.item_code,
      title: link.item_title,
      framework,
      tactics: [],
      mitigations: [],
      approaches: [],
      effects: [],
    };
    techniques.set(key, technique);
    const tactic = propText(link.props, "tactic");
    if (tactic && !technique.tactics.some((held) => held.code === tactic))
      technique.tactics.push({ code: tactic, title: named(framework, tactic)?.title ?? tactic });
    const mitigation = propText(link.props, "mitigation");
    if (mitigation && !technique.mitigations.some((held) => held.code === mitigation)) {
      const item = named(framework, mitigation);
      technique.mitigations.push({
        code: mitigation,
        title: item?.title ?? mitigation,
        candidate: item ? item.kind === "candidate-mitigation" : mitigation.startsWith("CM"),
      });
    }
    for (const reference of propList(link.props, "approaches")) {
      const { code } = itemReference(reference, framework);
      if (!technique.approaches.some((held) => held.code === code))
        technique.approaches.push({ code, title: approachTitles.get(code) ?? code });
    }
    for (const effect of propList(link.props, "effects"))
      if (!technique.effects.includes(effect)) technique.effects.push(effect);
  }
  const effectAt = (effect: string) => effectPlace.get(effect) ?? LAST;
  for (const technique of techniques.values()) {
    const tacticPlace = (tactic: ThreatTactic) =>
      named(technique.framework, tactic.code)?.ordinal ?? LAST;
    // Stable: what the vocabulary does not name keeps the order it was printed in, after the rest.
    technique.tactics.sort((a, b) => tacticPlace(a) - tacticPlace(b));
    technique.effects.sort((a, b) => effectAt(a) - effectAt(b));
    technique.mitigations.sort(
      (a, b) => Number(a.candidate) - Number(b.candidate) || comparePlace(a.code, b.code),
    );
  }
  return [...techniques.values()].sort(
    (a, b) => matrixPlace(a.framework) - matrixPlace(b.framework) || comparePlace(a.code, b.code),
  );
}

/**
 * How many risks name each ATT&CK technique, by the technique's identifier, which names it in one
 * matrix only. A risk's link keeps the item it was made from, and an item's id changes when the
 * appendix is read again while its code does not: `items` gives the code of every item the links
 * name, and a link whose item is not among them is passed over. A risk that names a technique
 * twice, through two readings, counts once.
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
