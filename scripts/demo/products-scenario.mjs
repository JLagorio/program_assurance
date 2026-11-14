/**
 * The products scenario: a business line, a product with three launch configurations assessed
 * once, and two customer programs that each take a configuration and change it.
 *
 * It is authored for this repository, not archived source, and it is illustrative: the product,
 * its elements, the customers and every determination are fictional. Which controls a component
 * claims, how much of each it covers and how each was judged are spread by a stable hash of the
 * component's or element's code and the control's (seed-products.sql), so two workspaces seeded
 * alike agree; `anchors` are the claims that are named outright. scripts/seed-demo-products.mjs
 * writes it under its own provenance dataset.
 */
export const datasetId = "products-v1";

/** People of the demo import's directory, by name. A workspace without them leaves the role empty. */
export const people = {
  airDefenseOwner: "Priya Raghavan",
  missionSystemsOwner: "Marcus Ryde",
  productAssessor: "Elena Vasquez",
};

export const businessLines = [
  {
    code: "AD",
    name: "Air Defense",
    description: "Interceptor products and the customer programs that field them.",
    owner: "airDefenseOwner",
  },
  {
    code: "MS",
    name: "Mission Systems",
    description: "Ground and mission support products.",
    owner: "missionSystemsOwner",
  },
];

/** What a component does for a control of each family, as a claim's sentence reads. */
export const familyPhrases = {
  AC: "enforces access to its functions and interfaces",
  AU: "records security-relevant events and protects the record",
  CM: "is built from a controlled baseline and reports its configuration",
  CP: "keeps or recovers its function after a fault",
  IA: "identifies and authenticates what connects to it",
  MA: "limits and records maintenance access",
  MP: "protects and sanitizes the media it holds",
  PE: "resists and reports physical tampering",
  SA: "is developed and delivered under the product's engineering process",
  SC: "protects its communications and the data it holds",
  SI: "checks the integrity of its software and reports faults",
  SR: "is sourced and tracked under the product's supply chain controls",
};

/** What a claim that covers part of a control leaves to the program that takes the product. */
export const consumerResponsibilities = {
  AC: "The program assigns its own roles and interface permissions.",
  AU: "The program collects and reviews the audit record.",
  CM: "The program keeps the configuration baseline of its variant.",
  CP: "The program plans for recovery in its mission.",
  IA: "The program provisions its own credentials and keys.",
  MA: "The program controls who maintains the delivered unit.",
  MP: "The program handles media under its own procedures.",
  PE: "The program provides the protected facility.",
  SA: "The program accepts delivery under its own acceptance procedure.",
  SC: "The program loads its own keys and sets the protected interfaces.",
  SI: "The program reports and handles faults in its operations.",
  SR: "The program tracks the delivered units it holds.",
};

/**
 * The library behind the product: one published component set. `families` is the share, in
 * percent, of the baseline's controls of a family the component claims.
 */
