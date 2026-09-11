"use client";

import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Check, Info, Loader2, Lock, ShoppingCart } from "lucide-react";
import { placeOrder, type PlaceOrderResult } from "@/app/checkout/actions";
import { useCart } from "@/components/cart/cartStore";
import { cartTotals, resolveLines } from "@/components/cart/lines";
import { PriceDetails } from "@/components/cart/PriceDetails";
import { ProductPhoto } from "@/components/product/ProductPhoto";
import { Button, ButtonLink } from "@/components/ui/Button";
import { productHref } from "@/data/catalog";
import { PAYMENT_LABEL, formatAddress, type Address, type PaymentMethod } from "@/lib/checkout";
import { cn, formatPrice } from "@/lib/utils";
import { AddressForm } from "./AddressForm";
import { PaymentOptions } from "./PaymentOptions";

type Step = "address" | "payment" | "review";
const STEPS: Step[] = ["address", "payment", "review"];

const noop = () => () => {};

/**
 * Checkout, laid out as Flipkart's: the steps down one page — delivery
 * address, payment method, review — each collapsing to a one-line summary
 * with "Change" once done, and the price details beside them.
 *
 * Nothing here decides what the order costs. "Place order" sends the address,
 * the payment method and the cart's references to the server (`placeOrder`),
 * which checks and prices everything itself.
 */
