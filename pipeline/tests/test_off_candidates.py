import duckdb
import pytest

from trivia.off_candidates import Candidate, find_candidates


@pytest.fixture
def parquet(tmp_path):
    path = tmp_path / "food.parquet"
    con = duckdb.connect()
    con.execute("""
        CREATE TABLE food AS SELECT * FROM (VALUES
          ('1', [{'lang': 'main', 'text': 'Nutella'}], 'Ferrero', ['en:spreads', 'en:hazelnut-spreads'],
           ['en:united-kingdom'], [{'lang': 'en', 'text': 'Sugar, palm oil, hazelnuts (13%)'}], 900, 'en'),
          ('2', [{'lang': 'en', 'text': 'Obscure Jam'}], 'Nobody', ['en:jams'],
           ['en:united-kingdom'], [{'lang': 'en', 'text': 'Fruit, sugar'}], 3, 'en'),
          ('3', [{'lang': 'fr', 'text': 'Pâte'}], 'X', ['en:spreads'],
           ['en:france'], [{'lang': 'fr', 'text': 'Sucre'}], 5000, 'fr'),
          ('4', [{'lang': 'en', 'text': 'Mystery Crisps'}], 'Y', ['en:crisps'],
           ['en:united-kingdom'], [{'lang': 'fr', 'text': 'Pommes de terre'}], 800, 'en'),
          ('5', [{'lang': 'en', 'text': 'Walkers Ready Salted'}], 'Walkers', ['en:crisps'],
           ['en:united-kingdom', 'en:ireland'], [{'lang': 'en', 'text': 'Potatoes, sunflower oil, salt'}], 1200, 'en'),
          ('6', [{'lang': 'en', 'text': 'Prince'}], 'LU', ['en:biscuits'],
           ['en:united-kingdom'], [{'lang': 'en', 'text': 'Farine de blé, sucre'}], 1500, 'fr')
        ) AS t(code, product_name, brands, categories_tags, countries_tags, ingredients_text, unique_scans_n, lang)
    """)
    con.execute(f"COPY food TO '{path.as_posix()}' (FORMAT parquet)")
    return path


def test_uk_english_famous_products_most_scanned_first(parquet):
    got = find_candidates(parquet, min_scans=50)
    assert [c.code for c in got] == ["5", "1"]


def test_candidate_fields(parquet):
    nutella = next(c for c in find_candidates(parquet, min_scans=50) if c.code == "1")
    assert nutella == Candidate(
        code="1", name="Nutella", brands="Ferrero", category="hazelnut-spreads",
        ingredients="Sugar, palm oil, hazelnuts (13%)", scans=900)


def test_limit(parquet):
    assert len(find_candidates(parquet, min_scans=50, limit=1)) == 1
