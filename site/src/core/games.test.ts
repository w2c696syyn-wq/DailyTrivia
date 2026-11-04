import { describe, expect, it } from "vitest";
import { type Game, gameHref, otherGames } from "./games";

const base: Game = {
  id: "trending",
  name: "Trending",
  pitch: "",
  accent: "#000",
  accentColourBlind: "#000",
  live: true,
  domain: null,
};

describe("gameHref", () => {
  it("uses the page path until the game has a domain", () => {
    expect(gameHref(base)).toBe("/trending/");
  });

  it("uses the game's own domain once set", () => {
    expect(gameHref({ ...base, domain: "trending.example" })).toBe("https://trending.example/");
  });
});

describe("otherGames", () => {
  it("lists the live games other than this one", () => {
    expect(otherGames("ingredient-x").map((g) => g.id)).toEqual(["trending"]);
    expect(otherGames("trending").map((g) => g.id)).toEqual(["ingredient-x"]);
  });
});
