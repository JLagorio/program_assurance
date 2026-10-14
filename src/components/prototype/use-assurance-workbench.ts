import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  applyEdits,
  applyOperation,
  createHistory,
  deserializeWorkbook,
  serializeWorkbook,
  validateWorkbook,
  type Workbook,
  type WorkbookOperation,
} from "@ledger/spreadsheet-core";
import {
  createCalculationClient,
  SupersededCalculationError,
} from "@ledger/spreadsheet-core/worker-client";
import type { CalculationResult } from "@ledger/spreadsheet-core";
import { useWorkspace } from "@/components/app/workspace";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  applyAssuranceChangesSchema,
  assuranceWorkbookSchema,
  mappingWorkbookChangeSchema,
  requirementWorkbookFields,
  saveAssuranceWorkbookSchema,
  useApplyAssuranceChanges,
  useAssuranceWorkbook,
  useSaveAssuranceWorkbook,
  type ApplyAssuranceChanges,
  type AssuranceWorkbookSnapshot,
  type MappingWorkbookChange,
  type SaveAssuranceWorkbook,
} from "@/lib/assurance-workbook";
import {
  projectWorkbook,
  proposeWorkbookChanges,
  workbookDocument,
} from "@/lib/workbook-projection";

const message = (error: unknown) =>
  error instanceof Error ? error.message : "The workbook operation failed.";
type Draft = {
  baseline: AssuranceWorkbookSnapshot;
  workbook: Workbook;
  mappings: MappingWorkbookChange[];
  applyAttempt?: ApplyAssuranceChanges | undefined;
  saveAttempt?: SaveAssuranceWorkbook | undefined;
  savedId?: string | undefined;
  savedRevision?: number | undefined;
  savedDocument?: string | undefined;
};

const recoveryByteLimit = 5_000_000;
const sourceEditSchema = z
  .object({
    sheetId: z.enum(["requirements", "mappings"]),
    rowId: z.string().uuid(),
    columnId: z.string().min(1).max(160),
    value: z.string().max(10_000),
  })
  .strict();
const compactWorkbookSchema = z
  .object({
    format: z.literal(2),
    document: z.record(z.unknown()),
    sourceEdits: z.array(sourceEditSchema).max(20_000),
    workbookMetadata: z
      .object({
        id: z.string().min(1).max(160),
        name: z.string().max(200),
        revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
        sheetOrder: z.array(z.string().min(1).max(160)).min(1).max(32),
      })
      .strict(),
  })
  .passthrough();
type SourceEdit = z.infer<typeof sourceEditSchema>;

/** Persist authored differences, not a second copy of all projected source cells and bindings. */
function compactSourceEdits(draft: Draft): SourceEdit[] {
  const edits: SourceEdit[] = [];
  const requirementSheet = draft.workbook.sheets.find((sheet) => sheet.id === "requirements");
  const mappingSheet = draft.workbook.sheets.find((sheet) => sheet.id === "mappings");
  const append = (
    sheetId: SourceEdit["sheetId"],
    rowId: string,
    columnId: string,
    before: unknown,
    after: string | undefined,
  ) => {
    if (
      after !== undefined &&
      after !== (before === null || before === undefined ? "" : String(before))
    )
      edits.push({ sheetId, rowId, columnId, value: after });
  };
  for (const row of draft.baseline.requirements)
    if (row.content_id && row.revision)
      for (const field of requirementWorkbookFields)
        append(
          "requirements",
          row.id,
          field.key,
          row[field.key],
          requirementSheet?.cells[row.id]?.[field.key]?.input,
        );
  for (const row of draft.baseline.mappings)
    for (const field of ["relationship_type", "rationale"] as const)
      append("mappings", row.id, field, row[field], mappingSheet?.cells[row.id]?.[field]?.input);
  return sourceEditSchema.array().max(20_000).parse(edits);
}

