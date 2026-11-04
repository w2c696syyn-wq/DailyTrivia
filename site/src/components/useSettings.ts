"use client";

// Settings as a tiny store over local storage, so every component that reads
// them updates together, and other open tabs follow along.

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings, parseSettings, rootAttributes } from "@/core/settings";

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Settings } = { raw: null, value: DEFAULT_SETTINGS };

function readRaw(): string | null {
  try {
    return localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): Settings {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, value: parseSettings(raw) };
  return cache.value;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function applyToRoot(s: Settings) {
  const root = document.documentElement;
  root.removeAttribute("data-colour-blind");
  root.removeAttribute("data-reduce-motion");
  for (const [name, value] of Object.entries(rootAttributes(s))) root.setAttribute(name, value);
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SETTINGS);
  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...getSnapshot(), ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable: the change lasts for this visit only.
      cache = { raw: JSON.stringify(next), value: next };
    }
    applyToRoot(next);
    listeners.forEach((l) => l());
  }, []);
  return [settings, update];
}
