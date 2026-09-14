import { createHash } from "node:crypto";

export const datasetId = "legacy-poc-v1";
const unknown =
  /^(?:—|-|unassigned|unrecorded(?: in source assessment)?|unknown|n\/a|pending|none)$/i;
export const text = (value) =>
  typeof value === "string" && value.trim() && !unknown.test(value.trim()) ? value.trim() : null;
export const lower = (value) => text(value)?.toLowerCase() ?? null;
export const sha256 = (value) =>
  createHash("sha256")
    .update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value))
    .digest("hex");
export function deterministicId(tenantId, table, key) {
  const namespace = Buffer.from("a7829e1a971354d0a3e24f5a501559cc", "hex");
  const bytes = createHash("sha1")
    .update(namespace)
    .update(`${datasetId}/${tenantId}/${table}/${key}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function createContext({ source, refs, tenantId, importedAt, fixtureSha256 }) {
  const entries = [],
    operations = [],
    issues = [],
    indexed = new Map();
  const ctx = {
    source,
    refs,
    tenantId,
    importedAt,
    fixtureSha256,
    entries,
    operations,
    issues,
    maps: Object.fromEntries(
      [
        "program",
        "system",
        "programSystem",
        "node",
        "scope",
        "requirement",
        "party",
        "component",
        "ssp",
        "evidence",
        "campaign",
        "procedure",
        "issue",
        "observation",
        "risk",
        "poam",
        "task",
        "workstream",
        "package",
      ].map((key) => [key, new Map()]),
    ),
    id: (table, key) => deterministicId(tenantId, table, key),
    lookup: (table, key) => indexed.get(`${table}/${key}`)?.values.id ?? null,
    sourceAt(pointer) {
      return (
        pointer
          ?.split("/")
          .slice(1)
          .reduce(
            (value, key) => value?.[key.replaceAll("~1", "/").replaceAll("~0", "~")],
            source,
          ) ?? null
      );
    },
    report(pointer, code, message) {
      issues.push({ pointer, code, message });
    },
    add(table, key, pointer, values) {
      if (!/^[a-z_]+$/.test(table)) throw new Error(`Invalid destination table ${table}`);
      const id = ctx.id(table, key);
      const entry = {
        table,
        key: String(key),
        pointer,
        source: ctx.sourceAt(pointer),
        values: { id, tenant_id: tenantId, ...values },
      };
      if (entry.values.id !== id || entry.values.tenant_id !== tenantId)
        throw new Error("Mapper attempted to override destination identity");
      const prior = indexed.get(`${table}/${key}`);
      if (prior) {
        if (JSON.stringify(prior.values) !== JSON.stringify(entry.values))
          throw new Error(`Conflicting mapped record ${table}/${key}`);
        return id;
      }
      entries.push(entry);
      operations.push({ kind: "insert", entry });
      indexed.set(`${table}/${key}`, entry);
      return id;
    },
    finish(table, key, patch) {
      const entry = indexed.get(`${table}/${key}`);
      if (!entry) throw new Error(`Missing imported record ${table}/${key}`);
      entry.finalize = { ...entry.finalize, ...patch };
      operations.push({ kind: "finalize", entry, patch });
    },
    date(value, pointer) {
      const input = text(value);
      if (!input) return null;
      let formatted;
      if (/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(input)) formatted = input.slice(0, 10);
      else if (/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(input)) {
        const parsed = new Date(`${input} 00:00:00 GMT`);
        if (Number.isFinite(parsed.valueOf())) formatted = parsed.toISOString().slice(0, 10);
      }
      if (formatted && new Date(`${formatted}T00:00:00Z`).toISOString().startsWith(formatted))
        return formatted;
      ctx.report(
        pointer,
        "date_not_precise",
        `Date '${input}' has no complete, valid year/month/day; left null.`,
      );
      return null;
    },
    timestamp(value, pointer) {
      const input = text(value);
      if (!input) return null;
      if (
        /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(input) &&
        Number.isFinite(Date.parse(input))
      )
        return input;
      ctx.report(
        pointer,
        "timestamp_not_precise",
        `Timestamp '${input}' lacks an explicit time or timezone; left null.`,
      );
      return null;
    },
    party(value, pointer) {
      const name = text(value);
      if (!name) return null;
      const id = ctx.maps.party.get(name);
      if (!id)
        ctx.report(
          pointer,
          "unresolved_party",
          `No person or organization record identifies '${name}'; party reference left null.`,
        );
      return id ?? null;
    },
  };
  return ctx;
}
export function mapPeople(ctx) {
  for (const [index, vendor] of (ctx.source.vendors ?? []).entries()) {
    const id = ctx.add("parties", `vendor:${vendor.domain}`, `/vendors/${index}`, {
      party_type: "organization",
      name: vendor.name,
    });
    if (vendor.id) ctx.maps.party.set(vendor.id, id);
    ctx.maps.party.set(vendor.name, id);
    ctx.report(
      `/vendors/${index}`,
      "vendor_metadata_unmodeled",
      "Supplier organization restored. Original domain, product description, risk/assurance labels and commercial metadata remain in source provenance; no unrelated party fields were invented.",
    );
  }
  for (const [index, person] of ctx.source.people.entries()) {
    const id = ctx.add("parties", person.id, `/people/${index}`, {
      party_type: "person",
      name: person.name,
      email: text(person.email),
      auth_user_id: null,
    });
    ctx.maps.party.set(person.id, id);
    ctx.maps.party.set(person.name, id);
  }
}
