/**
 * Restoring a workspace saved under the previous vocabularies.
 *
 * Two renames in this batch changed values that sit in a reader's browser: the
 * finding severity scale (CAT I/II/III to Critical/High/Moderate/Low) and the
 * library's entry kind (Component/Overlay to Product/Policy, with a version's
 * `baseOverlay` becoming `basePolicy`). Both stores validate what they load, and
 * both used to reject an unknown value outright — which does not fail safe: it
 * throws away every edit the reader had made. These tests pin the translation.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const storageKeys = {
  library: "equinox.assurance-library.v1",
  records: "equinox.assurance-records.v1",
};

let entries: Map<string, string>;

/** Each case starts from a browser whose only saved state is the legacy record. */
const savedAs = (key: string, value: unknown) => {
  entries.set(key, JSON.stringify(value));
};

beforeEach(() => {
  vi.resetModules();
  entries = new Map();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    },
  });
});

describe("a library saved before the consolidation", () => {
  it("translates the old kinds instead of losing the catalogue", async () => {
    const saved = {
      entries: [
        {
          id: "CMP-900",
          key: "legacy-policy",
          kind: "Overlay",
          name: "Legacy corporate policy",
          category: "Policy",
          owner: "Sarah Chen",
          versions: [
            {
              id: "CMP-900@1.0",
              version: "1.0",
              publishedOn: "Jan 1, 2026",
              controls: [],
              requirements: [],
              evidence: [],
              children: [],
              baseOverlay: null,
              conditions: [],
            },
          ],
          draft: null,
        },
      ],
      uses: [],
      assignments: [],
      decisions: [],
      programEvidence: [],
    };
    savedAs(storageKeys.library, saved);
    const { libraryEntries, restoreLibrary } = await import("@/lib/assurance-library");

    expect(() => restoreLibrary()).not.toThrow();
    const entry = libraryEntries().find((row) => row.key === "legacy-policy");
    expect(entry?.kind).toBe("Policy");
    // The renamed field arrives under its new name rather than failing the parse.
    expect(entry?.versions[0]?.basePolicy).toBeNull();
  });
});

describe("assurance records saved under the CAT scale", () => {
  it("regrades a stored CAT I rather than dropping every finding", async () => {
    const saved = {
      findings: [
        {
          id: "FND-9001",
          program: "PRG-1041",
          title: "Console does not lock after the idle interval",
          control: "AC-11",
          cci: "CCI-000057",
          asset: "AST-0117",
          source: "STIG checklist",
          sourceArtifact: "EVD-001",
          rawSeverity: "CAT I",
          mitigatedSeverity: "CAT I",
          lifecycle: "Open",
          firstSeen: "Aug 1, 2026",
          lastSeen: "Aug 20, 2026",
          occurrences: 1,
          owner: "Platform ops",
          detail: "The operator console stays unlocked past the configured idle timeout.",
          assessment: {
            method: "Test",
            procedure: "AC-11 idle lock",
            assessedBy: "Assessor",
            assessedOn: "Aug 20, 2026",
            determination: "Other than satisfied",
            evidence: [],
          },
          recommendation: "Set the session lock to the required interval.",
        },
      ],
      poams: [],
    };

    savedAs(storageKeys.records, saved);
    const { restoreAssuranceRecords } = await import("@/lib/assurance-record-store");
    const { findings } = await import("@/lib/findings");

    // It used to throw here, and the toast that surfaced the ZodError was the
    // reader's only sign that their saved findings had just been discarded.
    expect(() => restoreAssuranceRecords()).not.toThrow();
    expect(findings.find((row) => row.id === "FND-9001")?.rawSeverity).toBe("High");
  });
});
