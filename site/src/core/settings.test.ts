import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings, rootAttributes } from "./settings";

describe("parseSettings", () => {
  it("falls back to defaults for missing or broken data", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("not json")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{"sound": "loud", "colourBlind": true}')).toEqual({ ...DEFAULT_SETTINGS, colourBlind: true });
  });

  it("everything is off by default", () => {
    expect(DEFAULT_SETTINGS).toEqual({ colourBlind: false, reduceMotion: false, sound: false, shareLink: false });
  });
});

describe("rootAttributes", () => {
  it("sets a data attribute only for the visual settings that are on", () => {
    expect(rootAttributes(DEFAULT_SETTINGS)).toEqual({});
    expect(rootAttributes({ ...DEFAULT_SETTINGS, colourBlind: true, reduceMotion: true, sound: true })).toEqual({
      "data-colour-blind": "",
      "data-reduce-motion": "",
    });
  });
});
