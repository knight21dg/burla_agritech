import { describe, expect, it } from "vitest";
import { confirmationLink, confirmationText, whatsappNumber } from "./orderMessages";

const order = {
  orderNumber: "BGA-2026-00008",
  contactName: "Lakshmi Devi",
  contactPhone: "98765 43210",
  paymentMethod: "cod" as const,
  paymentStatus: "pending" as const,
  totalMinor: 49900,
  items: [
    { productName: "Moringa Powder", size: "100 g", quantity: 2 },
    { productName: "Mango Pickle", size: "250 g", quantity: 1 },
  ],
  shippingAddress: { city: "Nellore", pincode: "524003" },
};

describe("WhatsApp order confirmation", () => {
  it("turns the numbers customers type into WhatsApp numbers", () => {
    expect(whatsappNumber("98765 43210")).toBe("919876543210");
    expect(whatsappNumber("+91 98765-43210")).toBe("919876543210");
    expect(whatsappNumber("098765 43210")).toBe("919876543210");
    expect(whatsappNumber("12345")).toBeNull();
    expect(whatsappNumber("1234567890")).toBeNull();
  });

  it("lists what was ordered and how it is paid, and nothing it cannot know", () => {
    const text = confirmationText(order);
    expect(text).toContain("Hello Lakshmi,");
    expect(text).toContain("BGA-2026-00008");
    expect(text).toContain("• Moringa Powder (100 g) × 2");
    expect(text).toContain("cash on delivery");
    expect(text).toContain("Nellore 524003");
    expect(text).not.toMatch(/\bwithin\b|\bdays?\b|\btomorrow\b/i);
  });

  it("says an online payment was received only when it was", () => {
    expect(confirmationText({ ...order, paymentMethod: "upi", paymentStatus: "paid" })).toContain("paid online");
    expect(confirmationText({ ...order, paymentMethod: "upi", paymentStatus: "pending" })).not.toContain("paid online");
  });

  it("opens a chat with the customer, or nothing when the number is unusable", () => {
    expect(confirmationLink(order)).toMatch(/^https:\/\/wa\.me\/919876543210\?text=Hello%20Lakshmi/);
    expect(confirmationLink({ ...order, contactPhone: "123" })).toBeNull();
  });
});
