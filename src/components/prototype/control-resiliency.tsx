import { Fragment, useId, useLayoutEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  Box,
  Eyebrow,
  Heading,
  HeadingLevelProvider,
  List,
  Prose,
  Section,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Stack,
  Table,
  Text,
  TextLink,
  VisuallyHidden,
  useLedgerLocale,
} from "@ledger/design-system";
import {
  RESILIENCY_GUIDANCE_KINDS,
  splitByChoice,
  supportedGuidance,
  supportedOnce,
  techniqueSlug,
  type GuidedConstruct,
  type TechniqueControls,
  type TechniqueGuidance,
} from "@/lib/control-resiliency";
import {
  CYBER_RESILIENCY_FRAMEWORK,
  resiliencyByControl,
  useApproachLayers,
  useFrameworkControlLinks,
  useFrameworkItems,
  type ControlLinkScope,
} from "@/lib/frameworks";
import { QueryState, ReportFailures } from "./work-common";

/*
 * What a control supports in cyber resiliency, from NIST SP 800-160 Vol. 2 Rev. 1: the Section a
 * control's record lists it in (the techniques and approaches Table E-1 prints for the control,
 * each opening onto what Table D-4 says of them), the choice of one technique a program's Control
 * baseline is read by, and the architectural layers an approach can be used at (Table D-5), a
 * fact of an approach's preview.
 */

/** One approach as Table D-4 gives it: what it is, the publication's examples and its discussion. */
function ApproachGuidance({ approach }: { approach: GuidedConstruct }) {
  return (
    <Stack space="space.100">
      <Stack space="space.025">
        <Heading size="section">{approach.title}</Heading>
        {approach.informalDescription && (
          <Text as="p" color="color.text.subtle">
            {approach.informalDescription}
          </Text>
        )}
      </Stack>
      {approach.definition && <Prose label="Definition">{approach.definition}</Prose>}
      {approach.examples.length > 0 && (
        // A labelled Prose stands off the block above it; the list under its label does the same.
        <Box paddingBlockStart="space.075">
          <Stack space="space.050">
            <Eyebrow>Examples</Eyebrow>
            <List spacing="loose">
              {approach.examples.map((example, index) => (
                <List.Item key={index}>{example}</List.Item>
              ))}
            </List>
          </Stack>
        </Box>
      )}
      {approach.discussion && <Prose label="Discussion">{approach.discussion}</Prose>}
    </Stack>
  );
}

/**
 * What a technique's row opens onto: the technique, said once, then each approach the control
 * supports it through. A part the reference data does not hold is left out without a word.
 */
function TechniqueGuidanceBody({ row }: { row: TechniqueGuidance }) {
  const { technique, approaches } = row;
  return (
    <Stack space="space.250" className="min-w-0">
      {(technique.definition || technique.discussion) && (
        <Stack space="space.100">
          <Heading size="section">{technique.title}</Heading>
          {technique.definition && <Prose>{technique.definition}</Prose>}
          {technique.discussion && <Prose label="Discussion">{technique.discussion}</Prose>}
        </Stack>
      )}
      {/* An approach sits under its technique in the outline. */}
      <HeadingLevelProvider>
        {approaches.map((approach) => (
          <ApproachGuidance key={approach.code} approach={approach} />
        ))}
      </HeadingLevelProvider>
    </Stack>
  );
}

const EXAMPLES = { one: "{count} example", other: "{count} examples" };

/** The four columns' floors together (32 + 184 + 148 + 116): below it the count leaves its column. */
const GUIDANCE_COLUMNS_FIT = 480;

/** Whether the table's frame is narrower than `fit`, measured as it resizes. */
function useNarrowFrame(fit: number) {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [narrow, setNarrow] = useState(false);
  useLayoutEffect(() => {
    if (!frame) return;
    const measure = () => setNarrow(frame.clientWidth < fit);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frame, fit]);
  return [setFrame, narrow] as const;
}

/**
 * The techniques a control supports, one line a technique in the table's order, strongest first.
 * A row opens in place onto the guidance for its technique and approaches, and stays as the reader
 * left it. Its order is its meaning, so it is the kit `Table`, with no search or sort.
 */
