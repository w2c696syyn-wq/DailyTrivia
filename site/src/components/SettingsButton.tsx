"use client";

import { useRef } from "react";
import type { Settings } from "@/core/settings";
import styles from "./SettingsButton.module.css";
import { useSettings } from "./useSettings";

const OPTIONS: { key: keyof Settings; label: string; detail: string }[] = [
  { key: "colourBlind", label: "Colour-blind mode", detail: "Orange and blue instead of red and green." },
  { key: "reduceMotion", label: "Reduce motion", detail: "No sliding or flipping. Also saves battery." },
  { key: "sound", label: "Sound", detail: "Short tones for right and wrong answers." },
  { key: "shareLink", label: "Add link when sharing", detail: "Puts this game's web address under your result." },
];

export function SettingsButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [settings, update] = useSettings();

  return (
    <>
      <button className={styles.open} onClick={() => dialog.current?.showModal()} aria-label="Settings">
        <span aria-hidden>⚙</span>
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="settings-title">
        <h2 id="settings-title" className={styles.title}>
          Settings
        </h2>
        <ul className={styles.list}>
          {OPTIONS.map((o) => (
            <li key={o.key}>
              <label className={styles.option}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={settings[o.key]}
                  onChange={(e) => update({ [o.key]: e.target.checked })}
                />
                <span>
                  <strong>{o.label}</strong>
                  <span className={styles.detail}>{o.detail}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className={styles.note}>Settings are saved on this device only.</p>
        <form method="dialog">
          <button className={styles.done}>Done</button>
        </form>
      </dialog>
    </>
  );
}
