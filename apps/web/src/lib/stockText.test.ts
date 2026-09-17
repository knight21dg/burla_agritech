import { describe, expect, it } from "vitest";
import { lowStockLeft, stockText } from "./catalog";

const row = { status: "active" as const, trackInventory: true, stockQuantity: 2, lowStockThreshold: 5 };

describe("what the shop says about stock", () => {
  it("says how many are left only when few are", () => {
    expect(lowStockLeft(row)).toBe(2);
    expect(lowStockLeft({ ...row, stockQuantity: 40 })).toBeUndefined();
    expect(lowStockLeft({ ...row, stockQuantity: 0 })).toBeUndefined();
    expect(lowStockLeft({ ...row, trackInventory: false })).toBeUndefined();
  });

  it("reads naturally", () => {
    expect(stockText({ availability: "low_stock", stockLeft: 2 })).toBe("Only 2 left");
    expect(stockText({ availability: "in_stock" })).toBe("In stock");
    expect(stockText({ availability: "out_of_stock" })).toBe("Out of stock");
  });
});
