import { createFileRoute } from "@tanstack/react-router";
import { ComponentsRegister } from "@/components/prototype/components-register";
export const Route = createFileRoute("/library/components/")({
  head: () => ({ meta: [{ title: "Components — Program Assurance" }] }),
  component: ComponentsRegister,
});
