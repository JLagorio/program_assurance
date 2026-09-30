import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  FieldLabel,
  FieldDescription,
  FieldError,
  Button,
  Field,
  FieldContent,
  FieldSet,
  FieldLegend,
  Switch,
  Table,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: { layout: "padded" },
  args: { "aria-label": "Notify the owner", defaultChecked: true },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

const blockedChange = fn();

/** Sizes, checked states, disabled and read-only behavior, plus cancellation and RTL. A read-only switch that is on takes the neutral fill, not the brand one. */
export const SwitchMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Grid
        rows={["medium", "small"] as const}
        cols={["off", "on", "disabled", "read-only"] as const}
        rowLabel="size"
        render={(size, state) => (
          <Switch
            size={size}
            aria-label={`${size} ${state}`}
            defaultChecked={state !== "off"}
            disabled={state === "disabled"}
            readOnly={state === "read-only"}
            onCheckedChange={
              state === "disabled" || state === "read-only" ? blockedChange : undefined
            }
          />
        )}
      />
      <Specimens title="A change can be cancelled when a program owns the setting">
        <label className="inline-flex items-center gap-100">
          <Switch defaultChecked onCheckedChange={(_, details) => details.cancel()} />
          Program-managed notifications
        </label>
      </Specimens>
      <Specimens title="The shadcn spellings, deprecated">
        <Switch size="default" aria-label="Legacy default" />
        <Switch size="sm" aria-label="Legacy sm" />
      </Specimens>
      <LedgerProvider direction="rtl">
        <label className="inline-flex items-center gap-100 px-150">
          <Switch /> RTL notifications
        </label>
      </LedgerProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    blockedChange.mockClear();
    for (const [size, width, height, thumbSize, travel] of [
      ["medium", 32, 20, 16, 12],
      ["small", 24, 16, 12, 8],
    ] as const) {
      const off = canvas.getByRole("switch", { name: `${size} off` });
      const thumb = off.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      await expect(off.tagName).toBe("SPAN");
      await expect(off).toHaveAttribute("data-slot", "switch");
      await expect(off.getBoundingClientRect().width).toBe(width);
      await expect(off.getBoundingClientRect().height).toBe(height);
      await expect(thumb.getBoundingClientRect().width).toBe(thumbSize);
      await expect(thumb.getBoundingClientRect().height).toBe(thumbSize);
      await expect(getComputedStyle(thumb).transitionProperty === "none").toBe(reducedMotion);
      if (matchMedia("(forced-colors: active)").matches) {
        await expect(getComputedStyle(off).outlineStyle).toBe("solid");
        await expect(getComputedStyle(thumb).backgroundColor).not.toBe(
          getComputedStyle(off).backgroundColor,
        );
      } else {
        // base.css is optional; thumb colors must follow tokens, not color-scheme.
        const thumbColor = getComputedStyle(thumb).backgroundColor;
        for (const scheme of ["light", "dark"]) {
          off.style.colorScheme = scheme;
          await expect(getComputedStyle(thumb).backgroundColor).toBe(thumbColor);
        }
        off.style.removeProperty("color-scheme");
      }
      const position = () => thumb.getBoundingClientRect().left - off.getBoundingClientRect().left;
      const start = position();
      await userEvent.click(off);
      await expect(off).toBeChecked();
      if (matchMedia("(forced-colors: active)").matches) {
        await waitFor(() =>
          expect(getComputedStyle(thumb).backgroundColor).not.toBe(
            getComputedStyle(off).backgroundColor,
          ),
        );
      }
      await waitFor(() => expect(position() - start).toBeCloseTo(travel, 1));
      const disabled = canvas.getByRole("switch", { name: `${size} disabled` });
      await expect(disabled).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(disabled, { pointerEventsCheck: 0 });
      await expect(disabled).toBeChecked();
      const readOnly = canvas.getByRole("switch", { name: `${size} read-only` });
      await expect(readOnly).toHaveAttribute("aria-readonly", "true");
      await expect(off).toHaveAttribute("data-size", size);
      if (!matchMedia("(forced-colors: active)").matches)
        await expect(getComputedStyle(readOnly).backgroundColor).not.toBe(
          getComputedStyle(canvas.getByRole("switch", { name: `${size} on` })).backgroundColor,
        );
      await userEvent.click(readOnly);
      await userEvent.keyboard("{Enter} ");
      await expect(readOnly).toBeChecked();
      canvas.getByRole("switch", { name: `${size} on` }).focus();
      await userEvent.tab();
      await expect(readOnly).toHaveFocus();
    }
    await expect(blockedChange).not.toHaveBeenCalled();
    // The shadcn spellings still render at their sizes and report the kit's words.
    for (const [name, size, width] of [
      ["Legacy default", "medium", 32],
      ["Legacy sm", "small", 24],
    ] as const) {
      const legacy = canvas.getByRole("switch", { name });
      await expect(legacy).toHaveAttribute("data-size", size);
      await expect(legacy.getBoundingClientRect().width).toBe(width);
    }
    const managed = canvas.getByRole("switch", { name: "Program-managed notifications" });
    await userEvent.click(managed);
    await expect(managed).toBeChecked();
    const rtl = canvas.getByRole("switch", { name: "RTL notifications" });
    const thumb = rtl.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
    const position = () => thumb.getBoundingClientRect().left - rtl.getBoundingClientRect().left;
    const start = position();
    await userEvent.click(rtl);
    await waitFor(() => expect(position() - start).toBeCloseTo(-12, 1));
  },
};

