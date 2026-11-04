import type { Metadata } from "next";
import { LegalPage, Owner } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy notice" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy notice">
      <p>
        These games are run by <Owner field="name" />. We collect as little as we can: no accounts, no cookies, no
        adverts and no tracking.
      </p>

      <h2>What stays on your device</h2>
      <p>To make the games work, your browser keeps:</p>
      <ul>
        <li>your progress in today&apos;s puzzle, so a refresh doesn&apos;t lose it</li>
        <li>your past results, for your stats and streaks</li>
        <li>your settings, such as colour-blind mode</li>
      </ul>
      <p>
        This is stored in your browser&apos;s local storage, on your device only. It is never sent to us, and we cannot
        see it. It is strictly necessary for features you use, so we don&apos;t ask for consent. You can delete it at
        any time by clearing this site&apos;s data in your browser settings.
      </p>

      <h2>What our hosting provider sees</h2>
      <p>
        The site is hosted by Cloudflare. Like any website, when your browser asks for a page, Cloudflare receives
        technical details including your IP address, the page requested and your browser type. Cloudflare uses these
        to deliver the site and protect it from attacks, and acts as our data processor. We do not keep our own logs of
        visits and do not use this information to identify anyone.
      </p>
      <p>
        Our legal basis is legitimate interests: running a website safely needs this information. Cloudflare may
        process it outside the UK under safeguards approved for UK data. See{" "}
        <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare&apos;s privacy policy</a> for how long it keeps
        it.
      </p>

      <h2>Visitor numbers</h2>
      <p>
        We don&apos;t currently measure visits. If we start, it will be with a tool that uses no cookies and does not
        identify you, and we will update this notice first.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK data protection law you can ask what personal data we hold about you, and ask us to correct or delete
        it. Because we keep no records of visitors, we will usually have nothing to give you, but we will always
        answer. Contact <Owner field="email" />.
      </p>
      <p>
        If you are unhappy with how we handle your data, you can complain to the{" "}
        <a href="https://ico.org.uk/make-a-complaint/">Information Commissioner&apos;s Office</a>.
      </p>

      <h2>Children</h2>
      <p>The games are suitable for all ages. We have no accounts and collect nothing that identifies a player.</p>

      <h2>Changes</h2>
      <p>If this notice changes, the date at the top will change too.</p>
    </LegalPage>
  );
}
