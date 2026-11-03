# Daily Trivia

Five standalone daily games on one shared codebase. The build plan lives in the
"Daily Trivia Site — Build Plan" doc. This repo holds phase 1 (Ingredient X
and Trending): the Python content pipeline, the Next.js site, and the
Cloudflare Worker that releases each day's puzzle.

## Layout

| Path | What |
| --- | --- |
| `pipeline/trivia/` | Python: UK dates, puzzle format, data sources, scheduling, build |
| `pipeline/tests/` | pytest suite |
| `content/games.json` | Launch date per game; `null` until you choose one |
| `content/<game>/bank.json` | Reviewed items ready to schedule |
| `review/review.html` | Local review page for candidate queues |
| `puzzles/<game>/<date>.json` | One file per UK day; released by the Worker, never public |
| `site/public/answers/<game>.json` | Type-ahead answer list shipped with the site |
| `site/src/core/` | TypeScript: UK dates, scoring, answer search, game rules (browser and Worker) |
| `site/src/games/` | One component per game |
| `site/worker/` | Cloudflare Worker: today's puzzle by UK date, one domain per game |
| `shared/` | Test cases both Python and TypeScript must pass, so they never disagree |

## Set up

```
python -m venv .venv
.venv/Scripts/python -m pip install -r pipeline/requirements.txt
.venv/Scripts/python -m pytest -q
```

Site (Node.js LTS):

```
cd site
npm install
npm test
npm run dev      # plays built-in sample puzzles at http://localhost:3000
npm run build    # bundles puzzles/ into the Worker, static site in site/out/
npm run preview  # build, then run the real Worker at http://localhost:8787
```

With `npm run preview`, http://ingredient-x.localhost:8787/ shows the game the
way its own domain will. It plays only if `puzzles/` has a puzzle for today.

## Going live (Cloudflare)

1. Create a free Cloudflare account, then from `site/` run `npx wrangler login`.
2. Add each game's domain to `site/worker/hosts.ts`.
3. `npm run build`, then `npx wrangler deploy`.
4. In the Cloudflare dashboard, open the `daily-trivia` Worker, then
   **Settings → Domains & Routes**, and add each domain as a custom domain.
5. Set a usage alert at around 80,000 requests a day (the free plan allows 100,000).

Puzzles are compiled into the Worker, so each content session ends with a
fresh build and deploy.

Commands below run from the repo root with `PYTHONPATH=pipeline`.

## Monthly content session

1. **Candidates.**
   - Ingredient X: download `food.parquet` from the
     [Open Food Facts dataset](https://huggingface.co/datasets/openfoodfacts/product-database)
     to `pipeline/data/`, then run
     `python -m trivia.candidates ingredient-x --parquet pipeline/data/food.parquet`.
     Querying the remote URL directly works for a quick look, but Hugging Face
     rate-limits repeated remote reads.
   - Trending: set `TRIVIA_CONTACT` (an email or URL for Wikimedia's User-Agent
     policy), then run `python -m trivia.candidates trending --from 2016-01-04 --to 2025-12-28`.
     Daily lists are cached in `pipeline/data/wikimedia/`.
2. **Review.** Serve the folder (`python -m http.server -d review`), open
   `review.html` and load the queue. Fix label lines and add aliases and a
   fact, or pick 10 articles with notes. Then export.
3. **Merge.** `python -m trivia.bank merge ingredient-x ingredient-x.accepted.json`
4. **Build.** `python -m trivia.build build ingredient-x --from <next empty day> --days 60 --seed <any>`
5. **Check.** `python -m trivia.build check`. The same check runs nightly in
   GitHub Actions and fails when the next 7 days have a gap or a broken puzzle.

## Rules the pipeline enforces

- Puzzle #1 is launch day. One puzzle per UK calendar day (`Europe/London`),
  tested across the clock changes.
- No item is ever reused. The same Ingredient X category or Trending year
  never appears twice within 7 days.
- Ingredient X labels show the smallest ingredient first, group everything
  under 2% into one opening line, and stop at 8 lines.
- Trending drops site pages, always-popular pages and titles that contain a year.

Data: Open Food Facts (ODbL) and Wikimedia pageviews. The repo is private, so
`off_candidates.py` and `ingredients.py` must be published openly before
launch to meet ODbL's share-alike terms.
