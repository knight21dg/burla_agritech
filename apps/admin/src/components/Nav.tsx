import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  FileText,
  Images,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { can, type Actor, type Capability } from "@burla/core/auth/rbac";

/**
 * The navigation, filtered by what this actor may do.
 *
 * Hiding a link is a courtesy, not a control: every page behind these links
 * calls `requirePermission` itself, and typing the URL of a page you may not
 * see is refused there. The filter exists so an order manager is not shown
 * eight doors that will not open.
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
  {
    href: "/products",
    label: "Products",
    icon: Package,
    capability: "catalogue.read_draft",
    built: false,
  },
  {
    href: "/categories",
    label: "Categories",
    icon: Tags,
    capability: "catalogue.write",
    built: false,
  },
  {
    href: "/media",
    label: "Images",
    icon: Images,
    capability: "catalogue.write",
    built: false,
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Boxes,
    capability: "inventory.adjust",
    built: false,
  },
  {
    href: "/orders",
    label: "Orders",
    icon: ClipboardList,
    capability: "order.read_all",
    built: false,
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
    capability: "customer.read_pii",
    built: false,
  },
  {
    href: "/enquiries",
    label: "Enquiries",
    icon: MessageSquare,
    capability: "enquiry.read",
    built: false,
  },
  {
    href: "/content",
    label: "Content",
    icon: FileText,
    capability: "content.write",
    built: false,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    capability: "settings.write",
    built: false,
  },
  {
    href: "/audit",
    label: "Audit log",
    icon: ShieldCheck,
    capability: "audit.read",
    built: false,
  },
];

export function Nav({ actor }: { actor: Actor }) {
  const allowed = ITEMS.filter(
    (item) => !item.capability || can(actor, item.capability),
  );

  return (
    <nav aria-label="Sections" className="p-3">
      <ul className="space-y-0.5">
        {allowed.map((item) => {
          const Icon = item.icon;
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
                  className="flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[0.8125rem] font-medium text-ink hover:bg-surface"
                >
                  {inside}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title="Not built yet"
                  className="flex cursor-default items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[0.8125rem] text-ink-3"
                >
                  {inside}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
