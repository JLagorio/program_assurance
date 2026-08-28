// Design-sync bundle entry: the bespoke Program Assurance kit only.
// The shadcn files under src/components/ui are unused scaffolding and the
// app/* composites are data-bound screens - neither belongs in the DS bundle.
export {
  Button,
  IconButton,
  Badge,
  Dot,
  Card,
  Section,
  CardHeader,
  Table,
  Th,
  Td,
  Tr,
  Tabs,
  FilterChip,
  KeyValue,
  RailGroup,
  Mono,
  Meter,
  PageHeader,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
  EmptyState,
} from "../../src/components/app/ui";
export { Shell } from "../../src/components/app/shell";
export { Toaster, toast } from "../../src/components/app/toast";
export { PreviewRouter } from "./router-shim";

// Curated subset of the themed shadcn primitives the bespoke kit lacks
// (non-colliding names only; the rest of src/components/ui stays excluded).
export { Checkbox } from "../../src/components/ui/checkbox";
export { Switch } from "../../src/components/ui/switch";
export { RadioGroup, RadioGroupItem } from "../../src/components/ui/radio-group";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../../src/components/ui/tooltip";
export * from "../../src/components/ui/dropdown-menu";
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "../../src/components/ui/popover";
export { Skeleton } from "../../src/components/ui/skeleton";
export { Avatar, AvatarImage, AvatarFallback } from "../../src/components/ui/avatar";
export { Separator } from "../../src/components/ui/separator";

// Semi-reusable domain composites.
export {
  InheritChip,
  ConsumerTable,
  ProvidedControlsTable,
} from "../../src/components/app/inheritance";