export const library = {
  code: "x800-components",
  name: "X800 Missile component set",
  description: "The components of the X800 Missile and what each does for the product's controls.",
  remarks: "Released with X800 Missile version 1.",
  effectiveFrom: "2026-06-15",
  conditions: "Applies to the X800 Missile as delivered, in any of its launch configurations.",
  consumerResponsibilities:
    "A program that changes a component's software, firmware, hardware or data assesses the controls that component stands behind.",
  components: [
    {
      key: "mission-computer",
      name: "Mission Computer",
      type: "hardware",
      description: "Flight mission computer that hosts the flight program.",
      families: { AC: 45, AU: 40, IA: 30, SC: 35, SI: 30 },
      anchors: ["AC-3", "AC-4", "AU-2", "AU-12", "SC-3", "SC-39"],
    },
    {
      key: "flight-software",
      name: "Operational Flight Program",
      type: "software",
      description: "The flight software load.",
      families: { AC: 25, CM: 40, SA: 25, SC: 25, SI: 55 },
      anchors: ["CM-7", "SA-10", "SI-7", "SI-10", "SI-16"],
    },
    {
      key: "navigation-unit",
      name: "Navigation Unit",
      type: "hardware",
      description: "Inertial and satellite navigation.",
      families: { PE: 10, SC: 15, SI: 20 },
      anchors: [],
    },
    {
      key: "seeker-interface",
      name: "Seeker Interface Unit",
      type: "hardware",
      description: "Interface between the seeker and the mission computer.",
      families: { SC: 15, SI: 15 },
      anchors: ["SC-7"],
    },
    {
      key: "datalink-radio",
      name: "Datalink Radio",
      type: "hardware",
      description: "Two-way datalink.",
      families: { AC: 20, IA: 25, SC: 40 },
      anchors: ["AC-18", "SC-8", "SC-40"],
    },
    {
      key: "crypto-module",
      name: "Cryptographic Module",
      type: "hardware",
      description: "Encrypts the datalink and stored mission data.",
      families: { IA: 40, MP: 30, SC: 45 },
      anchors: ["IA-7", "SC-12", "SC-13", "SC-28"],
    },
    {
      key: "key-load-interface",
      name: "Key Load Interface",
      type: "hardware",
      description: "Port through which keys are loaded.",
      families: { AC: 20, IA: 30, MA: 20, MP: 25 },
      anchors: ["IA-5", "SC-12"],
    },
    {
      key: "secure-boot",
      name: "Secure Boot Firmware",
      type: "software",
      description: "Verifies each software load before it runs.",
      families: { CM: 35, SC: 15, SI: 40 },
      anchors: ["CM-14", "SI-7"],
    },
    {
      key: "telemetry-unit",
      name: "Telemetry Unit",
      type: "hardware",
      description: "Records and transmits flight telemetry.",
      families: { AU: 35, SC: 20 },
      anchors: ["AU-3", "AU-9"],
    },
    {
      key: "maintenance-port",
      name: "Maintenance Port",
      type: "hardware",
      description: "Port used by the field test set.",
      families: { AC: 20, IA: 20, MA: 55 },
      anchors: ["MA-3", "MA-4"],
    },
    {
      key: "field-test-set",
      name: "Field Test Set",
      type: "hardware",
      description: "Ground equipment that tests a missile before loading.",
      families: { AU: 20, CM: 25, IA: 20, MA: 35 },
      anchors: [],
    },
    {
      key: "mission-data-loader",
      name: "Mission Data Loader",
      type: "software",
      description: "Loads mission data into the missile.",
      families: { CM: 20, IA: 25, MP: 35, SI: 20 },
      anchors: [],
    },
    {
      key: "rail-umbilical",
      name: "Rail Umbilical Interface Unit",
      type: "hardware",
      description: "Power and data interface to a rail launcher.",
      families: { AC: 15, PE: 25, SC: 20 },
      anchors: [],
    },
    {
      key: "ejector-interface",
      name: "Ejector Interface Unit",
      type: "hardware",
      description: "Power and data interface to an ejector rack.",
      families: { PE: 25, SC: 20, SI: 15 },
      anchors: [],
    },
    {
      key: "separation-sensor",
      name: "Separation Sensor",
      type: "hardware",
      description: "Senses separation from the ejector rack.",
      families: { PE: 15, SI: 20 },
      anchors: [],
    },
    {
      key: "pallet-controller",
      name: "Pallet Controller",
      type: "hardware",
      description: "Sequences a palletized launch.",
      families: { AC: 30, CP: 25, PE: 30, SC: 25 },
      anchors: [],
    },
    {
      key: "pallet-datalink",
      name: "Pallet Datalink Node",
      type: "hardware",
      description: "Links the pallet to the launching aircraft.",
      families: { AC: 20, IA: 25, SC: 35 },
      anchors: ["SC-8"],
    },
    {
      key: "pallet-firmware",
      name: "Pallet Controller Firmware",
      type: "software",
      description: "Firmware of the pallet controller.",
      families: { AC: 20, CM: 35, SI: 45 },
      anchors: ["SI-7"],
    },
  ],
};

/**
 * The product. An element is [code, name, type, parent code, configurations, component key]:
 * "*" is every configuration, and a component key pins the element to that library component,
 * whose type it then takes.
 */
