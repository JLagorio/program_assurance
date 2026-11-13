import { describe, expect, it, vi } from "vitest";

// The requirement types come from the edit command's module, which reads the workspace.
vi.mock("@/components/app/workspace", () => ({ useWorkspace: vi.fn() }));
vi.mock("./database", () => ({ database: vi.fn(), requireIdentity: vi.fn() }));

import {
  FILE_NEEDS_ROWS,
  REQIF_NEEDS_OBJECTS,
  importColumns,
  importFileKind,
  parseDelimited,
  readReqif,
  readRequirementRows,
  workbookTable,
} from "./requirement-import-file";

describe("parseDelimited", () => {
  it("reads commas, quoted cells with separators and line breaks, and doubled quotes", () => {
    expect(
      parseDelimited(
        'Ref,Statement\n3.1,"The unit shall log, then ""seal"" the\nrecord."\n\n3.2,Plain\n',
      ),
    ).toEqual([
      ["Ref", "Statement"],
      ["3.1", 'The unit shall log, then "seal" the\nrecord.'],
      ["3.2", "Plain"],
    ]);
  });

  it("reads rows pasted from a spreadsheet, which are separated by tabs", () => {
    expect(
      parseDelimited("Ref\tStatement\r\n3.1\tThe unit shall, when armed, report.\r\n"),
    ).toEqual([
      ["Ref", "Statement"],
      ["3.1", "The unit shall, when armed, report."],
    ]);
  });

  it("reads semicolons where the first line uses them, and drops a byte order mark", () => {
    expect(parseDelimited(`${String.fromCharCode(0xfeff)}Ref;Statement\n3.1;One, two`)).toEqual([
      ["Ref", "Statement"],
      ["3.1", "One, two"],
    ]);
  });
});

describe("importColumns", () => {
  it("finds each field by what its heading says, whatever the tool calls it", () => {
    expect(
      importColumns(["Requirement ID", "Heading", "Requirement Text", "Category", "Fit Criterion"]),
    ).toEqual({ reference: 0, title: 1, statement: 2, type: 3, acceptanceCriteria: 4 });
  });

  it("does not give one column to two fields", () => {
    // "Requirement" alone is the text; the identifier is the column that says so.
    expect(importColumns(["Para", "Requirement"])).toEqual({ reference: 0, statement: 1 });
    expect(importColumns(["ID", "Description"])).toEqual({ reference: 0, statement: 1 });
  });
});

describe("readRequirementRows", () => {
  it("gives the requirements in the file's order with the fields it found", () => {
    const read = readRequirementRows(
      [
        "Reference,Title,Statement,Type,Acceptance criteria,Rationale",
        "3.2.1,Audit,The system shall record every arming.,Security,Shown in test,Customer policy",
        "3.2.2,,The system shall refuse an unsigned load.,Unknown kind,,",
      ].join("\n"),
    );
    expect(read.issues).toEqual([]);
    expect(read.skipped).toBe(0);
    expect(read.fields).toEqual([
      "reference",
      "title",
      "statement",
      "type",
      "acceptanceCriteria",
      "rationale",
    ]);
    expect(read.requirements).toEqual([
      {
        reference: "3.2.1",
        title: "Audit",
        statement: "The system shall record every arming.",
        type: "security",
        acceptanceCriteria: "Shown in test",
        rationale: "Customer policy",
      },
      // A type the product does not know is left for the import's default.
      { reference: "3.2.2", statement: "The system shall refuse an unsigned load." },
    ]);
  });

  it("passes over a row with no reference or no statement, and counts it", () => {
    const read = readRequirementRows("Ref,Statement\n3.1,One\n,Two\n3.3,\n3.4,Four");
    expect(read.requirements.map((row) => row.reference)).toEqual(["3.1", "3.4"]);
    expect(read.skipped).toBe(2);
  });

  it("says which column is missing, and reads nothing", () => {
    const read = readRequirementRows("Title,Owner\nAudit,Ana");
    expect(read.requirements).toEqual([]);
    expect(read.issues).toHaveLength(2);
    expect(read.issues[0]).toContain("Reference");
    expect(read.issues[1]).toContain("Statement");
  });

  it("says a file with headings alone, or nothing, holds no rows", () => {
    expect(readRequirementRows("Reference,Statement\n").issues).toEqual([FILE_NEEDS_ROWS]);
    expect(readRequirementRows("").issues).toEqual([FILE_NEEDS_ROWS]);
  });
});

