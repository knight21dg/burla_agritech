import { describe, expect, it } from "vitest";
import {
  checkPublishable,
  productDetailsSchema,
  toMinor,
  variantsSchema,
} from "./product";

/**
 * The rules the catalogue editor enforces, tested away from the database and
 * the browser — they are pure functions precisely so they can be.
 *
 * Two of these matter more than the rest: the strict-schema test, which is the
 * mass-assignment guard from AUTHORIZATION.md §10, and the money test, because
 * a rounding error in a price is the kind of bug that reaches an invoice.
 */

const validDetails = {
  name: "Mango Pickle",
  slug: "mango-pickle",
  categoryId: "11111111-1111-4111-8111-111111111111",
  typeId: "22222222-2222-4222-8222-222222222222",
  shortDescriptor: "Cut mango in mustard oil",
  description: "A description.",
  seoTitle: "",
  seoDescription: "",
  featured: false,
  sortOrder: 0,
  expectedUpdatedAt: "2026-09-16T10:00:00.000Z",
};

describe("product details schema", () => {
  it("accepts a well-formed product", () => {
    expect(productDetailsSchema.safeParse(validDetails).success).toBe(true);
  });

  // Test 10 in AUTHORIZATION.md §10. A payload with an extra field is
  // rejected, not quietly ignored — which is what makes "status is not
  // editable through this form" true rather than merely intended.
  it("refuses a payload carrying fields it does not own", () => {
    for (const extra of [
      { status: "published" },
      { isSample: false },
      { id: "33333333-3333-4333-8333-333333333333" },
      { publishedAt: "2026-01-01" },
    ]) {
      const result = productDetailsSchema.safeParse({ ...validDetails, ...extra });
      expect(result.success, JSON.stringify(extra)).toBe(false);
    }
  });

  it("treats an empty type as no type, not as an error", () => {
    const result = productDetailsSchema.safeParse({ ...validDetails, typeId: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.typeId).toBeNull();
  });

  it("insists a slug is a slug", () => {
    for (const bad of ["Mango Pickle", "mango_pickle", "-mango", "mango--pickle", "MANGO"]) {
      expect(productDetailsSchema.safeParse({ ...validDetails, slug: bad }).success).toBe(
        false,
      );
    }
  });

  it("keeps the short descriptor inside the column", () => {
    const result = productDetailsSchema.safeParse({
      ...validDetails,
      shortDescriptor: "x".repeat(91),
    });
    expect(result.success).toBe(false);
  });
});

describe("money", () => {
  it("converts rupees to paise as integers", () => {
    expect(toMinor(169)).toBe(16900);
    expect(toMinor(0)).toBe(0);
    expect(toMinor(1249.5)).toBe(124950);
  });

  // 19.99 * 100 is 1998.9999999999998 in binary floating point. Rounding, not
  // truncation, is the difference between ₹19.99 and ₹19.98.
  it("rounds rather than truncating", () => {
    expect(toMinor(19.99)).toBe(1999);
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });
});

const pack = {
  id: "new" as const,
  label: "250 g",
  sku: "MP-250",
  priceRupees: 169,
  mrpRupees: "" as const,
  netWeightGrams: 250,
  lowStockThreshold: 5,
  trackInventory: true,
  status: "active" as const,
  isDefault: true,
};

describe("pack sizes", () => {
  it("accepts a single well-formed pack", () => {
    expect(variantsSchema.safeParse([pack]).success).toBe(true);
  });

  it("refuses two packs sharing a SKU, whatever the case", () => {
    const result = variantsSchema.safeParse([
      pack,
      { ...pack, label: "500 g", sku: "mp-250", isDefault: false },
    ]);
    expect(result.success).toBe(false);
  });

  it("refuses two defaults", () => {
    const result = variantsSchema.safeParse([
      pack,
      { ...pack, label: "500 g", sku: "MP-500" },
    ]);
    expect(result.success).toBe(false);
  });

  it("refuses an MRP below the price", () => {
    const result = variantsSchema.safeParse([{ ...pack, mrpRupees: 100 }]);
    expect(result.success).toBe(false);
  });

  it("accepts an MRP equal to or above the price", () => {
    expect(variantsSchema.safeParse([{ ...pack, mrpRupees: 169 }]).success).toBe(true);
    expect(variantsSchema.safeParse([{ ...pack, mrpRupees: 199 }]).success).toBe(true);
  });

  it("refuses a negative price and a zero weight", () => {
    expect(variantsSchema.safeParse([{ ...pack, priceRupees: -1 }]).success).toBe(false);
    expect(variantsSchema.safeParse([{ ...pack, netWeightGrams: 0 }]).success).toBe(false);
  });
});

describe("publish rules", () => {
  const sellable = {
    name: "Mango Pickle",
    categoryId: "11111111-1111-4111-8111-111111111111",
    shortDescriptor: "Cut mango in mustard oil",
    description: "A description.",
    variants: [{ priceMinor: 16900, status: "active" }],
    hasLegalDetails: true,
    hasImage: true,
  };

  it("passes a complete product with nothing to warn about", () => {
    const check = checkPublishable(sellable);
    expect(check.ok).toBe(true);
    expect(check.blockers).toEqual([]);
    expect(check.warnings).toEqual([]);
  });

  it("blocks a product nobody could buy", () => {
    expect(checkPublishable({ ...sellable, variants: [] }).ok).toBe(false);
    expect(
      checkPublishable({
        ...sellable,
        variants: [{ priceMinor: 0, status: "active" }],
      }).ok,
    ).toBe(false);
    expect(
      checkPublishable({
        ...sellable,
        variants: [{ priceMinor: 16900, status: "inactive" }],
      }).ok,
    ).toBe(false);
  });

  it("blocks a product with no name", () => {
    expect(checkPublishable({ ...sellable, name: "   " }).ok).toBe(false);
  });

  /**
   * The deliberate decision recorded in `product.ts`: missing food-label
   * details warn loudly but do not block, because not one of the 63 products
   * has them yet and blocking would make the admin unusable without making the
   * site any more compliant. The warning must always name them.
   */
  it("warns about missing food label details without blocking", () => {
    const check = checkPublishable({ ...sellable, hasLegalDetails: false });
    expect(check.ok).toBe(true);
    expect(check.warnings.join(" ")).toContain("legally required");
  });

  it("warns about missing copy and photographs", () => {
    const check = checkPublishable({
      ...sellable,
      shortDescriptor: "",
      description: "",
      hasImage: false,
    });
    expect(check.ok).toBe(true);
    expect(check.warnings).toHaveLength(3);
  });
});
