import { useId } from "react";
import { Field, FieldLabel, Grid, Input, Section, Stack } from "@ledger/design-system";
import type { Row } from "@/lib/models";
import type { ProgramWizardDraft } from "@/lib/program-wizard";
import { PartyField, TextField } from "./fields";

export function ProgramStep({
  draft,
  onChange,
  parties,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  parties: Row<"parties">[];
}) {
  const id = useId();
  const patch = (values: Partial<ProgramWizardDraft>) => onChange({ ...draft, ...values });
  function setRole(role: ProgramWizardDraft["roles"][number]["role"], partyId: string | null) {
    patch({
      roles: [
        ...draft.roles.filter((assignment) => assignment.role !== role),
        ...(partyId ? [{ role, partyId }] : []),
      ],
    });
  }
  return (
    <Stack space="space.200">
      <Section title="Program">
        <Stack space="space.150">
          <Grid gap="space.150" templateColumns="minmax(0,1fr) 160px">
            <TextField
              label="Program name"
              value={draft.name}
              onChange={(name) => patch({ name })}
              required
              autoFocus
            />
            <TextField
              label="Program code"
              value={draft.code}
              onChange={(code) => patch({ code })}
              required
            />
          </Grid>
          <TextField
            label="Mission"
            value={draft.description}
            onChange={(description) => patch({ description })}
            multiline
            description="What the program does and for whom."
          />
          <Grid
            gap="space.150"
            templateColumns={{ base: "minmax(0,1fr)", lg: "repeat(2,minmax(0,1fr))" }}
          >
            <PartyField
              label="Sponsor"
              value={draft.sponsorPartyId}
              onChange={(sponsorPartyId) => patch({ sponsorPartyId })}
              parties={parties}
            />
            <PartyField
              label="Program manager"
              value={
                draft.roles.find((assignment) => assignment.role === "program_manager")?.partyId
              }
              onChange={(partyId) => setRole("program_manager", partyId)}
              parties={parties}
            />
            <PartyField
              label="Authorizing official"
              value={
                draft.roles.find((assignment) => assignment.role === "authorizing_official")
                  ?.partyId
              }
              onChange={(partyId) => setRole("authorizing_official", partyId)}
              parties={parties}
            />
            <PartyField
              label="Assessor"
              value={draft.roles.find((assignment) => assignment.role === "assessor")?.partyId}
              onChange={(partyId) => setRole("assessor", partyId)}
              parties={parties}
            />
          </Grid>
          <Grid gap="space.150" templateColumns="repeat(2,minmax(0,1fr))">
            <Field>
              <FieldLabel htmlFor={`${id}-start`}>Starts on</FieldLabel>
              <Input
                id={`${id}-start`}
                type="date"
                value={draft.startsOn ?? ""}
                onChange={(event) => patch({ startsOn: event.target.value || null })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-end`}>Ends on</FieldLabel>
              <Input
                id={`${id}-end`}
                type="date"
                value={draft.endsOn ?? ""}
                onChange={(event) => patch({ endsOn: event.target.value || null })}
              />
            </Field>
          </Grid>
        </Stack>
      </Section>
    </Stack>
  );
}
