import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RiAddLine,
  RiAlertLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiFilterLine,
  RiInformationLine,
  RiMoreLine,
  RiSearchLine,
  RiSettings3Line,
  RiShieldCheckLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { evidence, people } from "../_lib/fixtures";

/* shadcn preset b1Yobwku1 (base-nova / mist / remixicon), rendered from the
   generated files in src/components/ui so the kit can be judged against it.
   Everything here sits inside `.theme-shadcn-nova`, which is the only place the
   preset's tokens apply (src/components/ui/theme.css). Reference only: nothing
   in the app or in src/ds imports from src/components/ui. */

const meta = {
  title: "Reference/shadcn Nova",
  parameters: { layout: "fullscreen", controls: { disable: true } },
  // Pin the Theme toolbar to Ledger: the other sheets are unlayered overlays that
  // would restyle the preset (Geist, 13px, 400-weight buttons).
  globals: { theme: "ledger" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;
const sizes = ["xs", "sm", "default", "lg"] as const;

const kinds = [
  { value: "policy", label: "Policy" },
  { value: "export", label: "Export" },
  { value: "log", label: "Log" },
  { value: "attestation", label: "Attestation" },
];

const initials = (name: string) => name.replace(/[^A-Z]/g, "").slice(0, 2);

function NovaSection({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={["space-y-4", className].filter(Boolean).join(" ")}>
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

/* Base UI portals every popup into document.body, outside any wrapper, so the
   scope class has to sit on body for menus, selects, dialogs and tooltips to get
   the preset's tokens and font. */
function ScopeOnBody({ dark }: { dark: boolean }) {
  useEffect(() => {
    const classes = dark ? ["theme-shadcn-nova", "dark"] : ["theme-shadcn-nova"];
    document.body.classList.add(...classes);
    return () => document.body.classList.remove(...classes);
  }, [dark]);
  return null;
}

function NovaSheet({ dark = false }: { dark?: boolean }) {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 8, 14));

  return (
    <div className="theme-shadcn-nova min-h-screen p-8 text-sm">
      <ScopeOnBody dark={dark} />
      <TooltipProvider>
        <header className="mb-10 max-w-3xl space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Reference</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>shadcn Nova</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-semibold tracking-tight">shadcn preset b1Yobwku1</h1>
          <p className="text-muted-foreground">
            Style base-nova, base colour mist, Remix icons, inverted menus with bold accent. The
            tokens are scoped to this sheet; the kit under Primitives is untouched.
          </p>
        </header>

        <div className="grid gap-12 xl:grid-cols-2">
          <NovaSection title="Buttons" className="xl:col-span-2">
            <div className="overflow-x-auto">
              <table className="text-left">
                <thead>
                  <tr>
                    <th className="h-8 pr-6 text-xs font-medium text-muted-foreground">variant</th>
                    {sizes.map((s) => (
                      <th key={s} className="h-8 pr-6 text-xs font-medium text-muted-foreground">
                        {s}
                      </th>
                    ))}
                    <th className="h-8 pr-6 text-xs font-medium text-muted-foreground">icon</th>
                    <th className="h-8 pr-6 text-xs font-medium text-muted-foreground">disabled</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v}>
                      <td className="py-1.5 pr-6 text-xs text-muted-foreground">{v}</td>
                      {sizes.map((s) => (
                        <td key={s} className="py-1.5 pr-6">
                          <Button variant={v} size={s}>
                            {s === "xs" ? null : <RiDownloadLine data-icon="inline-start" />}
                            Request evidence
                          </Button>
                        </td>
                      ))}
                      <td className="py-1.5 pr-6">
                        <Button variant={v} size="icon" aria-label="Add">
                          <RiAddLine />
                        </Button>
                      </td>
                      <td className="py-1.5 pr-6">
                        <Button variant={v} disabled>
                          Request evidence
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonGroup>
                <Button variant="outline">Day</Button>
                <Button variant="outline">Week</Button>
                <Button variant="outline">Quarter</Button>
              </ButtonGroup>
              <ToggleGroup defaultValue={["list"]} variant="outline">
                <ToggleGroupItem value="list" aria-label="List">
                  <RiFilterLine />
                </ToggleGroupItem>
                <ToggleGroupItem value="board" aria-label="Board">
                  <RiSettings3Line />
                </ToggleGroupItem>
              </ToggleGroup>
              <Toggle variant="outline" aria-label="Pin">
                <RiShieldCheckLine />
                Pinned
              </Toggle>
              <Button variant="outline">
                <Spinner />
                Working
              </Button>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </div>
          </NovaSection>

          <NovaSection title="Badges, alerts, progress">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="ghost">Ghost</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="link">Link</Badge>
              <Badge variant="secondary">
                <RiShieldCheckLine />
                Satisfied
              </Badge>
            </div>
            <div className="space-y-3">
              <Alert>
                <RiInformationLine />
                <AlertTitle>Package ready for review</AlertTitle>
                <AlertDescription>
                  340 controls assessed. The authorizing official has been notified.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <RiAlertLine />
                <AlertTitle>Evidence expired</AlertTitle>
                <AlertDescription>
                  EV-0377 is 71 days old and no longer satisfies AC-2(3).
                </AlertDescription>
              </Alert>
            </div>
            <Progress value={62}>
              <ProgressLabel>Evidence collected</ProgressLabel>
              <ProgressValue />
            </Progress>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
              <AvatarGroup>
                {people.slice(0, 3).map((p) => (
                  <Avatar key={p}>
                    <AvatarFallback>{initials(p)}</AvatarFallback>
                  </Avatar>
                ))}
                <AvatarGroupCount>+3</AvatarGroupCount>
              </AvatarGroup>
            </div>
          </NovaSection>

          <NovaSection title="Form controls">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nova-title">Finding title</FieldLabel>
                <Input
                  id="nova-title"
                  placeholder="Inactive accounts not disabled within 90 days"
                />
                <FieldDescription>Shown to the authorizing official as written.</FieldDescription>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Evidence kind</FieldLabel>
                  <Select items={kinds} defaultValue="policy">
                    <SelectTrigger>
                      <SelectValue placeholder="Kind" />
                    </SelectTrigger>
                    <SelectContent>
                      {kinds.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="nova-search">Search</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <RiSearchLine />
                    </InputGroupAddon>
                    <InputGroupInput id="nova-search" placeholder="Search evidence" />
                    <InputGroupAddon align="inline-end">
                      <Kbd>⌘K</Kbd>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="nova-notes">Assessor notes</FieldLabel>
                <Textarea
                  id="nova-notes"
                  placeholder="What was examined, interviewed, or tested."
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Field orientation="horizontal">
                    <Checkbox id="nova-c1" defaultChecked />
                    <FieldLabel htmlFor="nova-c1">Include closed findings</FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox id="nova-c2" />
                    <FieldLabel htmlFor="nova-c2">Notify control owners</FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Switch id="nova-s1" defaultChecked />
                    <FieldLabel htmlFor="nova-s1">Continuous monitoring</FieldLabel>
                  </Field>
                </div>
                <RadioGroup defaultValue="examine" className="space-y-1">
                  {["examine", "interview", "test"].map((m) => (
                    <Field key={m} orientation="horizontal">
                      <RadioGroupItem value={m} id={`nova-r-${m}`} />
                      <FieldLabel htmlFor={`nova-r-${m}`} className="capitalize">
                        {m}
                      </FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>
              </div>
              <Field>
                <FieldLabel>Risk tolerance</FieldLabel>
                <Slider defaultValue={[62]} />
              </Field>
            </FieldGroup>
          </NovaSection>

          <NovaSection title="Navigation, overlays">
            <Tabs defaultValue="controls">
              <TabsList>
                <TabsTrigger value="controls">Controls</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
              </TabsList>
              <TabsContent value="controls" className="text-muted-foreground">
                340 controls across 18 families.
              </TabsContent>
              <TabsContent value="evidence">Five items, one expired.</TabsContent>
              <TabsContent value="findings">Seven open.</TabsContent>
            </Tabs>
            <Tabs defaultValue="controls">
              <TabsList variant="line">
                <TabsTrigger value="controls">Controls</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger render={<Button variant="outline">Submit package</Button>} />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit for authorization?</DialogTitle>
                    <DialogDescription>
                      The package is locked once submitted. Seven findings remain open.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline">Cancel</Button>} />
                    <Button>Submit</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Popover>
                <PopoverTrigger render={<Button variant="outline">Filters</Button>} />
                <PopoverContent className="w-72">
                  <PopoverHeader>
                    <PopoverTitle>Filter evidence</PopoverTitle>
                    <PopoverDescription>Narrow the list by kind and age.</PopoverDescription>
                  </PopoverHeader>
                  <div className="mt-3 space-y-2">
                    <Field orientation="horizontal">
                      <Checkbox id="nova-f1" defaultChecked />
                      <FieldLabel htmlFor="nova-f1">Policies</FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <Checkbox id="nova-f2" />
                      <FieldLabel htmlFor="nova-f2">Older than 60 days</FieldLabel>
                    </Field>
                  </div>
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline">
                      Actions
                      <RiMoreLine data-icon="inline-end" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>EV-0412</DropdownMenuLabel>
                    <DropdownMenuItem>
                      Assign reviewer
                      <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Download
                      <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked>Pinned to package</DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <RiDeleteBinLine />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon" aria-label="About this control">
                      <RiInformationLine />
                    </Button>
                  }
                />
                <TooltipContent>
                  AC-2(3): Disable accounts after 90 days of inactivity.
                </TooltipContent>
              </Tooltip>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <Accordion defaultValue={["scope"]}>
              <AccordionItem value="scope">
                <AccordionTrigger>Scope</AccordionTrigger>
                <AccordionContent>
                  Northwind payroll, production boundary, including the jump host.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="method">
                <AccordionTrigger>Assessment method</AccordionTrigger>
                <AccordionContent>Examine, interview, test.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </NovaSection>

          <NovaSection title="Data">
            <Card>
              <CardHeader>
                <CardTitle>Open findings</CardTitle>
                <CardDescription>Across 5 controls</CardDescription>
                <CardAction>
                  <Badge variant="secondary">7</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead className="text-right">Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evidence.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.id}</TableCell>
                        <TableCell>{e.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.kind}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{e.age}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="ghost">Export</Button>
                <Button>
                  Review
                  <RiArrowRightLine data-icon="inline-end" />
                </Button>
              </CardFooter>
            </Card>
            <Item variant="outline">
              <ItemMedia variant="icon">
                <RiShieldCheckLine />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>AC-2 Account management</ItemTitle>
                <ItemDescription>Satisfied · last assessed 3 days ago</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm">
                  Open
                </Button>
              </ItemActions>
            </Item>
            <Separator />
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiSearchLine />
                </EmptyMedia>
                <EmptyTitle>No evidence yet</EmptyTitle>
                <EmptyDescription>Attach a policy, export, or log to get started.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button>
                  <RiAddLine data-icon="inline-start" />
                  Add evidence
                </Button>
              </EmptyContent>
            </Empty>
          </NovaSection>

          <NovaSection title="Calendar">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-lg border"
            />
          </NovaSection>
        </div>
      </TooltipProvider>
    </div>
  );
}

/** The preset in light mode, inside its own token scope. */
export const Light: Story = { render: () => <NovaSheet /> };

/** Same sheet with `dark` on body, which is what the preset's dark tokens key on. */
export const Dark: Story = { render: () => <NovaSheet dark /> };
