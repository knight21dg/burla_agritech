"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  FileText,
  Images,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  X,
} from "lucide-react";
import type { Capability } from "@burla/core/auth/rbac";
import { cn } from "@/lib/cn";

/**
 * The navigation, filtered by what this actor may do.
 *
 * Hiding a link is a courtesy, not a control: every page behind these links
 * calls `requirePermission` itself, and typing the URL of a page you may not
 * see is refused there. The filter exists so an order manager is not shown
 * eight doors that will not open. That is also why it may run in the browser
 * — the capability list it receives decides nothing.
 *
 * The current section is marked with `aria-current`, so a screen reader says
 * where you are and the highlight is not a matter of colour alone.
 *
 * On a phone the list folds behind a Menu button. Otherwise all eleven items
 * sit above the page on every screen, and the page starts half way down.
 *
 * `built: false` items are listed because a tool that hides its own roadmap
 * makes staff wonder whether they are looking in the wrong place. They are
 * plainly marked and do not link anywhere.
 */

interface Item {
  href: string;
  label: string;
  icon: typeof Package;
  capability?: Capability;
  built: boolean;
}

const ITEMS: Item[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, built: true },
  { href: "/products", label: "Products", icon: Package, capability: "catalogue.read_draft", built: true },
  { href: "/categories", label: "Categories", icon: Tags, capability: "catalogue.read_draft", built: true },
  { href: "/media", label: "Images", icon: Images, capability: "catalogue.write", built: false },
  { href: "/inventory", label: "Inventory", icon: Boxes, capability: "inventory.adjust", built: false },
  { href: "/orders", label: "Orders", icon: ClipboardList, capability: "order.read_all", built: false },
  { href: "/customers", label: "Customers", icon: Users, capability: "customer.read_pii", built: false },
  { href: "/enquiries", label: "Enquiries", icon: MessageSquare, capability: "enquiry.read", built: false },
  { href: "/content", label: "Content", icon: FileText, capability: "content.write", built: false },
  { href: "/settings", label: "Settings", icon: Settings, capability: "settings.write", built: false },
  { href: "/audit", label: "Audit log", icon: ShieldCheck, capability: "audit.read", built: false },
];

/** `/products/abc` is inside Products; `/` is only ever the dashboard itself. */
function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ capabilities }: { capabilities: Capability[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Choosing a section on a phone closes the menu behind it.
  useEffect(() => setOpen(false), [pathname]);

  const held = new Set(capabilities);
  const allowed = ITEMS.filter((item) => !item.capability || held.has(item.capability));
  const current = allowed.find((item) => item.built && isCurrent(pathname, item.href));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="admin-sections"
        className="flex w-full items-center justify-between gap-2 border-b border-line px-4 py-2.5 text-[0.8125rem] font-medium md:hidden"
      >
        <span className="flex items-center gap-2">
          {open ? (
            <X className="size-4" aria-hidden="true" />
          ) : (
            <Menu className="size-4" aria-hidden="true" />
          )}
          {open ? "Close menu" : "Menu"}
        </span>
        {!open && current && <span className="text-ink-3">{current.label}</span>}
      </button>

      <nav
        id="admin-sections"
        aria-label="Sections"
        className={cn("p-3 md:block", open ? "block" : "hidden")}
      >
        <ul className="space-y-0.5">
          {allowed.map((item) => {
            const Icon = item.icon;
            const active = item.built && isCurrent(pathname, item.href);
            const inside = (
              <>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
                {!item.built && (
                  <span className="ml-auto text-[0.625rem] uppercase tracking-wide text-ink-3">
                    Soon
                  </span>
                )}
              </>
            );

            return (
              <li key={item.href}>
                {item.built ? (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[0.8125rem] font-medium md:py-1.5",
                      active
                        ? "bg-accent-soft text-accent-dark"
                        : "text-ink hover:bg-surface",
                    )}
                  >
                    {inside}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Not built yet"
                    className="flex cursor-default items-center gap-2.5 rounded-sm px-2.5 py-2 text-[0.8125rem] text-ink-3 md:py-1.5"
                  >
                    {inside}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
