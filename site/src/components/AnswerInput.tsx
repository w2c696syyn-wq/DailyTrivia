"use client";

// Type-ahead guess box (an ARIA combobox). Picking from the list submits that
// answer; typing and pressing Enter goes through "Did you mean?" so a typo
// never costs a guess.

import { useId, useMemo, useState } from "react";
import { type Answer, didYouMean, searchAnswers } from "@/core/answers";
import styles from "./AnswerInput.module.css";

type Props = {
  answers: Answer[];
  onGuess: (answer: Answer) => void;
  placeholder?: string;
};

export function AnswerInput({ answers, onGuess, placeholder = "Type a product…" }: Props) {
  const id = useId();
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const [suggestion, setSuggestion] = useState<Answer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const options = useMemo(() => searchAnswers(text, answers, 6), [text, answers]);
  const open = options.length > 0 && !suggestion;

  function submit(answer: Answer) {
    onGuess(answer);
    setText("");
    setSuggestion(null);
    setNotFound(false);
    setActive(0);
  }

  function onEnter() {
    if (open && options[active]) return submit(options[active]);
    const match = didYouMean(text, answers);
    if (!match) return setNotFound(text.trim().length > 0);
    if (match.exact) return submit(match.answer);
    setSuggestion(match.answer);
  }

  return (
    <div className={styles.wrap}>
      <input
        className={styles.input}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        aria-autocomplete="list"
        aria-label="Your guess"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
          setSuggestion(null);
          setNotFound(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, options.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          else if (e.key === "Escape") setText("");
          else if (e.key === "Enter") onEnter();
          else return;
          e.preventDefault();
        }}
      />
      {open && (
        <ul id={`${id}-list`} role="listbox" className={styles.list}>
          {options.map((a, i) => (
            <li
              key={a.id}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              className={styles.option}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => submit(a)}
            >
              {a.name}
            </li>
          ))}
        </ul>
      )}
      {suggestion && (
        <p className={styles.note} role="status">
          Did you mean <strong>{suggestion.name}</strong>?{" "}
          <button className={styles.link} onClick={() => submit(suggestion)}>
            Yes, guess it
          </button>{" "}
          <button className={styles.link} onClick={() => setSuggestion(null)}>
            No
          </button>
        </p>
      )}
      {notFound && (
        <p className={styles.note} role="status">
          That isn&apos;t on the list. Pick an answer from the suggestions.
        </p>
      )}
    </div>
  );
}
