import { registerPlatformStructure } from "@/lib/platform-structure";
import { registerPlatformControls } from "@/lib/platform-controls";
import { registerPlatformAssurance } from "@/lib/platform-assurance";

/** Register shipped records before restoring the user's edits to those same records. */
export function registerPlatformData(): void {
  registerPlatformStructure();
  registerPlatformControls();
  registerPlatformAssurance();
}
