// Which domain shows which game: each game's `domain` in src/core/games.ts,
// plus *.localhost names for `wrangler dev` (browsers send them to this PC).

import { GAMES } from "../src/core/games";
import type { Hosts } from "./handler";

export const HOSTS: Hosts = Object.fromEntries(
  GAMES.flatMap((g) => [[`${g.id}.localhost`, g.id], ...(g.domain ? [[g.domain, g.id], [`www.${g.domain}`, g.id]] : [])]),
);
