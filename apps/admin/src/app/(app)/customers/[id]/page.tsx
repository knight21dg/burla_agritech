import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Mail, Phone } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { AccountSwitch } from "@/components/customers/AccountSwitch";
import { requirePermission } from "@/server/auth/session";
import { getCustomer } from "@/server/customers";
import { ORDER_LABEL, ORDER_TONE } from "@/lib/orderSteps";
import { isUuid } from "@/lib/ids";
import { money, when } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("customer.read_pii");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Customers
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="page-title">{customer.name}</h1>
          <span className={cn("pill", customer.active ? "pill-on" : "pill-bad")}>
            {customer.active ? "Active" : "Deactivated"}
          </span>
        </div>
        <p className="mt-0.5 text-ink-2">Customer since {when(customer.joinedAt)}</p>
      </div>

      {!customer.active && (
        <p className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-danger">
          This account is deactivated. {customer.name} cannot sign in, and the website does not take orders from{" "}
          {customer.phones.length ? customer.phones.join(", ") : "their phone number"}.
        </p>
      )}

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Account details</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="hint">Name</dt>
            <dd className="font-medium">{customer.name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="hint">Email</dt>
            <dd className="break-words font-medium">{customer.email}</dd>
          </div>
          <div>
            <dt className="hint">Phone</dt>
            <dd className="font-medium">{customer.phones.length ? customer.phones.join(", ") : "Not given yet"}</dd>
          </div>
          <div>
            <dt className="hint">Account</dt>
            <dd className={cn("font-medium", !customer.active && "text-danger")}>
              {customer.active ? "Active — can sign in and shop" : "Deactivated — cannot sign in or shop"}
            </dd>
          </div>
          <div>
            <dt className="hint">Joined</dt>
            <dd className="font-medium">{when(customer.joinedAt)}</dd>
          </div>
          <div>
            <dt className="hint">Last signed in</dt>
            <dd className="font-medium">{customer.lastSignInAt ? when(customer.lastSignInAt) : "Not recorded"}</dd>
          </div>
          <div>
            <dt className="hint">Saved addresses</dt>
            <dd className="font-medium">{customer.addresses.length}</dd>
          </div>
        </dl>

        {can(actor, "user.manage") && (
          <div className="mt-4 border-t border-line pt-4">
            <AccountSwitch
              customerId={customer.id}
              name={customer.name}
              active={customer.active}
              phones={customer.phones}
            />
          </div>
        )}
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Contact</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="btn btn-quiet">
              <Phone className="size-4" aria-hidden="true" />
              {customer.phone}
            </a>
          )}
          <a href={`mailto:${customer.email}`} className="btn btn-quiet">
            <Mail className="size-4" aria-hidden="true" />
            {customer.email}
          </a>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="hint">Orders</dt>
            <dd className="text-xl font-semibold">{customer.orders.length}</dd>
          </div>
          <div className="rounded-md bg-surface px-3 py-2">
            <dt className="hint">Spent</dt>
            <dd className="text-xl font-semibold">{money(customer.spentMinor)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.0625rem] font-semibold">Orders</h2>
        {customer.orders.length === 0 ? (
          <p className="mt-2 text-ink-2">No orders yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {customer.orders.map((order) => (
              <li key={order.orderNumber}>
                <Link href={`/orders/${order.orderNumber}`} className="flex items-center gap-3 py-2.5 hover:text-accent">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-[0.875rem] text-ink-3">{when(order.placedAt)}</p>
                  </div>
                  <span className={cn("pill", ORDER_TONE[order.status])}>{ORDER_LABEL[order.status]}</span>
                  <span className="w-20 shrink-0 text-right font-semibold tabular-nums">{money(order.totalMinor)}</span>
                  <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {customer.addresses.length > 0 && (
        <section className="panel p-4 sm:p-5">
          <h2 className="text-[1.0625rem] font-semibold">Saved addresses</h2>
          <ul className="mt-2 space-y-3">
            {customer.addresses.map((address) => (
              <li key={address.id}>
                <address className="not-italic text-ink-2">
                  <span className="font-medium text-ink">{address.fullName}</span> · {address.phone}
                  <br />
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  {address.landmark ? `, near ${address.landmark}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                </address>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
