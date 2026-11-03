import { describe, expect, it } from "vitest";
import { type Bundle, handle } from "./handler";

const PUZZLES: Bundle = {
  "ingredient-x": {
    "2027-03-01": { game: "ingredient-x", number: 1, date: "2027-03-01", answerId: "nutella" },
    "2027-03-02": { game: "ingredient-x", number: 2, date: "2027-03-02", answerId: "marmite" },
  },
  trending: {},
};

const HOSTS = { "ingredientx.example": "ingredient-x" } as const;

// Stands in for Cloudflare's static-assets binding: echoes the path it was asked for.
const ASSETS = {
  fetch: async (req: Request) => new Response(`asset ${new URL(req.url).pathname}`),
};

const get = (url: string, now: string) =>
  handle(new Request(url), { ASSETS }, new Date(now), PUZZLES, HOSTS);

describe("puzzle API", () => {
  it("returns the puzzle for the current UK date", async () => {
    const res = await get("https://x.example/api/puzzle/ingredient-x/", "2027-03-01T12:00:00Z");
    expect(res.status).toBe(200);
    expect((await res.json()).answerId).toBe("nutella");
  });

  it("switches at UK midnight, not UTC midnight", async () => {
    // 23:30 UTC on 1 Mar is still 1 Mar in the UK (GMT)...
    let res = await get("https://x.example/api/puzzle/ingredient-x/", "2027-03-01T23:30:00Z");
    expect((await res.json()).number).toBe(1);
    // ...and 00:00 UTC on 2 Mar is the new UK day.
    res = await get("https://x.example/api/puzzle/ingredient-x/", "2027-03-02T00:00:00Z");
    expect((await res.json()).number).toBe(2);
  });

  it("never serves a future puzzle, whatever is asked", async () => {
    const res = await get("https://x.example/api/puzzle/ingredient-x/?date=2027-03-02", "2027-03-01T12:00:00Z");
    expect((await res.json()).number).toBe(1);
    const direct = await get("https://x.example/api/puzzle/ingredient-x/2027-03-02/", "2027-03-01T12:00:00Z");
    expect(direct.status).toBe(404);
  });

  it("404s on a day with no puzzle and on unknown games", async () => {
    expect((await get("https://x.example/api/puzzle/ingredient-x/", "2027-04-01T12:00:00Z")).status).toBe(404);
    expect((await get("https://x.example/api/puzzle/trending/", "2027-03-01T12:00:00Z")).status).toBe(404);
    expect((await get("https://x.example/api/puzzle/chess/", "2027-03-01T12:00:00Z")).status).toBe(404);
  });

  it("is cached no longer than the time left until the next puzzle", async () => {
    const res = await get("https://x.example/api/puzzle/ingredient-x/", "2027-03-01T23:59:00Z");
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  });
});

describe("game domains", () => {
  it("serves the game's page at the root of its own domain", async () => {
    const res = await get("https://ingredientx.example/", "2027-03-01T12:00:00Z");
    expect(await res.text()).toBe("asset /ingredient-x/");
  });

  it("passes other paths through to the static site", async () => {
    const res = await get("https://ingredientx.example/credits/", "2027-03-01T12:00:00Z");
    expect(await res.text()).toBe("asset /credits/");
  });

  it("finds Next.js prefetch files the static export puts in a folder", async () => {
    const res = await get("https://x.example/trending/__next.trending.__PAGE__.txt?_rsc=1", "2027-03-01T12:00:00Z");
    expect(await res.text()).toBe("asset /trending/__next.trending/__PAGE__.txt");
    const root = await get("https://x.example/__next.__PAGE__.txt", "2027-03-01T12:00:00Z");
    expect(await root.text()).toBe("asset /__next.__PAGE__.txt");
  });

  it("leaves unmapped hosts alone", async () => {
    const res = await get("https://x.example/", "2027-03-01T12:00:00Z");
    expect(await res.text()).toBe("asset /");
  });
});
