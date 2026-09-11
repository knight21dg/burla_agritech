import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LogOut, MapPin, Package } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { PAYMENT_LABEL, formatAddress } from "@/lib/checkout";
import { ORDER_STATUS_LABEL, statusTone } from "@/lib/orders";
import { cn, formatPrice } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { listAddresses, listOrders } from "@/server/services/orderService";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/**
 * The customer's account: their orders, newest first, and their saved
 * addresses. Everything here is read for the signed-in customer only, on the
 * server.
 */
export default async function AccountPage() {
  const user = await requireUser("/account");
  const [orders, addresses] = await Promise.all([listOrders(user.id), listAddresses(user.id)]);

  return (
    <Section tone="white" size="sm">
      <Container>
        <Breadcrumbs items={[{ label: "Your account" }]} />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="t-h1">Hello, {user.name?.split(" ")[0] ?? "there"}</h1>
            <p className="mt-2 text-[0.9375rem] text-ink-2">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-[0.875rem] font-medium text-ink transition-colors hover:border-green-700 hover:text-green-700"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <section aria-labelledby="my-orders" className="lg:col-span-8">
            <h2 id="my-orders" className="t-h3 flex items-center gap-2">
              <Package className="size-5 text-green-700" aria-hidden="true" />
              Your orders
            </h2>
            {orders.length === 0 ? (
              <div className="mt-4 rounded-lg border border-line p-8 text-center">
                <p className="text-[0.9375rem] text-ink-2">You haven&rsquo;t placed an order yet.</p>
                <ButtonLink href="/products" className="mt-5">
                  Explore our products
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {orders.map((o) => (
                  <li key={o.orderNumber}>
                    <Link
                      href={`/account/orders/${o.orderNumber}`}
                      className="block rounded-lg border border-line p-4 transition-colors hover:border-green-700/40 hover:shadow-[0_10px_24px_-18px_rgba(15,74,44,0.45)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-ink">{o.orderNumber}</span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold",
                            statusTone(o.status),
                          )}
                        >
                          {ORDER_STATUS_LABEL[o.status]}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[0.875rem] text-ink-2">
                        {o.firstItems.join(", ")}
                        {o.moreItems > 0 ? ` and ${o.moreItems} more` : ""}
                      </p>
                      <p className="mt-2 text-[0.8125rem] text-ink-3">
                        {dateFormat.format(o.placedAt)} · {o.itemCount}{" "}
                        {o.itemCount === 1 ? "item" : "items"} · {PAYMENT_LABEL[o.paymentMethod]} ·{" "}
                        <span className="font-semibold text-ink">{formatPrice(o.totalMinor)}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="my-addresses" className="lg:col-span-4">
            <h2 id="my-addresses" className="t-h3 flex items-center gap-2">
              <MapPin className="size-5 text-green-700" aria-hidden="true" />
              Saved addresses
            </h2>
            {addresses.length === 0 ? (
              <p className="mt-4 text-[0.9375rem] text-ink-2">
                Addresses you deliver to are saved here when you place an order.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {addresses.map((a) => (
                  <li key={a.id} className="rounded-lg border border-line p-4 text-[0.875rem] leading-relaxed">
                    <span className="font-semibold text-ink">{a.fullName}</span>
                    <span className="ml-2 rounded-sm bg-surface px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-3">
                      {a.kind}
                    </span>
                    <span className="block text-ink-2">+91 {a.mobile}</span>
                    <span className="block text-ink-2">{formatAddress(a)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Container>
    </Section>
  );
}
