// Player settings, kept on the device. Shared by every game on the site.

export type Settings = {
  /** Orange and blue instead of red and green, and orange squares in share text. */
  colourBlind: boolean;
  /** No sliding or flipping, on top of the device's own reduced-motion setting. */
  reduceMotion: boolean;
  sound: boolean;
  /** Add the game's web address to share text. */
  shareLink: boolean;
};

export const DEFAULT_SETTINGS: Settings = { colourBlind: false, reduceMotion: false, sound: false, shareLink: false };

export const SETTINGS_KEY = "settings";

/** Read stored settings, keeping only well-formed values. */
export function parseSettings(raw: string | null): Settings {
  let stored: Record<string, unknown> = {};
  try {
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    // Broken data: start again from the defaults.
  }
  const out = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (typeof stored[key] === "boolean") out[key] = stored[key];
  }
  return out;
}

/**
 * Runs in <head> before the page paints, so a colour-blind player never sees
 * the red-and-green version flash up first. Kept in step with rootAttributes.
 */
export const EARLY_SETTINGS_SCRIPT = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"{}");var r=document.documentElement;if(s.colourBlind===true)r.setAttribute("data-colour-blind","");if(s.reduceMotion===true)r.setAttribute("data-reduce-motion","")}catch(e){}`;

/** The attributes on <html> that switch the CSS for the visual settings. */
export function rootAttributes(s: Settings): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (s.colourBlind) attrs["data-colour-blind"] = "";
  if (s.reduceMotion) attrs["data-reduce-motion"] = "";
  return attrs;
}
