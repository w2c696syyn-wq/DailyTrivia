import { describe, expect, it } from "vitest";
import {
  ingredientXShare,
  ingredientXTier,
  trendingScore,
  trendingShare,
  trendingTier,
  weeksBetween,
} from "./scoring";

describe("Ingredient X", () => {
  it("names the tier from the line solved on", () => {
    expect(ingredientXTier(1)).toBe("Food Scientist");
    expect(ingredientXTier(2)).toBe("Food Scientist");
    expect(ingredientXTier(4)).toBe("Label Reader");
    expect(ingredientXTier(6)).toBe("Shopper");
    expect(ingredientXTier(8)).toBe("Snacker");
    expect(ingredientXTier(null)).toBe("Still Peckish");
  });

  it("shares misses then the solving line, with no spoilers", () => {
    expect(ingredientXShare(12, 4, 8)).toBe("🧾 Ingredient X #12  ⬛⬛⬛🟥 4/8");
    expect(ingredientXShare(12, 1, 8)).toBe("🧾 Ingredient X #12  🟥 1/8");
    expect(ingredientXShare(12, null, 6)).toBe("🧾 Ingredient X #12  ⬛⬛⬛⬛⬛⬛ X/6");
  });
});

describe("Trending", () => {
  it("counts whole weeks between two Mondays either way", () => {
    expect(weeksBetween("2019-07-15", "2019-08-05")).toBe(3);
    expect(weeksBetween("2019-08-05", "2019-07-15")).toBe(3);
    expect(weeksBetween("2019-07-15", "2019-07-15")).toBe(0);
  });

  it("loses 2 points a week off and 4 a reveal", () => {
    expect(trendingScore(0, 0)).toBe(100);
    expect(trendingScore(3, 2)).toBe(86);
    expect(trendingScore(0, 5)).toBe(80);
  });

  it("never goes below zero", () => {
    expect(trendingScore(60, 5)).toBe(0);
  });

  it("names the tier from the score", () => {
    expect(trendingTier(100)).toBe("Time Traveller");
    expect(trendingTier(90)).toBe("Time Traveller");
    expect(trendingTier(89)).toBe("Historian");
    expect(trendingTier(50)).toBe("Regular");
    expect(trendingTier(25)).toBe("Tourist");
    expect(trendingTier(24)).toBe("Living Under a Rock");
  });

  it("shares distance and reveals, never the year", () => {
    expect(trendingShare(9, 3, 2)).toBe("🔥 Trending #9  📍 3 weeks off · 2 reveals  86/100");
    expect(trendingShare(9, 1, 1)).toBe("🔥 Trending #9  📍 1 week off · 1 reveal  94/100");
    expect(trendingShare(9, 0, 0)).toBe("🔥 Trending #9  📍 Exact week! · 0 reveals  100/100");
  });
});
