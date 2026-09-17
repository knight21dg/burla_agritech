import "server-only";
import { and, asc, desc, eq, ilike, ne } from "drizzle-orm";
import { db } from "@burla/core/db";
import { inventoryMovements, productVariants, products, users } from "@burla/core/db/schema";
import { requireCapability, type Actor } from "@burla/core/auth/rbac";
import { writeAudit } from "@burla/core/repositories/audit";
import { countAfterSet, stockState, type PackStock, type StockState } from "@/lib/stock";
import { revalidateStorefront } from "@/server/storefront";

/**
 * The Stock screen: how many packets there are of every pack size, supply
 * coming in, and counts corrected.
 *
 * Every change goes through `inventory_movements`, the append-only ledger; a
 * database trigger keeps `product_variants.stock_quantity` equal to its sum,
 * so "why is this number what it is?" can always be answered. The pack row is
 * locked while a change is made, so an order placed at the same moment is
 * counted exactly once.
 */

export type StockShow = "all" | "low" | "out" | "not_counted";

export interface StockPack extends PackStock {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  onWebsite: boolean;
  state: StockState;
}

export async function listStock(options: { show?: StockShow; search?: string }) {
  const rows = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      productStatus: products.status,
      size: productVariants.label,
      grams: productVariants.netWeightGrams,
      counted: productVariants.trackInventory,
      quantity: productVariants.stockQuantity,
      lowLevel: productVariants.lowStockThreshold,
      status: productVariants.status,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        ne(productVariants.status, "removed"),
        ne(products.status, "archived"),
        options.search ? ilike(products.name, `%${options.search}%`) : undefined,
      ),
    )
    .orderBy(asc(products.name), asc(productVariants.netWeightGrams));

  const packs: StockPack[] = rows.map((row) => {
    const pack = { counted: row.counted, quantity: row.quantity, lowLevel: row.lowLevel, onSale: row.status === "active" };
    return {
      ...pack,
      variantId: row.variantId,
      productId: row.productId,
      productName: row.productName,
      size: row.size,
      onWebsite: row.productStatus === "published",
      state: stockState(pack),
    };
  });

  const counts = {
    all: packs.length,
    low: packs.filter((p) => p.state === "running_low").length,
    out: packs.filter((p) => p.state === "none_left" || p.state === "marked_out").length,
    not_counted: packs.filter((p) => p.state === "not_counted").length,
  };

  const show = options.show ?? "all";
  const shown = packs.filter((p) =>
    show === "low"
      ? p.state === "running_low"
      : show === "out"
        ? p.state === "none_left" || p.state === "marked_out"
        : show === "not_counted"
          ? p.state === "not_counted"
          : true,
  );

  // One group per product, in name order.
  const groups: { productId: string; productName: string; onWebsite: boolean; packs: StockPack[] }[] = [];
  for (const pack of shown) {
    const last = groups[groups.length - 1];
    if (last && last.productId === pack.productId) last.packs.push(pack);
    else groups.push({ productId: pack.productId, productName: pack.productName, onWebsite: pack.onWebsite, packs: [pack] });
  }

  return { groups, counts };
}

const REASON_WORDS: Record<string, string> = {
  order: "Ordered on the website",
  order_cancelled: "Order cancelled — put back",
  restock: "Supply received",
  correction: "Count corrected",
  adjustment: "Count corrected",
  return: "Returned",
  damage: "Damaged",
};

/** The latest stock changes, newest first, in sentences. */
export async function recentStockChanges(limit = 20) {
  const rows = await db
    .select({
      id: inventoryMovements.id,
      delta: inventoryMovements.delta,
      reason: inventoryMovements.reason,
      at: inventoryMovements.createdAt,
      by: users.name,
      productName: products.name,
      size: productVariants.label,
    })
    .from(inventoryMovements)
    .innerJoin(productVariants, eq(productVariants.id, inventoryMovements.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(users, eq(users.id, inventoryMovements.createdBy))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    what: `${row.productName} ${row.size}`,
    change: row.delta > 0 ? `+${row.delta}` : String(row.delta),
    why: REASON_WORDS[row.reason] ?? "Changed",
    by: row.by,
    at: row.at,
  }));
}

/** Pack sizes whose count is low or at nothing — for the Home screen. */
export async function lowStockCount(): Promise<number> {
  const { counts } = await listStock({});
  return counts.low + counts.out;
}

type Change = { ok: true; message: string } | { ok: false; message: string };

