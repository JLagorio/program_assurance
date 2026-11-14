import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid } from "./testing/fake-client";

const {
  GATE_OUTCOMES_ANSWER_UNREADABLE,
  GATE_OUTCOMES_REQUEST_REUSED,
  addGateSecurityOutcomes,
  choiceRequests,
  gateCriterionSources,
  readGateCriterionRows,
  securityOutcomes,
} = await import("./gate-criteria");
const { LIFE_CYCLE_FRAMEWORK } = await import("./frameworks");
const { productColumnLabel, productFieldLabel } = await import("./product-records");
const { isDerivedRecordField, recordPayload } = await import("./records");
type FrameworkItem = import("./frameworks").FrameworkItem;

const tenantId = uuid(900);
const context = { tenantId, token: "token" };
const gateId = uuid(100);

let next = 1;
/** One item of the life cycle framework as the view gives it. */
function item(
  kind: string,
  code: string,
  title: string,
  ordinal: number,
  parent: FrameworkItem | null = null,
): FrameworkItem {
  return {
    id: uuid(next++),
    framework_code: LIFE_CYCLE_FRAMEWORK,
    framework_revision_id: uuid(800),
    kind,
    code,
    code_order: code.toLowerCase(),
    title,
    prose: null,
    ordinal,
    props: {},
    printed_in: "Appendix H",
    parent_item_id: parent?.id ?? null,
    parent_code: parent?.code ?? null,
    parent_kind: parent?.kind ?? null,
    parent_title: parent?.title ?? null,
  };
}

describe("the security outcomes a gate can take", () => {
  // Agreement Processes is printed last (Appendix K) and its codes sort first.
  const technical = item("process-group", "group.technical-processes", "Technical Processes", 1);
  const agreement = item("process-group", "group.agreement-processes", "Agreement Processes", 4);
  const acquisition = item("process", "process.AQ", "Acquisition", 1, agreement);
  const needs = item("process", "process.SN", "Stakeholder Needs and Requirements", 2, technical);
  const analysis = item("process", "process.BA", "Business or Mission Analysis", 1, technical);
  const items = [
    item("outcome", "outcome.AQ.1", "A supplier is selected.", 1, acquisition),
    item("outcome", "outcome.SN.1", "Stakeholders are identified.", 1, needs),
    item("outcome", "outcome.BA.2", "The solution space is characterized.", 2, analysis),
    item("outcome", "outcome.BA.10", "Traceability is established.", 10, analysis),
    item("outcome", "outcome.BA.1", "The problem space is defined.", 1, analysis),
    acquisition,
    needs,
    analysis,
    agreement,
    technical,
  ];

  it("lists them as the publication prints them: groups, their processes, their outcomes", () => {
    expect(securityOutcomes(items).map((outcome) => outcome.code)).toEqual([
      "outcome.BA.1",
      "outcome.BA.2",
      "outcome.BA.10",
      "outcome.SN.1",
      "outcome.AQ.1",
    ]);
  });

  it("names each by its sentence, with the process and the group that hold it", () => {
    const first = securityOutcomes(items)[0]!;
    expect(first).toEqual({
      id: items[4]!.id,
      code: "outcome.BA.1",
      title: "The problem space is defined.",
      process: "Business or Mission Analysis",
      group: "Technical Processes",
    });
  });

  it("leaves out an outcome whose process or group was not read, and offers nothing unloaded", () => {
    const orphan = item("process", "process.XX", "A process with no group", 1);
    const read = [...items, orphan, item("outcome", "outcome.XX.1", "An orphan.", 1, orphan)];
    expect(securityOutcomes(read)).toHaveLength(5);
    expect(securityOutcomes(items.filter((entry) => entry.kind === "outcome"))).toEqual([]);
    expect(securityOutcomes([])).toEqual([]);
  });
});

describe("what a gate's criteria were drawn from", () => {
  const rows = [
    {
      id: uuid(1),
      outcome_item_id: uuid(11),
      outcome_code: "outcome.SR.2",
      process_title: "System Requirements Definition",
      group_title: "Technical Processes",
    },
    // A criterion somebody wrote.
    {
      id: uuid(2),
      outcome_item_id: null,
      outcome_code: null,
      process_title: null,
      group_title: null,
    },
    // An outcome whose reference rows the reader cannot read.
    {
      id: uuid(3),
      outcome_item_id: uuid(13),
      outcome_code: null,
      process_title: null,
      group_title: null,
    },
  ];

  it("reads the register's view for one gate, only the columns it names", async () => {
    const { client, calls } = fakeClient(() => ({ data: rows, error: null, count: rows.length }));
    const sources = gateCriterionSources(await readGateCriterionRows(client, context, gateId));
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("gate_criterion_rows");
    expect(args(calls[0], "select")[0]).toEqual([
      "id,outcome_item_id,outcome_code,process_title,group_title",
      { count: "exact", head: false },
    ]);
    expect(filter(calls[0], "eq", "gate_id")).toBe(gateId);
    expect(args(calls[0], "or")[0]).toEqual([`tenant_id.eq.${tenantId},tenant_id.is.null`]);
    expect(args(calls[0], "setHeader")[0]).toEqual(["Authorization", "Bearer token"]);
    expect(sources.byCriterion.get(uuid(1))).toEqual({
      outcomeCode: "outcome.SR.2",
      process: "System Requirements Definition",
      group: "Technical Processes",
    });
  });

  it("names no source for a written criterion, and holds each drawn outcome by its code", () => {
    const sources = gateCriterionSources(rows);
    expect(sources.byCriterion.has(uuid(2))).toBe(false);
    expect(sources.byCriterion.get(uuid(3))).toEqual({
      outcomeCode: null,
      process: null,
      group: null,
    });
    expect([...sources.outcomeCodes]).toEqual(["outcome.SR.2"]);
  });

  it("says a failed read", async () => {
    const { client } = fakeClient(() => ({
      data: null,
      error: { message: "permission denied for view gate_criterion_rows" },
      count: null,
    }));
    await expect(readGateCriterionRows(client, context, gateId)).rejects.toThrow(
      "permission denied for view gate_criterion_rows",
    );
  });
});

