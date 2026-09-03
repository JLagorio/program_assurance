import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Inline, Stack, Table, Text, type Tone } from "@ledger/design-system";
import { reconcileStateTone, reconcileStateTone as reconcileStateTone2 } from "@/lib/airgap";
import {
  packageStatusTone,
  observationTone,
  residualTone,
  decisionTone,
  grantTone,
} from "@/lib/authorization";
import {
  buildStateTone,
  securityImpactTone,
  changeKindTone,
  impactStateTone,
} from "@/lib/baselines";
import {
  assessmentStatusTone,
  freshnessTone,
  driftBandTone,
  alertSeverityTone,
  slcmMethodTone,
} from "@/lib/conmon";
import { stageStateTone } from "@/lib/control-board";
import { controlStatusTone } from "@/lib/control-matrix";
import { revisionTone } from "@/lib/control-set";
import { implementationTone, assessmentTone } from "@/lib/control-work";
import { healthTone, evidenceStatusTone, artifactTone } from "@/lib/digital-thread";
import {
  riskStatusTone,
  controlStateTone,
  programStatusTone,
  assessmentTone as assessmentTone2,
  poamStatusTone,
  poamSeverityTone,
  milestoneStatusTone,
  gateStatusTone,
  gateKindTone,
} from "@/lib/grc-data";
import { formatTone, scanStateTone, diffStateTone } from "@/lib/ingestion";
import { inheritanceStateTone, designationTone, shareTone } from "@/lib/inheritance";
import { packageStateTone } from "@/lib/packages";
import { taskStatusTone } from "@/lib/remediation";
import {
  requirementStateTone,
  allocationStateTone,
  coverageTone,
  derivationSourceTone,
  responsibilityTone,
} from "@/lib/requirements";
import { componentHealthTone } from "@/lib/reusable-components";
import { bandTone } from "@/lib/risk-scoring";
import { rowCurrencyTone, verificationMethodTone, determinationTone } from "@/lib/sctm";
import { approvalTone } from "@/lib/tailoring";
import { phaseStateTone, effectTone, scenarioStatusTone } from "@/lib/te-phases";
import { regressionStateTone, stepResultTone, runStateTone } from "@/lib/test-execution";
import {
  ingestTone,
  severityTone,
  findingStatusTone,
  verdictTone,
  testStatusTone,
} from "@/lib/verification";

/*
 * Every domain vocabulary as the Badges it renders, grouped by the lib file that owns it. This
 * sheet lives in the prototype, not the package: the maps are product knowledge; the Badge is the kit's.
 * Read it to catch the same concept carrying two tones in two files, then decide once.
 */

type Vocabulary = { name: string; source: string; map: Readonly<Record<string, Tone>> };

