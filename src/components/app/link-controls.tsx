import {
  FieldLabel,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Field,
  Id,
  PickerSheet,
  Stack,
  Table,
  Text,
  Textarea,
  toast,
} from "@ledger/design-system";
import { useId, useMemo, useState } from "react";
import { record } from "@/lib/activity";
import { controlMatrix } from "@/lib/control-matrix";
import { currentSession } from "@/lib/control-work";
import {
  linkRequirementControls,
  useRequirementsVersion,
  type Requirement,
} from "@/lib/requirements";
import { useScopesVersion } from "@/lib/scopes";

/** Requirement relationships are authored here, independently of where the requirement is allocated. */
export function LinkControlsSheet({
  requirement,
  open,
  onClose,
}: {
  requirement: Requirement;
  open: boolean;
  onClose: () => void;
}) {
  const fieldId = useId();

  const version = useRequirementsVersion();
  const scopeVersion = useScopesVersion();
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [relation, setRelation] = useState<"mapped" | "derived">("mapped");
  const [rationale, setRationale] = useState("");
  const controls = useMemo(() => {
    const already = new Set(
      requirement.derivations
        .filter(
          (source) => source.sourceType === "Control statement" || source.sourceType === "Overlay",
        )
        .map((source) => source.sourceId),
    );
    return controlMatrix(requirement.program).filter((control) => !already.has(control.id));
  }, [requirement, version, scopeVersion]);
  const search = query.trim().toLowerCase();
  const rows = controls.filter(
    (control) => !search || `${control.id} ${control.fullTitle}`.toLowerCase().includes(search),
  );
  const toggle = (id: string) =>
    setChosen((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const close = () => {
    setQuery("");
    setChosen(new Set());
    setRelation("mapped");
    setRationale("");
    onClose();
  };
  const apply = () => {
    try {
      const linked = linkRequirementControls(
        requirement.id,
        controls
          .filter((control) => chosen.has(control.id))
          .map((control) => ({ id: control.id, label: control.fullTitle })),
        relation,
        rationale,
      );
      for (const id of linked)
        record({
          program: requirement.program,
          actor: currentSession().name,
          kind: "link",
          summary: `${relation === "mapped" ? "mapped it to" : "recorded its derivation from"} ${id}`,
          body: rationale.trim(),
          subject: { kind: "requirement", id: requirement.id },
          about: { kind: "control", id },
        });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Controls could not be linked.");
    }
  };
  const relationItems = [
    { value: "mapped", label: "Mapped to — supports a control" },
    { value: "derived", label: "Derived from — the control is its source" },
  ];
  return (
    <PickerSheet
      open={open}
      onClose={close}
      title={`Link controls to ${requirement.id}`}
      subtitle={requirement.text}
      search={{ value: query, onChange: setQuery, placeholder: "Find a control" }}
      selected={chosen.size}
      total={rows.length}
      onClear={() => setChosen(new Set())}
      action={{
        label: chosen.size
          ? `Link ${chosen.size} control${chosen.size === 1 ? "" : "s"}`
          : "Link controls",
        onClick: apply,
        disabled: !chosen.size || !rationale.trim(),
      }}
      toolbar={
        <Stack space="space.150">
          <Field>
            <FieldLabel
              id={`${fieldId}-relationship-1-label`}
              htmlFor={`${fieldId}-relationship-1`}
            >
              {"Relationship"}
            </FieldLabel>
            <Select<string>
              items={relationItems}
              value={relation}
              onValueChange={(value) => {
                if (value === null) return;
                return setRelation(value as typeof relation);
              }}
            >
              <SelectTrigger
                id={`${fieldId}-relationship-1`}
                aria-labelledby={`${fieldId}-relationship-1-label`}
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent aria-labelledby={`${fieldId}-relationship-1-label`}>
                {relationItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel id={`${fieldId}-rationale-2-label`} htmlFor={`${fieldId}-rationale-2`}>
              {"Rationale"}
              <span aria-hidden="true" className="text-danger">
                {" "}
                *
              </span>
            </FieldLabel>
            <Textarea
              id={`${fieldId}-rationale-2`}
              aria-labelledby={`${fieldId}-rationale-2-label`}
              aria-required={true}
              rows={2}
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              placeholder="How this requirement relates to the selected controls"
            />
          </Field>
        </Stack>
      }
    >
      <Table>
        <thead>
          <Table.Row>
            <Table.Header width={40}>
              <span className="sr-only">Select</span>
            </Table.Header>
            <Table.Header width={110}>Control</Table.Header>
            <Table.Header>Title</Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          {rows.map((control) => (
            <Table.Row
              key={control.id}
              isSelected={chosen.has(control.id)}
              onClick={() => toggle(control.id)}
              className="cursor-pointer"
            >
              <Table.Selection
                checked={chosen.has(control.id)}
                onCheckedChange={() => toggle(control.id)}
                label={`Select ${control.id}`}
              />
              <Table.Cell>
                <Id>{control.id}</Id>
              </Table.Cell>
              <Table.Cell>{control.fullTitle}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      {!rows.length ? (
        <Text as="p" size="small" color="color.text.subtle">
          No unlinked controls match.
        </Text>
      ) : null}
    </PickerSheet>
  );
}