describe("add security outcomes", () => {
  const answer = { gateId, added: 2, skipped: 1, criterionIds: [uuid(21), uuid(22)] };
  const request = {
    gateId,
    requestId: uuid(500),
    outcomeItemIds: [uuid(12), uuid(11), uuid(13)],
  };

  it("sends the whole choice in one request, under the id chosen for it", async () => {
    const { client, calls } = fakeClient(() => ({ data: answer, error: null }));
    const added = await addGateSecurityOutcomes(client, context, request);
    expect(added).toEqual(answer);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("rpc:add_gate_security_outcomes");
    expect(args(calls[0], "rpc")[0]).toEqual([
      {
        p_tenant_id: tenantId,
        p_gate_id: gateId,
        p_request_id: uuid(500),
        p_outcome_item_ids: [uuid(12), uuid(11), uuid(13)],
      },
    ]);
    expect(args(calls[0], "setHeader")[0]).toEqual(["Authorization", "Bearer token"]);
  });

  it("says a refusal in the command's words, and a reused request in its own", async () => {
    const refused = fakeClient(() => ({
      data: null,
      error: { code: "23514", message: "Lifecycle gate was not found in this workspace" },
    }));
    await expect(addGateSecurityOutcomes(refused.client, context, request)).rejects.toThrow(
      "Lifecycle gate was not found in this workspace",
    );
    const viewer = fakeClient(() => ({
      data: null,
      error: { code: "42501", message: "Workspace write access is required" },
    }));
    await expect(addGateSecurityOutcomes(viewer.client, context, request)).rejects.toThrow(
      "Workspace write access is required",
    );
    const reused = fakeClient(() => ({
      data: null,
      error: { code: "PT409", message: "This request has already been used" },
    }));
    await expect(addGateSecurityOutcomes(reused.client, context, request)).rejects.toThrow(
      GATE_OUTCOMES_REQUEST_REUSED,
    );
  });

  it("does not pass on an answer it cannot read", async () => {
    const { client } = fakeClient(() => ({ data: { added: "two" }, error: null }));
    await expect(addGateSecurityOutcomes(client, context, request)).rejects.toThrow(
      GATE_OUTCOMES_ANSWER_UNREADABLE,
    );
  });

  it("chooses a request id once for a choice, whatever order it was made in", () => {
    let made = 0;
    const requestFor = choiceRequests(() => uuid(600 + made++));
    const first = requestFor([uuid(11), uuid(12)]);
    // The same outcomes again, as after a lost answer: the same request.
    expect(requestFor([uuid(12), uuid(11)])).toBe(first);
    expect(requestFor([uuid(11), uuid(12), uuid(11)])).toBe(first);
    // Another choice is another request, and going back to the first is the first again.
    const second = requestFor([uuid(11), uuid(12), uuid(13)]);
    expect(second).not.toBe(first);
    expect(requestFor([uuid(11), uuid(12)])).toBe(first);
    expect(made).toBe(2);
    // Another opening of the picker starts over.
    expect(choiceRequests(() => uuid(700))([uuid(11), uuid(12)])).toBe(uuid(700));
  });
});

describe("the outcome a criterion was drawn from, in a form and a preview", () => {
  it("is named Security outcome wherever it is named", () => {
    expect(productColumnLabel("gate_criteria", "outcome_item_id")).toBe("Security outcome");
    expect(productFieldLabel("gate_criteria", "outcome_item_id")).toBe("Security outcome");
    // Every other column keeps the words its name gives it.
    expect(productColumnLabel("gate_criteria", "gate_id")).toBeUndefined();
    expect(productFieldLabel("gate_criteria", "gate_id")).toBe("Gate");
    expect(productColumnLabel("risks", "outcome_item_id")).toBeUndefined();
  });

  it("is never a field of the generic form, and a save leaves it as it is", () => {
    expect(isDerivedRecordField("gate_criteria", "outcome_item_id")).toBe(true);
    expect(isDerivedRecordField("gate_criteria", "title")).toBe(false);
    const column = (name: string, type: string, required = false) => ({
      name,
      type,
      required,
      default: null,
      description: null,
      choices: [],
    });
    const criteria = {
      name: "gate_criteria",
      description: null,
      columns: [column("title", "text", true), column("outcome_item_id", "uuid")],
      relations: [],
      can_insert: true,
      can_update: true,
      can_delete: true,
    };
    // Even handed a value, as a forged form would be, the payload does not carry the column.
    expect(
      recordPayload(
        criteria,
        { title: "Reworded", outcome_item_id: "" },
        { id: uuid(1), revision: 1, title: "As printed", outcome_item_id: uuid(11) },
      ),
    ).toEqual({ title: "Reworded" });
  });
});
