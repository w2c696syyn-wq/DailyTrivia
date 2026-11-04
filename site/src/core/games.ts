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
  /** The game's own domain once bought, e.g. "ingredientx.co.uk". The Worker maps it to this game. */
  domain: string | null;
};

export const GAMES: Game[] = [
  {
    id: "ingredient-x",
    name: "Ingredient X",
    pitch: "Name the product from its ingredients label, smallest ingredient first.",
    accent: "#c8372d",
    accentColourBlind: "#d55e00",
    live: true,
    domain: null,
  },
  {
    id: "trending",
    name: "Trending",
    pitch: "Guess the week from what everyone was reading on Wikipedia.",
    accent: "#1f5fd1",
    accentColourBlind: "#0072b2",
    live: true,
    domain: null,
  },
];

export const gameById = (id: GameId) => GAMES.find((g) => g.id === id)!;

/** Where to send a player for a game: its own domain once it has one, else its page on this site. */
export const gameHref = (g: Game) => (g.domain ? `https://${g.domain}/` : `/${g.id}/`);

/** The other live games, for cross-links. */
export const otherGames = (id: GameId) => GAMES.filter((g) => g.id !== id && g.live);
