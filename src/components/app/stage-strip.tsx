import {
  FieldLabel,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  IconButton,
  Inline,
  Input,
  Stack,
  Stepper,
} from "@ledger/design-system";
import { Plus, Settings2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
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
  const alertCancelRef = useRef<HTMLButtonElement>(null);

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
        <Box className="min-w-0 flex-1 overflow-x-auto pb-050">
          <Stepper label="Stages">
            {stages.map((s, i) => (
              <Stepper.Item
                key={s}
                label={s}
                state={i < idx ? "done" : i === idx ? "current" : "upcoming"}
                onSelect={i === idx ? undefined : () => setPending(s)}
              />
            ))}
          </Stepper>
        </Box>
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
        onOpenChange={(next) => {
          if (!next) {
            setPending(null);
          }
        }}
      >
        <AlertDialogContent
          initialFocus={alertCancelRef}
          className="top-200 translate-y-0 sm:top-1000"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{`Move to ${pending ?? ""}?`}</AlertDialogTitle>
            <AlertDialogDescription>{`The program leaves ${current}. The move is logged with your name.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={alertCancelRef}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="primary"

              onClick={() => {
                (() => {
                  if (pending) setStage(programId, pending, session.name);
                  setPending(null);
                })();
              }}
            >{`Move to ${pending ?? ""}`}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
  const fieldId = useId();

  const [draft, setDraft] = useState<string[]>(stages);
  const [was, setWas] = useState(stages);
  if (was !== stages) {
    setWas(stages);
    setDraft(stages);
  }
  const clean = draft.map((s) => s.trim()).filter(Boolean);

  const selectionItems = [
    { value: "", label: "Choose a template" },
    ...stageSets.map((s) => ({ value: s.id, label: s.name })),
  ];
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
        <DialogHeader>
          <DialogTitle>Stages</DialogTitle>
          <DialogDescription>
            The names the program moves through, in order. RMF is the default; a program can use its
            own.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
          <Stack space="space.150">
            <Field>
              <FieldLabel id={`${fieldId}-start-from-1-label`} htmlFor={`${fieldId}-start-from-1`}>
                {"Start from"}
              </FieldLabel>
              <Select<string>
                items={selectionItems}
                value=""
                onValueChange={(value) => {
                  if (value === null) return;
                  const set = stageSets.find((s) => s.id === value);
                  if (set) setDraft(set.stages);
                }}
              >
                <SelectTrigger
                  id={`${fieldId}-start-from-1`}
                  className="w-full"
                  aria-label="Start from a template"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent aria-labelledby={`${fieldId}-start-from-1-label`}>
                  {selectionItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Stack space="space.075">
              {draft.map((s, i) => (
                <Inline key={i} space="space.075" alignBlock="center">
                  <Input
                    size="small"
                    value={s}
                    aria-label={`Stage ${i + 1}`}
                    onChange={(e) =>
                      setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))
                    }
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
              <Button
                size="small"
                iconBefore={<Plus />}
                onClick={() => setDraft((d) => [...d, ""])}
              >
                Add stage
              </Button>
            </Inline>
          </Stack>
        </Box>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { applyStageSet };
