import type { Metadata } from "next";
import "./globals.css";

/**
 * The root layout carries nothing but the document shell. The signed-in
 * furniture — sidebar, top bar, who you are — belongs to the `(app)` group,
 * so the sign-in page cannot render a navigation the visitor may not use.
 */
export const metadata: Metadata = {
  title: { default: "Burla Admin", template: "%s — Burla Admin" },
  // Belt, braces and a third strap: robots.ts, a response header, and this.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
