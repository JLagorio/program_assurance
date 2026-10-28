import { useState } from "react";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
  Id,
  Input,
  Inline,
  Citation,
  Related,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  Textarea,
  TextLink,
  downloadBlob,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useFormFeedback } from "@/components/app/form-feedback";
import {
  citationSourceLink,
  citationReaderHref,
  reviewCommandSchema,
  reviewTargetHref,
  useAssuranceCitations,
  useCitationEvidence,
  useAssuranceReviewSubmit,
  useDownloadCitation,
  type AssuranceCitation,
  type CitationEvidenceChoice,
  type ReviewTarget,
} from "@/lib/assurance-review";
import { ExternalReference } from "./evidence-version-details";
import { QueryState } from "./work-common";
import { useReaderCitationTargets } from "@/lib/evidence-reader";
import { AssuranceReviewPanel, AssuranceReviewPaging } from "./assurance-review";

export function AssuranceCitations({
  target,
  evidenceVersionId,
  focusedCitationId,
}: {
  target?: ReviewTarget | undefined;
  evidenceVersionId?: string | undefined;
  focusedCitationId?: string | undefined;
}) {
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const citations = useAssuranceCitations({ target, evidenceVersionId, page });
  const workspace = useWorkspace();
  return (
    <Stack space="space.150">
      <QueryState queries={[citations]}>
        <Related
          title={evidenceVersionId ? "Cited by" : "Evidence citations"}
          count={citations.data?.count ?? 0}
          layout="cards"
          empty={
            evidenceVersionId
              ? "This version has no passage citations yet"
              : "No evidence passages cited yet"
          }
          action={
            target && workspace.role !== "viewer" ? (
              <Button size="small" variant="secondary" onClick={() => setCreating(true)}>
                Cite evidence passage
              </Button>
            ) : undefined
          }
        >
          {citations.data?.rows.map((citation) => (
            <Citation
              key={citation.id}
              id={`citation-${citation.id}`}
              tabIndex={focusedCitationId === citation.id ? -1 : undefined}
              passage={citation.passage}
              passageLabel="Quoted passage"
              source={<CitationSource citation={citation} />}
              title={`${citation.evidence_title} · Version ${citation.version_number}`}
              link={<a href={citationReaderHref(citation)} />}
              meta={`${citation.author_name}${citation.page ? ` · Page ${citation.page}` : ""}${citation.anchor ? ` · ${citation.anchor}` : ""}`}
              properties={[
                {
                  label: "SHA-256",
                  value: <Id className="break-all">{citation.evidence_sha256}</Id>,
                },
                ...(citation.rectangle
                  ? [
                      {
                        label: "Page rectangle",
                        value: `x ${citation.rectangle.x}, y ${citation.rectangle.y}, width ${citation.rectangle.width}, height ${citation.rectangle.height}`,
                      },
                    ]
                  : []),
              ]}
              backlinks={
                evidenceVersionId && (
                  <TextLink href={reviewTargetHref(citation.target, citation.program_id)}>
                    Open{" "}
                    {citation.target.kind === "cell"
                      ? "workbook cell"
                      : citation.target.kind === "mapping"
                        ? "control mapping"
                        : citation.target.kind === "requirement"
                          ? "requirement"
                          : citation.target.kind === "assessment-finding"
                            ? "assessment finding"
                            : citation.target.kind === "requirement-change"
                              ? "requirement edit"
                              : "evidence version"}
                  </TextLink>
                )
              }
            >
              <AssuranceReviewPanel
                target={{ kind: "citation", recordId: citation.id }}
                title="Passage discussion"
              />
            </Citation>
          ))}
        </Related>
        <AssuranceReviewPaging page={page} count={citations.data?.count ?? 0} onPage={setPage} />
      </QueryState>
      {creating && target && (
        <AssuranceCitationDialog target={target} onClose={() => setCreating(false)} />
      )}
    </Stack>
  );
}

