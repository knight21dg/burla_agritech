import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, CheckCircle2, XCircle } from "lucide-react";
import { CancelOrderButton } from "@/components/account/CancelOrderButton";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container, Section } from "@/components/ui/Section";
import { PAYMENT_LABEL, formatAddress } from "@/lib/checkout";
import { ORDER_MILESTONES, ORDER_STATUS_LABEL, milestoneIndex, statusTone } from "@/lib/orders";
import { cn, formatPrice } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { getOrder, isCancellable } from "@/server/services/orderService";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

const when = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/**
 * One of the customer's orders: where it is, what is in it, what it cost,
 * where it is going, and its history. Found only for the customer who placed
 * it — anyone else gets "not found", never a hint that it exists.
 *
 * Arriving with ?placed=1 (straight from checkout) opens with the
 * confirmation.
 */
export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { orderNumber } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/account/orders/${orderNumber}`);
  const detail = await getOrder(user.id, orderNumber);
  if (!detail) notFound();

  const { order, items, events } = detail;
  const a = order.shippingAddress;
  const reached = milestoneIndex(order.status);
  const offPath = reached < 0;

  return (
    <Section tone="white" size="sm">
      <Container>
        <Breadcrumbs
          items={[{ label: "Your account", href: "/account" }, { label: order.orderNumber }]}
        />

        {placed === "1" && order.status !== "cancelled" && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-lg border border-green-700/30 bg-green-50 p-5"
          >
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-700" aria-hidden="true" />
            <div>
              <p className="text-[1.0625rem] font-semibold text-ink">
                Thank you — your order is placed.
              </p>
              <p className="mt-1 text-[0.9375rem] text-ink-2">
                Order {order.orderNumber}.{" "}
                {order.paymentMethod === "cod"
                  ? `Please keep ${formatPrice(order.totalMinor)} ready to pay in cash on delivery.`
                  : "We'll let you know when it ships."}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="t-h2">Order {order.orderNumber}</h1>
            <p className="mt-1 text-[0.875rem] text-ink-3">Placed {when.format(order.placedAt)}</p>
          </div>
          <span
            className={cn("rounded-full px-3 py-1 text-[0.8125rem] font-semibold", statusTone(order.status))}
          >
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>

        {/* Progress, as a line of milestones; replaced by a note when the
            order left the path (cancelled, failed, refunded). */}
        {offPath ? (
          <p className="mt-6 flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-[0.9375rem] text-ink-2">
            <XCircle className="size-5 text-danger" aria-hidden="true" />
            This order was {ORDER_STATUS_LABEL[order.status].toLowerCase()}
            {order.cancelledAt ? ` on ${when.format(order.cancelledAt)}` : ""}.
          </p>
        ) : (
          <ol className="mt-8 grid grid-cols-4" aria-label="Order progress">
            {ORDER_MILESTONES.map((m, i) => {
              const done = i <= reached;
              return (
                <li key={m.status} className="relative flex flex-col items-center text-center">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute right-1/2 top-3 h-0.5 w-full",
                        i <= reached ? "bg-green-700" : "bg-line",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "relative grid size-6 place-items-center rounded-full border-2",
                      done ? "border-green-700 bg-green-700 text-white" : "border-line bg-white",
                    )}
                  >
                    {done && <Check className="size-3.5" aria-hidden="true" />}
                  </span>
                  <span
                    className={cn("mt-2 text-[0.8125rem]", done ? "font-semibold text-ink" : "text-ink-3")}
                  >
                    {m.label}
                    <span className="sr-only">{done ? " — done" : " — to come"}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {order.trackingNumber && (
          <p className="mt-6 text-[0.9375rem] text-ink-2">
            Shipped with <span className="font-semibold text-ink">{order.courierName}</span> — tracking
            number <span className="font-semibold text-ink">{order.trackingNumber}</span>
          </p>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <section aria-labelledby="order-items" className="lg:col-span-8">
            <h2 id="order-items" className="t-label text-ink-3">
              Items
            </h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/products/p/${item.productSlug}`}
                      className="text-[0.9375rem] font-medium text-ink hover:text-green-700"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-[0.8125rem] text-ink-3">
                      {item.variantLabel} · {formatPrice(item.unitPriceMinor)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums text-ink">
                    {formatPrice(item.lineTotalMinor)}
                  </p>
                </li>
              ))}
            </ul>

            <h2 className="t-label mt-8 text-ink-3">History</h2>
            <ol className="mt-3 space-y-2 text-[0.875rem]">
              {events.map((e) => (
                <li key={e.id} className="flex flex-wrap gap-x-3 text-ink-2">
                  <span className="tabular-nums text-ink-3">{when.format(e.createdAt)}</span>
                  <span>
                    <span className="font-medium text-ink">{ORDER_STATUS_LABEL[e.toStatus]}</span>
                    {e.note ? ` — ${e.note}` : ""}
                  </span>
                </li>
              ))}
            </ol>

            {isCancellable(order.status) && (
              <div className="mt-8">
                <CancelOrderButton orderNumber={order.orderNumber} />
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-lg border border-line p-5">
              <h2 className="t-label text-ink-3">Payment</h2>
              <dl className="mt-3 space-y-2 text-[0.9375rem]">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Items</dt>
                  <dd className="tabular-nums">{formatPrice(order.subtotalMinor)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Delivery</dt>
                  <dd className="tabular-nums">
                    {order.shippingMinor === 0 ? "Free" : formatPrice(order.shippingMinor)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-2 font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatPrice(order.totalMinor)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[0.875rem] text-ink-2">
                {PAYMENT_LABEL[order.paymentMethod]}
                {order.paymentStatus === "paid" ? " · Paid" : order.paymentMethod === "cod" ? " · Pay on delivery" : ""}
              </p>
            </div>

            <div className="rounded-lg border border-line p-5 text-[0.9375rem] leading-relaxed">
              <h2 className="t-label text-ink-3">Delivering to</h2>
              <p className="mt-3 font-semibold text-ink">{a.fullName}</p>
              <p className="text-ink-2">+91 {a.mobile}</p>
              <p className="text-ink-2">{formatAddress(a)}</p>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
