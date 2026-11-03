// Ingredient X rules as pure functions: the page renders them, and the Worker
// can replay a player's guesses to check a result before counting it.

export type IngredientXPuzzle = {
  game: "ingredient-x";
  number: number;
  date: string;
  answerId: string;
  category: string;
  lines: string[]; // reveal order: smallest ingredient first
  fact: string;
  labelChecked: string;
};

export type IngredientXState = {
  revealed: number; // label lines showing
  guesses: (string | null)[]; // answer ids; null = skipped
  status: "playing" | "won" | "lost";
};

export type IngredientXMove = { guess: string } | { skip: true };

/** The category hint appears once this many lines have been revealed and missed. */
export const CATEGORY_AFTER = 4;

export const start = (): IngredientXState => ({ revealed: 1, guesses: [], status: "playing" });

export function play(puzzle: IngredientXPuzzle, state: IngredientXState, move: IngredientXMove): IngredientXState {
  if (state.status !== "playing") return state;
  const guess = "guess" in move ? move.guess : null;
  const guesses = [...state.guesses, guess];
  if (guess === puzzle.answerId) return { ...state, guesses, status: "won" };
  if (state.revealed >= puzzle.lines.length) return { ...state, guesses, status: "lost" };
  return { ...state, guesses, revealed: state.revealed + 1 };
}

export const showsCategory = (state: IngredientXState) =>
  state.status !== "playing" || state.revealed > CATEGORY_AFTER;

/** The line the puzzle was solved on, or null if it wasn't. */
export const solvedOn = (state: IngredientXState) => (state.status === "won" ? state.revealed : null);
