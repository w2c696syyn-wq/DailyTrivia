"use client";

// After a game: a link to another game, saying whether today's is already done.
// Only rendered on result screens, which exist in the browser alone.

import { useState } from "react";
import { type GameId, gameHref, otherGames } from "@/core/games";
import type { History } from "@/core/stats";
import { load } from "@/core/storage";
import { ukDate } from "@/core/ukDate";
import styles from "./NextGame.module.css";

export function NextGame({ current }: { current: GameId }) {
  const [games] = useState(() => {
    const today = ukDate(new Date());
    return otherGames(current).map((g) => ({ game: g, done: Boolean(load<History>(`${g.id}:history`)?.[today]) }));
  });
  if (games.length === 0) return null;

  // Point at a game not yet played today if there is one.
  const { game, done } = games.find((g) => !g.done) ?? games[0];
  return (
    <a
      className={styles.card}
      href={gameHref(game)}
      style={{ "--next-accent": game.accent } as React.CSSProperties}
    >
      <span className={styles.kicker}>{done ? "Done today ✓" : "Up next"}</span>
      <span className={styles.name}>{done ? `See today's ${game.name} result →` : `Play today's ${game.name} →`}</span>
      <span className={styles.pitch}>{game.pitch}</span>
    </a>
  );
}
