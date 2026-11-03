// The games and how each one looks. Names are working titles until chosen.

export type GameId = "ingredient-x" | "trending";

export type Game = {
  id: GameId;
  name: string;
  pitch: string;
  accent: string;
  live: boolean;
};

export const GAMES: Game[] = [
  {
    id: "ingredient-x",
    name: "Ingredient X",
    pitch: "Name the product from its ingredients label, smallest ingredient first.",
    accent: "#c8372d",
    live: true,
  },
  {
    id: "trending",
    name: "Trending",
    pitch: "Guess the week from what everyone was reading on Wikipedia.",
    accent: "#1f5fd1",
    live: true,
  },
];

export const gameById = (id: GameId) => GAMES.find((g) => g.id === id)!;
