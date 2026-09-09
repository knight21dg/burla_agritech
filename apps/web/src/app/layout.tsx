import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { DemoNotice } from "@/components/layout/DemoNotice";
import { ChromeMeasure } from "@/components/layout/ChromeMeasure";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * One family (DESIGN-SYSTEM §4.1). The v0.2 pairing — Fraunces display serif
 * plus a Caveat script accent — is withdrawn: it was editorial, and the client
 * asked for typography that never competes with the product photography.
 * Self-hosted through next/font: no third-party request, no FOUT, no CLS.
 */
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
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
      className={instrument.variable}
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
