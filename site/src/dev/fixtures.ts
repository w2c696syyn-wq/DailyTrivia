// Sample puzzles for `next dev` only. Real puzzles come from the pipeline via the Worker.

import type { Answer } from "@/core/answers";
import type { GameId } from "@/core/games";
import type { IngredientXPuzzle } from "@/core/ingredientX";
import type { TrendingPuzzle } from "@/core/trending";

const INGREDIENT_X_ANSWERS: Answer[] = [
  { id: "nutella", name: "Nutella", aliases: ["nutella", "nutella hazelnut spread"] },
  { id: "jaffa-cakes", name: "McVitie's Jaffa Cakes", aliases: ["mcvities jaffa cakes", "jaffa cakes"] },
  { id: "hula-hoops", name: "Hula Hoops Original", aliases: ["hula hoops original", "hula hoops"] },
  { id: "walkers-ready-salted", name: "Walkers Ready Salted", aliases: ["walkers ready salted"] },
  { id: "marmite", name: "Marmite", aliases: ["marmite", "marmite yeast extract"] },
  { id: "heinz-baked-beans", name: "Heinz Baked Beans", aliases: ["heinz baked beans", "baked beans"] },
  { id: "coca-cola", name: "Coca-Cola Original Taste", aliases: ["coca cola original taste", "coca cola", "coke"] },
  { id: "digestives", name: "McVitie's Digestives", aliases: ["mcvities digestives", "digestives"] },
];

const INGREDIENT_X: IngredientXPuzzle = {
  game: "ingredient-x",
  number: 1,
  date: "2027-03-01",
  answerId: "nutella",
  category: "Spread",
  lines: [
    "Vanillin",
    "Emulsifier: lecithins (soya)",
    "Fat-reduced cocoa",
    "Skimmed milk powder",
    "Hazelnuts",
    "Palm oil",
    "Sugar",
  ],
  fact: "Nutella first went on sale in Italy in 1964.",
  labelChecked: "2026",
};

// A real week (from the cached Wikimedia lists), hand-picked and annotated.
const TRENDING: TrendingPuzzle = {
  game: "trending",
  number: 1,
  date: "2027-03-01",
  week: "2019-07-15",
  articles: [
    { title: "Area_51", note: "A joke Facebook event to “storm Area 51” passed a million sign-ups." },
    { title: "Apollo_11", note: "The 50th anniversary of the Moon landing, 20 July." },
    { title: "Neil_Armstrong", note: "First man on the Moon, 50 years earlier." },
    { title: "Avengers:_Endgame", note: "Overtook Avatar as the highest-grossing film ever." },
    { title: "Stranger_Things", note: "Season 3 had landed on Netflix that month." },
    { title: "Spider-Man:_Far_From_Home", note: "In cinemas since the start of July." },
    { title: "Cats_(musical)", note: "The first trailer for the film version was released." },
    { title: "Buzz_Aldrin", note: "Second man on the Moon, also marking the anniversary." },
    { title: "Shane_Lowry_(golfer)", note: "Won The Open at Royal Portrush." },
    { title: "Novak_Djokovic", note: "Had just won Wimbledon in a record-long final." },
  ],
};

export function devPuzzle(game: GameId) {
  if (game === "ingredient-x") return { puzzle: INGREDIENT_X, answers: INGREDIENT_X_ANSWERS };
  if (game === "trending") return { puzzle: TRENDING, answers: [] };
  throw new Error(`No dev puzzle for ${game} yet`);
}