export const product = {
  code: "X800",
  name: "X800 Missile",
  businessLine: "AD",
  description:
    "Interceptor missile delivered in three launch configurations. A program takes one configuration and builds its own variant of it.",
  baseline: "NIST SP 800-53 Rev 5 High baseline",
  remarks: "First released version.",
  effectiveFrom: "2026-06-15",
  configurations: [
    {
      code: "A",
      name: "Lug & Rail Launch",
      description: "Carried on lugs and launched from a rail launcher.",
    },
    {
      code: "B",
      name: "Eject Launch",
      description: "Carried on an ejector rack and launched by ejection.",
    },
    {
      code: "C",
      name: "Palletized Launch",
      description: "Launched from a pallet released by a cargo aircraft.",
    },
  ],
  elements: [
    ["GS", "Guidance Section", "subsystem", null, "*", null],
    ["GS-MC", "Mission Computer", "hardware", "GS", "*", "mission-computer"],
    ["GS-OFP", "Operational Flight Program", "software", "GS", "*", "flight-software"],
    ["GS-NAV", "Navigation Unit", "hardware", "GS", "*", "navigation-unit"],
    ["GS-SKR", "Seeker Interface Unit", "hardware", "GS", "*", "seeker-interface"],
    ["CS", "Communications Section", "subsystem", null, "*", null],
    ["CS-DL", "Datalink Radio", "hardware", "CS", "*", "datalink-radio"],
    ["CS-CRY", "Cryptographic Module", "hardware", "CS", "*", "crypto-module"],
    ["CS-KL", "Key Load Interface", "hardware", "CS", "*", "key-load-interface"],
    ["PS", "Platform Services", "subsystem", null, "*", null],
    ["PS-BOOT", "Secure Boot Firmware", "software", "PS", "*", "secure-boot"],
    ["PS-TLM", "Telemetry Unit", "hardware", "PS", "*", "telemetry-unit"],
    ["PS-PWR", "Power Conditioning Unit", "hardware", "PS", "*", null],
    ["PS-MX", "Maintenance Port", "hardware", "PS", "*", "maintenance-port"],
    ["SE", "Support Equipment", "subsystem", null, "*", null],
    ["SE-TS", "Field Test Set", "hardware", "SE", "*", "field-test-set"],
    ["SE-MDL", "Mission Data Loader", "software", "SE", "*", "mission-data-loader"],
    ["LA", "Rail Launch Interface", "subsystem", null, "A", null],
    ["LA-UMB", "Rail Umbilical Interface Unit", "hardware", "LA", "A", "rail-umbilical"],
    ["LB", "Eject Launch Interface", "subsystem", null, "B", null],
    ["LB-EJ", "Ejector Interface Unit", "hardware", "LB", "B", "ejector-interface"],
    ["LB-SEP", "Separation Sensor", "hardware", "LB", "B", "separation-sensor"],
    ["LC", "Palletized Launch Interface", "subsystem", null, "C", null],
    ["LC-PC", "Pallet Controller", "hardware", "LC", "C", "pallet-controller"],
    ["LC-PDL", "Pallet Datalink Node", "hardware", "LC", "C", "pallet-datalink"],
    ["LC-PFW", "Pallet Controller Firmware", "software", "LC", "C", "pallet-firmware"],
  ],
  assessment: {
    title: "X800 Missile version 1 product assessment",
    description:
      "One assessment of the product against its control baseline, judged element by element so it answers for each launch configuration.",
    assessor: "productAssessor",
    startedOn: "2026-08-03",
    completedOn: "2026-09-30",
    publishedAt: "2026-09-30T16:00:00Z",
    /** Of every 100 claims: satisfied below the first, partially below the second, other than
     * satisfied below the third, and not judged above it. */
    spread: [80, 88, 93],
    /** Elements judged later in the product's life, which stand worse. */
    weakElements: ["LC-PFW", "LC-PDL"],
    weakSpread: [50, 72, 92],
    /** Families judged for the product as a whole, and the share of each that was. */
    wholeFamilies: ["CA", "CM", "PL", "RA", "SA", "SR"],
    wholeShare: 45,
    wholeSpread: [82, 93, 100],
    wholeRationale:
      "Judged for the product as a whole: its engineering, configuration and supply chain process.",
  },
  /** A second version, published after the programs took the first, so they read an update. */
  nextVersion: {
    remarks: "Adds a health monitoring unit to Platform Services.",
    effectiveFrom: "2026-11-02",
    element: ["PS-HMU", "Health Monitoring Unit", "hardware", "PS"],
  },
};

/** Products that give the register its shape: one published and not assessed, one still a draft. */
export const otherProducts = [
  {
    code: "R210",
    name: "R210 Launcher Electronics Unit",
    businessLine: "AD",
    description: "Electronics unit of the rail launcher the X800 is fired from.",
    state: "published",
    configurations: [{ code: "STD", name: "Standard", description: "The delivered unit." }],
    elements: [
      ["PSU", "Power Supply", "hardware", null],
      ["CTL", "Launch Controller", "hardware", null],
      ["FW", "Launch Controller Firmware", "software", "CTL"],
    ],
  },
  {
    code: "G40",
    name: "G40 Ground Terminal",
    businessLine: "MS",
    description: "Ground terminal for mission planning and datalink relay.",
    state: "draft",
    configurations: [
      { code: "FIX", name: "Fixed Site", description: "Installed in a facility." },
      { code: "TRN", name: "Transportable", description: "Carried in a shelter." },
    ],
    elements: [
      ["WS", "Planning Workstation", "hardware", null],
      ["RLY", "Datalink Relay", "hardware", null],
      ["SW", "Planning Software", "software", "WS"],
      ["PWR", "Shelter Power Unit", "hardware", null],
    ],
  },
];

