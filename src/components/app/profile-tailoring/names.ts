/**
 * A parameter's name in the tailoring screens: its label, or, for a selection the catalog leaves
 * unlabelled (OSCAL gives a selection its choices, not a label), the choices it offers; the source
 * id when it has neither.
 */
export function parameterName(
  parameter: { source_id: string; label: string | null },
  choices: readonly string[],
) {
  if (parameter.label) return parameter.label;
  if (choices.length) return `Choose: ${choices.join("; ")}`;
  return parameter.source_id;
}
