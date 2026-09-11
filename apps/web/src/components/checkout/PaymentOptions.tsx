"use client";

import { useState } from "react";
import { Banknote, CreditCard, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PAYMENT_LABEL, type PaymentMethod } from "@/lib/checkout";
import { cn } from "@/lib/utils";

const OPTIONS: {
  value: PaymentMethod;
  Icon: typeof Smartphone;
  detail: string;
}[] = [
  {
    value: "upi",
    Icon: Smartphone,
    detail: "Pay from any UPI app, or by UPI ID.",
  },
  {
    value: "card",
    Icon: CreditCard,
    detail: "Pay with a credit or debit card.",
  },
  {
    value: "cod",
    Icon: Banknote,
    detail: "Pay in cash when your order is delivered.",
  },
];

/**
 * How the shopper will pay: UPI, card, or cash on delivery — one choice, as
 * radio cards.
 *
 * No card or UPI details are ever asked for here. For UPI and cards the
 * shopper pays on the payment gateway's own secure page after placing the
 * order, and the order is confirmed only when the server has verified that
 * payment with the gateway — never because the browser says it went through.
 */
export function PaymentOptions({
  initial,
  onSubmit,
}: {
  initial?: PaymentMethod;
  onSubmit: (method: PaymentMethod) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod | undefined>(initial);
  const online = method === "upi" || method === "card";

  return (
    <div>
      <fieldset>
        <legend className="sr-only">Payment method</legend>
        <div className="space-y-3">
          {OPTIONS.map(({ value, Icon, detail }) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                method === value
                  ? "border-green-700 bg-green-50"
                  : "border-line bg-white hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="payment"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
                className="size-4 shrink-0 accent-green-700"
              />
              <Icon
                className={cn("size-6 shrink-0", method === value ? "text-green-700" : "text-ink-2")}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-semibold text-ink">
                  {PAYMENT_LABEL[value]}
                </span>
                <span className="block text-[0.8125rem] text-ink-3">{detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {online && (
        <p className="mt-4 flex items-start gap-2 text-[0.8125rem] leading-relaxed text-ink-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-green-700" aria-hidden="true" />
          You&rsquo;ll pay on a secure payment page after placing the order. Your
          card and UPI details are entered there, never on this site.
        </p>
      )}

      <Button
        type="button"
        size="lg"
        disabled={!method}
        onClick={() => method && onSubmit(method)}
        className="mt-6 w-full sm:w-auto sm:min-w-[16rem]"
      >
        Continue
      </Button>
    </div>
  );
}