function restoreCompactWorkbook(value: unknown, baseline: AssuranceWorkbookSnapshot): Workbook {
  const packed = compactWorkbookSchema.parse(value);
  let workbook = projectWorkbook(baseline, packed.document);
  for (const sheetId of ["requirements", "mappings"] as const) {
    const edits = packed.sourceEdits.filter((edit) => edit.sheetId === sheetId);
    if (edits.length) workbook = applyEdits(workbook, sheetId, edits);
  }
  const order = packed.workbookMetadata.sheetOrder;
  const sheets = new Map(workbook.sheets.map((sheet) => [sheet.id, sheet]));
  if (
    new Set(order).size !== order.length ||
    order.length !== sheets.size ||
    order.some((id) => !sheets.has(id))
  )
    throw new Error("The recovery draft has invalid sheet identities.");
  workbook = {
    ...workbook,
    id: packed.workbookMetadata.id,
    name: packed.workbookMetadata.name,
    revision: packed.workbookMetadata.revision,
    sheets: order.map((id) => sheets.get(id)!),
  };
  validateWorkbook(workbook);
  return workbook;
}

/** Recovery keeps original revisions and exact request IDs, even if a response was lost. */
export function readWorkbenchDraft(json: string, programId: string): Draft {
  if (new TextEncoder().encode(json).byteLength > recoveryByteLimit)
    throw new Error("This draft is too large for tab recovery. Download a backup before closing.");
  const draft = JSON.parse(json) as Draft & { format?: number };
  if (draft.format !== undefined && draft.format !== 2)
    throw new Error(
      "This recovery draft version is unsupported. Download a backup before replacing it.",
    );
  const baseline = assuranceWorkbookSchema.parse(draft.baseline);
  if (baseline.programId !== programId)
    throw new Error("The recovery draft belongs to another program.");
  const workbook =
    draft.format === 2
      ? restoreCompactWorkbook(draft, baseline)
      : deserializeWorkbook(JSON.stringify(draft.workbook));
  const mappings = mappingWorkbookChangeSchema.array().parse(draft.mappings ?? []);
  const proposal = proposeWorkbookChanges(baseline, workbook, mappings);
  const applyAttempt = draft.applyAttempt
    ? applyAssuranceChangesSchema.parse(draft.applyAttempt)
    : undefined;
  const saveAttempt = draft.saveAttempt
    ? saveAssuranceWorkbookSchema.parse(draft.saveAttempt)
    : undefined;
  if (applyAttempt) {
    const expected = applyAssuranceChangesSchema.parse({
      ...proposal.request,
      requestId: applyAttempt.requestId,
    });
    if (JSON.stringify(applyAttempt) !== JSON.stringify(expected))
      throw new Error(
        "The pending record request does not match this recovery draft. Download a backup before replacing it.",
      );
  }
  if (
    saveAttempt &&
    (saveAttempt.programId !== programId ||
      JSON.stringify(saveAttempt.document) !== JSON.stringify(workbookDocument(workbook)))
  )
    throw new Error(
      "The pending analysis request does not match this recovery draft. Download a backup before replacing it.",
    );
  const savedRevision =
    draft.savedRevision ?? saveAttempt?.expectedRevision ?? baseline.workbook?.revision ?? 0;
  const savedId = draft.savedId ?? saveAttempt?.workbookId ?? baseline.workbook?.id;
  if (
    !Number.isInteger(savedRevision) ||
    savedRevision < 0 ||
    (savedId && !/^[0-9a-f-]{36}$/.test(savedId))
  )
    throw new Error("The recovery draft has invalid save metadata.");
  return {
    baseline,
    workbook,
    mappings,
    ...(applyAttempt ? { applyAttempt } : {}),
    ...(saveAttempt ? { saveAttempt } : {}),
    ...(savedId ? { savedId } : {}),
    savedRevision,
    ...(typeof draft.savedDocument === "string" ? { savedDocument: draft.savedDocument } : {}),
  };
}