/**
 * The programs that take the product. Each creates one variant through the program wizard, as the
 * account: the configuration's elements without `removed`, the program's own `added`
 * ([code, name, type, parent code, description]) and what it `changes` in the elements it kept
 * ([element code, kinds, why]).
 */
export const programs = [
  {
    code: "PRG-2101",
    name: "Customer A · X800 Rail Integration",
    description: "Integrates the X800 Missile on Customer A's rail launcher.",
    businessLine: "AD",
    startsOn: "2026-07-01",
    variant: {
      code: "X800-A-CUSA",
      name: "X800 Missile · Lug & Rail Launch · Customer A",
      description: "Customer A's variant of the Lug & Rail Launch configuration.",
      configuration: "A",
      prefix: "CA",
      impact: ["high", "high", "moderate"],
      rationale: "Categorized as the product is, for the customer's mission.",
      removed: ["SE-MDL"],
      added: [
        [
          "CS-CWM",
          "Customer Waveform Module",
          "hardware",
          "CS",
          "The customer's own datalink waveform, beside the product's radio.",
        ],
      ],
      changes: [
        [
          "GS-OFP",
          ["data", "software"],
          "The customer's mission data and key material are built into the flight program.",
        ],
        [
          "CS-CRY",
          ["firmware"],
          "The customer's algorithm suite is loaded in place of the product's.",
        ],
      ],
    },
  },
  {
    code: "PRG-2102",
    name: "Customer B · X800 Palletized Integration",
    description: "Integrates the X800 Missile on Customer B's cargo aircraft pallet.",
    businessLine: "AD",
    startsOn: "2026-09-01",
    variant: {
      code: "X800-C-CUSB",
      name: "X800 Missile · Palletized Launch · Customer B",
      description: "Customer B's variant of the Palletized Launch configuration.",
      configuration: "C",
      prefix: "CB",
      impact: ["high", "high", "high"],
      rationale: "Categorized as the product is, for the customer's mission.",
      removed: [],
      added: [
        [
          "LC-PDU",
          "Pallet Power Distribution Unit",
          "hardware",
          "LC",
          "Distributes the customer aircraft's power to the pallet.",
        ],
        [
          "PS-RSR",
          "Range Safety Receiver",
          "hardware",
          "PS",
          "Required on the customer's test range.",
        ],
      ],
      changes: [
        ["LC-PFW", ["firmware"], "Pallet sequencing is rewritten for the customer's aircraft."],
        [
          "PS-TLM",
          ["firmware", "hardware"],
          "The telemetry encryptor is replaced with the customer's.",
        ],
      ],
    },
  },
];

const changeKinds = ["data", "firmware", "hardware", "software"];
const elementTypes = [
  "subsystem",
  "hardware",
  "software",
  "network",
  "service",
  "facility",
  "data",
  "other",
];
/** The element type a library component's type gives, as element_type_for_component does. */
const elementTypeFor = { software: "software", hardware: "hardware", service: "service" };

