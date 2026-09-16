import { describe, expect, it } from "vitest";
import { categorySchema, newCategorySchema, suggestSlug } from "./taxonomy";

const valid = {
  name: "Pickles",
  slug: "pickles",
  shortName: "Pickles",
  heroHeadline: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  tone: "chilli" as const,
  sortOrder: 3,
  expectedUpdatedAt: "2026-09-16T10:00:00.000Z",
};

describe("category schema", () => {
  it("accepts a well-formed range", () => {
    expect(categorySchema.safeParse(valid).success).toBe(true);
  });

  /**
   * Where a row sits in the tree is decided by the route, never by the body.
   * Without this, a type could be re-parented — or promoted to a top-level
   * range — by adding a field to a form post.
   */
  it("refuses a payload that tries to move itself in the tree", () => {
    for (const extra of [
      { parentId: "11111111-1111-4111-8111-111111111111" },
      { status: "published" },
      { isSample: false },
      { id: "22222222-2222-4222-8222-222222222222" },
    ]) {
      expect(categorySchema.safeParse({ ...valid, ...extra }).success).toBe(false);
    }
  });

  it("insists a slug is a slug", () => {
    for (const bad of ["Veg Pickles", "veg_pickles", "-veg", "veg--pickles"]) {
      expect(categorySchema.safeParse({ ...valid, slug: bad }).success).toBe(false);
    }
  });

  it("refuses an unknown tint rather than falling back to one", () => {
    expect(categorySchema.safeParse({ ...valid, tone: "neon" }).success).toBe(false);
  });
});

describe("creating", () => {
  const { expectedUpdatedAt: _drop, ...creating } = valid;

  it("takes an empty parent as top-level", () => {
    const result = newCategorySchema.safeParse({ ...creating, parentId: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });

  it("takes a uuid parent as a type inside it", () => {
    const parentId = "11111111-1111-4111-8111-111111111111";
    const result = newCategorySchema.safeParse({ ...creating, parentId });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBe(parentId);
  });

  it("refuses a parent that is not an id", () => {
    expect(newCategorySchema.safeParse({ ...creating, parentId: "pickles" }).success).toBe(
      false,
    );
  });
});

describe("slug suggestions", () => {
  it("turns a name into a slug", () => {
    expect(suggestSlug("Veg Pickles")).toBe("veg-pickles");
    expect(suggestSlug("Tea / Coffee")).toBe("tea-coffee");
    expect(suggestSlug("Dehydrated Powders & Flakes")).toBe(
      "dehydrated-powders-flakes",
    );
  });

  it("leaves no stray hyphens at either end", () => {
    expect(suggestSlug("  Pickles!  ")).toBe("pickles");
    expect(suggestSlug("— Spices —")).toBe("spices");
  });

  it("produces something the schema accepts", () => {
    for (const name of ["Millet Powders", "Dry Fruits", "A & B, C"]) {
      const result = categorySchema.safeParse({ ...valid, slug: suggestSlug(name) });
      expect(result.success, name).toBe(true);
    }
  });
});
