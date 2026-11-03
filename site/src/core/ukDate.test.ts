import { describe, expect, it } from "vitest";
import cases from "../../../shared/ukdate-cases.json";
import { addDays, msUntilNextPuzzle, puzzleNumber, ukDate, ukMidnight } from "./ukDate";

const MIN = 60_000;

describe("ukDate (shared cases)", () => {
  it.each(cases.ukDate)("$utc is $uk ($why)", ({ utc, uk }) => {
    expect(ukDate(new Date(utc))).toBe(uk);
  });
});

describe("puzzleNumber (shared cases)", () => {
  it.each(cases.puzzleNumber)("$day after $launch is #$n", ({ launch, day, n }) => {
    expect(puzzleNumber(day, launch)).toBe(n);
  });

  it("rejects days before launch", () => {
    expect(() => puzzleNumber("2027-02-28", "2027-03-01")).toThrow(RangeError);
  });
});

describe("addDays", () => {
  it("crosses months, years and clock changes", () => {
    expect(addDays("2027-03-27", 1)).toBe("2027-03-28");
    expect(addDays("2027-12-31", 1)).toBe("2028-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("ukMidnight", () => {
  it("is 00:00 UTC in winter and 23:00 UTC the day before in summer", () => {
    expect(ukMidnight("2027-01-15").toISOString()).toBe("2027-01-15T00:00:00.000Z");
    expect(ukMidnight("2027-07-01").toISOString()).toBe("2027-06-30T23:00:00.000Z");
  });

  it("handles both clock-change days", () => {
    expect(ukMidnight("2027-03-28").toISOString()).toBe("2027-03-28T00:00:00.000Z");
    expect(ukMidnight("2027-10-31").toISOString()).toBe("2027-10-30T23:00:00.000Z");
  });
});

describe("msUntilNextPuzzle", () => {
  it("counts to UK midnight, not UTC midnight", () => {
    expect(msUntilNextPuzzle(new Date("2027-06-30T22:30:00Z"))).toBe(30 * MIN);
    expect(msUntilNextPuzzle(new Date("2027-01-14T23:30:00Z"))).toBe(30 * MIN);
  });

  it("knows the 23- and 25-hour days", () => {
    // 00:30 GMT on 28 Mar: the day loses an hour, so 22.5 hours remain.
    expect(msUntilNextPuzzle(new Date("2027-03-28T00:30:00Z"))).toBe(22.5 * 60 * MIN);
    // 00:30 BST on 31 Oct: the day gains an hour, so 24.5 hours remain.
    expect(msUntilNextPuzzle(new Date("2027-10-30T23:30:00Z"))).toBe(24.5 * 60 * MIN);
  });
});