/** What is wrong with the scenario as written: an empty list is a scenario the seed can write. */
export function scenarioIssues() {
  const issues = [];
  const say = (message) => issues.push(message);
  const lines = new Set(businessLines.map((line) => line.code));
  if (lines.size !== businessLines.length) say("Two business lines share a code.");
  for (const line of businessLines)
    if (!people[line.owner]) say(`Business line ${line.code} names no known owner role.`);
  const components = new Map(library.components.map((component) => [component.key, component]));
  if (components.size !== library.components.length) say("Two library components share a key.");
  for (const component of library.components) {
    if (!elementTypeFor[component.type]) say(`Component ${component.key} has no element type.`);
    for (const [family, share] of Object.entries(component.families)) {
      if (!familyPhrases[family])
        say(`Component ${component.key} claims ${family}, which has no phrase.`);
      if (!consumerResponsibilities[family])
        say(`Component ${component.key} claims ${family}, which has no consumer responsibility.`);
      if (!(share > 0 && share <= 100))
        say(`Component ${component.key} claims ${share}% of ${family}.`);
    }
  }
  const check = (item, withComponents) => {
    const configurations = new Set(item.configurations.map((configuration) => configuration.code));
    if (!lines.has(item.businessLine)) say(`${item.code} names no business line.`);
    const codes = new Map();
    for (const [code, , type, parent, membership, key] of item.elements) {
      if (codes.has(code)) say(`${item.code} has two elements coded ${code}.`);
      if (!elementTypes.includes(type)) say(`${item.code} ${code} has the unknown type ${type}.`);
      if (parent !== null && !codes.has(parent))
        say(`${item.code} ${code} comes before its parent ${parent}.`);
      if (!withComponents) {
        codes.set(code, "*");
        continue;
      }
      if (membership !== "*" && !configurations.has(membership))
        say(`${item.code} ${code} is in the unknown configuration ${membership}.`);
      if (parent !== null && codes.get(parent) !== "*" && codes.get(parent) !== membership)
        say(`${item.code} ${code} is in a configuration its parent ${parent} is not in.`);
      if (key !== null) {
        const component = components.get(key);
        if (!component) say(`${item.code} ${code} is pinned to the unknown component ${key}.`);
        else if (elementTypeFor[component.type] !== type)
          say(`${item.code} ${code} is a ${type} pinned to a ${component.type} component.`);
      }
      codes.set(code, membership);
    }
    return codes;
  };
  const elements = check(product, true);
  for (const item of otherProducts)
    check({ ...item, elements: item.elements.map((e) => [...e]) }, false);
  for (const code of product.assessment.weakElements)
    if (!elements.has(code)) say(`The assessment names the unknown element ${code}.`);
  if (!people[product.assessment.assessor]) say("The assessment names no known assessor role.");
  if (!elements.has(product.nextVersion.element[3]))
    say("The next version's element has no parent.");
  if (elements.has(product.nextVersion.element[0]))
    say("The next version's element is already in the product.");
  const programCodes = new Set(),
    variantCodes = new Set(),
    prefixes = new Set();
  for (const program of programs) {
    const variant = program.variant;
    if (programCodes.has(program.code)) say(`Two programs are coded ${program.code}.`);
    if (variantCodes.has(variant.code)) say(`Two variants are coded ${variant.code}.`);
    if (prefixes.has(variant.prefix))
      say(`Two variants share the element prefix ${variant.prefix}.`);
    (programCodes.add(program.code), variantCodes.add(variant.code), prefixes.add(variant.prefix));
    if (!lines.has(program.businessLine)) say(`${program.code} names no business line.`);
    if (
      !product.configurations.some((configuration) => configuration.code === variant.configuration)
    )
      say(`${program.code} takes the unknown configuration ${variant.configuration}.`);
    const inConfiguration = (code) => ["*", variant.configuration].includes(elements.get(code));
    const kept = (code) => inConfiguration(code) && !variant.removed.includes(code);
    for (const code of variant.removed) {
      if (!inConfiguration(code))
        say(`${program.code} removes ${code}, which its configuration does not include.`);
      if (product.elements.some(([child, , , parent]) => parent === code && kept(child)))
        say(`${program.code} removes ${code} and keeps an element inside it.`);
    }
    for (const [code, , type, parent] of variant.added) {
      if (elements.has(code)) say(`${program.code} adds ${code}, which the product already has.`);
      if (!elementTypes.includes(type))
        say(`${program.code} adds ${code} with the unknown type ${type}.`);
      if (parent !== null && !kept(parent))
        say(`${program.code} adds ${code} under ${parent}, which it does not keep.`);
    }
    for (const [code, kinds, why] of variant.changes) {
      if (!kept(code)) say(`${program.code} changes ${code}, which it does not keep.`);
      if (!kinds.length || kinds.some((kind) => !changeKinds.includes(kind)))
        say(`${program.code} changes ${code} in an unknown way.`);
      if (!why.trim()) say(`${program.code} changes ${code} without a reason.`);
    }
  }
  return issues;
}

/** The dataset of the customers' requirements, written after the products scenario. */
export const requirementsDatasetId = "products-requirements-v1";

/**
 * Each customer's requirements document, by program. A requirement is [reference, title,
 * statement, the variant's elements it is allocated to, the controls it maps, the program's answer,
 * how it is verified, the compliance statement]; an answer of null is a requirement nobody has
 * answered yet. An element is named by its product code or by the code the program added it under.
 */