const rootRef = createRef<HTMLElement>();
const inputRef = createRef<HTMLInputElement>();

function SettingsDemo() {
  const [notify, setNotify] = useState(true);
  const [digest, setDigest] = useState(false);
  const [status, setStatus] = useState("");
  const apply = (setting: string, on: boolean) =>
    setStatus(`${setting} ${on ? "turned on" : "turned off"}.`);
  return (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field orientation="horizontal">
        <Switch
          checked={notify}
          onCheckedChange={(on) => {
            setNotify(on);
            apply("Owner notifications", on);
          }}
        />
        <FieldContent>
          <FieldLabel>Notify the owner</FieldLabel>
          <FieldDescription>Email the owner when a finding changes status.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <Switch
          checked={digest}
          onCheckedChange={(on) => {
            setDigest(on);
            apply("Weekly digest", on);
          }}
        />
        <FieldContent>
          <FieldLabel>Weekly digest</FieldLabel>
          <FieldDescription>A summary of open work every Monday.</FieldDescription>
        </FieldContent>
      </Field>
      <Text role="status">{status}</Text>
    </Stack>
  );
}

/**
 * A settings list: each switch applies the moment it moves, and a status says what changed, so
 * there is no Save button. The label, the hint and the switch are one horizontal Field each.
 */
export const Settings: Story = {
  render: () => <SettingsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notify = canvas.getByRole("switch", { name: "Notify the owner" });
    const digest = canvas.getByRole("switch", { name: "Weekly digest" });
    await expect(notify).toHaveAccessibleDescription(
      "Email the owner when a finding changes status.",
    );
    await expect(canvas.queryByRole("button")).toBeNull();
    await userEvent.click(canvas.getByText("Weekly digest"));
    await expect(digest).toBeChecked();
    await expect(canvas.getByRole("status")).toHaveTextContent("Weekly digest turned on.");
    notify.focus();
    await userEvent.keyboard(" ");
    await expect(notify).not.toBeChecked();
    await expect(canvas.getByRole("status")).toHaveTextContent("Owner notifications turned off.");
  },
};

function NativeFormDemo() {
  const [notify, setNotify] = useState(true);
  const [pack, setPack] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saved, setSaved] = useState("Changes have not been saved.");
  return (
    <Stack space="space.300" className="max-w-layout-measure">
      <form
        aria-label="Notification settings"
        onReset={() => {
          setNotify(true);
          setPack(false);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSaved(
            `Notifications: ${data.get("notify")}; board pack: ${data.get("pack") ?? "omitted"}.`,
          );
        }}
      >
        <Stack space="space.200">
          <Inline space="space.100" alignBlock="center">
            <Switch
              ref={rootRef}
              inputRef={inputRef}
              id="owner-notifications"
              name="notify"
              value="yes"
              uncheckedValue="no"
              checked={notify}
              onCheckedChange={setNotify}
              className={(state) => (state.checked ? "align-middle" : "align-baseline")}
              style={(state) => ({ outlineOffset: state.checked ? 4 : 2 })}
            />
            <label htmlFor="owner-notifications">Notify the owner</label>
          </Inline>
          <label className="inline-flex items-center gap-100">
            <Switch name="pack" value="yes" checked={pack} onCheckedChange={setPack} />
            Include in the board pack
          </label>
          <Inline space="space.100">
            <Button type="submit" variant="primary">
              Save settings
            </Button>
            <Button type="reset">Reset settings</Button>
          </Inline>
          <Text role="status">{saved}</Text>
        </Stack>
      </form>
      <Field invalid={!sharing} required>
        <FieldLabel>External sharing</FieldLabel>
        <Switch id="external-sharing" checked={sharing} onCheckedChange={setSharing} />
        {sharing ? (
          <FieldDescription>Only approved partners can access the package.</FieldDescription>
        ) : (
          <FieldError>Enable sharing before sending the package.</FieldError>
        )}
      </Field>
    </Stack>
  );
}

