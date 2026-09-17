"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FolderOpen,
  House,
  Menu,
  MessageSquare,
  Monitor,
  Package,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import type { Capability } from "@burla/core/auth/rbac";
import { cn } from "@/lib/cn";

/**
 * The menu. Nine places, in the words a business owner uses, and nothing
 * that is not finished — an unfinished section is hidden, never shown with a
 * "coming soon".
 *
 * Filtered by what this person may do. That is a courtesy, not a lock: every
 * page and every action checks permission again on the server.
 *
 * On a phone the menu folds behind a button, so each page starts at the top
 * of the screen instead of below a list of links.
 */

interface Item {
  href: string;
  label: string;
  icon: typeof House;
  capability?: Capability;
}

const ITEMS: Item[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/products", label: "Products", icon: ShoppingBag, capability: "catalogue.read_draft" },
  { href: "/stock", label: "Stock", icon: Boxes, capability: "inventory.adjust" },
  { href: "/categories", label: "Categories", icon: FolderOpen, capability: "catalogue.read_draft" },
  { href: "/orders", label: "Orders", icon: Package, capability: "order.read_all" },
  { href: "/customers", label: "Customers", icon: Users, capability: "customer.read_pii" },
  { href: "/enquiries", label: "Enquiries", icon: MessageSquare, capability: "enquiry.read" },
  { href: "/website", label: "Website", icon: Monitor, capability: "content.write" },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ capabilities }: { capabilities: Capability[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const held = new Set(capabilities);
  const allowed = ITEMS.filter((item) => !item.capability || held.has(item.capability));
  const current = allowed.find((item) => isCurrent(pathname, item.href));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="admin-menu"
        className="flex min-h-12 w-full items-center justify-between gap-2 border-b border-line px-4 text-[1rem] font-semibold md:hidden"
      >
        <span className="flex items-center gap-2">
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          {open ? "Close menu" : "Menu"}
        </span>
        {!open && current && <span className="font-normal text-ink-2">{current.label}</span>}
      </button>

      <nav id="admin-menu" aria-label="Menu" className={cn("p-3 md:block", open ? "block" : "hidden")}>
        <ul className="space-y-1">
          {allowed.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-[1rem] font-medium",
                    active ? "bg-accent text-white" : "text-ink hover:bg-accent-soft",
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
