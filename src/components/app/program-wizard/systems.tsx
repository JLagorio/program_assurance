import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Box,
  Button,
  Section,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  Tree,
} from "@ledger/design-system";
import type { Row } from "@/lib/models";
import type { ProgramWizardDraft, SystemWizardDraft } from "@/lib/program-wizard";
import { ChoiceField, PartyField, TextField } from "./fields";

const systemTypes = [
  { value: "information_system", label: "Information system" },
  { value: "industrial_control_system", label: "Industrial control system" },
  { value: "platform", label: "Platform" },
  { value: "service", label: "Service" },
];
const nodeTypes = [
  "subsystem",
  "hardware",
  "software",
  "network",
  "service",
  "facility",
  "data",
  "other",
].map((value) => ({ value, label: value[0]!.toUpperCase() + value.slice(1) }));
type Subsystem = SystemWizardDraft["subsystems"][number];
type Editing = { systemKey: string; nodeKey: string | null } | null;

export function SystemsStep({
  draft,
  onChange,
  parties,
  newSystem,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  parties: Row<"parties">[];
  newSystem: () => SystemWizardDraft;
}) {
  const [editing, setEditing] = useState<Editing>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(draft.systems.map((system) => system.key)),
  );
  const system = draft.systems.find((item) => item.key === editing?.systemKey);
  const node = system?.subsystems.find((item) => item.key === editing?.nodeKey);
  const target = editing?.nodeKey ? node : system;
  function patchSystem(key: string, patch: Partial<SystemWizardDraft>) {
    onChange({
      ...draft,
      systems: draft.systems.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    });
  }
  function patchTarget(patch: Partial<Pick<Subsystem, "name" | "code" | "description" | "type">>) {
    if (!system) return;
    if (node)
      patchSystem(system.key, {
        subsystems: system.subsystems.map((item) =>
          item.key === node.key ? { ...item, ...patch } : item,
        ),
      });
    else patchSystem(system.key, patch as Partial<SystemWizardDraft>);
  }
  function toggle(key: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function addNode(parentSystem: SystemWizardDraft, parentKey: string | null) {
    const key = crypto.randomUUID();
    patchSystem(parentSystem.key, {
      subsystems: [
        ...parentSystem.subsystems,
        { key, parentKey, code: "", name: "", description: "", type: "subsystem" },
      ],
    });
    setExpanded((previous) => new Set(previous).add(parentKey ?? parentSystem.key));
    setEditing({ systemKey: parentSystem.key, nodeKey: key });
  }
  function removeNode(parentSystem: SystemWizardDraft, key: string) {
    const removed = new Set([key]);
    let previousSize = 0;
    while (previousSize !== removed.size) {
      previousSize = removed.size;
      parentSystem.subsystems.forEach((item) => {
        if (item.parentKey && removed.has(item.parentKey)) removed.add(item.key);
      });
    }
    if (
      removed.size > 1 &&
      !window.confirm(
        `Remove this subsystem and its ${removed.size - 1} nested subsystem(s) from the draft?`,
      )
    )
      return;
    patchSystem(parentSystem.key, {
      subsystems: parentSystem.subsystems.filter((item) => !removed.has(item.key)),
    });
    if (editing?.nodeKey && removed.has(editing.nodeKey)) setEditing(null);
  }
  function nodeRows(
    parentSystem: SystemWizardDraft,
    parentKey: string | null,
    depth: number,
  ): React.ReactNode[] {
    return parentSystem.subsystems
      .filter((item) => item.parentKey === parentKey)
      .flatMap((item) => {
        const hasChildren = parentSystem.subsystems.some((child) => child.parentKey === item.key);
        return [
          <Tree.Item
            key={item.key}
            depth={depth}
            hasChildren={hasChildren}
            expanded={expanded.has(item.key)}
            onToggle={() => toggle(item.key)}
            isSelected={editing?.nodeKey === item.key}
            onSelect={() => setEditing({ systemKey: parentSystem.key, nodeKey: item.key })}
            trailing={
              <>
                <Button
                  variant="subtle"
                  size="xsmall"
                  onClick={() => addNode(parentSystem, item.key)}
                  aria-label={`Add subsystem under ${item.name || "unnamed subsystem"}`}
                >
                  <Plus className="size-150" /> Subsystem
                </Button>
                <Button
                  variant="subtle"
                  size="xsmall"
                  aria-label={`Remove ${item.name || "unnamed subsystem"}`}
                  onClick={() => removeNode(parentSystem, item.key)}
                >
                  <Trash2 className="size-150" />
                </Button>
              </>
            }
          >
            <span className="truncate font-body">{item.name || "Unnamed subsystem"}</span>
            <span className="truncate font-body-xsmall text-subtle">
              {item.code || "Code required"}
            </span>
          </Tree.Item>,
          ...(expanded.has(item.key) ? nodeRows(parentSystem, item.key, depth + 1) : []),
        ];
      });
  }
  return (
    <Section
      title="Systems and subsystems"
      count={`${draft.systems.length} system${draft.systems.length === 1 ? "" : "s"}`}
      action={
        <Button
          size="small"
          iconBefore={<Plus />}
          onClick={() => {
            const added = newSystem();
            onChange({ ...draft, systems: [...draft.systems, added] });
            setExpanded((previous) => new Set(previous).add(added.key));
            setEditing({ systemKey: added.key, nodeKey: null });
          }}
        >
          Add system
        </Button>
      }
    >
      <p className="pb-100 font-body-small text-subtle">
        Define each system boundary and its composition. Each system receives its own
        categorization, profile, and draft system security plan.
      </p>
      <Tree label="Systems">
        {draft.systems.flatMap((item) => [
          <Tree.Item
            key={item.key}
            depth={0}
            hasChildren={item.subsystems.length > 0}
            expanded={expanded.has(item.key)}
            onToggle={() => toggle(item.key)}
            isSelected={editing?.systemKey === item.key && !editing.nodeKey}
            onSelect={() => setEditing({ systemKey: item.key, nodeKey: null })}
            trailing={
              <>
                <Badge size="xsmall" variant="secondary" tone="information">
                  System
                </Badge>
                <Button
                  variant="subtle"
                  size="xsmall"
                  onClick={() => addNode(item, null)}
                  aria-label={`Add subsystem under ${item.name || "unnamed system"}`}
                >
                  <Plus className="size-150" /> Subsystem
                </Button>
                {draft.systems.length > 1 ? (
                  <Button
                    variant="subtle"
                    size="xsmall"
                    aria-label={`Remove ${item.name || "unnamed system"}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove ${item.name || "this system"} and its setup from the draft?`,
                        )
                      ) {
                        onChange({
                          ...draft,
                          systems: draft.systems.filter((other) => other.key !== item.key),
                        });
                        if (editing?.systemKey === item.key) setEditing(null);
                      }
                    }}
                  >
                    <Trash2 className="size-150" />
                  </Button>
                ) : null}
              </>
            }
          >
            <span className="truncate font-body">{item.name || "Unnamed system"}</span>
            <span className="truncate font-body-xsmall text-subtle">
              {item.code || "Code required"}
            </span>
          </Tree.Item>,
          ...(expanded.has(item.key) ? nodeRows(item, null, 1) : []),
        ])}
      </Tree>
      <Sheet
        open={!!target}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <SheetContent side="end" style={{ maxWidth: 420 }}>
          <SheetHeader>
            <SheetTitle>
              {node ? "Subsystem" : "System"} · {target?.name || "Unnamed"}
            </SheetTitle>
            <SheetDescription>
              {node
                ? `Under ${system?.name || "the system"}. Categorization and controls are set at the system boundary.`
                : "Define the system boundary and its owner."}
            </SheetDescription>
          </SheetHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
            {target ? (
              <Stack space="space.150">
                <TextField
                  label="Name"
                  value={target.name}
                  onChange={(name) => patchTarget({ name })}
                  required
                  autoFocus
                />
                <TextField
                  label="Code"
                  value={target.code}
                  onChange={(code) => patchTarget({ code })}
                  required
                  description="Your stable identifier for this record."
                />
                <TextField
                  label="Function"
                  value={target.description}
                  onChange={(description) => patchTarget({ description })}
                  multiline
                  description="What it does for the mission."
                />
                <ChoiceField
                  label="Type"
                  value={target.type}
                  onChange={(type) => {
                    if (node) patchTarget({ type: type as Subsystem["type"] });
                    else if (system)
                      patchSystem(system.key, { type: type as SystemWizardDraft["type"] });
                  }}
                  options={node ? nodeTypes : systemTypes}
                  required
                />
                {!node && system ? (
                  <PartyField
                    label="System owner"
                    value={system.ownerPartyId}
                    onChange={(ownerPartyId) => patchSystem(system.key, { ownerPartyId })}
                    parties={parties}
                  />
                ) : null}
              </Stack>
            ) : null}
          </Box>
          <SheetFooter>
            <Button variant="primary" onClick={() => setEditing(null)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Section>
  );
}
