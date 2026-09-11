/**
 * SAMPLE DELIVERY CHARGE — NOT THE CLIENT'S. TODO (client): set the real rule.
 *
 * A flat charge, waived above an order value: the common Indian e-commerce
 * pattern, with placeholder numbers chosen by us (2026-09-11) so checkout can
 * show a real total. One place, read by the cart, checkout and the server,
 * so changing the rule changes it everywhere at once.
 */
export const DELIVERY_RULE = {
  flatMinor: 50_00,
  freeFromMinor: 499_00,
} as const;

export function deliveryFeeMinor(subtotalMinor: number): number {
  return subtotalMinor >= DELIVERY_RULE.freeFromMinor ? 0 : DELIVERY_RULE.flatMinor;
}
