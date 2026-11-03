from datetime import date, timedelta

from trivia.trending import is_excluded, weekly_top

MON = date(2019, 7, 15)


def week_of(daily_rows, start=MON, days=7):
    return {start + timedelta(days=i): daily_rows for i in range(days)}


class TestWeeklyTop:
    def test_sums_views_across_the_week_and_ranks(self):
        daily = week_of([("Moon_landing", 100), ("Area_51", 300)])
        daily[MON] = [("Moon_landing", 2000), ("Area_51", 300)]
        assert weekly_top(daily) == {MON: [("Moon_landing", 2600), ("Area_51", 2100)]}

    def test_drops_incomplete_weeks(self):
        assert weekly_top(week_of([("Area_51", 1)], days=6)) == {}

    def test_keyed_by_monday_even_from_midweek_data(self):
        daily = week_of([("Area_51", 1)])
        daily.update(week_of([("Area_51", 1)], start=MON + timedelta(days=7), days=3))
        assert list(weekly_top(daily)) == [MON]

    def test_applies_exclusions_and_limit(self):
        rows = [("Main_Page", 10**9)] + [(f"Thing_{i}", 100 - i) for i in range(60)]
        top = weekly_top(week_of(rows), n=50)[MON]
        assert len(top) == 50
        assert top[0][0] == "Thing_0"


class TestIsExcluded:
    def test_site_pages(self):
        assert is_excluded("Main_Page")
        assert is_excluded("Special:Search")
        assert is_excluded("Wikipedia:Featured_pictures")

    def test_always_popular(self):
        assert is_excluded("YouTube")
        assert is_excluded("Google")

    def test_titles_containing_a_year_give_the_answer_away(self):
        assert is_excluded("2019_Cricket_World_Cup")
        assert is_excluded("Avengers:_Endgame_(2019_film)")

    def test_keeps_ordinary_articles(self):
        assert not is_excluded("Area_51")
        assert not is_excluded("Apollo_11")
        assert not is_excluded("Stranger_Things")
