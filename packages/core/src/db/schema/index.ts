/**
 * The schema, as one module.
 *
 * OQ-001 is answered — the client sells online (2026-09-11) — so the order
 * tables exist (commerce.ts). Payments, refunds and webhook_events follow
 * with the Razorpay integration; carts stay in the browser for now.
 */
export * from "./_shared";
export * from "./enums";
export * from "./media";
export * from "./taxonomy";
export * from "./products";
export * from "./identity";
export * from "./operations";
export * from "./commerce";
