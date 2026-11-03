import { describe, expect, it } from "vitest";
import shared from "../../../shared/normalise-cases.json";
import { type Answer, didYouMean, editDistance, normalise, searchAnswers } from "./answers";

const ANSWERS: Answer[] = [
  { id: "nutella", name: "Nutella", aliases: ["nutella", "nutella hazelnut spread"] },
  { id: "jaffa-cakes", name: "McVitie's Jaffa Cakes", aliases: ["mcvities jaffa cakes", "jaffa cakes"] },
  { id: "hula-hoops", name: "Hula Hoops Original", aliases: ["hula hoops original", "hula hoops"] },
  { id: "walkers-ready-salted", name: "Walkers Ready Salted", aliases: ["walkers ready salted"] },
  { id: "walkers-salt-vinegar", name: "Walkers Salt & Vinegar", aliases: ["walkers salt and vinegar"] },
  { id: "marmite", name: "Marmite", aliases: ["marmite"] },
];

describe("normalise (shared cases)", () => {
  it.each(shared.cases)("'$in' → '$out'", (c) => {
    expect(normalise(c.in)).toBe(c.out);
  });
});

describe("editDistance", () => {
  it("counts a swapped pair as one edit", () => {
    expect(editDistance("nutlela", "nutella")).toBe(1);
    expect(editDistance("marmte", "marmite")).toBe(1);
    expect(editDistance("abc", "abc")).toBe(0);
    expect(editDistance("", "abc")).toBe(3);
  });
});

describe("searchAnswers", () => {
  it("puts start-of-name matches first", () => {
    expect(searchAnswers("wal", ANSWERS).map((a) => a.id)).toEqual(["walkers-ready-salted", "walkers-salt-vinegar"]);
  });

  it("matches a later word and an alias", () => {
    expect(searchAnswers("jaffa", ANSWERS).map((a) => a.id)).toEqual(["jaffa-cakes"]);
    expect(searchAnswers("vinegar", ANSWERS).map((a) => a.id)).toEqual(["walkers-salt-vinegar"]);
  });

  it("forgives a typo once the query is long enough", () => {
    expect(searchAnswers("nutela", ANSWERS).map((a) => a.id)).toEqual(["nutella"]);
    expect(searchAnswers("hu", ANSWERS).map((a) => a.id)).toEqual(["hula-hoops"]);
  });

  it("lists each answer once and respects the limit", () => {
    expect(searchAnswers("hula", ANSWERS)).toHaveLength(1);
    expect(searchAnswers("a", ANSWERS, 2)).toHaveLength(2);
  });

  it("returns nothing for an empty query", () => {
    expect(searchAnswers("  ", ANSWERS)).toEqual([]);
  });
});

describe("didYouMean", () => {
  it("accepts an alias exactly, in any case", () => {
    expect(didYouMean("JAFFA CAKES", ANSWERS)).toEqual({ answer: ANSWERS[1], exact: true });
  });

  it("suggests the closest answer for a small typo", () => {
    expect(didYouMean("Marmte", ANSWERS)).toEqual({ answer: ANSWERS[5], exact: false });
    expect(didYouMean("walkers salt and viengar", ANSWERS)).toEqual({ answer: ANSWERS[4], exact: false });
  });

  it("gives up when nothing is close", () => {
    expect(didYouMean("Pringles", ANSWERS)).toBeNull();
    expect(didYouMean("mar", ANSWERS)).toBeNull();
  });
});