/**
 * The hidden checkbox takes part in a native form: `name`, `value`, `uncheckedValue`, reset, a
 * sibling `<label htmlFor>` pointing at the input's `id`, a wrapping label, refs and state
 * callbacks. A Field names, describes and marks the last switch with no ids.
 */
export const NativeForm: Story = {
  name: "Native form",
  render: () => <NativeFormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notify = canvas.getByRole("switch", { name: "Notify the owner" });
    const pack = canvas.getByRole("switch", { name: "Include in the board pack" });
    await expect(rootRef.current).toBe(notify);
    await expect(inputRef.current?.tagName).toBe("INPUT");
    await expect(inputRef.current).toHaveAttribute("id", "owner-notifications");
    await expect(inputRef.current).toHaveAttribute("aria-hidden", "true");
    await expect(notify).not.toHaveAttribute("id", "owner-notifications");
    await expect(notify).toHaveClass("align-middle");
    await expect(notify).toHaveStyle({ outlineOffset: "4px" });
    await userEvent.click(canvas.getByText("Include in the board pack"));
    await expect(pack).toBeChecked();
    await userEvent.click(canvas.getByText("Notify the owner"));
    await expect(notify).not.toBeChecked();
    await expect(inputRef.current).not.toBeChecked();
    await expect(notify).toHaveClass("align-baseline");
    await expect(notify).toHaveStyle({ outlineOffset: "2px" });
    await userEvent.click(canvas.getByRole("button", { name: "Save settings" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Notifications: no; board pack: yes.",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Reset settings" }));
    await expect(notify).toBeChecked();
    await expect(pack).not.toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "Save settings" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Notifications: yes; board pack: omitted.",
    );
    notify.focus();
    await userEvent.keyboard(" ");
    await expect(notify).not.toBeChecked();
    await userEvent.keyboard("{Enter}");
    await expect(notify).toBeChecked();
    const sharing = canvas.getByRole("switch", { name: "External sharing" });
    await expect(sharing).toHaveAttribute("aria-invalid", "true");
    await expect(sharing).toHaveAttribute("aria-required", "true");
    await expect(sharing).toHaveAccessibleDescription("Enable sharing before sending the package.");
    await expect(canvasElement.querySelectorAll('[id="external-sharing"]')).toHaveLength(1);
    await expect(canvasElement.querySelector('[id="external-sharing"]')?.tagName).toBe("INPUT");
    await userEvent.click(canvas.getByText("External sharing"));
    await expect(sharing).toBeChecked();
    await expect(sharing).not.toHaveAttribute("aria-invalid", "true");
    await expect(sharing).toHaveAccessibleDescription(
      "Only approved partners can access the package.",
    );
  },
};

const buttonRef = createRef<HTMLElement>();
const renderedRef = createRef<HTMLButtonElement>();
const renderedInputRef = createRef<HTMLInputElement>();
const rootClick = fn();
const renderedClick = fn();

