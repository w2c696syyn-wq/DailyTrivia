// The frame every game sits in: header, how to play, the game, and the
// shared footer with the other games and credits.

import Link from "next/link";
import { GAMES, type GameId, gameById } from "@/core/games";
import styles from "./GameFrame.module.css";
import { SettingsButton } from "./SettingsButton";

type Props = { game: GameId; howToPlay: string[]; children: React.ReactNode };

export function GameFrame({ game, howToPlay, children }: Props) {
  const g = gameById(game);
  const others = GAMES.filter((o) => o.id !== game && o.live);
  return (
    <div
      className={styles.page}
      style={{ "--game-accent": g.accent, "--game-accent-cb": g.accentColourBlind } as React.CSSProperties}
    >
      <header className={`column ${styles.header}`}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{g.name}</h1>
          <SettingsButton />
        </div>
        <details className={styles.how}>
          <summary>How to play</summary>
          <ul>
            {howToPlay.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      </header>
      <main className="column">{children}</main>
      <footer className={`column ${styles.footer}`}>
        {others.length > 0 && (
          <p>
            Our other games:{" "}
            {others.map((o, i) => (
              <span key={o.id}>
                {i > 0 && " · "}
                <Link href={`/${o.id}/`}>{o.name}</Link>
              </span>
            ))}
          </p>
        )}
        <p>
          <Link href="/credits/">Credits and data sources</Link>
        </p>
      </footer>
    </div>
  );
}
