import { Plus, Settings2, X } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  Button,
  Dialog,
  Field,
  IconButton,
  Input,
  NativeSelect,
  Stepper,
} from "@ledger/design-system";
import { Inline, Stack } from "@ledger/design-system";

import { currentSession } from "@/lib/control-work";
import {
  applyStageSet,
  setStage,
  setStages,
  stageOf,
  stageSets,
  stagesFor,
  useStagesVersion,
} from "@/lib/stages";

/** Where the program is on its own stages. A step is a button: choosing one asks, then moves and logs. The gear edits the names. */
export function StageStrip({ programId }: { programId: string }) {
  useStagesVersion();
  const stages = stagesFor(programId);
  const current = stageOf(programId);
  const idx = stages.indexOf(current);
  const [pending, setPending] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const session = currentSession();

  return (
    <>
      <Inline space="space.150" alignBlock="start">
        <Stepper label="Stages" className="min-w-0 flex-1">
          {stages.map((s, i) => (
            <Stepper.Item
              key={s}
              label={s}
              state={i < idx ? "done" : i === idx ? "current" : "upcoming"}
              onSelect={i === idx ? undefined : () => setPending(s)}
            />
          ))}
        </Stepper>
        <IconButton
          label="Edit stages"
          variant="subtle"
          size="small"
          icon={<Settings2 />}
          onClick={() => setEditing(true)}
        />
      </Inline>

      <AlertDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) setStage(programId, pending, session.name);
          setPending(null);
        }}
        title={`Move to ${pending ?? ""}?`}
        description={`The program leaves ${current}. The move is logged with your name.`}
        confirmLabel={`Move to ${pending ?? ""}`}
      />

      <StagesDialog
        open={editing}
        onClose={() => setEditing(false)}
        programId={programId}
        stages={stages}
        actor={session.name}
      />
    </>
  );
}

function StagesDialog({
  open,
  onClose,
  programId,
  stages,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  stages: string[];
  actor: string;
}) {
  const [draft, setDraft] = useState<string[]>(stages);
  const [was, setWas] = useState(stages);
  if (was !== stages) {
    setWas(stages);
    setDraft(stages);
  }
  const clean = draft.map((s) => s.trim()).filter(Boolean);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Stages"
      description="The names the program moves through, in order. RMF is the default; a program can use its own."
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={clean.length === 0}
            onClick={() => {
              setStages(programId, clean, actor);
              onClose();
            }}
          >
            Save stages
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field label="Start from">
          <NativeSelect
            value=""
            onChange={(e) => {
              const set = stageSets.find((s) => s.id === e.target.value);
              if (set) setDraft(set.stages);
            }}
            aria-label="Start from a template"
          >
            <option value="">Choose a template</option>
            {stageSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Stack space="space.075">
          {draft.map((s, i) => (
            <Inline key={i} space="space.075" alignBlock="center">
              <Input
                size="small"
                value={s}
                aria-label={`Stage ${i + 1}`}
                onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
              />
              <IconButton
                label={`Remove stage ${i + 1}`}
                variant="subtle"
                size="small"
                icon={<X />}
                onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
              />
            </Inline>
          ))}
        </Stack>
        <Inline>
          <Button size="small" iconBefore={<Plus />} onClick={() => setDraft((d) => [...d, ""])}>
            Add stage
          </Button>
        </Inline>
      </Stack>
    </Dialog>
  );
}

export { applyStageSet };
