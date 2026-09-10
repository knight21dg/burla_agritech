import type { Metadata } from "next";
import { Caveat, Instrument_Sans, Source_Serif_4 } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { DemoNotice } from "@/components/layout/DemoNotice";
import { ChromeMeasure } from "@/components/layout/ChromeMeasure";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * Sans for everything a customer reads to act — navigation, prices, labels,
 * body copy. Self-hosted through next/font: no third-party request, no FOUT,
 * no layout shift.
 */
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

/**
 * Script accent, used exactly twice on the homepage — "Good Food Better
 * Living" beside the hero and "From Our Farms To Your Family" over the about
 * image, both of which appear in the client's mockups. It never carries
 * information, so it is decorative and marked aria-hidden at each use.
 */
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

/**
 * Serif for section headings and the hero, as in the client's final mockup
 * (2026-09-10), which sets every heading — "Our Product Categories",
 * "Rooted in Values." — in a book serif against a sans body.
 *
 * Source Serif 4 because it is a true optical-size family: the `opsz` axis
 * sharpens contrast at display sizes and opens it up at heading sizes, so one
 * file serves both the 7rem hero wordmark and a 1.75rem section title without
 * either looking wrong.
 */
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.shortName}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  robots: {
    // Demo build: not for indexing until the real domain and content land.
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    description: site.description,
    // Address, logo, certifications and contact points are deliberately
    // omitted until client-verified (OQ-002, OQ-008, OQ-019, OQ-021).
  };

  return (
    <html
      lang="en-IN"
      className={`${instrument.variable} ${caveat.variable} ${serif.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <ChromeMeasure />
        <DemoNotice />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppFab />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
