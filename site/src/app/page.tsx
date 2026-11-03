import Link from "next/link";
import { GAMES } from "@/core/games";
import styles from "./page.module.css";

// Seen only on the shared dev host: in production each game's own domain
// is mapped by the Worker straight to that game's page.
export default function Home() {
  return (
    <main className={`column ${styles.main}`}>
      <h1>Daily puzzles</h1>
      <ul className={styles.list}>
        {GAMES.filter((g) => g.live).map((g) => (
          <li key={g.id} style={{ "--accent": g.accent } as React.CSSProperties}>
            <Link href={`/${g.id}/`} className={styles.card}>
              <h2>{g.name}</h2>
              <p>{g.pitch}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
