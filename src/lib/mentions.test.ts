import { describe, expect, it } from "vitest";
import { parseMentions } from "./mentions";

describe("product activity mention serialization", () => {
  it("keeps first occurrence order and trims names without treating plain @ text as a mention", () => {
    expect(
      parseMentions(
        "Email @example; @[ Joel Barrantes ] then @[Priya Raghavan] and @[Joel Barrantes]",
      ),
    ).toEqual(["Joel Barrantes", "Priya Raghavan"]);
  });
  it("ignores empty and unclosed mentions and does not leak regex state between calls", () => {
    expect(parseMentions("@[] @[   ] @[unfinished")).toEqual([]);
    expect(parseMentions("@[Sam Rivera]")).toEqual(["Sam Rivera"]);
    expect(parseMentions("@[Sam Rivera]")).toEqual(["Sam Rivera"]);
  });
});