function RowsDemo() {
  const [applied, setApplied] = useState({ privacy: true, classified: false, cds: false });
  const rows = [
    ["privacy", "Privacy overlay", "22 controls"],
    ["classified", "Classified information overlay", "14 controls"],
    ["cds", "Cross domain solution overlay", "31 controls"],
  ] as const;
  return (
    <div style={{ maxWidth: 520 }}>
      <Table>
        <thead>
          <Table.Row>
            <Table.Header>Overlay</Table.Header>
            <Table.Header>Adds</Table.Header>
            <Table.Header>Applied</Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          {rows.map(([key, name, adds]) => (
            <Table.Row key={key}>
              <Table.Cell>{name}</Table.Cell>
              <Table.Cell>
                <Text color="color.text.subtle">{adds}</Text>
              </Table.Cell>
              <Table.Cell>
                <Switch
                  aria-label={`Apply ${name}`}
                  checked={applied[key]}
                  onCheckedChange={(value) => setApplied({ ...applied, [key]: value })}
                  {...(key === "privacy"
                    ? {
                        id: "privacy-switch",
                        ref: buttonRef,
                        inputRef: renderedInputRef,
                        nativeButton: true,
                        render: (
                          <button
                            ref={renderedRef}
                            title="Privacy setting"
                            onClick={renderedClick}
                          />
                        ),
                        onClick: rootClick,
                      }
                    : {})}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

/** Row-specific names and a native button render target with merged refs and handlers. */
export const InRows: Story = {
  render: () => <RowsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    rootClick.mockClear();
    renderedClick.mockClear();
    const privacy = canvas.getByRole("switch", { name: "Apply Privacy overlay" });
    await expect(privacy.tagName).toBe("BUTTON");
    await expect(buttonRef.current).toBe(privacy);
    await expect(renderedRef.current).toBe(privacy);
    await expect(privacy).toHaveAttribute("id", "privacy-switch");
    await expect(privacy).toHaveAttribute("title", "Privacy setting");
    await expect(renderedInputRef.current).not.toHaveAttribute("id", "privacy-switch");
    await userEvent.click(privacy);
    await expect(privacy).not.toBeChecked();
    await userEvent.keyboard("{Enter}");
    await expect(privacy).toBeChecked();
    await userEvent.keyboard(" ");
    await expect(privacy).not.toBeChecked();
    await expect(rootClick).toHaveBeenCalledTimes(3);
    await expect(renderedClick).toHaveBeenCalledTimes(3);
  },
};

/**
 * In a Field the switch needs no ids: the label names it, the hint and error describe it, and
 * `invalid` and `required` reach it. Invalid draws the danger outline while the switch is not
 * focused; focus replaces it with the focus outline, so focus stays visible. A disabled FieldSet
 * disables the switches inside it.
 */
export const BoundInField: Story = {
  name: "Bound in a Field",
  render: () => (
    <Stack space="space.300" className="w-layout-list max-w-full">
      <Field orientation="horizontal" invalid required>
        <Switch />
        <FieldContent>
          <FieldLabel>Share with the assessor</FieldLabel>
          <FieldDescription>The assessor sees the draft before it is published.</FieldDescription>
          <FieldError>Share the draft before you request an assessment.</FieldError>
        </FieldContent>
      </Field>
      <FieldSet disabled>
        <FieldLegend variant="label">While saving</FieldLegend>
        <Field orientation="horizontal">
          <Switch defaultChecked />
          <FieldLabel>Notify the owner</FieldLabel>
        </Field>
      </FieldSet>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const share = canvas.getByRole("switch", { name: "Share with the assessor" });
    await expect(share).toHaveAttribute("aria-invalid", "true");
    await expect(share).toHaveAttribute("aria-required", "true");
    await expect(share).toHaveAccessibleDescription(
      "The assessor sees the draft before it is published. Share the draft before you request an assessment.",
    );
    // Forced colours replace the token colours with system ones: the error text and aria-invalid
    // carry the state there, and the focus outline is the Highlight ring from forced-colors.css.
    const forced = matchMedia("(forced-colors: active)").matches;
    const danger = getComputedStyle(share).getPropertyValue("--ds-color-border-danger").trim();
    const ring = getComputedStyle(share).getPropertyValue("--ds-color-border-focused").trim();
    if (!forced) await expect(getComputedStyle(share).outlineColor).toBe(danger);
    const resting = getComputedStyle(share).outlineWidth;
    // Keyboard focus, as Tab gives it; the option draws :focus-visible without a trusted key press.
    share.focus({ focusVisible: true } as FocusOptions);
    await waitFor(() =>
      forced
        ? expect(getComputedStyle(share).outlineWidth).not.toBe(resting)
        : expect(getComputedStyle(share).outlineColor).toBe(ring),
    );
    await userEvent.keyboard(" ");
    await expect(share).toBeChecked();
    const notify = canvas.getByRole("switch", { name: "Notify the owner" });
    await expect(notify).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(notify, { pointerEventsCheck: 0 });
    await expect(notify).toBeChecked();
  },
};

export const Playground: Story = {};

/**
 * The off track is `color.background.input.track`, 3:1 against every surface with the thumb at
 * 3:1 on it, so an off switch reads as a control and not a faint pill (WCAG 1.4.11). It is not the
 * neutral fill that buttons and badges share. contrast.test holds both pairs in both modes. The
 * play compares the track with a hidden `bg-input-track` reference.
 */
export const Boundary: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Switch aria-label="Include in the board pack" />
      <span data-testid="track" aria-hidden className="hidden bg-input-track" />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Include in the board pack" });
    await expect(control).not.toBeChecked();
    if (matchMedia("(forced-colors: active)").matches) return;
    await expect(getComputedStyle(control).backgroundColor).toBe(
      getComputedStyle(canvas.getByTestId("track")).backgroundColor,
    );
  },
};