export const customerRequirements = {
  "PRG-2101": {
    source: {
      code: "CUSA-SSRD",
      title: "Customer A System Security Requirements Document",
      documentReference: "CUSA-SSRD-0042",
      versionLabel: "Rev C",
      receivedOn: "2026-07-15",
      description: "Customer A's security requirements for the missile on its rail launcher.",
    },
    items: [
      [
        "3.1.1",
        "Maintenance access",
        "The missile shall restrict maintenance functions to authenticated maintainers.",
        ["PS-MX"],
        ["AC-3", "IA-2"],
        "compliant",
        "similarity",
        "Met by the product's maintenance port as assessed in version 1.",
      ],
      [
        "3.1.2",
        "Audit of maintenance sessions",
        "The missile shall record each maintenance session and protect the record.",
        ["PS-MX", "PS-TLM"],
        ["AU-2", "AU-12"],
        "compliant",
        "similarity",
        "Met by the product's maintenance port and telemetry unit as assessed in version 1.",
      ],
      [
        "3.2.1",
        "Datalink encryption",
        "The datalink shall be encrypted with the customer's algorithm suite.",
        ["CS-DL", "CS-CRY"],
        ["SC-8", "SC-13"],
        "partially_compliant",
        "test",
        "The radio is the product's. The customer's algorithm suite in the cryptographic module is to be tested.",
      ],
      [
        "3.2.2",
        "Customer key management",
        "Keys shall be loaded and zeroized under the customer's key management plan.",
        ["CS-KL", "CS-CRY"],
        ["SC-12"],
        "partially_compliant",
        "demonstration",
        "Key loading is the product's. Zeroization with the customer's suite is to be demonstrated.",
      ],
      [
        "3.2.3",
        "Mission data at rest",
        "Mission data held in the missile shall be protected at rest.",
        ["GS-OFP", "CS-CRY"],
        ["SC-28"],
        "non_compliant",
        "test",
        "Mission data is built into the flight program for this variant, and its protection at rest is not yet shown.",
      ],
      [
        "3.3.1",
        "Software integrity at load",
        "The missile shall verify the integrity of each software load before it runs.",
        ["PS-BOOT", "GS-OFP"],
        ["SI-7"],
        "partially_compliant",
        "test",
        "Secure boot is the product's. The customer's flight program load is to be tested against it.",
      ],
      [
        "3.3.2",
        "Signed software only",
        "The missile shall run only software signed by the approved authority.",
        ["PS-BOOT"],
        ["CM-14"],
        "compliant",
        "similarity",
        "Met by the product's secure boot firmware as assessed in version 1.",
      ],
      [
        "3.3.3",
        "Least functionality",
        "The flight program shall include only the functions the mission needs.",
        ["GS-OFP"],
        ["CM-7"],
        null,
        null,
        null,
      ],
      [
        "3.4.1",
        "Tamper response",
        "The missile shall detect and report physical tampering with its guidance section.",
        ["GS-MC", "LA-UMB"],
        ["PE-3"],
        "compliant",
        "inspection",
        "Met by the product's mission computer and rail umbilical interface.",
      ],
      [
        "3.4.2",
        "Launcher interface isolation",
        "The launcher interface shall pass only the data the launch sequence needs.",
        ["LA-UMB"],
        ["AC-4", "SC-7"],
        "compliant",
        "similarity",
        "Met by the product's rail umbilical interface unit as assessed in version 1.",
      ],
      [
        "3.5.1",
        "Waveform separation",
        "The customer waveform shall be separated from the product's datalink.",
        ["CS-CWM"],
        ["SC-7"],
        null,
        null,
        null,
      ],
      [
        "3.5.2",
        "Waveform confidentiality",
        "The customer waveform shall protect the confidentiality of what it carries.",
        ["CS-CWM"],
        ["SC-8"],
        "non_compliant",
        "test",
        "The waveform module is the program's own and has not been tested.",
      ],
      [
        "3.6.1",
        "Mission data loading",
        "Mission data shall be loaded only with the customer's loader.",
        [],
        ["MP-2"],
        "not_applicable",
        null,
        "The product's mission data loader is not delivered in this variant, and the customer's loader is outside the system.",
      ],
      [
        "3.7.1",
        "Supply chain records",
        "The contractor shall keep supply chain records for each delivered unit.",
        [],
        ["SR-3"],
        "compliant",
        "inspection",
        "Met by the product's supply chain process.",
      ],
    ],
  },
  "PRG-2102": {
    source: {
      code: "CUSB-SRS",
      title: "Customer B Security Requirements Specification",
      documentReference: "CUSB-SRS-0117",
      versionLabel: "Issue 2",
      receivedOn: "2026-09-10",
      description:
        "Customer B's security requirements for the missile on its cargo aircraft pallet.",
    },
    items: [
      [
        "4.1.1",
        "Release authorization",
        "The pallet shall release a missile only on an authenticated command from the aircraft.",
        ["LC-PC", "LC-PDL"],
        ["AC-3", "IA-3"],
        "compliant",
        "similarity",
        "Met by the product's pallet controller and datalink node as assessed in version 1.",
      ],
      [
        "4.1.2",
        "Sequencing integrity",
        "The pallet shall verify its sequencing software before each release.",
        ["LC-PFW"],
        ["SI-7", "SI-10"],
        "partially_compliant",
        "test",
        "The firmware is rewritten for the customer's aircraft and is to be tested.",
      ],
      [
        "4.1.3",
        "Firmware configuration control",
        "Pallet firmware shall be changed only under the customer's configuration control.",
        ["LC-PFW"],
        ["CM-3", "CM-14"],
        "non_compliant",
        "inspection",
        "The rewritten firmware is not yet under the customer's configuration control.",
      ],
      [
        "4.2.1",
        "Aircraft link encryption",
        "The link between the pallet and the aircraft shall be encrypted.",
        ["LC-PDL", "CS-CRY"],
        ["SC-8", "SC-13"],
        "compliant",
        "similarity",
        "Met by the product's pallet datalink node and cryptographic module as assessed in version 1.",
      ],
      [
        "4.2.2",
        "Telemetry encryption",
        "Telemetry shall be encrypted with the customer's encryptor.",
        ["PS-TLM"],
        ["SC-8", "SC-12"],
        "partially_compliant",
        "test",
        "The customer's encryptor replaces the product's and is to be tested.",
      ],
      [
        "4.2.3",
        "Telemetry record protection",
        "The telemetry record shall be protected from change.",
        ["PS-TLM"],
        ["AU-9"],
        null,
        null,
        null,
      ],
      [
        "4.3.1",
        "Power fault isolation",
        "A power fault on the pallet shall not disable the aircraft's systems.",
        ["LC-PDU"],
        ["PE-9"],
        null,
        null,
        null,
      ],
      [
        "4.3.2",
        "Range safety command authentication",
        "The range safety receiver shall act only on authenticated commands.",
        ["PS-RSR"],
        ["IA-3"],
        "non_compliant",
        "test",
        "The receiver is the program's own and has not been tested.",
      ],
      [
        "4.4.1",
        "Flight software integrity",
        "The missile shall verify the integrity of its flight software before it runs.",
        ["GS-OFP", "PS-BOOT"],
        ["SI-7"],
        "compliant",
        "similarity",
        "Met by the product's flight program and secure boot firmware as assessed in version 1.",
      ],
      [
        "4.4.2",
        "Mission computer access",
        "Access to the mission computer shall be limited to what each role needs.",
        ["GS-MC"],
        ["AC-3", "AC-6"],
        "compliant",
        "similarity",
        "Met by the product's mission computer as assessed in version 1.",
      ],
      [
        "4.4.3",
        "Key loading",
        "Keys shall be loaded through a controlled interface.",
        ["CS-KL"],
        ["IA-5", "SC-12"],
        "compliant",
        "demonstration",
        "Met by the product's key load interface.",
      ],
      [
        "4.5.1",
        "Maintenance on the aircraft",
        "Maintenance on the aircraft shall use approved and recorded tools.",
        ["PS-MX", "SE-TS"],
        ["MA-3", "MA-4"],
        "partially_compliant",
        "demonstration",
        "The product's test set is approved. Its use on the customer's aircraft is to be demonstrated.",
      ],
      [
        "4.6.1",
        "Configuration records",
        "The contractor shall keep configuration records for each delivered unit.",
        [],
        ["CM-8"],
        "compliant",
        "inspection",
        "Met by the product's configuration records.",
      ],
      [
        "4.6.2",
        "Incident reporting",
        "Security incidents shall be reported to the customer within one working day.",
        [],
        ["IR-6"],
        null,
        null,
        null,
      ],
    ],
  },
};

