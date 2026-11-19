// Prototype v2, agent H (v2h-): host systems and common control providers, the data. Read by mod-zzzz-v2-8host.js (PA.v2host).
// Synthetic: the snapshot records no host system and no provider offer for WS-X90 other than the Corporate identity provider's
// (mod-v7-org.js, CCP), which is copied here as it stands. Each provider's offer is its customer responsibility matrix (CRM):
//   offers { code: [kind, statement, part?, status?, poam?] }  kind "i" inherited or "h" hybrid by default; statement is what the
//   provider implements; part is the consumer's own part of a hybrid control; status is the provider's control status
//   ("satisfied" unless named); poam is the provider's own POA&M item that holds a control short of satisfied.
// A family line stands in for a statement where the provider writes one for the family (fam { PE: "…" }).
(function () {
  const PA = window.PA; if (!PA) return;
  const AIR = ["CN-109001", "CN-109002", "CN-109003", "CN-109004", "CN-109005"];
  PA.HOSTD = {
    // The program's providers, in the order a control is looked up (the first that offers it holds it).
    programs: {
      "PRG-1090": { host: "f16", providers: ["f16", "sqops", "idp"] },
      "PRG-2101": { host: "f16", providers: ["f16"] },
      "PRG-2102": { host: "c130j", providers: ["c130j"] },
      "PRG-2201": { host: null, providers: [] },
    },
    providers: {
      f16: {
        id: "f16", name: "F-16 Block 70", kind: "Host system", owner: "F-16 System Program Office", ao: "Col. M. Hargrove",
        auth: { word: "Authorized", on: "2025-03-04", atd: "2028-03-03", ref: "eMASS 2417", by: "the Fighters & Bombers authorizing official" },
        about: "The fighter that carries WS-X90's five airborne subsystems: its mission bus, the store station the Payload Interface Subsystem sits on, its power, antennas and bays.",
        els: AIR,
        ifaces: [
          { id: "1553", name: "MIL-STD-1553B data bus", to: ["CN-109001", "CN-109002", "CN-109005"], data: "Mission commands and status, and the aircraft's EGI time and position" },
          { id: "1760", name: "MIL-STD-1760 aircraft–store interface", to: ["CN-109004"], data: "Store management, release consent and store power, through the Payload Interface Subsystem" },
          { id: "pwr", name: "Aircraft power", to: AIR, data: "28 V DC and 115 V AC 400 Hz to every airborne LRU" },
          { id: "rf", name: "Aircraft antennas", to: ["CN-109002", "CN-109003"], data: "RF feeds for the Timing Receiver and the Tactical Data Radio" },
        ],
        offers: {
          "PE-3": ["h", "F-16 Block 70 controls entry to the aircraft and its avionics bays on the flightline and in the hangar.", "WS-X90 seals its LRU access panels and logs every opening."],
          "PE-4": ["i", "The wiring between WS-X90's LRUs and the aircraft's bus runs inside the airframe, behind panels only maintainers open, each opening recorded on the aircraft's forms."],
          "PE-6(1)": ["i", "The aircraft is parked in the flightline's restricted area, watched by intrusion detection and security forces around the clock."],
          "PE-6(4)": ["i", "The crew chief logs every entry to the aircraft on its forms; the logs cover the bays that hold WS-X90."],
          "PE-9": ["i", "Aircraft power reaches WS-X90 through shielded harnesses inside the airframe, protected as the F-16's own."],
          "PE-11": ["i", "The F-16's emergency power unit keeps the essential buses, WS-X90's among them, powered through a loss of main power."],
          "PE-13": ["i", "The aircraft's fire detection covers the avionics bays that hold WS-X90."],
          "PE-13(1)": ["i", "Fire detection activates on its own and alerts the pilot in flight and the crew chief on the ground."],
          "PE-13(2)": ["i", "Fire suppression in the bays activates on its own and notifies the flightline's fire department."],
          "PE-14": ["h", "F-16 Block 70's environmental control system cools the avionics bays.", "WS-X90 monitors its LRUs' temperature and alarms on an overheat."],
          "PE-16": ["i", "Every LRU removed from or installed in the aircraft is authorized and recorded in its maintenance records."],
          "MA-2": ["h", "F-16 Block 70's maintenance program schedules and records the aircraft's maintenance.", "WS-X90 controls maintenance of its own LRUs through the Maintenance Access Gateway."],
          "MA-3(1)": ["i", "Tools brought to the aircraft are inspected under the maintenance unit's tool control program."],
          "MA-3(3)": ["i", "Maintenance equipment leaving the aircraft is checked against the tool control log, so none leaves holding mission data."],
          "MA-5(1)": ["i", "Maintainers without clearance work on the aircraft only escorted, with WS-X90's bays closed."],
          "SC-7": ["h", "F-16 Block 70 isolates the MIL-STD-1553B bus.", "WS-X90 filters its side."],
        },
        carries: {
          "PRG-2101": { inh: ["PE-4", "PE-6(1)", "PE-9", "PE-11", "PE-13", "PE-13(1)", "PE-13(2)", "PE-16", "MA-3(1)", "MA-3(3)", "MA-5(1)"], hyb: ["PE-3", "PE-14", "SC-7"], at: "MIL-STD-1760 rail launcher" },
        },
      },
      sqops: {
        id: "sqops", name: "Squadron operations facility", kind: "Common control provider", owner: "Operations Support Squadron", ao: "Col. A. Brennan",
        auth: { word: "Authorized", on: "2025-06-02", atd: "2028-06-01", ref: "eMASS 3380", by: "the wing's authorizing official" },
        about: "The building the Ground Support Subsystem runs in, with the squadron's personnel security, training, incident response and media programs.",
        els: ["CN-109006"],
        ifaces: [{ id: "fac", name: "Facility power and space", to: ["CN-109006"], data: "Power, lighting and controlled space for the Provisioning Workstation, the Security Log Collector, the Maintenance Laptop and the Configuration Repository" }],
        fam: {
          PE: "The Squadron operations facility controls and records access to the ground spaces that hold the Ground Support Subsystem, and keeps their power, lighting and water protection.",
          PS: "The squadron's personnel security program screens, transfers and separates everyone with access, WS-X90's ground crew included.",
          AT: "The squadron's awareness training covers everyone with access, WS-X90's ground crew included, and records each completion.",
          CP: "The facility's alternate processing and storage site, and its telecommunications service, take over the Ground Support Subsystem's work in an outage.",
          IR: "The squadron's incident response desk helps WS-X90's ground crew and coordinates with outside responders.",
          MP: "The facility's media library stores, carries and sanitizes removable media under one log.",
        },
        offers: {
          "PE-1": ["h", "The facility's physical security policy covers its spaces.", "WS-X90 writes the procedures for its own ground equipment."],
          "PE-2": ["i"], "PE-8": ["i"], "PE-8(1)": ["i"], "PE-8(3)": ["i"], "PE-12": ["i"],
          "PE-15": ["i", "The server room's master shutoff valve sits behind a locked mechanical room that key personnel can't open.", null, "partially_satisfied",
            { id: "SQ-POAM-07", title: "Give key personnel access to the server room's master shutoff valve", due: "2027-02-26" }],
          "PE-17": ["i"], "PE-23": ["i"],
          "PS-1": ["h", "The squadron's personnel security policy covers everyone with access.", "WS-X90's procedures name its privileged roles and their screening."],
          "PS-2": ["i"], "PS-4(1)": ["i"], "PS-5": ["i"], "PS-6(3)": ["i"], "PS-7": ["i"], "PS-8": ["i"], "PS-9": ["i"],
          "AT-1": ["h", "The squadron's training policy covers everyone with access.", "WS-X90 keeps the procedures for its maintainer course."],
          "AT-2": ["i"], "AT-2(2)": ["i"], "AT-2(3)": ["i"], "AT-2(4)": ["i"], "AT-2(5)": ["i"], "AT-2(6)": ["i"],
          "AT-3": ["h", "The squadron's role-based training covers every role.", "WS-X90 adds its maintainer and provisioning course."],
          "AT-3(1)": ["i"], "AT-3(2)": ["i"], "AT-6": ["i"],
          "CP-6(1)": ["i"], "CP-6(3)": ["i"], "CP-7": ["i"], "CP-7(1)": ["i"], "CP-7(2)": ["i"], "CP-7(3)": ["i"], "CP-8": ["i"], "CP-8(1)": ["i"],
          "IR-2": ["h", "The squadron trains its incident responders.", "WS-X90 trains its ground crew on the Ground Support Subsystem."],
          "IR-7": ["i"], "IR-7(1)": ["i"], "IR-7(2)": ["i"],
          "MP-4": ["i"], "MP-5": ["i"], "MP-6(1)": ["i"], "MP-6(2)": ["i"], "MP-6(3)": ["i"],
        },
        carries: {},
      },
      // The Corporate identity provider, as mod-v7-org.js records it: real, accepted Jun 30 into SSP 2 and SSP 3. Its own authorization
      // is not recorded (its AO approval of the RMF strategy has been blocked since Aug 21, 2025), so nothing it offers is inherited
      // whole: every control is hybrid, the consumer duty of each capability is WS-X90's part, and the status stays WS-X90's own.
      idp: {
        id: "idp", name: "Corporate identity provider", kind: "Enterprise service", owner: "Corporate IT", ao: null, real: true, program: "PRG-1013",
        auth: { word: "Not authorized", on: null, atd: null, ref: "PRG-1013", by: null, note: "Its AO approval of the RMF strategy has been blocked since Aug 21, 2025." },
        about: "Enterprise single sign-on, multifactor authentication, account lifecycle and certificates, offered on Jun 30 and accepted into SSP 2 and SSP 3.",
        els: ["CN-109005"], accepted: "Jun 30 · Priya Raghavan", forceHybrid: true,
        ifaces: [{ id: "ids", name: "Identity services", to: ["CN-109005"], data: "Identities and group membership, through the Platform Management Controller" }],
        caps: [
          ["IDP-CAP-SSO", "Enterprise single sign-on", ["IA-2", "IA-8", "AC-7", "AC-12", "IA-5(1)"], "Federate the boundary's applications to the enterprise identity provider and keep no local password store."],
          ["IDP-CAP-MFA", "Phishing-resistant multifactor authentication", ["IA-2(1)", "IA-2(2)", "IA-2(8)", "IA-5"], "Require the enterprise authenticator for every interactive logon to the boundary."],
          ["IDP-CAP-ACCOUNTS", "Account lifecycle management", ["AC-2", "AC-2(1)", "AC-2(3)", "IA-4"], "Map the boundary's roles to directory groups and complete the quarterly access review for them."],
          ["IDP-CAP-PKI", "Certificate issuance", ["SC-17", "IA-5(2)"], "Enroll the boundary's devices and validate certificate paths to the enterprise trust anchor."],
        ],
        carries: {},
      },
      c130j: {
        id: "c130j", name: "C-130J", kind: "Host system", owner: "C-130J System Program Office", ao: "Col. K. Mendez",
        auth: { word: "Authorized with conditions", on: "2024-11-20", atd: "2027-11-19", ref: "eMASS 1952", by: "the Mobility authorizing official" },
        about: "The airlifter that carries Customer B's palletized X800 launcher: its cargo floor, its power and the loadmaster's station.",
        els: [], host: true,
        ifaces: [
          { id: "pal", name: "Cargo floor and pallet locks", to: [], data: "The palletized launcher's restraint and its release from the aircraft" },
          { id: "pwr", name: "Aircraft power", to: [], data: "28 V DC to the pallet's launch controller" },
        ],
        offers: {
          "PE-3": ["h", "C-130J controls entry to the aircraft and its cargo compartment.", "The pallet's launch controller is sealed and its seal checked before each sortie."],
          "PE-4": ["i", "Cabling from the aircraft to the pallet runs in the cargo compartment's protected raceways."],
          "PE-9": ["i", "Aircraft power reaches the pallet through the cargo compartment's protected outlets."],
          "PE-11": ["i", "The aircraft's auxiliary power keeps the pallet powered through a loss of main power."],
          "PE-13": ["i", "The cargo compartment's fire detection covers the pallet."],
          "PE-16": ["i", "The loadmaster records every pallet loaded onto and unloaded from the aircraft."],
          "MA-5(1)": ["i", "Maintainers without clearance work in the cargo compartment only escorted."],
          "SC-7": ["h", "C-130J keeps the pallet off its mission bus.", "The pallet's launch controller is its own boundary."],
        },
        carries: {
          "PRG-2102": { inh: ["PE-4", "PE-9", "PE-11", "PE-13", "PE-16", "MA-5(1)"], hyb: ["PE-3", "SC-7"], at: "Palletized roll-on, roll-off launcher" },
        },
      },
      // The workspace's other providers (mod-v7-org.js, CCP): offered to no program yet.
      lab: {
        id: "lab", name: "Integration laboratory hosting enclave", kind: "Hosting enclave", owner: "Integration laboratory", ao: "Col. A. Brennan",
        auth: { word: "Authorized", on: "2025-09-15", atd: "2028-09-14", ref: "eMASS 3511", by: "the wing's authorizing official" },
        about: "The enclave the integration laboratory hosts development and test systems in.",
        els: [],
        caps: [["LAB-PHYS", "Physical and environmental protection", ["PE-2", "PE-3", "PE-6"], "Badge the program's staff through the enclave's access list."],
          ["LAB-CONT", "Backup and alternate processing", ["CP-7", "CP-9"], "Name the system's backup sets and test a restore each year."],
          ["LAB-NET", "Boundary and remote maintenance", ["SC-7", "MA-4"], "Route maintenance sessions through the enclave's jump hosts."]],
        carries: {},
      },
      cssp: {
        id: "cssp", name: "Cybersecurity service provider (CSSP)", kind: "CSSP", owner: "Air Force CSSP", ao: "DoD CIO accreditation",
        auth: { word: "Accredited CSSP", on: "2025-04-01", atd: "2028-03-31", ref: "CSSP-AF-04", by: "DoD CIO" },
        about: "Incident handling, reporting and audit log monitoring for the systems it serves.",
        els: [],
        caps: [["CSSP-IR", "Incident handling and reporting", ["IR-4", "IR-4(1)", "IR-5", "IR-6"], "Report incidents to the CSSP within one hour and keep the contact roster current."],
          ["CSSP-MON", "Monitoring and log review", ["SI-4", "AU-6", "AU-6(1)"], "Forward audit logs to the CSSP's collector."]],
        carries: {},
      },
      peo: {
        id: "peo", name: "PEO enterprise services", kind: "PEO shared services", owner: "Program Executive Office", ao: "PEO authorizing official",
        auth: { word: "Authorized with conditions", on: "2026-01-12", atd: "2029-01-11", ref: "eMASS 2790", by: "the PEO's authorizing official" },
        about: "Vulnerability management, advisories, key management and provenance shared across the PEO's programs.",
        els: [],
        caps: [["PEO-VM", "Vulnerability management and advisories", ["RA-5", "SI-5", "CA-7"], "Accept ACAS policies from the PEO and import scans on its cadence."],
          ["PEO-KEY", "Key management and provenance", ["SC-12", "SC-13", "SR-4"], "Order keys through the PEO's key management office."]],
        carries: {},
      },
    },
  };
})();
