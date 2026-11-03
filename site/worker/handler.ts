// The Worker's logic as a plain function, so it can be tested without Cloudflare.
//
//   /api/puzzle/<game>/  today's puzzle for the current UK date, and only that.
//   <game's domain>/     that game's page.
//   anything else        the static site.

import type { GameId } from "../src/core/games";
import { msUntilNextPuzzle, ukDate } from "../src/core/ukDate";

/** Every scheduled puzzle, by game then UK date. Lives in the Worker's code, never in public assets. */
export type Bundle = Record<string, Record<string, Record<string, unknown>>>;

export type Hosts = Readonly<Record<string, GameId>>;

export type Env = { ASSETS: { fetch: (req: Request) => Promise<Response> } };

const API = /^\/api\/puzzle\/([a-z-]+)\/?$/;
const PREFETCH = /^(.*\/__next\.[^/]+)\.(__PAGE__\.txt)$/;

export async function handle(req: Request, env: Env, now: Date, puzzles: Bundle, hosts: Hosts): Promise<Response> {
  const url = new URL(req.url);

  const api = url.pathname.match(API);
  if (api) return todaysPuzzle(api[1], now, puzzles);
  if (url.pathname.startsWith("/api/")) return notFound("No such endpoint");

  const game = hosts[url.hostname];
  if (game && url.pathname === "/") {
    url.pathname = `/${game}/`;
    return env.ASSETS.fetch(new Request(url, req));
  }

  // Next.js asks for /x/__next.x.__PAGE__.txt but its static export writes
  // /x/__next.x/__PAGE__.txt. Without this, link prefetches 404.
  const prefetch = url.pathname.match(PREFETCH);
  if (prefetch) {
    url.pathname = `${prefetch[1]}/${prefetch[2]}`;
    return env.ASSETS.fetch(new Request(url, req));
  }
  return env.ASSETS.fetch(req);
}

function todaysPuzzle(game: string, now: Date, puzzles: Bundle): Response {
  // Query strings are ignored on purpose: the date always comes from the clock.
  const puzzle = puzzles[game]?.[ukDate(now)];
  if (!puzzle) return notFound("No puzzle today");
  // Cache until midnight at most, so nobody is served yesterday's puzzle.
  const maxAge = Math.min(300, Math.floor(msUntilNextPuzzle(now) / 1000));
  return Response.json(puzzle, { headers: { "cache-control": `public, max-age=${maxAge}` } });
}

const notFound = (message: string) => Response.json({ error: message }, { status: 404 });
