import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { can } from "@burla/core/auth/rbac";
import { requireStaff } from "@/server/auth/session";
import { getBusiness } from "@/server/website";
import { BusinessForm } from "@/components/settings/BusinessForm";
import { PasswordForm } from "@/components/settings/PasswordForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const actor = await requireStaff();
  const canEditBusiness = can(actor, "settings.write");
  const canSeeActivity = can(actor, "audit.read");
  const business = canEditBusiness ? await getBusiness() : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="mt-0.5 text-ink-2">Your business details and your account.</p>
      </div>

      {business && (
        <section className="panel p-4 sm:p-5">
          <h2 className="text-[1.125rem] font-semibold">Business information</h2>
          <div className="mt-4">
            <BusinessForm business={business} />
          </div>
        </section>
      )}

      <section className="panel p-4 sm:p-5">
        <h2 className="text-[1.125rem] font-semibold">Your account</h2>
        <p className="mt-0.5 text-ink-2">
          Signed in as {actor.kind === "user" ? actor.email : ""}.
        </p>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </section>

      {canSeeActivity && (
        <Link href="/settings/activity" className="panel flex items-center justify-between gap-3 p-4 hover:border-accent sm:p-5">
          <div>
            <h2 className="text-[1.125rem] font-semibold">Recent activity</h2>
            <p className="mt-0.5 text-ink-2">Every change made in this admin: who, what and when.</p>
          </div>
          <ChevronRight className="size-5 text-ink-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
