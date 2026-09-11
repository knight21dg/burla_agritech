import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

/**
 * Checkout. The frame is static; the steps work from the cart, which lives
 * in the browser, so `CheckoutView` renders on the client. Placing the order
 * is a server action (`./actions.ts`).
 */
export default function CheckoutPage() {
  return (
    <Section tone="white" size="sm">
      <Container>
        <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
        <h1 className="t-h1 mt-6">Checkout</h1>
        <CheckoutView />
      </Container>
    </Section>
  );
}
