// Shared layout for the privacy notice and terms.

import Link from "next/link";
import { LEGAL_UPDATED, OWNER } from "@/core/site";
import styles from "./LegalPage.module.css";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className={`column ${styles.page}`}>
      <p className={styles.back}>
        <Link href="/">← Back to the games</Link>
      </p>
      <h1>{title}</h1>
      <p className={styles.updated}>Last updated {LEGAL_UPDATED}</p>
      {children}
    </main>
  );
}

/** An owner detail, or a visible marker while it is still missing. */
export function Owner({ field }: { field: keyof typeof OWNER }) {
  const value = OWNER[field];
  if (value) return field === "email" ? <a href={`mailto:${value}`}>{value}</a> : <>{value}</>;
  return <mark className={styles.missing}>[{field} to be added before launch]</mark>;
}
