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
} from "../../src/components/app/ui";
export { Shell } from "../../src/components/app/shell";
export { PreviewRouter } from "./router-shim";
