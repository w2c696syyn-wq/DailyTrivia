// The games and how each one looks. Names are working titles until chosen.

export type GameId = "ingredient-x" | "trending";

export type Game = {
  id: GameId;
  name: string;
  pitch: string;
  accent: string;
  /** Used instead of accent in colour-blind mode (Okabe-Ito palette). */
  accentColourBlind: string;
  live: boolean;
};

export const GAMES: Game[] = [
  {
    id: "ingredient-x",
    name: "Ingredient X",
    pitch: "Name the product from its ingredients label, smallest ingredient first.",
    accent: "#c8372d",
    accentColourBlind: "#d55e00",
    live: true,
  },
  {
    id: "trending",
    name: "Trending",
    pitch: "Guess the week from what everyone was reading on Wikipedia.",
    accent: "#1f5fd1",
    accentColourBlind: "#0072b2",
    live: true,
  },
];

export const gameById = (id: GameId) => GAMES.find((g) => g.id === id)!;
