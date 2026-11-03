// Device-only storage. Counts as strictly necessary (it is the game's own
// progress), so no cookie banner. Every access can fail in private windows
// or with site data blocked; the game must still play without it.

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: progress lasts for this visit only.
  }
}
