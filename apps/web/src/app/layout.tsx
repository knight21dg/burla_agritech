import type { Metadata } from "next";
import { Caveat, Fraunces, Instrument_Sans } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { DemoNotice } from "@/components/layout/DemoNotice";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * Typography Direction A (DESIGN-SYSTEM §4.1): Fraunces for display,
 * Instrument Sans for body and UI, with Caveat as a sparing editorial accent.
 * Self-hosted through next/font — no third-party request, no FOUT, no CLS.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
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
      className={`${fraunces.variable} ${instrument.variable} ${caveat.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
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
