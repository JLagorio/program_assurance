import type { Meta, StoryObj } from "@storybook/react-vite";
import { Command as CommandIcon, Search } from "lucide-react";

import { Input, InputGroup, NativeSelect } from "../../components";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/InputGroup",
  component: InputGroup,
  parameters: { layout: "padded" },
  args: { children: <Input aria-label="Search" /> },
} satisfies Meta<typeof InputGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A leading icon, a trailing shortcut hint, both at once, and a NativeSelect inside. */
export const InputGroupMatrix: Story = {
  render: () => (
    <Specimens title="InputGroup">
      <InputGroup leading={<Search />} width={240}>
        <Input type="search" placeholder="Search…" aria-label="Search" />
      </InputGroup>
      <InputGroup
        trailing={
          <span className="flex items-center gap-025">
            <CommandIcon className="size-100" />K
          </span>
        }
        width={240}
      >
        <Input type="search" placeholder="Search…" aria-label="Search" />
      </InputGroup>
      <InputGroup
        leading={<Search />}
        trailing={
          <span className="flex items-center gap-025">
            <CommandIcon className="size-100" />K
          </span>
        }
        width={240}
      >
        <Input
          type="search"
          placeholder="Search risks, controls, evidence…"
          aria-label="Search"
          className="h-control-small"
        />
      </InputGroup>
      <InputGroup leading={<Search />} width={240}>
        <NativeSelect aria-label="Owner" defaultValue="">
          <option value="" disabled>
            Choose an owner
          </option>
          <option>Dana Whitfield</option>
          <option>Priya Natarajan</option>
        </NativeSelect>
      </InputGroup>
    </Specimens>
  ),
};
