import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";
import { EARLY_SETTINGS_SCRIPT } from "@/core/settings";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Daily puzzles",
  description: "One small puzzle a day.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe3" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1c19" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The early script may add data-* attributes before React hydrates.
    <html lang="en-GB" className={`${fraunces.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_SETTINGS_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
