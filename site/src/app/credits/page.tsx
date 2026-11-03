import type { Metadata } from "next";

export const metadata: Metadata = { title: "Credits" };

export default function Credits() {
  return (
    <main className="column" style={{ padding: "40px 16px", display: "grid", gap: 16 }}>
      <h1>Credits and data sources</h1>
      <section>
        <h2>Ingredient X</h2>
        <p>
          Ingredients data from <a href="https://world.openfoodfacts.org">Open Food Facts</a>, made available under
          the <a href="https://opendatacommons.org/licenses/odbl/1-0/">Open Database Licence</a>. Labels are UK
          versions and recipes change; each answer shows when its label was checked.
        </p>
      </section>
      <section>
        <h2>Trending</h2>
        <p>
          Weekly reading lists built from <a href="https://wikimedia.org/api/rest_v1/">Wikimedia pageview data</a>.
        </p>
      </section>
      <p>
        Product names are used only to identify the answer. These games are not affiliated with, or endorsed by,
        any brand.
      </p>
    </main>
  );
}
