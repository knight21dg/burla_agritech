/**
 * The schema, as one module.
 *
 * Commerce tables — carts, orders, payments, refunds, webhook_events — are
 * designed in docs/DATABASE-DESIGN.md §6 but deliberately not built yet. They
 * are conditional on OQ-001 (sell online, or enquiry-only). Creating eight
 * empty tables for a decision that has not been made would be worse than
 * adding them in one migration when it has: the design is settled, so this
 * costs nothing to defer, and if the answer is enquiry-only they never exist.
 */
export * from "./_shared";
export * from "./enums";
export * from "./media";
export * from "./taxonomy";
export * from "./products";
export * from "./identity";
export * from "./operations";
