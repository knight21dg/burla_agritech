import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

/**
 * The root layout carries nothing but the document shell. The signed-in
 * furniture — sidebar, top bar, who you are — belongs to the `(app)` group,
 * so the sign-in page cannot render a navigation the visitor may not use.
 */
/** The shop's own font, self-hosted by Next — so the admin feels like Burla. */
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Burla Admin", template: "%s — Burla Admin" },
  // Belt, braces and a third strap: robots.ts, a response header, and this.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={instrument.variable}>
      <body>{children}</body>
    </html>
  );
}
