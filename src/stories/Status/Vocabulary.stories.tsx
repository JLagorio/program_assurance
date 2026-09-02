import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@/components/app/ui";
import type { Tone } from "@/components/app/ui";
import { reconcileStateTone } from "@/lib/airgap";
import {
  decisionTone,
  grantTone,
  observationTone,
  packageStatusTone,
  residualTone,
} from "@/lib/authorization";
import {
  buildStateTone,
  changeKindTone,
  impactStateTone,
  securityImpactTone,
} from "@/lib/baselines";
import {
  alertSeverityTone,
  assessmentStatusTone,
  driftBandTone,
  freshnessTone,
  slcmMethodTone,
} from "@/lib/conmon";
import { controlStatusTone } from "@/lib/control-matrix";
import { assessmentTone as workAssessmentTone, implementationTone } from "@/lib/control-work";
import { artifactTone, evidenceStatusTone, healthTone } from "@/lib/digital-thread";
import {
  assessmentTone,
  controlStateTone,
  gateKindTone,
  gateStatusTone,
  milestoneStatusTone,
  poamSeverityTone,
  poamStatusTone,
  programStatusTone,
  riskStatusTone,
} from "@/lib/grc-data";
import { designationTone, inheritanceStateTone, shareTone } from "@/lib/inheritance";
import { diffStateTone, formatTone, scanStateTone } from "@/lib/ingestion";
import { packageStateTone } from "@/lib/packages";
import {
  allocationStateTone,
  coverageTone,
  derivationSourceTone,
  requirementStateTone,
  responsibilityTone,
} from "@/lib/requirements";
import { componentHealthTone } from "@/lib/reusable-components";
import { bandTone } from "@/lib/risk-scoring";
import { approvalTone } from "@/lib/tailoring";
import {
  findingStatusTone,
  ingestTone,
  severityTone,
  testStatusTone,
  verdictTone,
} from "@/lib/verification";

const meta = {
  title: "Status/Vocabulary",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Satisfied", size: "sm" },
  argTypes: {
    size: { control: "inline-radio", options: ["xs", "sm"] },
    tone: { control: false },
    children: { control: false },
    icon: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

type Vocabulary = { name: string; source: string; map: Readonly<Record<string, Tone>> };

/** Every exported tone map in lib/, grouped by the file that owns it. */
const vocabularies: Vocabulary[] = [
  { name: "controlStatusTone", source: "control-matrix", map: controlStatusTone },
  { name: "implementationTone", source: "control-work", map: implementationTone },
  { name: "assessmentTone", source: "control-work", map: workAssessmentTone },
  { name: "assessmentTone", source: "grc-data", map: assessmentTone },
  { name: "controlStateTone", source: "grc-data", map: controlStateTone },
  { name: "programStatusTone", source: "grc-data", map: programStatusTone },
  { name: "riskStatusTone", source: "grc-data", map: riskStatusTone },
  { name: "poamStatusTone", source: "grc-data", map: poamStatusTone },
  { name: "poamSeverityTone", source: "grc-data", map: poamSeverityTone },
  { name: "milestoneStatusTone", source: "grc-data", map: milestoneStatusTone },
  { name: "gateStatusTone", source: "grc-data", map: gateStatusTone },
  { name: "gateKindTone", source: "grc-data", map: gateKindTone },
  { name: "requirementStateTone", source: "requirements", map: requirementStateTone },
  { name: "allocationStateTone", source: "requirements", map: allocationStateTone },
  { name: "coverageTone", source: "requirements", map: coverageTone },
  { name: "derivationSourceTone", source: "requirements", map: derivationSourceTone },
  { name: "responsibilityTone", source: "requirements", map: responsibilityTone },
  { name: "inheritanceStateTone", source: "inheritance", map: inheritanceStateTone },
  { name: "designationTone", source: "inheritance", map: designationTone },
  { name: "shareTone", source: "inheritance", map: shareTone },
  { name: "severityTone", source: "verification", map: severityTone },
  { name: "findingStatusTone", source: "verification", map: findingStatusTone },
  { name: "verdictTone", source: "verification", map: verdictTone },
  { name: "testStatusTone", source: "verification", map: testStatusTone },
  { name: "ingestTone", source: "verification", map: ingestTone },
  { name: "formatTone", source: "ingestion", map: formatTone },
  { name: "scanStateTone", source: "ingestion", map: scanStateTone },
  { name: "diffStateTone", source: "ingestion", map: diffStateTone },
  { name: "buildStateTone", source: "baselines", map: buildStateTone },
  { name: "changeKindTone", source: "baselines", map: changeKindTone },
  { name: "securityImpactTone", source: "baselines", map: securityImpactTone },
  { name: "impactStateTone", source: "baselines", map: impactStateTone },
  { name: "assessmentStatusTone", source: "conmon", map: assessmentStatusTone },
  { name: "freshnessTone", source: "conmon", map: freshnessTone },
  { name: "driftBandTone", source: "conmon", map: driftBandTone },
  { name: "alertSeverityTone", source: "conmon", map: alertSeverityTone },
  { name: "slcmMethodTone", source: "conmon", map: slcmMethodTone },
  { name: "bandTone", source: "risk-scoring", map: bandTone },
  { name: "packageStatusTone", source: "authorization", map: packageStatusTone },
  { name: "observationTone", source: "authorization", map: observationTone },
  { name: "residualTone", source: "authorization", map: residualTone },
  { name: "decisionTone", source: "authorization", map: decisionTone },
  { name: "grantTone", source: "authorization", map: grantTone },
  { name: "packageStateTone", source: "packages", map: packageStateTone },
  { name: "healthTone", source: "digital-thread", map: healthTone },
  { name: "evidenceStatusTone", source: "digital-thread", map: evidenceStatusTone },
  { name: "artifactTone", source: "digital-thread", map: artifactTone },
  { name: "componentHealthTone", source: "reusable-components", map: componentHealthTone },
  { name: "approvalTone", source: "tailoring", map: approvalTone },
  { name: "reconcileStateTone", source: "airgap", map: reconcileStateTone },
];

const th = "h-8 pr-6 text-[12px] font-medium text-muted-foreground";

/**
 * Every domain vocabulary as the Badges it renders. Fifty maps, nineteen one-line
 * Chip wrappers; the same concept is `xs` in one file and `sm` in another. Flip
 * the size control to compare, then decide once.
 */
export const Maps: Story = {
  render: (args) => (
    <div className="overflow-x-auto">
      <table className="text-left text-[13px]">
        <thead>
          <tr>
            <th className={th}>vocabulary</th>
            <th className={th}>source</th>
            <th className={th}>values</th>
          </tr>
        </thead>
        <tbody>
          {vocabularies.map((v) => (
            <tr key={`${v.source}/${v.name}`} className="border-t border-border-subtle">
              <td className="py-2 pr-6 align-top font-mono text-[11px] text-foreground">
                {v.name}
              </td>
              <td className="py-2 pr-6 align-top font-mono text-[11px] text-muted-foreground">
                lib/{v.source}
              </td>
              <td className="py-2 pr-6">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(v.map).map(([value, tone]) => (
                    <Badge key={value} tone={tone} size={args.size}>
                      {value}
                    </Badge>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
