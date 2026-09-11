import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/account/AuthForm";
import { Container, Section } from "@/components/ui/Section";
import { safeNextPath } from "@/lib/account";
import { currentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const { next: rawNext, mode } = await searchParams;
  const next = safeNextPath(rawNext);
  // Already signed in: nothing to do here.
  if (await currentUser()) redirect(next);

  const toCheckout = next.startsWith("/checkout");

  return (
    <Section tone="surface" size="md">
      <Container>
        <div className="mx-auto max-w-md">
          <h1 className="t-h2 text-center">
            {toCheckout ? "Sign in to place your order" : "Your Burla account"}
          </h1>
          <p className="mt-2 text-center text-[0.9375rem] text-ink-2">
            {toCheckout
              ? "Your cart is kept. Sign in or create an account to continue to checkout."
              : "Sign in to see your orders and saved addresses."}
          </p>
          <div className="mt-8">
            <AuthForm next={next} initialMode={mode === "signup" ? "signup" : "signin"} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
