// Where today's puzzle comes from. In production the Worker answers
// /api/puzzle/<game>/ with the puzzle for the current UK date only, so
// future answers are never on the public site. In `next dev` there is no
// Worker, so a small built-in sample stands in.

import type { Answer } from "./answers";
import type { GameId } from "./games";

export async function loadToday<P>(game: GameId): Promise<{ puzzle: P; answers: Answer[] }> {
  if (process.env.NODE_ENV === "development") {
    const { devPuzzle } = await import("@/dev/fixtures");
    return devPuzzle(game) as { puzzle: P; answers: Answer[] };
  }
  const [puzzle, answers] = await Promise.all([
    fetch(`/api/puzzle/${game}/`).then((r) => {
      if (!r.ok) throw new Error(`No puzzle today (${r.status})`);
      return r.json() as Promise<P>;
    }),
    fetch(`/answers/${game}.json`).then((r) => (r.ok ? (r.json() as Promise<Answer[]>) : [])),
  ]);
  return { puzzle, answers };
}