/** Locks a live pack for a stock change, with what the messages need. */
async function lockPack(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], variantId: string) {
  const [pack] = await tx
    .select({
      id: productVariants.id,
      size: productVariants.label,
      counted: productVariants.trackInventory,
      quantity: productVariants.stockQuantity,
      status: productVariants.status,
      productName: products.name,
      slug: products.slug,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(eq(productVariants.id, variantId), ne(productVariants.status, "removed"), ne(products.status, "archived")))
    .for("update", { of: productVariants })
    .limit(1);
  return pack;
}

function actorId(actor: Actor) {
  return actor.kind === "user" ? actor.userId : null;
}

/** Supply came in: add packets. Counting starts if it had not, and a pack marked out of stock goes back on sale. */
export async function addSupply(actor: Actor, variantId: string, packets: number): Promise<Change> {
  requireCapability(actor, "inventory.adjust");
  if (packets < 1) return { ok: false, message: "Enter how many packets came in — at least 1." };

  let slug = "";
  const result = await db.transaction(async (tx): Promise<Change> => {
    const pack = await lockPack(tx, variantId);
    if (!pack) return { ok: false, message: "This pack size no longer exists." };
    slug = pack.slug;

    // Not counted before: start from nothing, not from an old leftover figure.
    const start = pack.counted ? pack.quantity : 0;
    if (!pack.counted && pack.quantity !== 0) {
      await tx.insert(inventoryMovements).values({
        variantId, delta: -pack.quantity, reason: "correction", note: "Counting started", createdBy: actorId(actor),
      });
    }
    await tx.insert(inventoryMovements).values({
      variantId, delta: packets, reason: "restock", createdBy: actorId(actor),
    });
    await tx
      .update(productVariants)
      .set({ trackInventory: true, ...(pack.status === "inactive" ? { status: "active" as const } : {}) })
      .where(eq(productVariants.id, variantId));

    const now = start + packets;
    await writeAudit(tx, actor, {
      action: "stock.supply_added",
      entityType: "product_variant",
      entityId: variantId,
      changes: { name: `${pack.productName} ${pack.size}`, added: packets, now },
    });
    return {
      ok: true,
      message: `Added ${packets}. ${pack.productName} ${pack.size} now has ${now} ${now === 1 ? "packet" : "packets"}.`,
    };
  });

  if (result.ok) await revalidateStorefront({ catalogue: true, productSlug: slug });
  return result;
}

/** Set the count to what is really on the shelf. */
export async function setCount(actor: Actor, variantId: string, wanted: number, seen?: number): Promise<Change> {
  requireCapability(actor, "inventory.adjust");

  let slug = "";
  const result = await db.transaction(async (tx): Promise<Change> => {
    const pack = await lockPack(tx, variantId);
    if (!pack) return { ok: false, message: "This pack size no longer exists." };
    slug = pack.slug;

    const current = pack.counted ? pack.quantity : 0;
    if (!pack.counted && pack.quantity !== 0) {
      await tx.insert(inventoryMovements).values({
        variantId, delta: -pack.quantity, reason: "correction", note: "Counting started", createdBy: actorId(actor),
      });
    }
    const target = countAfterSet(current, pack.counted ? seen : undefined, wanted);
    if (target !== current) {
      await tx.insert(inventoryMovements).values({
        variantId, delta: target - current, reason: "correction", createdBy: actorId(actor),
      });
    }
    await tx
      .update(productVariants)
      .set({
        trackInventory: true,
        ...(pack.status === "inactive" && target > 0 ? { status: "active" as const } : {}),
      })
      .where(eq(productVariants.id, variantId));

    await writeAudit(tx, actor, {
      action: "stock.count_set",
      entityType: "product_variant",
      entityId: variantId,
      changes: { name: `${pack.productName} ${pack.size}`, from: pack.counted ? current : null, now: target },
    });

    const note = target !== wanted ? ` (${wanted - target} sold while you were counting)` : "";
    return {
      ok: true,
      message: `${pack.productName} ${pack.size} now has ${target} ${target === 1 ? "packet" : "packets"}${note}.`,
    };
  });

  if (result.ok) await revalidateStorefront({ catalogue: true, productSlug: slug });
  return result;
}

/** Stop counting: the pack is simply on sale again, with no number. */
export async function stopCounting(actor: Actor, variantId: string): Promise<Change> {
  requireCapability(actor, "inventory.adjust");

  let slug = "";
  const result = await db.transaction(async (tx): Promise<Change> => {
    const pack = await lockPack(tx, variantId);
    if (!pack) return { ok: false, message: "This pack size no longer exists." };
    slug = pack.slug;
    if (!pack.counted) return { ok: true, message: `${pack.productName} ${pack.size} is not being counted.` };

    if (pack.quantity !== 0) {
      await tx.insert(inventoryMovements).values({
        variantId, delta: -pack.quantity, reason: "correction", note: "Counting stopped", createdBy: actorId(actor),
      });
    }
    await tx.update(productVariants).set({ trackInventory: false }).where(eq(productVariants.id, variantId));
    await writeAudit(tx, actor, {
      action: "stock.counting_stopped",
      entityType: "product_variant",
      entityId: variantId,
      changes: { name: `${pack.productName} ${pack.size}` },
    });
    return { ok: true, message: `${pack.productName} ${pack.size} is no longer counted. The website shows it as in stock.` };
  });

  if (result.ok) await revalidateStorefront({ catalogue: true, productSlug: slug });
  return result;
}
