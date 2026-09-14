import { Badge, Button, Inline, Stack } from "@ledger/design-system";
import { useRows, type Row } from "@/lib/models";

function Parts({
  parts,
  parentId = null,
}: {
  parts: Row<"control_parts">[];
  parentId?: string | null;
}) {
  return (
    <Stack space="space.150">
      {parts
        .filter((part) => part.parent_part_id === parentId)
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((part) => (
          <Stack key={part.id} space="space.075" className={parentId ? "border-s ps-150" : ""}>
            <Inline space="space.100" shouldWrap>
              <Badge variant="secondary" tone="neutral">
                {part.name.replaceAll("-", " ")}
              </Badge>
              {part.source_id ? (
                <span className="font-body-small text-subtle">{part.source_id}</span>
              ) : null}
            </Inline>
            {part.title ? <h4 className="font-body-small font-semibold">{part.title}</h4> : null}
            {part.prose ? (
              <p className="whitespace-pre-wrap font-body-small">{part.prose}</p>
            ) : null}
            {parts.some((child) => child.parent_part_id === part.id) ? (
              <Parts parts={parts} parentId={part.id} />
            ) : null}
          </Stack>
        ))}
    </Stack>
  );
}

export function ControlDetail({ control }: { control: Row<"controls"> }) {
  const parts = useRows("control_parts", { control_id: control.id });
  if (parts.isPending)
    return (
      <p className="text-subtle" role="status">
        Loading control statements…
      </p>
    );
  if (parts.error)
    return (
      <Stack space="space.100">
        <p className="text-danger" role="alert">
          {parts.error.message}
        </p>
        <Button size="small" onClick={() => void parts.refetch()}>
          Retry statements
        </Button>
      </Stack>
    );
  return (
    <Stack space="space.150">
      <h3 className="font-body-large font-semibold">
        {control.code} · {control.title}
      </h3>
      {control.status === "withdrawn" ? <Badge tone="warning">Withdrawn</Badge> : null}
      {parts.data.length ? (
        <Parts parts={parts.data} />
      ) : (
        <p className="font-body-small text-subtle">
          No statement text is recorded for this control.
        </p>
      )}
    </Stack>
  );
}