describe("elements", () => {
  it("reads the element codes a row names, each once, whatever separates them", () => {
    const read = readRequirementRows(
      'Reference,Statement,Allocated to\n3.1,One,"CA-GS-OFP; CA-CS-CRY, CA-GS-OFP"\n3.2,Two,',
    );
    expect(read.fields).toEqual(["reference", "statement", "elements"]);
    expect(read.requirements).toEqual([
      { reference: "3.1", statement: "One", elements: ["CA-GS-OFP", "CA-CS-CRY"] },
      { reference: "3.2", statement: "Two" },
    ]);
  });
});

describe("workbookTable", () => {
  it("gives the first sheet that holds anything as rows of text", () => {
    const sheet = (cells: Record<string, Record<string, { input: string }>>) => ({
      rows: [{ id: "r1" }, { id: "r2" }, { id: "r3" }],
      columns: [{ id: "a" }, { id: "b" }],
      cells,
    });
    const table = workbookTable({
      sheets: [
        sheet({}),
        sheet({
          r1: { a: { input: "Ref" }, b: { input: " Statement " } },
          r3: { a: { input: "3.1" }, b: { input: "It shall." } },
        }),
      ],
    });
    expect(table).toEqual([
      ["Ref", "Statement"],
      ["3.1", "It shall."],
    ]);
    expect(readRequirementRows("").issues).toEqual([FILE_NEEDS_ROWS]);
  });
});

describe("readReqif", () => {
  const reqif = `<?xml version="1.0"?>
<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd" xmlns:xhtml="http://www.w3.org/1999/xhtml">
 <CORE-CONTENT><REQ-IF-CONTENT>
  <SPEC-TYPES>
   <SPEC-OBJECT-TYPE IDENTIFIER="_t" LONG-NAME="Requirement"><SPEC-ATTRIBUTES>
    <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="_id" LONG-NAME="ReqIF.ForeignID"><TYPE/></ATTRIBUTE-DEFINITION-STRING>
    <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="_name" LONG-NAME="ReqIF.Name"/>
    <ATTRIBUTE-DEFINITION-XHTML IDENTIFIER="_text" LONG-NAME="ReqIF.Text"/>
   </SPEC-ATTRIBUTES></SPEC-OBJECT-TYPE>
  </SPEC-TYPES>
  <SPEC-OBJECTS>
   <SPEC-OBJECT IDENTIFIER="_o1"><VALUES>
    <ATTRIBUTE-VALUE-STRING THE-VALUE="SRD-12"><DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>_id</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION></ATTRIBUTE-VALUE-STRING>
    <ATTRIBUTE-VALUE-STRING THE-VALUE="Key &amp; load"><DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>_name</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION></ATTRIBUTE-VALUE-STRING>
    <ATTRIBUTE-VALUE-XHTML><DEFINITION><ATTRIBUTE-DEFINITION-XHTML-REF>_text</ATTRIBUTE-DEFINITION-XHTML-REF></DEFINITION>
     <THE-VALUE><xhtml:div>The unit shall load keys <xhtml:b>only</xhtml:b> when safed.<xhtml:br/>It shall log each load.</xhtml:div></THE-VALUE>
    </ATTRIBUTE-VALUE-XHTML>
   </VALUES></SPEC-OBJECT>
   <SPEC-OBJECT IDENTIFIER="_o2"><VALUES>
    <ATTRIBUTE-VALUE-STRING THE-VALUE="3 Security"><DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>_name</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION></ATTRIBUTE-VALUE-STRING>
   </VALUES></SPEC-OBJECT>
  </SPEC-OBJECTS>
 </REQ-IF-CONTENT></CORE-CONTENT>
</REQ-IF>`;

  it("reads each object with the customer's identifier, its name and its text as words", () => {
    const read = readReqif(reqif);
    expect(read.issues).toEqual([]);
    expect(read.requirements).toEqual([
      {
        reference: "SRD-12",
        title: "Key & load",
        statement: "The unit shall load keys only when safed.\nIt shall log each load.",
      },
    ]);
    // A heading object holds no text: it is passed over and counted.
    expect(read.skipped).toBe(1);
  });

  it("takes an object's own identifier where the file gives none of the customer's", () => {
    const read = readReqif(
      reqif.replace(
        /<ATTRIBUTE-VALUE-STRING THE-VALUE="SRD-12">[\s\S]*?<\/ATTRIBUTE-VALUE-STRING>/,
        "",
      ),
    );
    expect(read.requirements[0]?.reference).toBe("_o1");
  });

  it("says a file with no objects holds none", () => {
    expect(readReqif("<REQ-IF></REQ-IF>").issues).toEqual([REQIF_NEEDS_OBJECTS]);
  });
});

describe("importFileKind", () => {
  it("reads a file by its name", () => {
    expect(importFileKind("Customer SRD.XLSX")).toBe("workbook");
    expect(importFileKind("srd.reqif")).toBe("reqif");
    expect(importFileKind("srd.csv")).toBe("text");
  });
});
