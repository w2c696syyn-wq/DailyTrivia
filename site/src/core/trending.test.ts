import { describe, expect, it } from "vitest";
import {
  FIRST_WEEK,
  MAX_REVEALS,
  START_SHOWN,
  type TrendingPuzzle,
  lastWeek,
  play,
  result,
  start,
  weekAt,
  weekCount,
} from "./trending";

const PUZZLE: TrendingPuzzle = {
  game: "trending",
  number: 9,
  date: "2027-03-09",
  week: "2019-07-15",
  articles: Array.from({ length: 10 }, (_, i) => ({ title: `Article_${i}`, note: `note ${i}` })),
};

describe("Trending timeline", () => {
  it("runs from the first Monday of 2016 to the last Monday of last year", () => {
    expect(FIRST_WEEK).toBe("2016-01-04");
    expect(lastWeek("2027-03-09")).toBe("2026-12-28");
    expect(lastWeek("2028-06-01")).toBe("2027-12-27");
  });

  it("indexes weeks by position on the timeline", () => {
    expect(weekAt(0)).toBe("2016-01-04");
    expect(weekAt(1)).toBe("2016-01-11");
    const n = weekCount("2027-03-09");
    expect(weekAt(n - 1)).toBe("2026-12-28");
  });
});

describe("Trending play", () => {
  it("starts with five articles and no reveals", () => {
    expect(start()).toEqual({ reveals: 0, guess: null, status: "playing" });
    expect(START_SHOWN).toBe(5);
  });

  it("reveals up to five more", () => {
    let s = start();
    for (let i = 0; i < 7; i++) s = play(PUZZLE, s, { reveal: true });
    expect(s.reveals).toBe(MAX_REVEALS);
  });

  it("one guess ends the game", () => {
    const s = play(PUZZLE, play(PUZZLE, start(), { reveal: true }), { guess: "2019-08-05" });
    expect(s).toEqual({ reveals: 1, guess: "2019-08-05", status: "done" });
    expect(play(PUZZLE, s, { guess: "2019-07-15" })).toBe(s);
    expect(result(PUZZLE, s)).toEqual({ weeksOff: 3, score: 90 });
  });

  it("has no result before a guess", () => {
    expect(result(PUZZLE, start())).toBeNull();
  });
});
