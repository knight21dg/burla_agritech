import { describe, expect, it } from "vitest";
import { OFFER_STRIP_DEFAULTS, offerStripSchema, readOfferStrip } from "./content";

describe("the offers strip", () => {
  it("accepts the supplied offers", () => {
    expect(offerStripSchema.safeParse(OFFER_STRIP_DEFAULTS).success).toBe(true);
  });

  it("links only to this website's own pages", () => {
    const strip = { visible: true, offers: [{ icon: "star", title: "Sale", text: "", link: "https://example.com" }] };
    expect(offerStripSchema.safeParse(strip).success).toBe(false);
  });

  it("refuses unknown icons, extra fields and empty or long titles", () => {
    const offer = OFFER_STRIP_DEFAULTS.offers[0]!;
    const bad = [
      { ...offer, icon: "rocket" },
      { ...offer, colour: "red" },
      { ...offer, title: " " },
      { ...offer, title: "x".repeat(41) },
    ];
    for (const one of bad) expect(offerStripSchema.safeParse({ visible: true, offers: [one] }).success).toBe(false);
  });

  it("keeps between one and eight offers", () => {
    expect(offerStripSchema.safeParse({ visible: true, offers: [] }).success).toBe(false);
    const nine = Array.from({ length: 9 }, () => OFFER_STRIP_DEFAULTS.offers[0]);
    expect(offerStripSchema.safeParse({ visible: true, offers: nine }).success).toBe(false);
  });

  it("shows the supplied offers when nothing valid is stored", () => {
    expect(readOfferStrip(undefined)).toEqual(OFFER_STRIP_DEFAULTS);
    expect(readOfferStrip({ visible: "yes" })).toEqual(OFFER_STRIP_DEFAULTS);
  });
});
