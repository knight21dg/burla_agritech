import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Your cart",
  // A shopper's own cart: nothing here for a search engine.
  robots: { index: false, follow: false },
};

/**
 * The cart. The frame is static; the lines live in the browser
 * (`cartStore`), so `CartView` renders them on the client.
 */
export default function CartPage() {
  return (
    <Section tone="white" size="sm">
      <Container>
        <Breadcrumbs items={[{ label: "Cart" }]} />
        <h1 className="t-h1 mt-6">Your cart</h1>
        <CartView />
      </Container>
    </Section>
  );
}