function ResiliencyTable({
  rows,
  programId,
}: {
  rows: readonly TechniqueGuidance[];
  programId?: string | undefined;
}) {
  const { formatPlural } = useLedgerLocale();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  // Each row's chevron names the guidance it opens, so it says whether that guidance is shown.
  const detailBase = useId();
  // Where the columns do not fit (a phone), the count leaves and the two names share the frame,
  // each wrapping, so the table never scrolls sideways.
  const [frameRef, narrow] = useNarrowFrame(GUIDANCE_COLUMNS_FIT);
  // Without the guidance the table is the mapping alone: nothing opens and nothing is counted.
  const opens = rows.some((row) => row.guided);
  const counted = !narrow && rows.some((row) => row.examples > 0);
  const columns = 2 + (opens ? 1 : 0) + (counted ? 1 : 0);
  return (
    <Table label="Cyber resiliency techniques this control supports" frameRef={frameRef}>
      <thead>
        <tr>
          {opens && (
            <Table.Header width={32}>
              <VisuallyHidden>Open</VisuallyHidden>
            </Table.Header>
          )}
          {/* A technique's name on one line where there is room; the approaches take the rest. */}
          <Table.Header {...(narrow ? {} : { width: 184 })}>Technique</Table.Header>
          <Table.Header>Approaches</Table.Header>
          {/* What a row opens onto, in the reader's word for it, counted by its examples. */}
          {counted && <Table.Header width={116}>Guidance</Table.Header>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const { technique, approaches } = row;
          const expanded = row.guided && open.has(technique.code);
          const detailId = `${detailBase}-${techniqueSlug(technique.code)}`;
          return (
            <Fragment key={technique.code}>
              <Table.Row>
                {opens && (
                  <Table.Disclosure
                    hasChildren={row.guided}
                    expanded={expanded}
                    label={technique.title}
                    controls={detailId}
                    onExpandedChange={(next) =>
                      setOpen((before) => {
                        const after = new Set(before);
                        if (next) after.add(technique.code);
                        else after.delete(technique.code);
                        return after;
                      })
                    }
                  />
                )}
                <Table.Cell rowHeader wrap>
                  {programId ? (
                    <TextLink
                      render={
                        <Link
                          to="/programs/$programId/control-baseline"
                          params={{ programId }}
                          search={{ technique: techniqueSlug(technique.code) }}
                        />
                      }
                    >
                      {technique.title}
                    </TextLink>
                  ) : (
                    technique.title
                  )}
                </Table.Cell>
                <Table.Cell wrap>
                  {approaches.length ? (
                    approaches.map((approach) => approach.title).join(", ")
                  ) : (
                    <Absent label="No approach named" />
                  )}
                </Table.Cell>
                {counted && <Table.Cell>{formatPlural(row.examples, EXAMPLES)}</Table.Cell>}
              </Table.Row>
              {expanded && (
                <Table.Detail id={detailId} colSpan={columns}>
                  <TechniqueGuidanceBody row={row} />
                </Table.Detail>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}

/**
 * The cyber resiliency techniques a control supports, strongest first, each with its approaches:
 * one line a row, which opens in place onto NIST's guidance for them (the definition, the examples
 * and the discussion of Table D-4). A control Table E-1 does not name draws nothing, and nothing is
 * drawn until the read says which. Inside a program a technique opens that program's Control
 * baseline on it.
 */
export function ControlResiliency({
  controlId,
  programId,
  isCollapsible = false,
}: {
  controlId: string;
  /** The program the control is read in: a technique's name then leads to its Control baseline. */
  programId?: string | undefined;
  /** Closed until asked for, where the Section sits above a control's text in a preview. */
  isCollapsible?: boolean | undefined;
}) {
  // This control's links alone: a few rows, where the whole of Table E-1 is the baseline's read.
  const scope = useMemo((): ControlLinkScope => ({ controlIds: [controlId] }), [controlId]);
  const links = useFrameworkControlLinks(CYBER_RESILIENCY_FRAMEWORK, scope);
  const supported = useMemo(
    () => supportedOnce(resiliencyByControl(links.data ?? []).get(controlId) ?? []),
    [links.data, controlId],
  );
  // What Table D-4 says of every technique and approach: one read for every control, asked for
  // once a control is known to support one.
  const items = useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, {
    kinds: RESILIENCY_GUIDANCE_KINDS,
    enabled: supported.length > 0,
  });
  const rows = useMemo(
    () => supportedGuidance(supported, items.data ?? []),
    [supported, items.data],
  );
  // Most controls support no technique: the Section waits for the read rather than promise one.
  if (links.data === undefined && !links.isError) return null;
  // A control the table does not name has no Section; a refresh of that answer that failed is
  // still said, by the page's alert or, in a panel, by its own.
  if (links.data !== undefined && !supported.length)
    return links.isError ? <ReportFailures queries={[links]} /> : null;
  // The mapping reads whole without the guidance: when that read fails with nothing to show, the
  // techniques are still listed, no row opens, and the failure is said with its Retry.
  const unread = items.isError && items.data === undefined;
  const failed = links.isError || unread;
  return (
    <Section
      title="Cyber resiliency"
      count={links.data ? supported.length : undefined}
      countMax={9999}
      description="The techniques this control supports, strongest first, with NIST's guidance for each approach, from NIST SP 800-160 Vol. 2 Rev. 1, Tables D-4 and E-1."
      // A failure is said in the open, never behind a closed heading.
      {...(isCollapsible && !failed ? { isCollapsible: true } : {})}
    >
      <QueryState queries={unread ? [links] : [links, items]}>
        {unread && <ReportFailures queries={[items]} />}
        {/* Keyed by the control: a preview that steps to another starts with its rows closed. */}
        {rows.length > 0 && <ResiliencyTable key={controlId} rows={rows} programId={programId} />}
      </QueryState>
    </Section>
  );
}

/**
 * The architectural layers Table D-5 says an approach can be used at, in the table's order, as the
 * value of a fact in an approach's preview. Table D-5 is read once for every approach, so a step to
 * the next reads nothing. A preview is drawn outside the page's region, so a failure is said in
 * place.
 */
export function ApproachLayers({ code }: { code: string }) {
  const { byApproach, queries } = useApproachLayers();
  if (!byApproach)
    return queries.some((query) => query.isError) ? (
      <Text color="color.text.subtle">Could not load</Text>
    ) : (
      <Skeleton shape="line" width={160} />
    );
  const layers = byApproach.get(code) ?? [];
  return layers.length ? (
    <>{layers.map((layer) => layer.title).join(", ")}</>
  ) : (
    <Absent label="No layer named" />
  );
}

/** A technique as the Control baseline offers it: how many of its controls the step shown selects. */
export type TechniqueOption = Pick<TechniqueControls, "code" | "slug" | "title"> & {
  /** Controls of the baseline at the step shown that support it. */
  selected: number;
  /** Controls that support it at all. */
  total: number;
};

/** The Select's value for no technique: never a technique's slug. */
const ALL = "*";

/**
 * The resiliency technique a Control baseline is read by: All controls, then each technique with
 * its count at the step shown ("Segmentation · 16 of 41"). The techniques a program chose for
 * SA-24 come first, under their own heading.
 */
export function ResiliencyTechniqueSelect({
  options,
  chosen,
  value,
  onValueChange,
}: {
  /** The techniques, in the framework's order. */
  options: readonly TechniqueOption[];
  /** The codes of the techniques the program chose for SA-24; none is one list. */
  chosen: readonly string[];
  /** The technique shown, by its slug; none is All controls. */
  value: string | null;
  onValueChange: (slug: string | null) => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const current = options.find((option) => option.slug === value);
  const groups = useMemo(() => splitByChoice(options, chosen), [options, chosen]);
  const item = (option: TechniqueOption) => (
    <SelectItem key={option.slug} value={option.slug}>
      {`${option.title} · ${formatNumber(option.selected)} of ${formatNumber(option.total)}`}
    </SelectItem>
  );
  return (
    <Select
      value={current?.slug ?? ALL}
      onValueChange={(next) => {
        if (next) onValueChange(next === ALL ? null : next);
      }}
    >
      <SelectTrigger size="small" aria-label="Resiliency technique">
        <SelectValue>{current?.title ?? "All controls"}</SelectValue>
      </SelectTrigger>
      <SelectContent aria-label="Resiliency technique">
        <SelectItem value={ALL}>All controls</SelectItem>
        <SelectSeparator />
        {groups.chosen.length ? (
          <>
            <SelectGroup>
              <SelectLabel>Chosen for SA-24</SelectLabel>
              {groups.chosen.map(item)}
            </SelectGroup>
            {groups.others.length > 0 && (
              <SelectGroup>
                <SelectLabel>Other techniques</SelectLabel>
                {groups.others.map(item)}
              </SelectGroup>
            )}
          </>
        ) : (
          <SelectGroup>
            <SelectLabel>Resiliency techniques</SelectLabel>
            {options.map(item)}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
