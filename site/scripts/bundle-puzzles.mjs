// Collects ../puzzles/<game>/<date>.json into worker/puzzles.generated.json,
// which is compiled into the Worker so no puzzle is ever a public file.
// Runs before every build; an empty bundle (no launch date yet) is fine.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..", "puzzles");
const out = join(import.meta.dirname, "..", "worker", "puzzles.generated.json");

const bundle = {};
let count = 0;
if (existsSync(root)) {
  for (const game of readdirSync(root)) {
    bundle[game] = {};
    for (const file of readdirSync(join(root, game)).filter((f) => f.endsWith(".json"))) {
      bundle[game][file.replace(/\.json$/, "")] = JSON.parse(readFileSync(join(root, game, file), "utf8"));
      count++;
    }
  }
}

writeFileSync(out, JSON.stringify(bundle));
console.log(`bundled ${count} puzzles into the Worker`);