const vocabularies: Vocabulary[] = [
  { name: "reconcileStateTone", source: "airgap", map: reconcileStateTone },
  { name: "reconcileStateTone", source: "airgap", map: reconcileStateTone2 },
  { name: "packageStatusTone", source: "authorization", map: packageStatusTone },
  { name: "observationTone", source: "authorization", map: observationTone },
  { name: "residualTone", source: "authorization", map: residualTone },
  { name: "decisionTone", source: "authorization", map: decisionTone },
  { name: "grantTone", source: "authorization", map: grantTone },
  { name: "buildStateTone", source: "baselines", map: buildStateTone },
  { name: "securityImpactTone", source: "baselines", map: securityImpactTone },
  { name: "changeKindTone", source: "baselines", map: changeKindTone },
  { name: "impactStateTone", source: "baselines", map: impactStateTone },
  { name: "assessmentStatusTone", source: "conmon", map: assessmentStatusTone },
  { name: "freshnessTone", source: "conmon", map: freshnessTone },
  { name: "driftBandTone", source: "conmon", map: driftBandTone },
  { name: "alertSeverityTone", source: "conmon", map: alertSeverityTone },
  { name: "slcmMethodTone", source: "conmon", map: slcmMethodTone },
  { name: "stageStateTone", source: "control-board", map: stageStateTone },
  { name: "controlStatusTone", source: "control-matrix", map: controlStatusTone },
  { name: "revisionTone", source: "control-set", map: revisionTone },
  { name: "implementationTone", source: "control-work", map: implementationTone },
  { name: "assessmentTone", source: "control-work", map: assessmentTone },
  { name: "healthTone", source: "digital-thread", map: healthTone },
  { name: "evidenceStatusTone", source: "digital-thread", map: evidenceStatusTone },
  { name: "artifactTone", source: "digital-thread", map: artifactTone },
  { name: "riskStatusTone", source: "grc-data", map: riskStatusTone },
  { name: "controlStateTone", source: "grc-data", map: controlStateTone },
  { name: "programStatusTone", source: "grc-data", map: programStatusTone },
  { name: "assessmentTone", source: "grc-data", map: assessmentTone2 },
  { name: "poamStatusTone", source: "grc-data", map: poamStatusTone },
  { name: "poamSeverityTone", source: "grc-data", map: poamSeverityTone },
  { name: "milestoneStatusTone", source: "grc-data", map: milestoneStatusTone },
  { name: "gateStatusTone", source: "grc-data", map: gateStatusTone },
  { name: "gateKindTone", source: "grc-data", map: gateKindTone },
  { name: "formatTone", source: "ingestion", map: formatTone },
  { name: "scanStateTone", source: "ingestion", map: scanStateTone },
  { name: "diffStateTone", source: "ingestion", map: diffStateTone },
  { name: "inheritanceStateTone", source: "inheritance", map: inheritanceStateTone },
  { name: "designationTone", source: "inheritance", map: designationTone },
  { name: "shareTone", source: "inheritance", map: shareTone },
  { name: "packageStateTone", source: "packages", map: packageStateTone },
  { name: "taskStatusTone", source: "remediation", map: taskStatusTone },
  { name: "requirementStateTone", source: "requirements", map: requirementStateTone },
  { name: "allocationStateTone", source: "requirements", map: allocationStateTone },
  { name: "coverageTone", source: "requirements", map: coverageTone },
  { name: "derivationSourceTone", source: "requirements", map: derivationSourceTone },
  { name: "responsibilityTone", source: "requirements", map: responsibilityTone },
  { name: "componentHealthTone", source: "reusable-components", map: componentHealthTone },
  { name: "bandTone", source: "risk-scoring", map: bandTone },
  { name: "rowCurrencyTone", source: "sctm", map: rowCurrencyTone },
  { name: "verificationMethodTone", source: "sctm", map: verificationMethodTone },
  { name: "determinationTone", source: "sctm", map: determinationTone },
  { name: "approvalTone", source: "tailoring", map: approvalTone },
  { name: "phaseStateTone", source: "te-phases", map: phaseStateTone },
  { name: "effectTone", source: "te-phases", map: effectTone },
  { name: "scenarioStatusTone", source: "te-phases", map: scenarioStatusTone },
  { name: "regressionStateTone", source: "test-execution", map: regressionStateTone },
  { name: "stepResultTone", source: "test-execution", map: stepResultTone },
  { name: "runStateTone", source: "test-execution", map: runStateTone },
  { name: "ingestTone", source: "verification", map: ingestTone },
  { name: "severityTone", source: "verification", map: severityTone },
  { name: "findingStatusTone", source: "verification", map: findingStatusTone },
  { name: "verdictTone", source: "verification", map: verdictTone },
  { name: "testStatusTone", source: "verification", map: testStatusTone },
];

type Args = { size?: "xsmall" | "small" };

const meta = {
  title: "Product/Status vocabulary",
  parameters: { layout: "padded" },
  args: { size: "small" },
  argTypes: { size: { control: "inline-radio", options: ["xsmall", "small"] } },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const Maps: Story = {
  render: (args) => (
    <Stack space="space.200">
      <Text size="small" color="color.text.subtle">
        {vocabularies.length} tone maps across {new Set(vocabularies.map((v) => v.source)).size}{" "}
        files.
      </Text>
      <Table>
        <thead>
          <tr>
            <Table.Header width={200}>Vocabulary</Table.Header>
            <Table.Header width={160}>Source</Table.Header>
            <Table.Header>Values</Table.Header>
          </tr>
        </thead>
        <tbody>
          {vocabularies.map((v) => (
            <Table.Row key={`${v.source}/${v.name}`} isStatic>
              <Table.Cell className="align-top">{v.name}</Table.Cell>
              <Table.Cell className="align-top">lib/{v.source}</Table.Cell>
              <Table.Cell className="h-auto whitespace-normal py-100">
                <Inline space="space.075" rowSpace="space.075" shouldWrap>
                  {Object.entries(v.map).map(([value, tone]) => (
                    <Badge key={value} tone={tone} size={args.size ?? "small"}>
                      {value}
                    </Badge>
                  ))}
                </Inline>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Stack>
  ),
};
