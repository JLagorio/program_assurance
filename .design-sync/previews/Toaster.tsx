import { Toaster, toast } from "program-assurance";
import { useEffect } from "react";

export function Toasts() {
  useEffect(() => {
    toast.success("Evidence linked to AU-6", { duration: Infinity });
    toast.error("Package validation failed — 2 controls missing evidence", {
      duration: Infinity,
    });
    toast("Assessment scheduled for Mar 3", { duration: Infinity });
  }, []);
  return (
    <div style={{ minHeight: 330 }}>
      <Toaster expand />
    </div>
  );
}