export function writeWorkbenchDraft(
  storage: Pick<Storage, "setItem">,
  key: string,
  draft: Draft,
): void {
  validateWorkbook(draft.workbook);
  const { workbook, ...metadata } = draft;
  const json = JSON.stringify({
    ...metadata,
    format: 2,
    document: workbookDocument(workbook),
    sourceEdits: compactSourceEdits(draft),
    workbookMetadata: {
      id: workbook.id,
      name: workbook.name,
      revision: workbook.revision,
      sheetOrder: workbook.sheets.map((sheet) => sheet.id),
    },
  });
  if (new TextEncoder().encode(json).byteLength > recoveryByteLimit)
    throw new Error("This draft is too large for tab recovery. Download a backup before closing.");
  storage.setItem(key, json);
}

export function workbookSourcesChanged(
  before: AssuranceWorkbookSnapshot,
  after: AssuranceWorkbookSnapshot,
): boolean {
  return (
    [
      "requirements",
      "mappings",
      "allocations",
      "evidence",
      "systems",
      "owners",
      "selectedControls",
    ] as const
  ).some((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

export function useAssuranceWorkbench(programId: string) {
  const workspace = useWorkspace();
  const query = useAssuranceWorkbook(programId);
  const apply = useApplyAssuranceChanges();
  const save = useSaveAssuranceWorkbook();
  const history = useRef<ReturnType<typeof createHistory> | null>(null);
  const [baseline, setBaseline] = useState<AssuranceWorkbookSnapshot | null>(null);
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [mappings, setMappings] = useState<MappingWorkbookChange[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [initializationError, setInitializationError] = useState<string | undefined>();
  const [storageError, setStorageError] = useState<string | undefined>();
  const [recovery, setRecovery] = useState<Draft | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | undefined>();
  const [applyAttempt, setApplyAttempt] = useState<ApplyAssuranceChanges | undefined>();
  const [saveAttempt, setSaveAttempt] = useState<SaveAssuranceWorkbook | undefined>();
  const [savedDocument, setSavedDocument] = useState("");
  const [savedRevision, setSavedRevision] = useState(0);
  const [savedId, setSavedId] = useState<string>(() => crypto.randomUUID());
  const [results, setResults] = useState<CalculationResult | undefined>();
  const [calculationError, setCalculationError] = useState<string | undefined>();
  const [calculating, setCalculating] = useState(false);
  const [calculationTick, setCalculationTick] = useState(0);
  const [status, setStatus] = useState("");
  const [cellDraftDirty, setCellDraftDirty] = useState(false);
  const initialized = useRef<string | null>(null);
  const draftWriteVersion = useRef(0);
  const calculator = useRef<ReturnType<typeof createCalculationClient> | null>(null);
  const key = `assurance-workbook:${workspace.tenantId}:${workspace.userId}:${programId}`;
  const proposal = useMemo(() => {
    if (!baseline || !workbook)
      return { changes: [], request: { programId, requirements: [], mappings: [] } };
    return proposeWorkbookChanges(baseline, workbook, mappings);
  }, [baseline, workbook, mappings, programId]);
  const document = useMemo(() => (workbook ? workbookDocument(workbook) : null), [workbook]);
  const analysisDirty = document !== null && JSON.stringify(document) !== savedDocument;
  const dirty =
    cellDraftDirty ||
    proposal.changes.length > 0 ||
    analysisDirty ||
    Boolean(applyAttempt || saveAttempt);
  const sourceChanged = useMemo(
    () => Boolean(baseline && query.data && workbookSourcesChanged(baseline, query.data)),
    [baseline, query.data],
  );
  const guard = useDraftGuard({
    dirty,
    onClose: () => {},
    description:
      "The active cell draft, unapplied record changes and unsaved analysis in this workbook will be left behind.",
  });

  useEffect(() => {
    if (!query.data || query.data.programId !== programId || initialized.current === key) return;
    initialized.current = key;
    draftWriteVersion.current++;
    history.current = null;
    setWorkbook(null);
    setBaseline(query.data);
    setMappings([]);
    setRecovery(null);
    setRecoveryError(undefined);
    setApplyAttempt(undefined);
    setSaveAttempt(undefined);
    setCellDraftDirty(false);
    setInitializationError(undefined);
    setError(undefined);
    setResults(undefined);
    setSavedRevision(query.data.workbook?.revision ?? 0);
    setSavedId(query.data.workbook?.id ?? crypto.randomUUID());
    try {
      const json = sessionStorage.getItem(key);
      if (json) setRecovery(readWorkbenchDraft(json, programId));
    } catch (cause) {
      setRecoveryError(message(cause));
      setStorageError(`The tab recovery draft could not be opened. ${message(cause)}`);
    }
    try {
      const next = projectWorkbook(query.data);
      history.current = createHistory(next);
      setWorkbook(next);
      setBaseline(query.data);
      setSavedDocument(JSON.stringify(workbookDocument(next)));
    } catch (cause) {
      setInitializationError(message(cause));
      setError(message(cause));
    }
  }, [query.data, key, programId]);

  useEffect(() => {
    if (!workbook || !baseline || recovery || recoveryError) return;
    const version = ++draftWriteVersion.current;
    const timer = window.setTimeout(() => {
      if (version !== draftWriteVersion.current) return;
      try {
        if (dirty) {
          writeWorkbenchDraft(sessionStorage, key, {
            baseline,
            workbook,
            mappings,
            applyAttempt,
            saveAttempt,
            savedId,
            savedRevision,
            savedDocument,
          });
        } else sessionStorage.removeItem(key);
        setStorageError(undefined);
      } catch (cause) {
        setStorageError(`Tab recovery is unavailable. ${message(cause)}`);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    workbook,
    baseline,
    mappings,
    applyAttempt,
    saveAttempt,
    dirty,
    recovery,
    recoveryError,
    key,
    savedId,
    savedRevision,
    savedDocument,
  ]);

  useEffect(() => {
    calculator.current = createCalculationClient();
    return () => {
      calculator.current?.dispose();
      calculator.current = null;
    };
  }, []);
  useEffect(() => {
    if (!workbook) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setCalculating(true);
      setCalculationError(undefined);
      void calculator.current
        ?.calculate(workbook)
        .then((result) => {
          if (active) {
            setResults(result);
            setCalculating(false);
          }
        })
        .catch((cause: unknown) => {
          if (active && !(cause instanceof SupersededCalculationError)) {
            setCalculationError(message(cause));
            setCalculating(false);
          }
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [workbook, calculationTick]);

  function update(next: Workbook) {
    if (
      !baseline ||
      !history.current ||
      applyAttempt ||
      saveAttempt ||
      guard.busy ||
      recovery ||
      recoveryError
    )
      throw new Error("Finish or reconcile the pending save before editing this workbook.");
    proposeWorkbookChanges(baseline, next, mappings);
    setWorkbook(history.current.replace(next));
    setError(undefined);
  }
  function perform(operation: WorkbookOperation) {
    if (!workbook) return;
    update(applyOperation(workbook, operation));
  }
  function safely(action: () => void | Promise<void>) {
    try {
      void Promise.resolve(action()).catch((cause: unknown) => setError(message(cause)));
    } catch (cause) {
      setError(message(cause));
    }
  }
  async function refresh() {
    if (guard.busy || cellDraftDirty || recovery || recoveryError) return;
    if (proposal.changes.length || applyAttempt || saveAttempt) {
      const discard = await guard.confirm({
        title: "Reload recorded values?",
        description:
          "Replace the staged record edits with the latest recorded values. Your analysis sheets remain. A failed save may already have reached the server; reloading reconciles its result.",
        confirmLabel: "Reload records",
      });
      if (!discard) return;
    }
    if (!guard.start()) return;
    try {
      const latest = await query.refetch();
      if (!latest.data || latest.error)
        throw latest.error ?? new Error("No snapshot was returned.");
      const recorded = projectWorkbook(latest.data);
      const recordedDocument = JSON.stringify(workbookDocument(recorded));
      const keepAnalysis = analysisDirty && JSON.stringify(document) !== recordedDocument;
      const next = keepAnalysis ? projectWorkbook(latest.data, document ?? undefined) : recorded;
      history.current = createHistory(next);
      setWorkbook(next);
      setBaseline(latest.data);
      setMappings([]);
      setApplyAttempt(undefined);
      setSaveAttempt(undefined);
      if (!keepAnalysis) {
        setSavedRevision(latest.data.workbook?.revision ?? 0);
        setSavedId(latest.data.workbook?.id ?? savedId);
        setSavedDocument(recordedDocument);
      }
      setError(undefined);
      setStatus("Source records reloaded. Analysis now uses the new snapshot.");
    } finally {
      guard.finish();
    }
  }
  async function applyChanges() {
    if (
      !workbook ||
      !baseline ||
      cellDraftDirty ||
      saveAttempt ||
      recovery ||
      recoveryError ||
      (!applyAttempt && !proposal.changes.length) ||
      !guard.start()
    )
      return;
    const attempt = applyAttempt ?? { ...proposal.request, requestId: crypto.randomUUID() };
    setError(undefined);
    try {
      draftWriteVersion.current++;
      try {
        writeWorkbenchDraft(sessionStorage, key, {
          baseline,
          workbook,
          mappings,
          applyAttempt: attempt,
          savedId,
          savedRevision,
          savedDocument,
        });
      } catch (cause) {
        setStorageError(message(cause));
        throw new Error(
          `The change set was not sent because its retry receipt could not be saved. ${message(cause)}`,
        );
      }
      setApplyAttempt(attempt);
      await apply.mutateAsync(attempt);
      const latest = await query.refetch();
      if (!latest.data || latest.error)
        throw new Error(
          "The changes were applied, but the latest records could not load. Retry to reconcile the same request safely.",
        );
      const next = projectWorkbook(latest.data, workbookDocument(workbook));
      history.current = createHistory(next);
      setWorkbook(next);
      setBaseline(latest.data);
      setMappings([]);
      setApplyAttempt(undefined);
      setStatus("Changes applied. The recorded values and audit history are up to date.");
    } finally {
      guard.finish();
    }
  }
  async function saveAnalysis() {
    if (
      !workbook ||
      !baseline ||
      !document ||
      cellDraftDirty ||
      applyAttempt ||
      recovery ||
      recoveryError ||
      !guard.start()
    )
      return;
    const attempt = saveAttempt ?? {
      requestId: crypto.randomUUID(),
      programId,
      workbookId: savedId,
      expectedRevision: savedRevision,
      name: workbook.name,
      document,
    };
    setError(undefined);
    try {
      draftWriteVersion.current++;
      try {
        writeWorkbenchDraft(sessionStorage, key, {
          baseline,
          workbook,
          mappings,
          saveAttempt: attempt,
          savedId,
          savedRevision,
          savedDocument,
        });
      } catch (cause) {
        setStorageError(message(cause));
        throw new Error(
          `The analysis was not sent because its retry receipt could not be saved. ${message(cause)}`,
        );
      }
      setSaveAttempt(attempt);
      const result = await save.mutateAsync(attempt);
      setSavedId(result.id);
      setSavedRevision(result.revision);
      setSavedDocument(JSON.stringify(attempt.document));
      setSaveAttempt(undefined);
      setStatus("Analysis and sheet layout saved. Staged source edits remain unapplied.");
    } finally {
      guard.finish();
    }
  }
  return {
    query,
    baseline,
    workbook,
    proposal,
    error,
    initializationError,
    storageError,
    recovery,
    recoveryError,
    dirty,
    analysisDirty,
    sourceChanged,
    cellDraftDirty,
    setCellDraftDirty,
    results: results?.revision === workbook?.revision ? results : undefined,
    calculating,
    calculationError,
    retryCalculation: () => setCalculationTick((tick) => tick + 1),
    canEdit: workspace.role !== "viewer",
    locked: guard.busy || Boolean(applyAttempt || saveAttempt || recovery || recoveryError),
    busy: guard.busy,
    applyAttempt,
    saveAttempt,
    status,
    setStatus,
    setError,
    safely,
    perform,
    update,
    refresh,
    applyChanges,
    saveAnalysis,
    confirmation: guard.confirmation,
    confirm: guard.confirm,
    undo: () => {
      if (
        history.current &&
        !applyAttempt &&
        !saveAttempt &&
        !guard.busy &&
        !recovery &&
        !recoveryError
      )
        setWorkbook(history.current.undo());
    },
    redo: () => {
      if (
        history.current &&
        !applyAttempt &&
        !saveAttempt &&
        !guard.busy &&
        !recovery &&
        !recoveryError
      )
        setWorkbook(history.current.redo());
    },
    canUndo: history.current?.canUndo ?? false,
    canRedo: history.current?.canRedo ?? false,
    stageMapping: (change: MappingWorkbookChange) => {
      if (
        !workbook ||
        !baseline ||
        guard.busy ||
        applyAttempt ||
        saveAttempt ||
        recovery ||
        recoveryError
      )
        return;
      const next = [...mappings.filter((item) => item.id !== change.id), change];
      proposeWorkbookChanges(baseline, workbook, next);
      setMappings(next);
    },
    unstageMappings: () => {
      if (!guard.busy && !applyAttempt && !saveAttempt && !recovery && !recoveryError)
        setMappings([]);
    },
    mappingChanges: mappings,
    recover: () => {
      if (!recovery) return;
      history.current = createHistory(recovery.workbook);
      setWorkbook(recovery.workbook);
      setBaseline(recovery.baseline);
      setMappings(recovery.mappings);
      setApplyAttempt(recovery.applyAttempt);
      setSaveAttempt(recovery.saveAttempt);
      setSavedRevision(recovery.savedRevision ?? recovery.baseline.workbook?.revision ?? 0);
      setSavedId(recovery.savedId ?? recovery.baseline.workbook?.id ?? crypto.randomUUID());
      setSavedDocument(
        recovery.savedDocument ??
          JSON.stringify(workbookDocument(projectWorkbook(recovery.baseline))),
      );
      setCellDraftDirty(false);
      setInitializationError(undefined);
      setError(undefined);
      setRecovery(null);
      setRecoveryError(undefined);
      setStatus(
        "Draft recovered. Source changes will be checked against their original revisions when applied.",
      );
    },
    discardRecovery: () => {
      try {
        draftWriteVersion.current++;
        sessionStorage.removeItem(key);
        setRecovery(null);
        setRecoveryError(undefined);
        setStorageError(undefined);
      } catch (cause) {
        setStorageError(message(cause));
      }
    },
    startNewAnalysis: () => {
      if (!query.data || guard.busy) return;
      const next = projectWorkbook({ ...query.data, workbook: null });
      history.current = createHistory(next);
      setWorkbook(next);
      setBaseline(query.data);
      setSavedId(query.data.workbook?.id ?? crypto.randomUUID());
      setSavedRevision(query.data.workbook?.revision ?? 0);
      setSavedDocument(
        query.data.workbook
          ? JSON.stringify(query.data.workbook.document)
          : JSON.stringify(workbookDocument(next)),
      );
      setMappings([]);
      setApplyAttempt(undefined);
      setSaveAttempt(undefined);
      setCellDraftDirty(false);
      setInitializationError(undefined);
      setError(undefined);
      setStatus(
        "New analysis opened. Saving will replace the saved analysis using its recorded revision.",
      );
    },
    downloadSavedAnalysis: () =>
      query.data?.workbook ? JSON.stringify(query.data.workbook.document, null, 2) : null,
    downloadRecoveryDraft: () => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    downloadDraft: () => workbook && serializeWorkbook(workbook),
  };
}
