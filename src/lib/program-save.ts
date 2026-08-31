/**
 * Mock persistence for inline property edits. Mirrors the shape of a real
 * mutation so the UI can be optimistic: a promise that resolves on success and
 * rejects with a human message on failure.
 */

export type FieldSave = {
  programId: string;
  field: string;
  value: string;
};

export function saveProgramField({ field, value }: FieldSave): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (value.trim().length === 0) reject(new Error(`${field} cannot be empty`));
      else resolve(value.trim());
    }, 420);
  });
}
