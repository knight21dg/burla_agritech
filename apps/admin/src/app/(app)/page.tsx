import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, MessageSquare, Package, Pencil, Plus, ShoppingBag, Users } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requireStaff } from "@/server/auth/session";
import {
  customerCount,
  newEnquiryCount,
  orderCounts,
  productCount,
} from "@/server/repositories/dashboardRepository";

export const metadata: Metadata = { title: "Home" };

/**
 * Home — what needs attention, and the things people come here to do.
 *
 * Four numbers, each a link to the list behind it, and big buttons for the
 * everyday jobs. No charts: a small business does not need a graph to know
 * whether an order came in.
 */

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Card({
  href,
  label,
  value,
  note,
  highlight = false,
}: {
  href: string;
  label: string;
  value: number;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`panel block p-4 transition-colors hover:border-accent ${highlight ? "border-accent bg-accent-soft" : ""}`}
    >
      <p className="font-medium text-ink-2">{label}</p>
      <p className="mt-1 text-[2rem] font-semibold leading-none tabular-nums">{value}</p>
      {note && <p className={`mt-2 text-[0.875rem] ${highlight ? "font-semibold text-accent-dark" : "text-ink-3"}`}>{note}</p>}
    </Link>
  );
}

function Action({ href, icon: Icon, label }: { href: string; icon: typeof Plus; label: string }) {
  return (
    <Link href={href} className="panel flex min-h-16 items-center gap-3 px-4 py-3 text-[1.0625rem] font-semibold hover:border-accent hover:text-accent-dark">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-dark">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      {label}
    </Link>
  );
}

export default async function HomePage() {
  const actor = await requireStaff();
  const name = actor.kind === "user" ? actor.name : null;

  const seeCatalogue = can(actor, "catalogue.read_draft");
  const seeOrders = can(actor, "order.read_all");
  const seeCustomers = can(actor, "customer.read_pii");
  const seeEnquiries = can(actor, "enquiry.read");

  const [products, orders, customers, enquiries] = await Promise.all([
    seeCatalogue ? productCount() : undefined,
    seeOrders ? orderCounts() : undefined,
    seeCustomers ? customerCount() : undefined,
    seeEnquiries ? newEnquiryCount() : undefined,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          {greeting()}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-0.5 text-ink-2">Welcome to Burla. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {products !== undefined && <Card href="/products" label="Products" value={products} />}
        {orders && (
          <Card
            href={orders.new > 0 ? "/orders?show=new" : "/orders"}
            label="Orders"
            value={orders.total}
            note={orders.new > 0 ? `${orders.new} new — needs attention` : "No new orders"}
            highlight={orders.new > 0}
          />
        )}
        {customers !== undefined && <Card href="/customers" label="Customers" value={customers} />}
        {enquiries !== undefined && (
          <Card
            href="/enquiries"
            label="New Enquiries"
            value={enquiries}
            note={enquiries > 0 ? "Waiting for a reply" : "All caught up"}
            highlight={enquiries > 0}
          />
        )}
      </div>

      <section>
        <h2 className="text-[1.125rem] font-semibold">What would you like to do?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {can(actor, "catalogue.write") && <Action href="/products/new" icon={Plus} label="Add Product" />}
          {seeCatalogue && <Action href="/products" icon={Pencil} label="Edit Products" />}
          {can(actor, "catalogue.write") && <Action href="/categories" icon={FolderOpen} label="Manage Categories" />}
          {seeOrders && <Action href="/orders" icon={Package} label="View Orders" />}
          {seeEnquiries && <Action href="/enquiries" icon={MessageSquare} label="View Enquiries" />}
          {seeCustomers && <Action href="/customers" icon={Users} label="View Customers" />}
          {can(actor, "content.write") && <Action href="/website" icon={ShoppingBag} label="Change the Homepage" />}
        </div>
      </section>
    </div>
  );
}
