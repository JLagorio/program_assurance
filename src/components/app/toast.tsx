import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

/** App toast outlet (sonner, styled to the DS). Render once near the app root; fire with toast("…"), toast.success("…"), toast.error("…"). @category overlay */
export function Toaster({ expand = false }: { expand?: boolean }) {
  return (
    <SonnerToaster
      expand={expand}
      position="bottom-right"
      gap={8}
      offset={16}
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          boxShadow: "var(--shadow-pop)",
          fontSize: "13px",
          fontFamily: "var(--font-sans)",
          padding: "10px 14px",
        },
      }}
    />
  );
}