const complianceStatuses = ["compliant", "partially_compliant", "non_compliant", "not_applicable"];
const verificationMethods = ["inspection", "analysis", "demonstration", "test", "similarity"];

/** What is wrong with the customers' requirements as written. */
export function requirementIssues() {
  const issues = [];
  const say = (message) => issues.push(message);
  const membership = new Map(product.elements.map((element) => [element[0], element[4]]));
  for (const [code, entry] of Object.entries(customerRequirements)) {
    const program = programs.find((item) => item.code === code);
    if (!program) {
      say(`${code} has requirements and is not a program of the scenario.`);
      continue;
    }
    const variant = program.variant;
    const held = (element) =>
      variant.added.some((added) => added[0] === element) ||
      (["*", variant.configuration].includes(membership.get(element)) &&
        !variant.removed.includes(element));
    if (!entry.source.code.trim() || !entry.source.title.trim())
      say(`${code}'s document has no code or title.`);
    const references = new Set();
    for (const [
      reference,
      title,
      statement,
      elements,
      controls,
      status,
      method,
      answer,
    ] of entry.items) {
      if (references.has(reference)) say(`${code} has two requirements at ${reference}.`);
      references.add(reference);
      if (!title.trim() || !statement.trim())
        say(`${code} ${reference} has no title or statement.`);
      for (const element of elements)
        if (!held(element))
          say(`${code} ${reference} is allocated to ${element}, which the variant does not hold.`);
      if (!controls.length) say(`${code} ${reference} maps no control.`);
      if (status === null) {
        if (method !== null || answer !== null)
          say(`${code} ${reference} has an answer and no status.`);
      } else {
        if (!complianceStatuses.includes(status))
          say(`${code} ${reference} has the unknown status ${status}.`);
        if (method !== null && !verificationMethods.includes(method))
          say(`${code} ${reference} has the unknown method ${method}.`);
        if (!answer?.trim()) say(`${code} ${reference} is answered without a statement.`);
      }
    }
  }
  for (const program of programs)
    if (!customerRequirements[program.code]) say(`${program.code} has no customer requirements.`);
  const cited = new Set(
    (customerRequirements[customerOverlay.program]?.items ?? []).map((item) => item[0]),
  );
  for (const [control, reference] of overlayRequirementMaps())
    if (!cited.has(reference))
      say(
        `${customerOverlay.code} adds ${control} for ${reference ?? "no paragraph"}, which ${customerOverlay.program}'s document does not hold.`,
      );
  return issues;
}

