import { z } from "zod";

/**
 * Checkout rules, shared by the form (to say what is wrong before anything is
 * sent) and the server action (which checks again, because the browser can
 * send anything). One schema, so the two can never disagree about what a
 * valid address is.
 *
 * Strict objects: a field the schema does not name is rejected, never passed
 * along.
 */

/** The most of one line a shopper can order — the cart's limit too. */
export const MAX_LINE_QTY = 20;

/** Product slugs and pack-size ids, as the catalogue writes them. */
export const CATALOGUE_ID = /^[A-Za-z0-9_-]{1,120}$/;

/** The 28 states and 8 union territories, for the delivery address. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const addressSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter the full name of the person receiving the order.")
      .max(80, "Keep the name under 80 characters."),
    // Indian mobile numbers: ten digits, starting 6-9. Entered without +91,
    // which the form shows beside the field.
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number."),
    pincode: z
      .string()
      .trim()
      .regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code."),
    line1: z
      .string()
      .trim()
      .min(3, "Enter the flat, house number or building.")
      .max(120, "Keep this under 120 characters."),
    line2: z
      .string()
      .trim()
      .min(3, "Enter the area, street or village.")
      .max(120, "Keep this under 120 characters."),
    landmark: z.string().trim().max(80, "Keep the landmark under 80 characters."),
    city: z
      .string()
      .trim()
      .min(2, "Enter the town or city.")
      .max(60, "Keep this under 60 characters."),
    state: z.enum(INDIAN_STATES, { message: "Choose a state." }),
    kind: z.enum(["home", "work"]),
  })
  .strict();

export type Address = z.infer<typeof addressSchema>;
export type AddressField = keyof Address;

/** An address saved to a customer's account. */
export interface SavedAddress extends Address {
  id: string;
}

export const PAYMENT_METHODS = ["upi", "card", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Credit or debit card",
  cod: "Cash on delivery",
};

export const orderRequestSchema = z
  .object({
    /** One per checkout attempt, so a retried request cannot order twice. */
    idempotencyKey: z.string().uuid(),
    // A saved address is sent by id and loaded on the server, which checks
    // it belongs to the signed-in customer; a new one is sent in full. Parsed
    // on its own (parseAddressInput), so a new address's problems come back
    // field by field rather than as one "no union member matched".
    address: z.unknown(),
    paymentMethod: z.enum(PAYMENT_METHODS),
    // References only, as the cart holds them. Never a price: the server
    // prices every line from its own records.
    lines: z
      .array(
        z
          .object({
            slug: z.string().regex(CATALOGUE_ID),
            variantId: z.string().regex(CATALOGUE_ID).optional(),
            qty: z.number().int().min(1).max(MAX_LINE_QTY),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();

export type OrderRequest = z.infer<typeof orderRequestSchema>;

const savedAddressRefSchema = z.object({ savedId: z.string().uuid() }).strict();

/** A new address in full, or a saved one by id. */
export type AddressInput = Address | { savedId: string };

export function parseAddressInput(value: unknown) {
  const saved =
    typeof value === "object" && value !== null && "savedId" in value;
  return saved ? savedAddressRefSchema.safeParse(value) : addressSchema.safeParse(value);
}

const ADDRESS_FIELDS = new Set<string>(Object.keys(addressSchema.shape));

/**
 * Field-by-field messages for the address, first issue per field — from an
 * address parse, or from an order request, where the fields sit under
 * "address". Only the address's own fields, whose messages are written for
 * the shopper: a problem anywhere else in a request is not something the
 * form can show, and its wording is not for the shopper.
 */
export function addressErrors(error: z.ZodError): Partial<Record<AddressField, string>> {
  const out: Partial<Record<AddressField, string>> = {};
  for (const issue of error.issues) {
    const path = issue.path[0] === "address" ? issue.path.slice(1) : issue.path;
    const field = path[0];
    if (typeof field !== "string" || !ADDRESS_FIELDS.has(field)) continue;
    if (!out[field as AddressField]) out[field as AddressField] = issue.message;
  }
  return out;
}

/** "Flat 4B, Sunrise Apartments, MG Road, Nellore, Andhra Pradesh 524001" */
export function formatAddress(
  a: Pick<Address, "line1" | "line2" | "landmark" | "city" | "pincode"> & { state: string },
): string {
  return [a.line1, a.line2, a.landmark, a.city, `${a.state} ${a.pincode}`]
    .filter(Boolean)
    .join(", ");
}
