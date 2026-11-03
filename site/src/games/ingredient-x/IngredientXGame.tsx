"use client";

import { useEffect, useState } from "react";
import { AnswerInput } from "@/components/AnswerInput";
import { Countdown } from "@/components/Countdown";
import { ShareButtons } from "@/components/ShareButtons";
import type { Answer } from "@/core/answers";
import {
  type IngredientXMove,
  type IngredientXPuzzle,
  type IngredientXState,
  play,
  showsCategory,
  solvedOn,
  start,
} from "@/core/ingredientX";
import { loadToday } from "@/core/puzzleSource";
import { ingredientXShare, ingredientXTier } from "@/core/scoring";
import { load, save } from "@/core/storage";
import styles from "./IngredientX.module.css";

type Loaded = { puzzle: IngredientXPuzzle; answers: Answer[] };

const progressKey = (p: IngredientXPuzzle) => `ix:progress:${p.date}`;

export function IngredientXGame() {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<IngredientXState>(start);

  useEffect(() => {
    loadToday<IngredientXPuzzle>("ingredient-x")
      .then((d) => {
        setData(d);
        setState(load<IngredientXState>(progressKey(d.puzzle)) ?? start());
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className={styles.message}>Today&apos;s label isn&apos;t ready. {error}</p>;
  if (!data) return <p className={styles.message}>Fetching today&apos;s label…</p>;

  const { puzzle, answers } = data;
  const nameOf = (id: string | null) => (id === null ? "Skipped" : (answers.find((a) => a.id === id)?.name ?? id));

  function move(m: IngredientXMove) {
    const next = play(puzzle, state, m);
    setState(next);
    save(progressKey(puzzle), next);
  }

  const finished = state.status !== "playing";
  const shown = finished ? puzzle.lines.length : state.revealed;

  return (
    <div className={styles.game}>
      <section className={styles.label} aria-label="Ingredients label">
        <h2 className={styles.labelTitle}>Ingredients</h2>
        {finished ? (
          <FullLabel puzzle={puzzle} giveaway={solvedOn(state)} />
        ) : (
          <ol className={styles.lines}>
            {puzzle.lines.map((line, i) => (
              <li key={i} className={i < shown ? styles.line : styles.hidden} aria-hidden={i >= shown}>
                {i < shown ? line : "▒▒▒▒▒▒▒▒"}
              </li>
            ))}
          </ol>
        )}
        {showsCategory(state) && (
          <p className={styles.category}>
            Category: <strong>{puzzle.category}</strong>
          </p>
        )}
      </section>

      {state.guesses.length > 0 && (
        <ol className={styles.guesses} aria-label="Your guesses">
          {state.guesses.map((g, i) => (
            <li key={i} className={g === puzzle.answerId ? styles.right : styles.wrong}>
              <span aria-hidden>{g === puzzle.answerId ? "✓" : "✗"}</span> {nameOf(g)}
            </li>
          ))}
        </ol>
      )}

      {finished ? (
        <Result puzzle={puzzle} state={state} answerName={nameOf(puzzle.answerId)} />
      ) : (
        <div className={styles.controls}>
          <AnswerInput answers={answers} onGuess={(a) => move({ guess: a.id })} />
          <button className={styles.skip} onClick={() => move({ skip: true })}>
            Skip – show the next line
          </button>
        </div>
      )}
    </div>
  );
}

// The label as printed: biggest ingredient first, the giveaway line marked.
function FullLabel({ puzzle, giveaway }: { puzzle: IngredientXPuzzle; giveaway: number | null }) {
  const printed = puzzle.lines.map((line, i) => ({ line, revealedAt: i + 1 })).reverse();
  return (
    <p className={styles.printed}>
      {printed.map(({ line, revealedAt }, i) => (
        <span key={i}>
          {revealedAt === giveaway ? <mark className={styles.giveaway}>{line}</mark> : line}
          {i < printed.length - 1 ? ", " : "."}
        </span>
      ))}
    </p>
  );
}

function Result({ puzzle, state, answerName }: { puzzle: IngredientXPuzzle; state: IngredientXState; answerName: string }) {
  const line = solvedOn(state);
  return (
    <section className={styles.result} aria-live="polite">
      <p className={styles.tier}>{ingredientXTier(line)}</p>
      <h2 className={styles.answer}>{answerName}</h2>
      <p>{line ? `Solved on line ${line} of ${puzzle.lines.length}.` : "Not this time."}</p>
      <p className={styles.fact}>{puzzle.fact}</p>
      <p className={styles.small}>UK label, checked {puzzle.labelChecked}.</p>
      <ShareButtons text={ingredientXShare(puzzle.number, line, puzzle.lines.length)} />
      <Countdown />
    </section>
  );
}
