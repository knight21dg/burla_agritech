import { describe, expect, it } from "vitest";
import { countAfterSet, packetsSchema, stockState, websiteSays } from "./stock";

const pack = { counted: true, quantity: 12, lowLevel: 5, onSale: true };

describe("stock in the owner's words", () => {
  it("names each state", () => {
    expect(stockState(pack)).toBe("in_stock");
    expect(stockState({ ...pack, quantity: 5 })).toBe("running_low");
    expect(stockState({ ...pack, quantity: 0 })).toBe("none_left");
    expect(stockState({ ...pack, counted: false, quantity: 0 })).toBe("not_counted");
    expect(stockState({ ...pack, onSale: false })).toBe("marked_out");
  });

  it("says what the website shows", () => {
    expect(websiteSays({ ...pack, quantity: 2 })).toBe("Only 2 left");
    expect(websiteSays(pack)).toBe("In stock");
    expect(websiteSays({ ...pack, quantity: 0 })).toBe("Out of stock");
    expect(websiteSays({ ...pack, counted: false })).toBe("In stock");
  });

  it("keeps orders placed while the owner was counting", () => {
    // Saw 10, set 8; meanwhile 3 were ordered (now 7): 7 - 2 = 5.
    expect(countAfterSet(7, 10, 8)).toBe(5);
    expect(countAfterSet(10, 10, 8)).toBe(8);
    expect(countAfterSet(1, 10, 0)).toBe(0);
    expect(countAfterSet(4, undefined, 9)).toBe(9);
  });

  it("accepts whole packets only", () => {
    expect(packetsSchema.safeParse("12").success).toBe(true);
    expect(packetsSchema.safeParse("2.5").success).toBe(false);
    expect(packetsSchema.safeParse("-1").success).toBe(false);
    expect(packetsSchema.safeParse("abc").success).toBe(false);
  });
});
