import { describe, expect, it } from "vitest";
import { createShuffle } from "./crypto-shuffle";

describe("createShuffle", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("returns a permutation without mutating the input", () => {
    const copy = [...input];

    const result = createShuffle()(input);

    expect(input).toEqual(copy);
    expect([...result].sort((a, b) => a - b)).toEqual(copy);
  });

  it("handles empty and single-item lists", () => {
    expect(createShuffle()([])).toEqual([]);
    expect(createShuffle()(["a"])).toEqual(["a"]);
  });

  it("is deterministic given a deterministic random source", () => {
    const zero = createShuffle(() => 0);

    expect(zero([1, 2, 3])).toEqual(zero([1, 2, 3]));
    expect(zero([1, 2, 3])).toEqual([2, 3, 1]);
  });

  it("actually reorders (statistically)", () => {
    const shuffles = Array.from({ length: 20 }, () => createShuffle()(input).join(","));

    expect(new Set(shuffles).size).toBeGreaterThan(1);
  });
});
