/** A message read as a sentence: a server's words may arrive without their full stop. */
export function sentence(text: string) {
  const trimmed = text.trim();
  return !trimmed || /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** What a failed request said, as a sentence, or `fallback` when it said nothing readable. */
export function causeText(cause: unknown, fallback = "The request failed.") {
  return cause instanceof Error && cause.message.trim() ? sentence(cause.message) : fallback;
}