/** The dataset of the delta assessments, written after the products scenario. */
export const assessmentDatasetId = "products-assessment-v1";

/**
 * The programs whose delta assessment is planned. A plan is pinned to a published SSP, so the
 * seed publishes the variant's SSP as the product seeded it; the other program's stays a draft,
 * which is the state a reader meets before they may plan.
 */
export const deltaAssessments = [
  { program: "PRG-2101", title: "Customer A · X800 Rail Integration delta assessment" },
];

/** The dataset of the customer overlay, written after the records one click down. */
export const overlayDatasetId = "products-overlay-v1";

/**
 * Customer A's overlay: what its requirements document asks of the X800 on its rail launcher
 * beyond the High baseline, and what does not apply to a missile on a rail launcher. A decision is
 * [control, include or exclude, rationale], each include citing the paragraph of CUSA-SSRD that
 * calls for it. It is a published library overlay, written through the overlay commands as the
 * account, and then put on top of PRG-2101's stack through set_program_baseline_overlays as the
 * account, which takes the program's baseline from the High baseline's 370 controls to 374. The
 * systems that adopt the program's baseline move to the new top; every SSP revision, and so the
 * delta assessment planned on one, keeps the 370 it was pinned to.
 */
export const customerOverlay = {
  program: "PRG-2101",
  code: "OVL-CUSA-SSRD",
  title: "Customer A rail integration",
  description:
    "What Customer A's system security requirements document (CUSA-SSRD Rev C) asks of the X800 on its rail launcher beyond the High baseline, and two controls that do not apply to a missile on a rail launcher.",
  decisions: [
    [
      "CM-14",
      "include",
      "CUSA-SSRD 3.3.2 requires the missile to run only software signed by the approved authority.",
    ],
    [
      "SI-7(6)",
      "include",
      "CUSA-SSRD 3.3.1 requires the integrity of each software load to be verified before it runs; the secure boot firmware verifies it cryptographically.",
    ],
    [
      "SC-12(2)",
      "include",
      "CUSA-SSRD 3.2.2 requires keys to be loaded and zeroized under the customer's key management plan, which governs the datalink's symmetric keys.",
    ],
    [
      "AC-4(21)",
      "include",
      "CUSA-SSRD 3.4.2 requires the launcher interface to pass only the data the launch sequence needs, apart from the missile's other information flows.",
    ],
    [
      "SC-32",
      "include",
      "CUSA-SSRD 3.5.1 requires the customer waveform to be separated from the product's datalink, in a partition of its own.",
    ],
    [
      "SR-4",
      "include",
      "CUSA-SSRD 3.7.1 requires supply chain records for each delivered unit, which is its provenance.",
    ],
    [
      "SC-15",
      "exclude",
      "The missile and its rail launcher carry no camera, microphone or collaborative computing application for the control to govern.",
    ],
    [
      "PE-17",
      "exclude",
      "Nobody works on the system from an alternate work site: it is integrated in Customer A's laboratory and on the launcher.",
    ],
  ],
};

/**
 * Each control the overlay adds, mapped to the CUSA-SSRD requirement its decision cites, as
 * [control, reference]: once the overlay is on the stack the paragraph that called for a control
 * maps it, so the control reads where its requirement's evidence leaves it rather than No
 * requirement. A requirement that maps its control already (3.3.2 maps CM-14 from the import) is
 * left as it is.
 */
export function overlayRequirementMaps() {
  return customerOverlay.decisions
    .filter(([, action]) => action === "include")
    .map(([control, , rationale]) => [control, rationale.match(/^CUSA-SSRD (\S+) requires /)?.[1]]);
}

/** What a mapping the overlay brings says of itself. */
export const overlayMapRationale =
  "Customer A's overlay adds this control to the program's baseline for this requirement.";
