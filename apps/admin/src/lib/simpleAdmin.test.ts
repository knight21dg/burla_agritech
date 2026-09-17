import { describe, expect, it } from "vitest";
import { parsePackSize } from "./packSize";
import { productFormSchema, toPaise, webAddressFrom } from "./productForm";
import { CAN_CANCEL, NEXT_STEPS, canMove, isRejection, needsRefund, paymentLabel } from "./orderSteps";
import { describe as sentence } from "./activity";

/**
 * The rules behind the simplified admin. Pure functions, tested on their own:
 * what a typed pack size means, what a product form must contain, which way
 * an order may move, and what the activity log says.
 */

describe("pack sizes, as people type them", () => {
  it.each([
    ["500 g", "500 g", 500],
    ["500g", "500 g", 500],
    ["250 GM", "250 g", 250],
    ["1 kg", "1 kg", 1000],
    ["1kg", "1 kg", 1000],
    ["1.5 kg", "1.5 kg", 1500],
    ["250", "250 g", 250],
    ["500 ml", "500 ml", 500],
    ["1 L", "1 L", 1000],
  ])("%s → %s", (typed, label, amount) => {
    expect(parsePackSize(typed)).toEqual({ label, amount });
  });

  it.each(["", "big", "0 g", "-5 g", "5 tons", "1 kg 500 g", "250kg extra"])("refuses %j", (typed) => {
    expect(parsePackSize(typed)).toBeUndefined();
  });
});

const product = {
  name: "Moringa Powder",
  categoryId: "11111111-1111-4111-8111-111111111111",
  subcategoryId: "",
  description: "",
  visible: true,
  packs: [{ id: "new", size: "500 g", price: 250, available: true }],
  advanced: { shortLine: "", webAddress: "", onHomepage: false },
  removePhoto: false,
};

describe("the product form", () => {
  it("accepts a simple product", () => {
    expect(productFormSchema.safeParse(product).success).toBe(true);
  });

  it("refuses anything the form does not show", () => {
    for (const extra of [{ status: "archived" }, { isSample: true }, { id: "22222222-2222-4222-8222-222222222222" }]) {
      expect(productFormSchema.safeParse({ ...product, ...extra }).success).toBe(false);
    }
  });

  it("will not show a product on the website that has no pack size", () => {
    const result = productFormSchema.safeParse({ ...product, packs: [] });
    expect(result.success).toBe(false);
  });

  it("lets an out-of-stock product stay on the website", () => {
    const result = productFormSchema.safeParse({
      ...product,
      packs: [{ id: "new", size: "500 g", price: 250, available: false }],
    });
    expect(result.success).toBe(true);
  });

  it("lets a hidden product have no available pack", () => {
    const result = productFormSchema.safeParse({ ...product, visible: false, packs: [] });
    expect(result.success).toBe(true);
  });

  it("refuses the same pack size twice, however it is written", () => {
    const result = productFormSchema.safeParse({
      ...product,
      packs: [
        { id: "new", size: "1 kg", price: 400, available: true },
        { id: "new", size: "1kg", price: 450, available: true },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("refuses a price of nothing", () => {
    const result = productFormSchema.safeParse({
      ...product,
      packs: [{ id: "new", size: "500 g", price: 0, available: true }],
    });
    expect(result.success).toBe(false);
  });

  it("turns rupees into paise without losing a paisa", () => {
    expect(toPaise(250)).toBe(25000);
    expect(toPaise(19.99)).toBe(1999);
  });

  it("makes a web address from a name", () => {
    expect(webAddressFrom("Tea / Coffee Powders")).toBe("tea-coffee-powders");
    expect(webAddressFrom("  Moringa Powder! ")).toBe("moringa-powder");
  });
});

describe("moving an order along", () => {
  it("follows the owner's order of work", () => {
    expect(canMove("confirmed", "processing")).toBe(true);
    expect(canMove("processing", "packed")).toBe(true);
    expect(canMove("packed", "delivered")).toBe(true);
    expect(canMove("packed", "shipped")).toBe(true);
    expect(canMove("shipped", "delivered")).toBe(true);
  });

  it("never skips a step or goes backwards", () => {
    expect(canMove("confirmed", "delivered")).toBe(false);
    expect(canMove("delivered", "processing")).toBe(false);
    expect(canMove("cancelled", "processing")).toBe(false);
  });

  it("allows cancelling only before the order has left", () => {
    expect(CAN_CANCEL).toContain("confirmed");
    expect(canMove("packed", "cancelled")).toBe(true);
    expect(canMove("shipped", "cancelled")).toBe(false);
    expect(canMove("delivered", "cancelled")).toBe(false);
  });

  it("has nothing further to do once delivered or cancelled", () => {
    expect(NEXT_STEPS.delivered).toBeUndefined();
    expect(NEXT_STEPS.cancelled).toBeUndefined();
  });

  it("reminds about a refund only when money was paid online", () => {
    expect(needsRefund("upi", "paid")).toBe(true);
    expect(needsRefund("card", "pending")).toBe(false);
    expect(needsRefund("cod", "paid")).toBe(false);
    expect(isRejection("confirmed")).toBe(true);
    expect(isRejection("processing")).toBe(false);
  });

  it("says plainly whether cash on delivery has been paid", () => {
    expect(paymentLabel("cod", "pending")).toBe("Cash on delivery — not paid yet");
    expect(paymentLabel("cod", "paid")).toBe("Cash on delivery — paid");
  });
});

describe("the activity log in words", () => {
  it("never shows a code to the owner", () => {
    for (const action of [
      "product.saved",
      "product.variants_replaced",
      "category.added",
      "order.processing",
      "enquiry.marked",
      "something.unknown",
    ]) {
      const text = sentence({ action, changes: { name: "Mango Pickle", orderNumber: "BGA-2026-00004", to: "Contacted" } });
      expect(text, action).not.toMatch(/[a-z]+\.[a-z_]+/);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("calls a new order's first answer accepted or rejected", () => {
    const order = (action: string, from: string) =>
      sentence({ action, changes: { orderNumber: "BGA-2026-00004", status: { from, to: action.split(".")[1] } } });
    expect(order("order.processing", "confirmed")).toBe("Accepted order BGA-2026-00004");
    expect(order("order.cancelled", "confirmed")).toBe("Rejected order BGA-2026-00004");
    expect(order("order.cancelled", "processing")).toBe("Cancelled order BGA-2026-00004");
  });

  it("names renames", () => {
    expect(sentence({ action: "product.saved", changes: { name: "Mango Pickle", renamedFrom: "Mango Achar" } })).toBe(
      "Renamed Mango Achar to Mango Pickle",
    );
  });
});
