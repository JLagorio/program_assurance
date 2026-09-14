export function downloadLibraryRecords(name: string, records: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function canAuthorLibrary(role: string) {
  return ["owner", "admin", "editor"].includes(role);
}
