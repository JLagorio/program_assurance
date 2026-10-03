import { revisionStates } from "@/lib/status";
import { StatusBadge } from "@/components/app/status";
import {
  Button,
  DateTime,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Stack,
  Table,
  Text,
  VisuallyHidden,
} from "@ledger/design-system";
import { useLayoutEffect, useState, type ReactNode, type Ref } from "react";
import type { QueryStatus } from "./work-common";

/**
 * One choice from a short fixed list. On its own it is a labelled Field; `inline` draws the Select
 * alone, named by `label`, as the value of a rail row whose label says the same
 * (`<KeyValue label="Version">`), so choosing sits in the Details grid instead of above it.
 */
export function LibrarySelect({
  label,
  value,
  options,
  onChange,
  inline = false,
  triggerRef,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  inline?: boolean | undefined;
  /** The trigger, for a caller that returns focus to it. */
  triggerRef?: Ref<HTMLButtonElement> | undefined;
}) {
  const select = (
    <Select<string>
      value={value}
      items={options}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger
        ref={triggerRef}
        className="w-full"
        {...(inline ? { size: "small" as const, "aria-label": label } : {})}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  if (inline) return select;
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {select}
    </Field>
  );
}

type HistoryVersion = {
  id: string;
  version_number: number;
  state: string;
  published_at: string | null;
};

/** The four columns' floors together (68 + 100 + 104 + 80): below it the date leaves its column. */
const HISTORY_COLUMNS_FIT = 352;

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
 * A versioned library record's history, newest first, as the kit Table: the version on this page is
 * selected and current, and every other version opens with its own button. The order is the
 * history's meaning, so it has no search, sort or eye.
 *
 * Each column has a floor that holds its value whole. Where the four do not fit (a narrow phone,
 * about 350px), the published date stacks under the state, as "Published 3 Sep 2026", instead of
 * taking a third column, so the version, the state and the button stay in view without scrolling:
 * the button reads "Open" and is named "Open version N".
 */
export function VersionHistory({
  label,
  versions,
  shownId,
  onVersion,
  shownRef,
}: {
  /** The table's name: "Versions of this product". */
  label: string;
  versions: readonly HistoryVersion[];
  /** The version this page shows. */
  shownId: string;
  onVersion: (id: string) => void;
  /** The shown version's mark, which takes focus once a version opened from here is drawn. */
  shownRef?: Ref<HTMLElement> | undefined;
}) {
  const [frameRef, narrow] = useNarrowFrame(HISTORY_COLUMNS_FIT);
  return (
    <Table label={label} frameRef={frameRef}>
      <thead>
        <tr>
          <Table.Header minWidth={68}>Version</Table.Header>
          <Table.Header minWidth={100}>State</Table.Header>
          {!narrow && <Table.Header minWidth={104}>Published</Table.Header>}
          <Table.Header minWidth={80}>
            <VisuallyHidden>Open</VisuallyHidden>
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {versions.map((version) => {
          const shown = version.id === shownId;
          return (
            <Table.Row
              key={version.id}
              isSelected={shown}
              {...(shown ? { "aria-current": "true" as const } : {})}
            >
              <Table.Cell>{version.version_number}</Table.Cell>
              {narrow ? (
                <Table.Cell wrap>
                  <Stack space="space.050" alignInline="start">
                    <StatusBadge statuses={revisionStates} value={version.state} size="xsmall" />
                    {version.published_at && (
                      <Text size="small" color="color.text.subtle">
                        Published <DateTime value={version.published_at} format="date" />
                      </Text>
                    )}
                  </Stack>
                </Table.Cell>
              ) : (
                <>
                  <Table.Cell>
                    <StatusBadge statuses={revisionStates} value={version.state} size="xsmall" />
                  </Table.Cell>
                  <Table.Cell>
                    <DateTime
                      value={version.published_at}
                      format="date"
                      absentLabel="Not published"
                    />
                  </Table.Cell>
                </>
              )}
              <Table.Cell wrap>
                {shown ? (
                  <Text
                    ref={shownRef}
                    tabIndex={-1}
                    size="small"
                    color="color.text.subtle"
                    className="rounded-xsmall outline-none focus-visible:outline-focused"
                  >
                    Shown on this page
                  </Text>
                ) : (
                  <Button variant="subtle" size="small" onClick={() => onVersion(version.id)}>
                    Open<VisuallyHidden> version {version.version_number}</VisuallyHidden>
                  </Button>
                )}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

/**
 * A value in a rail that comes from its own queries: a skeleton while they load, "Could not
 * load" when one fails with nothing to show, and the value once they are in. Loading and failure
 * never read as a value.
 */
export function QueryValue({
  queries,
  children,
}: {
  queries: QueryStatus[];
  /** The value, drawn only once every query has its data. */
  children: () => ReactNode;
}) {
  if (queries.some((query) => query.isError && query.data === undefined))
    return <Text color="color.text.subtle">Could not load</Text>;
  if (queries.some((query) => query.data === undefined))
    return (
      <>
        <Skeleton shape="line" width={64} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </>
    );
  return <>{children()}</>;
}
