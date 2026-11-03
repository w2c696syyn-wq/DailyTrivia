"use client";

// Separate Copy and Share: Share opens the phone's share sheet where there is one.

import { useState } from "react";
import styles from "./ShareButtons.module.css";

export function ShareButtons({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.row}>
      <button className={styles.primary} onClick={copy}>
        {copied ? "Copied" : "Copy result"}
      </button>
      {canShare && (
        <button className={styles.secondary} onClick={() => navigator.share({ text }).catch(() => {})}>
          Share
        </button>
      )}
    </div>
  );
}
