import { createContext, useContext, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PinOff } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  DateTime,
  Heading,
  IconButton,
  Inline,
  KeyValue,
  LinkButton,
  Prose,
  Skeleton,
  Stack,
  Text,
} from "@ledger/design-system";
import { FieldStatus } from "@/components/app/status";
import { useRow, useRows, type TableName } from "@/lib/models";
import { productRecordNoun } from "@/lib/product-records";
import type { DataRecord } from "@/lib/records";
import { recordDestination } from "./record-preview";

/** A reference is a record identity, never another copy of its editable form or draft. */
export type RecordIdentity = { table: TableName; id: string; label?: string | undefined };
export const RecordComparisonContext = createContext<{
  pinned: RecordIdentity | null;
  pin: (identity: RecordIdentity) => void;
  close: () => void;
} | null>(null);
export const useRecordComparison = () => useContext(RecordComparisonContext);

/** Reads only when a peek opens or a record is explicitly pinned; normal links do no extra work. */
export function useRecordReference(identity: RecordIdentity, enabled = true) {
  const record = useRow(identity.table, enabled ? identity.id : null);
  const revisions = useRows(
    "requirement_revisions",
    { engineering_requirement_id: identity.id },
    {
      enabled: enabled && identity.table === "engineering_requirements",
      order: { column: "version_number", ascending: false },
    },
  );
  const controls = useRows(
    "control_parts",
    { control_id: identity.id },
    {
      enabled: enabled && identity.table === "controls",
      columns: ["id", "prose"],
    },
  );
  const details =
    identity.table === "engineering_requirements"
      ? revisions
      : identity.table === "controls"
        ? controls
        : null;
  const data = record.data
    ? ({
        ...record.data,
        ...(identity.table === "engineering_requirements" ? revisions.data?.[0] : {}),
        id: identity.id,
      } as DataRecord)
    : null;
  const title = String(
    data?.["title"] ??
      data?.["name"] ??
      data?.["code"] ??
      identity.label ??
      productRecordNoun(identity.table),
  );
  const body = data
    ? ["statement", "description", "acceptance_criteria", "rationale"].flatMap((key) =>
        typeof data[key] === "string" && data[key]
          ? [
              {
                label:
                  key === "acceptance_criteria"
                    ? "Acceptance criteria"
                    : key.charAt(0).toUpperCase() + key.slice(1),
                text: String(data[key]),
              },
            ]
          : [],
      )
    : [];
  if (identity.table === "controls")
    for (const item of controls.data ?? [])
      if (item.prose) body.push({ label: "Control text", text: item.prose });
  return {
    data,
    title,
    body,
    loading: enabled && (record.isPending || !!details?.isPending),
    error: record.error ?? details?.error,
    retry: () => {
      void record.refetch();
      if (details) void details.refetch();
    },
  };
}
export function RecordReferenceContent({
  identity,
  compact = false,
}: {
  identity: RecordIdentity;
  compact?: boolean | undefined;
}) {
  const reference = useRecordReference(identity);
  if (reference.loading)
    return (
      <Stack space="space.100" aria-label="Loading record preview">
        <Skeleton shape="line" />
        <Skeleton shape="line" />
        <Skeleton shape="line" />
      </Stack>
    );
  if (reference.error)
    return (
      <Alert tone="danger">
        <AlertDescription>
          Could not load this record.{" "}
          <Button variant="link" onClick={reference.retry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  if (!reference.data)
    return (
      <Text color="color.text.subtle">This record is no longer available in this workspace.</Text>
    );
  const data = reference.data;
  const statusField = data["status"] ? "status" : data["state"] ? "state" : undefined;
  const fields: ReactNode = (
    <KeyValue.Group>
      {data["code"] && <KeyValue label="Code">{String(data["code"])}</KeyValue>}
      {statusField && (
        <KeyValue label="Status">
          <FieldStatus table={identity.table} field={statusField} value={data[statusField]} />
        </KeyValue>
      )}
      {data["updated_at"] && (
        <KeyValue label="Updated">
          <DateTime value={String(data["updated_at"])} />
        </KeyValue>
      )}
    </KeyValue.Group>
  );
  return (
    <Stack space="space.150">
      <Heading size="section">{reference.title}</Heading>
      {fields}
      {(compact ? reference.body.slice(0, 1) : reference.body).map((part, index) =>
        compact ? (
          <Text key={`${part.label}-${index}`} size="small" maxLines={3}>
            {part.text}
          </Text>
        ) : (
          <Prose key={`${part.label}-${index}`} label={part.label}>
            {part.text}
          </Prose>
        ),
      )}
      {!reference.body.length && (
        <Text size="small" color="color.text.subtle">
          {productRecordNoun(identity.table)}
        </Text>
      )}
    </Stack>
  );
}

export function PinnedRecord({
  identity,
  onClose,
}: {
  identity: RecordIdentity;
  onClose: () => void;
}) {
  const row = useRow(identity.table, identity.id);
  return (
    <Stack space="space.200" data-record-reference={`${identity.table}:${identity.id}`}>
      <Inline spread="space-between" shouldWrap>
        <Text size="small" weight="medium">
          Pinned reference
        </Text>
        <Inline space="space.050">
          {row.data && (
            <LinkButton
              size="small"
              variant="subtle"
              render={
                <Link {...recordDestination(identity.table, { ...row.data, id: identity.id })} />
              }
            >
              Open record
            </LinkButton>
          )}
          <IconButton
            label="Unpin reference"
            icon={<PinOff />}
            variant="subtle"
            onClick={onClose}
          />
        </Inline>
      </Inline>
      <RecordReferenceContent identity={identity} />
    </Stack>
  );
}
