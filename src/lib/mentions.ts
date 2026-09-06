/** Product mention serialization. Shared by the activity composer, rendering and store. */
export const mentionPattern = /@\[([^\]]+)\]/g;

/** The names mentioned in a body, in order, once each. A mention is written `@[Full Name]`. */
export function parseMentions(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(mentionPattern)) {
    const name = m[1]!.trim();
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}
