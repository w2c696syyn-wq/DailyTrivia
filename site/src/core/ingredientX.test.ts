import { describe, expect, it } from "vitest";
import { CATEGORY_AFTER, type IngredientXPuzzle, play, showsCategory, start } from "./ingredientX";

const PUZZLE: IngredientXPuzzle = {
  game: "ingredient-x",
  number: 12,
  date: "2027-03-12",
  answerId: "nutella",
  category: "spread",
  lines: ["vanillin", "lecithins", "cocoa", "milk powder", "hazelnuts", "palm oil", "sugar"],
  fact: "Launched in 1964.",
  labelChecked: "2026",
};

describe("Ingredient X play", () => {
  it("starts with one line showing", () => {
    expect(start()).toEqual({ revealed: 1, guesses: [], status: "playing" });
  });

  it("a right first guess solves on line 1", () => {
    const s = play(PUZZLE, start(), { guess: "nutella" });
    expect(s).toEqual({ revealed: 1, guesses: ["nutella"], status: "won" });
  });

  it("a wrong guess or a skip reveals the next line", () => {
    let s = play(PUZZLE, start(), { guess: "marmite" });
    s = play(PUZZLE, s, { skip: true });
    expect(s).toEqual({ revealed: 3, guesses: ["marmite", null], status: "playing" });
    s = play(PUZZLE, s, { guess: "nutella" });
    expect(s.status).toBe("won");
    expect(s.revealed).toBe(3);
  });

  it("is lost after a miss on the last line", () => {
    let s = start();
    for (let i = 0; i < PUZZLE.lines.length; i++) s = play(PUZZLE, s, { skip: true });
    expect(s.status).toBe("lost");
    expect(s.revealed).toBe(PUZZLE.lines.length);
  });

  it("ignores moves once finished", () => {
    const won = play(PUZZLE, start(), { guess: "nutella" });
    expect(play(PUZZLE, won, { guess: "marmite" })).toBe(won);
  });

  it("shows the category only after line 4", () => {
    expect(CATEGORY_AFTER).toBe(4);
    expect(showsCategory({ revealed: 4, guesses: [], status: "playing" })).toBe(false);
    expect(showsCategory({ revealed: 5, guesses: [], status: "playing" })).toBe(true);
    expect(showsCategory({ revealed: 1, guesses: ["x"], status: "lost" })).toBe(true);
  });
});
