import { describe, expect, it } from "vitest";
import { type History, INGREDIENT_X_STATS, TRENDING_STATS, computeStats, record } from "./stats";

const ix = (entries: [string, number | null][]): History =>
  Object.fromEntries(entries.map(([date, score], i) => [date, { date, number: i + 1, score }]));

describe("record", () => {
  it("adds a finished game once and never overwrites it", () => {
    let h: History = {};
    h = record(h, { date: "2027-03-01", number: 1, score: 3 });
    h = record(h, { date: "2027-03-01", number: 1, score: 1 });
    expect(h["2027-03-01"].score).toBe(3);
  });
});

describe("Ingredient X stats", () => {
  const history = ix([
    ["2027-03-01", 2],
    ["2027-03-02", 5],
    ["2027-03-03", null],
    ["2027-03-04", 1],
    ["2027-03-05", 4],
    ["2027-03-06", 8],
  ]);

  it("counts played, wins and the average and best line", () => {
    const s = computeStats(history, "2027-03-06", INGREDIENT_X_STATS);
    expect(s.played).toBe(6);
    expect(s.wins).toBe(5);
    expect(s.winRate).toBe(83);
    expect(s.average).toBe(4);
    expect(s.best).toBe(1);
  });

  it("streaks count solved days in a row; a miss breaks them", () => {
    const s = computeStats(history, "2027-03-06", INGREDIENT_X_STATS);
    expect(s.currentStreak).toBe(3);
    expect(s.bestStreak).toBe(3);
  });

  it("a streak survives until today's puzzle is played", () => {
    expect(computeStats(history, "2027-03-07", INGREDIENT_X_STATS).currentStreak).toBe(3);
    expect(computeStats(history, "2027-03-08", INGREDIENT_X_STATS).currentStreak).toBe(0);
  });

  it("a skipped day breaks the streak", () => {
    const gap = ix([["2027-03-01", 1], ["2027-03-02", 1], ["2027-03-04", 1]]);
    const s = computeStats(gap, "2027-03-04", INGREDIENT_X_STATS);
    expect(s.currentStreak).toBe(1);
    expect(s.bestStreak).toBe(2);
  });

  it("buckets results by line, misses last", () => {
    const s = computeStats(history, "2027-03-06", INGREDIENT_X_STATS);
    expect(s.distribution).toEqual([
      { label: "1", count: 1 }, { label: "2", count: 1 }, { label: "3", count: 0 }, { label: "4", count: 1 },
      { label: "5", count: 1 }, { label: "6", count: 0 }, { label: "7", count: 0 }, { label: "8", count: 1 },
      { label: "X", count: 1 },
    ]);
  });

  it("is empty but valid before the first game", () => {
    const s = computeStats({}, "2027-03-01", INGREDIENT_X_STATS);
    expect(s).toMatchObject({ played: 0, wins: 0, winRate: 0, average: null, best: null, currentStreak: 0, bestStreak: 0 });
  });
});

describe("Trending stats", () => {
  const history: History = Object.fromEntries(
    [["2027-03-01", 95], ["2027-03-02", 40], ["2027-03-03", 76], ["2027-03-04", 10]].map(([d, s], i) => [
      d,
      { date: d as string, number: i + 1, score: s as number },
    ]),
  );

  it("every finished game keeps the streak going", () => {
    const s = computeStats(history, "2027-03-04", TRENDING_STATS);
    expect(s.currentStreak).toBe(4);
    expect(s.wins).toBe(4);
  });

  it("averages and bests are points, higher is better", () => {
    const s = computeStats(history, "2027-03-04", TRENDING_STATS);
    expect(s.average).toBe(55);
    expect(s.best).toBe(95);
  });

  it("buckets by tier, best first", () => {
    const s = computeStats(history, "2027-03-04", TRENDING_STATS);
    expect(s.distribution.map((d) => d.count)).toEqual([1, 1, 0, 1, 1]);
    expect(s.distribution[0].label).toBe("Time Traveller");
  });
});