export function CheckoutView() {
  const { items } = useCart();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<Address>();
  const [payment, setPayment] = useState<PaymentMethod>();
  const [result, setResult] = useState<PlaceOrderResult>();
  const [placing, startPlacing] = useTransition();

  if (!hydrated) return <div className="min-h-[40vh]" aria-busy="true" />;

  const lines = resolveLines(items);
  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingCart className="mx-auto size-10 text-ink-3" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="t-h3 mt-4">Your cart is empty</h2>
        <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-ink-2">
          Add something to your cart, then come back here to check out.
        </p>
        <ButtonLink href="/products" className="mt-6">
          Explore our products
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    );
  }

  const { count, unpriced, subtotalMinor } = cartTotals(lines);
  const reached = (s: Step) => STEPS.indexOf(s) <= STEPS.indexOf(step);

  function place() {
    if (!address || !payment) return;
    setResult(undefined);
    startPlacing(async () => {
      const outcome = await placeOrder({
        address,
        paymentMethod: payment,
        lines: items.map(({ slug, variantId, qty }) => ({
          slug,
          ...(variantId ? { variantId } : {}),
          qty,
        })),
      });
      setResult(outcome);
      // The server found a problem with the address itself: reopen it.
      if (!outcome.ok && outcome.code === "INVALID") setStep("address");
    });
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="space-y-4 lg:col-span-8">
        {unpriced > 0 && (
          <p className="flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-[0.875rem] leading-relaxed text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden="true" />
            Prices for {unpriced === lines.length ? "the items" : `${unpriced} of the items`} in
            your cart are still being confirmed. You can go through checkout, but
            the order can be placed only once they are.
          </p>
        )}

        <StepCard
          n={1}
          title="Delivery address"
          active={step === "address"}
          done={Boolean(address) && step !== "address"}
          summary={
            address && (
              <>
                <span className="font-semibold text-ink">{address.fullName}</span>
                {" · +91 "}
                {address.mobile}
                <br />
                {formatAddress(address)}
              </>
            )
          }
          onChange={() => setStep("address")}
        >
          <AddressForm
            initial={address}
            onSubmit={(a) => {
              setAddress(a);
              setResult(undefined);
              setStep(payment ? "review" : "payment");
            }}
          />
        </StepCard>

        <StepCard
          n={2}
          title="Payment method"
          active={step === "payment"}
          done={Boolean(payment) && reached("review") && step !== "payment"}
          summary={payment && PAYMENT_LABEL[payment]}
          onChange={() => setStep("payment")}
        >
          <PaymentOptions
            initial={payment}
            onSubmit={(m) => {
              setPayment(m);
              setResult(undefined);
              setStep("review");
            }}
          />
        </StepCard>

        <StepCard n={3} title="Review and place order" active={step === "review"} done={false}>
          <ul className="divide-y divide-line border-y border-line">
            {lines.map(({ line, product, variant }) => (
              <li key={`${line.slug}:${line.variantId ?? ""}`} className="flex items-center gap-3 py-3">
                <div className="w-14 shrink-0 overflow-hidden rounded-md border border-line">
                  <ProductPhoto product={product} decorative />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={productHref(product)}
                    className="text-[0.9375rem] font-medium text-ink hover:text-green-700"
                  >
                    {product.name}
                  </Link>
                  <p className="text-[0.8125rem] text-ink-3">
                    Qty {line.qty}
                    {variant ? ` · ${variant.label}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-right text-[0.875rem] tabular-nums">
                  {variant ? (
                    <span className="font-semibold text-ink">
                      {formatPrice(variant.priceMinor * line.qty)}
                    </span>
                  ) : (
                    <span className="text-ink-3">Price to be confirmed</span>
                  )}
                </p>
              </li>
            ))}
          </ul>

          <Link
            href="/cart"
            className="mt-3 inline-block text-[0.8125rem] font-semibold text-green-700 hover:underline"
          >
            Edit cart
          </Link>

          {result && !result.ok && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-lg border border-danger/40 bg-white px-4 py-3 text-[0.875rem] text-ink"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
              <div>
                <p className="font-medium">{result.message}</p>
                {"items" in result && result.items.length > 0 && (
                  <p className="mt-1 text-ink-2">{result.items.join(", ")}</p>
                )}
              </div>
            </div>
          )}

          <Button
            type="button"
            size="lg"
            onClick={place}
            disabled={placing || !address || !payment}
            className="mt-5 w-full"
          >
            {placing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Lock className="size-4" aria-hidden="true" />
            )}
            {placing ? "Placing order…" : "Place order"}
          </Button>
        </StepCard>
      </div>

      <aside aria-labelledby="price-details" className="lg:col-span-4">
        <PriceDetails
          count={count}
          unpriced={unpriced}
          subtotalMinor={subtotalMinor}
          delivery="To be confirmed"
        />
      </aside>
    </div>
  );
}

/**
 * One checkout step: a numbered header, its form while active, and a
 * one-line summary with "Change" once done. Steps not yet reached show only
 * their header, so the shopper sees what is still to come.
 */
function StepCard({
  n,
  title,
  active,
  done,
  summary,
  onChange,
  children,
}: {
  n: number;
  title: string;
  active: boolean;
  done: boolean;
  summary?: ReactNode;
  onChange?: () => void;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`checkout-step-${n}`}
      className={cn(
        "rounded-lg border bg-white",
        active ? "border-green-700/40 shadow-[0_10px_30px_-20px_rgba(15,74,44,0.5)]" : "border-line",
      )}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[0.75rem] font-semibold",
            done ? "bg-green-700 text-white" : active ? "bg-forest text-white" : "bg-surface text-ink-3",
          )}
        >
          {done ? <Check className="size-3.5" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={`checkout-step-${n}`}
            className={cn("text-[1rem] font-semibold", active || done ? "text-ink" : "text-ink-3")}
          >
            {title}
          </h2>
          {done && summary && (
            <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-2">{summary}</p>
          )}
        </div>
        {done && onChange && (
          <button
            type="button"
            onClick={onChange}
            className="shrink-0 rounded-sm border border-line px-3 py-1.5 text-[0.8125rem] font-semibold text-green-700 transition-colors hover:border-green-700"
          >
            Change
          </button>
        )}
      </div>
      {active && <div className="border-t border-line px-5 pb-5 pt-5">{children}</div>}
    </section>
  );
}
