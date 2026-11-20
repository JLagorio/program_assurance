// A working example of the V3 kit (not part of the prototype: built only into out/v3r-kit.html). Route k3-demo, records k3-demo--<id>(--<tab>).
(function () {
  const PA = window.PA, K = PA.v3k, V3 = PA.v3; if (!K) return;
  const ITEMS = [
    { id: "a", fam: "AC", name: "Account Management", code: "AC-2", desc: "Define and document the types of accounts allowed and specifically prohibited for use within the system.", st: "Satisfied", ev: [26, 26], owner: "Priya Raghavan" },
    { id: "b", fam: "AC", name: "Device Lock", code: "AC-11", desc: "Prevent further access to the system by initiating a device lock after a period of inactivity.", st: "Other than satisfied", ev: [2, 2], owner: null },
    { id: "c", fam: "AU", name: "Non-repudiation", code: "AU-10", desc: "Provide irrefutable evidence that an individual performed an action.", st: "No evidence", ev: [0, 1], owner: null },
  ];
  const view = () => K.get("demo.view", { fam: "", q: "" });
  const sw = () => K.get("demo.sw", [{ id: "s1", kind: "Firmware", name: "MC-FW", version: "4.2.1" }]);
  K.on("demo.fam", (id) => { K.set("demo.view", Object.assign({}, view(), { fam: id })); K.redraw(); });
  K.on("demo.q", (v) => { K.set("demo.view", Object.assign({}, view(), { q: v })); K.redraw(); });
  K.on("demo.add", () => K.form({ title: "Add software or firmware", submit: "Add item", fields: [
    { key: "kind", label: "Kind", type: "select", options: ["Software", "Firmware", "Hardware"], required: true, half: true },
    { key: "version", label: "Version", required: true, half: true },
    { key: "name", label: "Name", required: true },
    { key: "note", label: "What it does", type: "textarea" } ],
    onSubmit: (v) => { if (sw().some((x) => x.name === v.name && x.version === v.version)) return { name: "This item and version is already on the component." }; K.push("demo.sw", Object.assign({ id: K.id("s") }, v)); K.redraw(); K.toast(`${v.kind} added: ${v.name} ${v.version}`); } }));
  K.on("demo.pick", () => K.pick({ title: "Add controls", multi: true, submit: (n) => (n ? `Add ${n} control${n === 1 ? "" : "s"}` : "Add controls"), search: "Search the baseline's controls",
    items: ITEMS.map((x) => ({ id: x.id, title: x.name, code: x.code, desc: x.desc, group: x.fam, held: x.id === "a" ? "Already here" : "" })), onPick: (ids) => K.toast(`${ids.length} added`) }));
  K.on("demo.rm", (id) => K.confirm({ title: "Remove item", text: "It leaves this component, its SBOM and section 8 of the SSP.", submit: "Remove item", danger: true, onOk: () => { K.drop("demo.sw", (x) => x.id === id); K.redraw(); K.toast("Item removed"); } }));
  K.panel("k3demo", (id) => { const x = ITEMS.find((i) => i.id === id); return x && { label: "Control preview", title: x.name, code: x.code, chip: K.status(x.st), page: "k3-demo--" + x.id, open: "Open control", actions: K.btn("Edit implementation", { sm: true, primary: true, act: "demo.add" }), facts: [["Owner", K.owner(x.owner)], ["Evidence", K.ring(x.ev[0], x.ev[1])]], sections: [K.section({ title: "Requirements", count: 1, actions: K.btn("Add requirement", { sm: true, act: "demo.pick" }), body: K.table({ cols: [{ label: "Requirement" }], rows: [{ cells: [K.name("AC Enforcement Requirement 001", "", "REQ-001")] }] }) })] }; });
  K.screen("k3-demo", () => {
    const v = view(), rows = ITEMS.filter((x) => (!v.fam || x.fam === v.fam) && (!v.q || (x.name + x.code).toLowerCase().includes(v.q.toLowerCase())));
    return K.page({
      head: K.head({ title: "Controls", actions: K.menu("More", [{ label: "Export controls", act: "demo.add" }, { label: "Remove", act: "demo.rm", arg: "s1", danger: true }]) + K.btn("Add control", { primary: true, act: "demo.pick" }) }),
      tabs: K.tabs([{ label: "Controls", count: 560, route: "k3-demo", on: true }, { label: "Baseline layers", count: 6, route: "k3-demo" }]),
      body: K.split(
        K.rail({ title: "Control families", act: "demo.fam", items: [{ id: "", label: "All controls", count: 3, on: !v.fam }, { id: "AC", code: "AC", label: "Access Control", count: 2, on: v.fam === "AC" }, { id: "AU", code: "AU", label: "Audit and Accountability", count: 1, on: v.fam === "AU" }, { head: "Outside the baseline" }, { id: "x", label: "Tailored out", count: 26 }] }),
        [K.cards(K.completion({ label: "Controls satisfied", done: 227, total: 560, unit: "controls", minis: [{ label: "With evidence", done: 361, total: 560, act: "demo.fam", arg: "AC" }, { label: "Assessed", done: 275, total: 560 }] }), K.attention({ rows: [{ label: "Other than satisfied", n: 13, tone: "bad", act: "demo.fam", arg: "AC" }, { label: "No evidence", n: 185, act: "demo.fam", arg: "AU" }, { label: "No owner", n: 0 }] })),
          K.toolbar({ search: { act: "demo.q", value: v.q, placeholder: "Search controls" }, filters: [{ label: "Status", act: "demo.fam", value: "", options: [["AC", "Satisfied"], ["AU", "No evidence"]] }], right: `<span class="k3-seg"><button type="button" class="on">List</button><a href="#sctm">Spreadsheet</a></span>` }),
          K.table({ cols: [{ label: "Control" }, { label: "Status" }, { label: "Evidence", cls: "nw" }, { label: "Owner" }, { label: "", cls: "tight" }], rows: rows.map((x) => ({ panel: "k3demo", id: x.id, cells: [K.name(x.name, x.desc, x.code), K.status(x.st), K.ring(x.ev[0], x.ev[1]), K.owner(x.owner), ""] })), empty: { title: "No controls match", line: "Clear the search or choose another family." }, foot: `<span class="num">${rows.length} of 3</span>` }),
          K.group({ code: "AC", title: "Access Control", meta: `${K.ring(31, 52)} 52 controls`, open: true, body: K.table({ cols: [{ label: "Item" }, { label: "Kind" }, { label: "Version" }, { label: "", cls: "tight" }], rows: sw().map((s) => ({ cells: [K.name(s.name), K.tagged(s.kind), K.num(s.version), K.btn("Remove", { sm: true, quiet: true, act: "demo.rm", arg: s.id })] })) }) }),
          K.section({ title: "Software and firmware", count: sw().length, actions: K.btn("Add item", { sm: true, act: "demo.add" }), body: K.empty({ title: "Nothing recorded", line: "Add the first item.", action: K.btn("Add item", { sm: true, act: "demo.add" }) }) })]),
    });
  }, "controls");
  K.lazy(/^k3-demo--([a-z])(?:--(\w+))?$/, (route, m) => { const x = ITEMS.find((i) => i.id === m[1]); return K.page({ head: K.head({ crumbs: [["Controls", "k3-demo"], ["Access Control", "k3-demo"], [x ? x.code : "?"]], title: x ? x.name : "Not found", code: x && x.code, chip: x && K.status(x.st), actions: K.btn("Edit implementation", { primary: true, act: "demo.add" }) }), tabs: K.tabs([{ label: "Overview", route: "k3-demo--" + m[1], on: !m[2] }, { label: "Requirements", count: 4, route: "k3-demo--" + m[1] + "--reqs", on: m[2] === "reqs" }]), body: K.aside([K.section({ title: "Statement", body: `<p>${x ? x.desc : ""}</p>` })], [K.details("Details", [["Owner", K.owner(x && x.owner)], ["Family", "Access Control"], ["Tab", m[2] || "overview"]])]) }); }, "controls");
})();
