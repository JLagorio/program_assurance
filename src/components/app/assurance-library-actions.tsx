import { toast } from "@ledger/design-system";
export function runLibraryAction(action: () => void, message?: string): boolean {
  try {
    action();
    if (message) toast.add({ title: message, type: "success" });
    return true;
  } catch (error) {
    toast.add({ title: error instanceof Error ? error.message : String(error), type: "error" });
    return false;
  }
}
export const options = (values: string[]) => values.map((value) => ({ value, label: value }));
