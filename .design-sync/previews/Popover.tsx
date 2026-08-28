import {
  Button,
  Field,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
} from "program-assurance";

export function SaveView() {
  return (
    <div className="p-4" style={{ minHeight: 340 }}>
      <Popover defaultOpen modal={false}>
        <PopoverTrigger asChild>
          <Button variant="secondary">Save view</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-72">
          <div className="grid gap-3">
            <Field label="View name">
              <Input defaultValue="Overdue POA&M — GovCloud" />
            </Field>
            <Field label="Visibility">
              <Select defaultValue="Team">
                <option>Only me</option>
                <option>Team</option>
                <option>Organization</option>
              </Select>
            </Field>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button variant="primary">Save view</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
