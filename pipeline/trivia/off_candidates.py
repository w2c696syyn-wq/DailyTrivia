"""Ingredient X candidates from the Open Food Facts Parquet export.

The export is published at
https://huggingface.co/datasets/openfoodfacts/product-database (food.parquet).
DuckDB can query it from a local copy or straight from that URL; only the
columns used here are read. Data is (c) Open Food Facts contributors, ODbL.

Scan count stands in for fame: the more people scanned a product, the more
likely players know it. Candidates still go through hand review.
"""

from dataclasses import dataclass
from pathlib import Path

DEFAULT_MIN_SCANS = 20  # UK coverage is thin: about 2,100 products reach 20 (Nov 2026)


@dataclass(frozen=True)
class Candidate:
    code: str
    name: str
    brands: str
    category: str
    ingredients: str
    scans: int


def _text_in(column: str, langs: str) -> str:
    """First text in a [{lang, text}] column for the given languages, in order."""
    picks = ", ".join(
        f"list_filter({column}, lambda x: x.lang = '{lang}')[1].text" for lang in langs.split(",")
    )
    return f"coalesce({picks})"


def find_candidates(parquet: str | Path, min_scans: int = DEFAULT_MIN_SCANS, limit: int = 5000) -> list[Candidate]:
    import duckdb

    source = str(parquet).replace("\\", "/")
    con = duckdb.connect()
    if source.startswith("http"):
        con.execute("INSTALL httpfs; LOAD httpfs;")
    # A CTE, because the export has its own `ingredients` column and a WHERE
    # clause would test that instead of the English text picked out here.
    rows = con.execute(f"""
        WITH uk AS (
            SELECT code,
                   {_text_in('product_name', 'en,main')} AS name,
                   coalesce(brands, '') AS brands,
                   coalesce(replace(categories_tags[-1], 'en:', ''), '') AS category,
                   {_text_in('ingredients_text', 'en')} AS english_ingredients,
                   unique_scans_n AS scans
            FROM read_parquet(?)
            WHERE list_contains(countries_tags, 'en:united-kingdom')
              -- Main language English: drops imports whose "en" text is really French etc.
              AND lang = 'en'
              AND unique_scans_n >= ?
        )
        SELECT code, name, brands, category, english_ingredients, scans
        FROM uk
        WHERE english_ingredients IS NOT NULL AND trim(english_ingredients) <> ''
          AND name IS NOT NULL
        ORDER BY scans DESC, code
        LIMIT ?
    """, [source, min_scans, limit]).fetchall()
    return [Candidate(*r) for r in rows]
