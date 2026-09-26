import { DatePicker, Field, FieldError, FieldLabel, Grid, Stack } from "@ledger/design-system";
import type { Row } from "@/lib/models";
import type { ProgramWizardDraft } from "@/lib/program-wizard";
import { PartyField, TextField } from "../fields";
import { wizardField } from "./issues";

type Role = "program_manager" | "authorizing_official" | "assessor";
const roles: { role: Role; label: string }[] = [
  { role: "program_manager", label: "Program manager" },
  { role: "authorizing_official", label: "Authorizing official" },
  { role: "assessor", label: "Assessor" },
];

/** Step 1: what the program is, who answers for it and, if it has one, its period. */
export function ProgramStep({
  draft,
  onChange,
  parties,
  errorFor,
  controlRef,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  parties: Row<"parties">[];
  /** The field's message from the last Continue, once the step has been checked. */
  errorFor: (field: string) => string | undefined;
  /** Registers a field's control, for focus on arrival and from the error summary. */
  controlRef: (field: string) => (node: HTMLElement | null) => void;
}) {
  const patch = (values: Partial<ProgramWizardDraft>) => onChange({ ...draft, ...values });
  function setRole(role: Role, partyId: string | null) {
    patch({
      roles: [
        ...draft.roles.filter((assignment) => assignment.role !== role),
        ...(partyId ? [{ role, partyId }] : []),
      ],
    });
  }
  return (
    <Stack space="space.200">
      <Grid
        gap="space.150"
        templateColumns={{ base: "minmax(0,1fr)", sm: "minmax(0,1fr) minmax(0,12rem)" }}
      >
        <TextField
          label="Program name"
          value={draft.name}
          onChange={(name) => patch({ name })}
          required
          error={errorFor("name")}
          controlRef={controlRef("name")}
        />
        <TextField
          label="Program code"
          value={draft.code}
          onChange={(code) => patch({ code })}
          required
          error={errorFor("code")}
          controlRef={controlRef("code")}
        />
      </Grid>
      <TextField
        label="Mission"
        value={draft.description}
        onChange={(description) => patch({ description })}
        multiline
        description="What the program does and for whom."
        error={errorFor("description")}
        controlRef={controlRef("description")}
      />
      <Grid
        gap="space.150"
        templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
      >
        <PartyField
          label="Sponsor"
          value={draft.sponsorPartyId}
          onChange={(sponsorPartyId) => patch({ sponsorPartyId })}
          parties={parties}
          error={errorFor("sponsor")}
          controlRef={controlRef("sponsor")}
        />
        {roles.map(({ role, label }) => (
          <PartyField
            key={role}
            label={label}
            value={draft.roles.find((assignment) => assignment.role === role)?.partyId}
            onChange={(partyId) => setRole(role, partyId)}
            parties={parties}
            error={errorFor(wizardField.role(role))}
            controlRef={controlRef(wizardField.role(role))}
          />
        ))}
      </Grid>
      <Grid
        gap="space.150"
        templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
      >
        {/* Each end limits the other, so the period cannot end before it starts. */}
        <Field invalid={errorFor("startsOn") ? true : undefined}>
          <FieldLabel>Starts on</FieldLabel>
          <DatePicker
            ref={controlRef("startsOn")}
            value={draft.startsOn ?? ""}
            onValueChange={(startsOn) => patch({ startsOn: startsOn || null })}
            {...(draft.endsOn ? { max: draft.endsOn } : {})}
          />
          {errorFor("startsOn") ? <FieldError>{errorFor("startsOn")}</FieldError> : null}
        </Field>
        <Field invalid={errorFor("endsOn") ? true : undefined}>
          <FieldLabel>Ends on</FieldLabel>
          <DatePicker
            ref={controlRef("endsOn")}
            value={draft.endsOn ?? ""}
            onValueChange={(endsOn) => patch({ endsOn: endsOn || null })}
            {...(draft.startsOn ? { min: draft.startsOn } : {})}
          />
          {errorFor("endsOn") ? <FieldError>{errorFor("endsOn")}</FieldError> : null}
        </Field>
      </Grid>
    </Stack>
  );
}
