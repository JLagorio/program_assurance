import type { Meta, StoryObj } from "@storybook/react-vite";
import { Command as CommandIcon, Search, SlidersHorizontal, Star, User, X } from "lucide-react";

import { Button, Field, IconButton, Input, InputGroup, NativeSelect } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const owners = ["Dana Whitfield", "Priya Natarajan", "Grace Hoppel"];

const meta = {
  title: "Components/InputGroup",
  component: InputGroup,
  parameters: { layout: "padded" },
  args: {
    leading: <Search />,
    width: 240,
    children: <Input type="search" placeholder="Search controls" aria-label="Search" />,
  },
} satisfies Meta<typeof InputGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const shortcut = (
  <>
    <CommandIcon />K
  </>
);

const kinds = [
  "leading icon",
  "trailing hint",
  "both",
  "trailing unit",
  "NativeSelect inside",
] as const;
type Kind = (typeof kinds)[number];
const states = ["rest", "filled", "disabled"] as const;
type State = (typeof states)[number];

function Specimen({ kind, state }: { kind: Kind; state: State }) {
  const disabled = state === "disabled";
  const filled = state !== "rest";
  if (kind === "trailing unit")
    return (
      <InputGroup trailing="days" width={140}>
        <Input
          type="number"
          inputMode="numeric"
          aria-label="Retention"
          min={0}
          placeholder="90"
          defaultValue={filled ? "90" : undefined}
          disabled={disabled}
        />
      </InputGroup>
    );
  if (kind === "NativeSelect inside")
    return (
      <InputGroup leading={<User />} width={240}>
        <NativeSelect aria-label="Owner" defaultValue={filled ? owners[1] : ""} disabled={disabled}>
          <option value="">Any owner</option>
          {owners.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </NativeSelect>
      </InputGroup>
    );
  return (
    <InputGroup
      leading={kind === "trailing hint" ? undefined : <Search />}
      trailing={kind === "leading icon" ? undefined : shortcut}
      width={240}
    >
      <Input
        type="search"
        aria-label="Search"
        placeholder="Search controls"
        defaultValue={filled ? "AC-2 account management" : undefined}
        disabled={disabled}
      />
    </InputGroup>
  );
}

/** What can sit at either end, down the side; the states across. */
export const InputGroupMatrix: Story = {
  render: () => (
    <Grid
      rows={kinds}
      cols={states}
      rowLabel="ends"
      render={(kind, state) => <Specimen kind={kind} state={state} />}
    />
  ),
};

/** The search box: the top navigation's, wide and small with its shortcut, and a toolbar's beside a small Button. Escape clears either. */
export const SearchBox: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="the top navigation">
        <InputGroup leading={<Search />} trailing={shortcut} width={420}>
          <Input
            type="search"
            size="small"
            placeholder="Search risks, controls, evidence…"
            aria-label="Search"
          />
        </InputGroup>
      </Specimens>
      <Specimens title="a toolbar">
        <Inline space="space.100" alignBlock="center">
          <InputGroup leading={<Search />} width={240}>
            <Input
              type="search"
              size="small"
              placeholder="Search POA&M items, owners"
              aria-label="Search"
            />
          </InputGroup>
          <Button size="small" variant="secondary" iconBefore={<SlidersHorizontal />}>
            Filter
          </Button>
        </Inline>
      </Specimens>
    </Stack>
  ),
};

/** A unit at the end, a currency at the start. The value is a number; the end says what it counts. */
export const Units: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start">
      <div style={{ width: 160 }}>
        <Field label="Retention" hint="Days before the scan is purged.">
          <InputGroup trailing="days">
            <Input type="number" inputMode="numeric" defaultValue="90" min={0} />
          </InputGroup>
        </Field>
      </div>
      <div style={{ width: 160 }}>
        <Field label="Weight">
          <InputGroup trailing="kg">
            <Input type="number" inputMode="decimal" defaultValue="12.5" min={0} step={0.1} />
          </InputGroup>
        </Field>
      </div>
      <div style={{ width: 180 }}>
        <Field label="Budget">
          <InputGroup leading="$">
            <Input type="number" inputMode="decimal" defaultValue="240000" min={0} />
          </InputGroup>
        </Field>
      </div>
    </Inline>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <InputGroup leading={<Search />} width={220}>
              <Input type="search" defaultValue="AC-2" aria-label="Search" />
            </InputGroup>
            <Button variant="secondary">Clear</Button>
          </Inline>
        }
        doText="An action is a Button beside the field, and Escape clears a search box anyway."
        dont={
          <InputGroup
            trailing={
              <IconButton
                label="Clear"
                icon={<X />}
                variant="subtle"
                size="small"
                isTooltipDisabled
              />
            }
            width={220}
          >
            <Input type="search" defaultValue="AC-2" aria-label="Search" />
          </InputGroup>
        }
        dontText="A button inside the field. The ends are static; this one cannot be clicked or reached by Tab."
      />
      <Pair
        do={
          <div style={{ width: 160 }}>
            <Field label="Retention">
              <InputGroup trailing="days">
                <Input type="number" inputMode="numeric" defaultValue="90" />
              </InputGroup>
            </Field>
          </div>
        }
        doText="The value is a number and the unit stays after it."
        dont={
          <div style={{ width: 160 }}>
            <Field label="Retention">
              <Input placeholder="90 days" />
            </Field>
          </div>
        }
        dontText="The unit is in the placeholder. It vanishes when typing starts, and the value is now free text."
      />
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Program name">
              <Input defaultValue="Atlas payments platform" />
            </Field>
          </div>
        }
        doText="A field with nothing to say at either end has no group."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Program name">
              <InputGroup leading={<Star />}>
                <Input defaultValue="Atlas payments platform" />
              </InputGroup>
            </Field>
          </div>
        }
        dontText="A decoration in the field. The icon means nothing and takes the room the name needs."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
