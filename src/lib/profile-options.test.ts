import { describe, expect, it } from "vitest";
import type { Row, TableName } from "./models";
import { profileChoices, profileOptions } from "./profile-options";

const record = <T extends TableName>(value: Partial<Row<T>>) => value as Row<T>;

/**
 * A catalog and three profiles on it: High and Low, published reference profiles, and Draft, a
 * profile revision still a draft. A fourth resolution, Tailored, layers on High.
 */
const sources = () => ({
  catalogs: [
    record<"catalog_revisions">({
      id: "catalog",
      state: "published",
      document_revision_id: "catalog-doc",
    }),
  ],
  profileRecords: [
    record<"profiles">({ id: "high", title: "High" }),
    record<"profiles">({ id: "low", title: "Low" }),
    record<"profiles">({ id: "draft", title: "Draft" }),
    record<"profiles">({ id: "tailored", title: "Tailored" }),
  ],
  profiles: [
    record<"profile_revisions">({
      id: "high-1",
      profile_id: "high",
      title: "High baseline",
      version: "5.2.0",
      state: "published",
      document_revision_id: "high-doc",
    }),
    record<"profile_revisions">({
      id: "low-1",
      profile_id: "low",
      title: "Low baseline",
      version: "5.2.0",
      state: "published",
      document_revision_id: "low-doc",
    }),
    record<"profile_revisions">({
      id: "draft-1",
      profile_id: "draft",
      title: "Draft baseline",
      version: "0.1",
      state: "draft",
      document_revision_id: "draft-doc",
    }),
    record<"profile_revisions">({
      id: "tailored-1",
      profile_id: "tailored",
      title: "Tailored baseline",
      version: "1",
      state: "published",
      document_revision_id: "tailored-doc",
    }),
  ],
  imports: [
    record<"profile_imports">({
      profile_revision_id: "high-1",
      catalog_revision_id: "catalog",
      imported_profile_revision_id: null,
      ordinal: 0,
      include_all: false,
    }),
    record<"profile_imports">({
      profile_revision_id: "low-1",
      catalog_revision_id: "catalog",
      imported_profile_revision_id: null,
      ordinal: 0,
      include_all: false,
    }),
    record<"profile_imports">({
      profile_revision_id: "draft-1",
      catalog_revision_id: "catalog",
      imported_profile_revision_id: null,
      ordinal: 0,
      include_all: false,
    }),
    record<"profile_imports">({
      profile_revision_id: "tailored-1",
      catalog_revision_id: null,
      imported_profile_revision_id: "high-1",
      ordinal: 0,
      include_all: true,
    }),
  ],
  resolutions: [
    record<"profile_resolutions">({
      id: "high-r",
      profile_revision_id: "high-1",
      state: "published",
      base_profile_resolution_id: null,
    }),
    record<"profile_resolutions">({
      id: "low-r",
      profile_revision_id: "low-1",
      state: "published",
      base_profile_resolution_id: null,
    }),
    record<"profile_resolutions">({
      id: "draft-r",
      profile_revision_id: "draft-1",
      state: "published",
      base_profile_resolution_id: null,
    }),
    record<"profile_resolutions">({
      id: "tailored-r",
      profile_revision_id: "tailored-1",
      state: "published",
      base_profile_resolution_id: "high-r",
    }),
  ],
});

describe("the profiles an element can adopt", () => {
  it("lists each published profile on a published catalog with the count the server gives it, by its label", () => {
    const options = profileOptions({
      ...sources(),
      counts: new Map([
        ["high-r", 374],
        ["low-r", 150],
        ["draft-r", 12],
        ["tailored-r", 380],
      ]),
    });
    expect(options.map((option) => [option.label, option.controlCount, option.kind])).toEqual([
      ["High · 5.2.0", 374, "reference"],
      ["Low · 5.2.0", 150, "reference"],
      ["Tailored · 1 · tailored from High", 380, "overlay"],
    ]);
    expect(options[2]).toMatchObject({ baseLabel: "High · 5.2.0", catalogId: "catalog", depth: 1 });
  });

  it("leaves out a profile that selects nothing, or whose count is not known", () => {
    const options = profileOptions({
      ...sources(),
      counts: new Map([
        ["high-r", 374],
        ["low-r", 0],
      ]),
    });
    expect(options.map((option) => option.id)).toEqual(["high-r"]);
  });

  it("gives the controls each profile selects where its selections are read", () => {
    const choices = profileChoices({
      ...sources(),
      selections: [
        { profile_resolution_id: "low-r", control_id: "ac-1" },
        { profile_resolution_id: "low-r", control_id: "ac-2" },
        { profile_resolution_id: "high-r", control_id: "ac-1" },
      ],
    });
    expect(choices.map((choice) => [choice.id, choice.controlIds])).toEqual([
      ["high-r", ["ac-1"]],
      ["low-r", ["ac-1", "ac-2"]],
    ]);
  });
});
