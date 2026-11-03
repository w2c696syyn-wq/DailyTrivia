// Which domain shows which game. Add each game's real domain here once bought.
// The *.localhost names work with `wrangler dev` (browsers send them to this PC).

import type { Hosts } from "./handler";

export const HOSTS: Hosts = {
  "ingredient-x.localhost": "ingredient-x",
  "trending.localhost": "trending",
};
