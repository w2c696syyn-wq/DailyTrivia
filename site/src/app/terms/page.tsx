import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Owner } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>
        These games are run by <Owner field="name" />. By playing them you agree to these terms. They are written to
        be short and plain.
      </p>

      <h2>Playing</h2>
      <ul>
        <li>The daily puzzles are free and need no account.</li>
        <li>Play them for your own enjoyment, and share your results as much as you like.</li>
        <li>
          Please don&apos;t copy puzzles or answers to publish elsewhere, or use automated tools to read or play the
          site.
        </li>
      </ul>

      <h2>Our content</h2>
      <p>
        Puzzles are built from public data: Open Food Facts for Ingredient X and Wikipedia reading figures for
        Trending. See the <Link href="/credits/">credits</Link> for sources and licences. Product names belong to
        their owners and are used only to name the answers. We are not affiliated with, or endorsed by, any brand.
      </p>
      <p>
        We check every puzzle, but recipes change and mistakes happen. If you spot one, tell us at{" "}
        <Owner field="email" />.
      </p>
      <p>
        <strong>Ingredient X labels are for fun only.</strong> They may be out of date or shortened. Never use them
        to make allergy or dietary decisions: always read the label on the pack.
      </p>

      <h2>Changes and availability</h2>
      <p>
        We may change, pause or stop any game, and may update these terms. If the terms change, the date at the top
        will change too.
      </p>

      <h2>Liability</h2>
      <p>
        The games are provided as they are, free of charge. As far as the law allows, we are not responsible for any
        loss from using them. Nothing in these terms limits liability that cannot be limited by law, such as for
        death or personal injury caused by negligence, or for fraud.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the law of England and Wales.</p>

      <h2>Contact</h2>
      <p>
        <Owner field="name" />, <Owner field="address" />. Email <Owner field="email" />.
      </p>
    </LegalPage>
  );
}
