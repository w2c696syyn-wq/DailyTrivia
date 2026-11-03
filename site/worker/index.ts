// Cloudflare Worker entry point. Every request comes here first
// (assets.run_worker_first in wrangler.jsonc).

import { type Bundle, type Env, handle } from "./handler";
import { HOSTS } from "./hosts";
import puzzles from "./puzzles.generated.json";

const worker = {
  fetch: (req: Request, env: Env) => handle(req, env, new Date(), puzzles as Bundle, HOSTS),
};

export default worker;