type FieldName = "evidenceVersionId" | "passage" | "page" | "anchor" | "rectangle";
export function AssuranceCitationDialog({
  target: providedTarget,
  onClose,
  initial,
  onCreated,
}: {
  target?: ReviewTarget | undefined;
  onClose: () => void;
  initial?:
    | {
        evidence: CitationEvidenceChoice;
        passage: string;
        page: number;
        rectangle: { x: number; y: number; width: number; height: number };
      }
    | undefined;
  onCreated?: ((citationId: string) => void) | undefined;
}) {
  const [target, setTarget] = useState<ReviewTarget | undefined>(providedTarget);
  const [search, setSearch] = useState("");
  const [choicePage, setChoicePage] = useState(0);
  const choices = useCitationEvidence(search, choicePage);
  const [selected, setSelected] = useState<CitationEvidenceChoice | undefined>(initial?.evidence);
  const [version, setVersion] = useState(initial?.evidence.id ?? "");
  const [passage, setPassage] = useState(initial?.passage ?? "");
  const [page, setPage] = useState(initial ? String(initial.page) : "");
  const [anchor, setAnchor] = useState("");
  const [rectangle, setRectangle] = useState(
    initial
      ? [
          initial.rectangle.x,
          initial.rectangle.y,
          initial.rectangle.width,
          initial.rectangle.height,
        ].join(", ")
      : "",
  );
  const [failure, setFailure] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string | undefined>>>({});
  const feedback = useFormFeedback<FieldName>();
  const options =
    selected && !choices.data?.rows.some((choice) => choice.id === selected.id)
      ? [selected, ...(choices.data?.rows ?? [])]
      : (choices.data?.rows ?? []);
  const command = useAssuranceReviewSubmit();
  const guard = useDraftGuard({
    dirty: Boolean(passage || page || anchor || rectangle),
    onClose,
    description: "The evidence citation you were writing will be lost.",
  });
  async function submit() {
    setFailure("");
    let rect: unknown;
    if (rectangle.trim()) {
      const values = rectangle.split(",").map((value) => Number(value.trim()));
      rect = { x: values[0], y: values[1], width: values[2], height: values[3] };
      if (values.length !== 4) rect = {};
    }
    const parsed = reviewCommandSchema.safeParse({
      operation: "create-citation",
      target,
      evidenceVersionId: version,
      expectedEvidenceRevision: selected?.revision,
      passage,
      ...(page ? { page: Number(page) } : {}),
      ...(anchor.trim() ? { anchor: anchor.trim() } : {}),
      ...(rect ? { rectangle: rect } : {}),
    });
    const issues: { field: FieldName; message: string }[] = [];
    if (!target) {
      setFailure("Choose the requirement or assessment finding this passage supports.");
      return;
    }
    if (!selected)
      issues.push({ field: "evidenceVersionId", message: "Choose a listed evidence version." });
    if (!passage.trim())
      issues.push({ field: "passage", message: "Enter the exact quoted passage." });
    if (!page && !anchor.trim())
      issues.push({ field: "page", message: "Enter a page number or source anchor." });
    if (page && (!Number.isInteger(Number(page)) || Number(page) < 1 || Number(page) > 100000))
      issues.push({ field: "page", message: "Enter a page number between 1 and 100,000." });
    if (rect && !parsed.success)
      issues.push({
        field: "rectangle",
        message:
          "Use x, y, width, height within 0–1 and a page number; the rectangle must fit the page.",
      });
    if (!parsed.success && !issues.length)
      issues.push({
        field: "passage",
        message: "Use at most 10,000 characters and a valid source location.",
      });
    setErrors(Object.fromEntries(issues.map((issue) => [issue.field, issue.message])));
    if (!feedback.report(issues) || !parsed.success || !guard.start()) return;
    try {
      const result = await command.submit(parsed.data);
      if ("citationId" in result) onCreated?.(result.citationId);
      guard.complete();
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "The citation was not saved.");
    } finally {
      guard.finish();
    }
  }
  const field = (
    key: FieldName,
    label: string,
    value: string,
    onValue: (value: string) => void,
    placeholder?: string,
  ) => (
    <Field invalid={Boolean(errors[key])}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        ref={feedback.ref(key)}
        value={value}
        onValueChange={(next) => {
          onValue(next);
          setErrors((current) => ({ ...current, [key]: undefined }));
        }}
        placeholder={placeholder}
      />
      {errors[key] && <FieldError>{errors[key]}</FieldError>}
    </Field>
  );
  return (
    <>
      <Dialog
        open
        pending={guard.busy}
        onOpenChange={(open) => {
          if (!open) void guard.close();
        }}
      >
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <DialogHeader>
              <DialogTitle>Cite evidence passage</DialogTitle>
              <DialogDescription>
                The saved citation keeps the evidence version, recorded SHA-256, source URI and the
                passage/location you enter. It does not verify the passage against a PDF.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Stack space="space.200">
                {failure && (
                  <Alert tone="danger" role="alert">
                    <AlertDescription>{failure}</AlertDescription>
                  </Alert>
                )}
                <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
                <FieldSet disabled={guard.busy}>
                  <Stack space="space.150">
                    {!providedTarget && <CitationTargetPicker onChange={setTarget} />}
                    <Field>
                      <FieldLabel>Find evidence</FieldLabel>
                      <Input
                        value={search}
                        onValueChange={(value) => {
                          setSearch(value);
                          setChoicePage(0);
                        }}
                      />
                    </Field>
                    <QueryState queries={[choices]}>
                      <Field invalid={Boolean(errors.evidenceVersionId)}>
                        <FieldLabel>Evidence version</FieldLabel>
                        <Select
                          value={version}
                          onValueChange={(value) => {
                            setVersion(value ?? "");
                            if (value !== version && initial) {
                              setPassage("");
                              setPage("");
                              setRectangle("");
                              setAnchor("");
                            }
                            setSelected(options.find((choice) => choice.id === value));
                            setErrors((current) => ({ ...current, evidenceVersionId: undefined }));
                          }}
                        >
                          <SelectTrigger ref={feedback.ref("evidenceVersionId")}>
                            <SelectValue placeholder="Choose a version">
                              {selected
                                ? `${selected.artifact.title} · Version ${selected.version_number}`
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((choice) => (
                              <SelectItem key={choice.id} value={choice.id}>
                                {choice.artifact.title} · Version {choice.version_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.evidenceVersionId && (
                          <FieldError>{errors.evidenceVersionId}</FieldError>
                        )}
                      </Field>
                      {(choices.data?.count ?? 0) > 25 && (
                        <Inline shouldWrap space="space.100">
                          <Button
                            size="small"
                            variant="subtle"
                            disabled={choicePage === 0}
                            onClick={() => setChoicePage((current) => current - 1)}
                          >
                            Previous evidence versions
                          </Button>
                          <Text size="small">
                            Versions page {choicePage + 1} of{" "}
                            {Math.ceil((choices.data?.count ?? 0) / 25)}
                          </Text>
                          <Button
                            size="small"
                            variant="subtle"
                            disabled={(choicePage + 1) * 25 >= (choices.data?.count ?? 0)}
                            onClick={() => setChoicePage((current) => current + 1)}
                          >
                            Next evidence versions
                          </Button>
                        </Inline>
                      )}
                    </QueryState>
                    <Text size="small" color="color.text.subtle">
                      Search narrows all matching versions, shown 25 per page. A recorded SHA-256
                      and an attached file or HTTP(S) source URI are required.
                    </Text>
                    {!initial && selected?.storage_object_name && target && (
                      <TextLink
                        href={`/evidence?version=${selected.id}&reader=true&target=${encodeURIComponent(JSON.stringify(target))}`}
                      >
                        Select a passage in the document reader
                      </TextLink>
                    )}
                    <Field invalid={Boolean(errors.passage)}>
                      <FieldLabel>Exact quoted passage</FieldLabel>
                      <Textarea
                        ref={feedback.ref("passage")}
                        value={passage}
                        maxLength={10000}
                        rows={4}
                        onChange={(event) => {
                          setPassage(event.target.value);
                          setErrors((current) => ({ ...current, passage: undefined }));
                        }}
                      />
                      {errors.passage && <FieldError>{errors.passage}</FieldError>}
                    </Field>
                    {field("page", "Page number", page, setPage)}
                    {field("anchor", "Source anchor (optional)", anchor, setAnchor, "section-3")}
                    {field(
                      "rectangle",
                      "Page rectangle (optional)",
                      rectangle,
                      setRectangle,
                      "x, y, width, height (0–1)",
                    )}
                  </Stack>
                </FieldSet>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <Button variant="subtle" onClick={() => void guard.close()}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={guard.busy}>
                Save citation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {guard.confirmation}
    </>
  );
}

function CitationSource({ citation }: { citation: AssuranceCitation }) {
  const download = useDownloadCitation();
  if (!citation.source_storage_object_name)
    return (
      <ExternalReference uri={citationSourceLink(citation)}>
        Open cited source location
      </ExternalReference>
    );
  return (
    <Stack space="space.100">
      <Text size="small" color="color.text.subtle">
        Stored file:{" "}
        <Id className="break-all">{citation.source_storage_object_name.split("/").at(-1)}</Id>
      </Text>
      <Button
        size="small"
        variant="secondary"
        disabled={download.isPending}
        onClick={() => {
          void download
            .mutateAsync(citation)
            .then(({ blob, filename }) => downloadBlob(blob, filename))
            .catch(() => {});
        }}
      >
        {download.isPending ? "Downloading cited file…" : "Download cited file"}
      </Button>
      {download.error && (
        <Alert variant="danger">
          <AlertDescription>{download.error.message}</AlertDescription>
        </Alert>
      )}
      <TextLink href={citationReaderHref(citation)}>Read cited passage</TextLink>
    </Stack>
  );
}

function CitationTargetPicker({
  onChange,
}: {
  onChange: (target: ReviewTarget | undefined) => void;
}) {
  const [kind, setKind] = useState<"requirement" | "assessment-finding">("requirement");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const choices = useReaderCitationTargets(kind, search);
  return (
    <Stack space="space.100">
      <Field>
        <FieldLabel>Reference from</FieldLabel>
        <Select
          value={kind}
          onValueChange={(value) => {
            if (value !== "requirement" && value !== "assessment-finding") return;
            setKind(value);
            setSelected("");
            onChange(undefined);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="requirement">Requirement</SelectItem>
            <SelectItem value="assessment-finding">Assessment finding</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>
          {kind === "requirement" ? "Find requirement by code" : "Find assessment finding"}
        </FieldLabel>
        <Input value={search} onValueChange={setSearch} />
      </Field>
      <QueryState queries={[choices]}>
        <Field>
          <FieldLabel>Supporting record</FieldLabel>
          <Select
            value={selected}
            onValueChange={(id) => {
              setSelected(id ?? "");
              onChange(id ? { kind, recordId: id } : undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a record" />
            </SelectTrigger>
            <SelectContent>
              {choices.data?.map((choice) => (
                <SelectItem key={choice.id} value={choice.id}>
                  {choice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </QueryState>
      <Text size="small" color="color.text.subtle">
        Showing up to 25 matches. Refine the search to find another record.
      </Text>
    </Stack>
  );
}
