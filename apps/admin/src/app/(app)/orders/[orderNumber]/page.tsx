import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requirePermission } from "@/server/auth/session";
import { getOrder } from "@/server/orders";
import { CAN_CANCEL, NEXT_STEPS, ORDER_LABEL, ORDER_TONE, needsRefund, paymentLabel } from "@/lib/orderSteps";
import { money, when } from "@/lib/format";
import { cn } from "@/lib/cn";
import { OrderActions } from "@/components/orders/OrderActions";

export const metadata: Metadata = { title: "Order" };

/** Digits for a WhatsApp link, assuming an Indian number when no code is given. */
function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const actor = await requirePermission("order.read_all");
  const { orderNumber } = await params;
  if (!/^BGA-\d{4}-\d{5,}$/.test(orderNumber)) notFound();

  const order = await getOrder(orderNumber);
  if (!order) notFound();

  const address = order.shippingAddress;
  const canAct = can(actor, "order.transition");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="page-title">Order {order.orderNumber}</h1>
          <span className={cn("pill", ORDER_TONE[order.status])}>{ORDER_LABEL[order.status]}</span>
        </div>
        <p className="mt-0.5 text-ink-2">Placed {when(order.placedAt)}</p>
      </div>

      {canAct && (NEXT_STEPS[order.status] || CAN_CANCEL.includes(order.status)) ? (
        <OrderActions
          orderNumber={order.orderNumber}
          steps={NEXT_STEPS[order.status] ?? []}
          canCancel={CAN_CANCEL.includes(order.status)}
          isNew={order.status === "confirmed"}
          paidOnline={needsRefund(order.paymentMethod, order.paymentStatus) ? money(order.totalMinor) : undefined}
        />
      ) : (
        <p className="panel px-4 py-3 font-medium text-ink-2 sm:px-5">
          {order.status === "delivered"
            ? "This order is complete. Nothing more to do."
            : order.status === "cancelled"
              ? "This order was cancelled. Nothing more to do."
              : `This order is ${ORDER_LABEL[order.status].toLowerCase()}.`}
        </p>
      )}

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Customer</h2>
        <p className="mt-2 text-[1.0625rem] font-semibold">{order.contactName}</p>
        <p className="text-ink-2">{order.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${order.contactPhone}`} className="btn btn-quiet">
            <Phone className="size-4" aria-hidden="true" />
            Call {order.contactPhone}
          </a>
          <a
            href={`https://wa.me/${whatsappNumber(order.contactPhone)}?text=${encodeURIComponent(`Hello ${order.contactName}, this is Burla about your order ${order.orderNumber}.`)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-quiet"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp
          </a>
        </div>

        <h3 className="mt-4 text-[0.9375rem] font-semibold">Deliver to</h3>
        <address className="mt-1 not-italic text-ink-2">
          {address.fullName}
          <br />
          {address.line1}
          {address.line2 && (
            <>
              <br />
              {address.line2}
            </>
          )}
          {address.landmark && (
            <>
              <br />
              Near {address.landmark}
            </>
          )}
          <br />
          {address.city}, {address.state} {address.pincode}
          <br />
          Phone {address.mobile}
        </address>
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Products</h2>
        <ul className="mt-2 divide-y divide-line">
          {order.items.map((item, index) => (
            <li key={index} className="flex items-baseline justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-medium">{item.productName}</p>
                <p className="text-[0.875rem] text-ink-3">
                  {item.size} · {item.quantity} × {money(item.unitPriceMinor)}
                </p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">{money(item.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-line pt-3">
          <div className="flex justify-between text-ink-2">
            <dt>Products</dt>
            <dd className="tabular-nums">{money(order.subtotalMinor)}</dd>
          </div>
          <div className="flex justify-between text-ink-2">
            <dt>Delivery</dt>
            <dd className="tabular-nums">{order.shippingMinor ? money(order.shippingMinor) : "Free"}</dd>
          </div>
          {order.discountMinor > 0 && (
            <div className="flex justify-between text-ink-2">
              <dt>Discount</dt>
              <dd className="tabular-nums">−{money(order.discountMinor)}</dd>
            </div>
          )}
          <div className="flex justify-between text-[1.125rem] font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(order.totalMinor)}</dd>
          </div>
        </dl>
        <p className="mt-3 rounded-md bg-surface px-3 py-2 font-medium">
          {paymentLabel(order.paymentMethod, order.paymentStatus)}
        </p>
      </section>

      {order.events.length > 0 && (
        <section className="panel p-4 sm:p-5">
          <h2 className="text-[1.0625rem] font-semibold">History</h2>
          <ol className="mt-2 space-y-2">
            {order.events.map((event, index) => (
              <li key={index} className="flex flex-wrap justify-between gap-x-3 text-[0.9375rem]">
                <span>
                  <span className="font-medium">{ORDER_LABEL[event.to]}</span>
                  {event.by && <span className="text-ink-3"> by {event.by}</span>}
                  {event.note && <span className="text-ink-3"> — {event.note}</span>}
                </span>
                <span className="text-ink-3">{when(event.at)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
