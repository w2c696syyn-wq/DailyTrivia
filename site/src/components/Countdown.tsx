"use client";

import { useEffect, useState } from "react";
import { msUntilNextPuzzle } from "@/core/ukDate";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown() {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMs(msUntilNextPuzzle(new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  if (ms === null) return null;
  const s = Math.floor(ms / 1000);
  return (
    <p>
      Next puzzle in{" "}
      <strong style={{ fontVariantNumeric: "tabular-nums" }}>
        {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
      </strong>
    </p>
  );
}
