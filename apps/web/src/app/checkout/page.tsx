import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { requireUser } from "@/server/auth/session";
import { listAddresses } from "@/server/services/orderService";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

/**
 * Checkout, for signed-in customers: anyone else is sent to sign in and
 * brought back here, with their cart untouched (it lives in the browser).
 * The customer's saved addresses are loaded here, on the server; the steps
 * themselves run in `CheckoutView`, and placing the order is a server action.
 */
export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const saved = await listAddresses(user.id);

  return (
    <Section tone="white" size="sm">
      <Container>
        <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
        <h1 className="t-h1 mt-6">Checkout</h1>
        <CheckoutView saved={saved} />
      </Container>
    </Section>
  );
}
