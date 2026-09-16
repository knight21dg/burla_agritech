"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@burla/core/db";
import { enquiries } from "@burla/core/db/schema";
import { createRateLimiter } from "@burla/core/auth";
import { env } from "@burla/core/env";

/**
 * Contact and wholesale enquiries: saved, so the owner sees them in the admin.
 *
 * Until now the form showed a thank-you and sent nothing anywhere — every
 * enquiry a customer wrote was lost. It is written to `enquiries` here, before
 * anything else happens, because a lead that exists only in an email that
 * failed to send is a lead nobody can find again.
 *
 * Three brakes on abuse, none of which bother a real person:
 *   - a hidden field ("website") that people never see and bots fill in;
 *   - a strict schema, so nothing but the listed fields is accepted;
 *   - at most five enquiries per address per hour, counted against a hash of
 *     the address — raw IPs are never stored.
 */

export type EnquiryResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const limiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxFailures: 5 });

const phone = z
  .string()
  .trim()
  .max(20)
  .refine((v) => v === "" || /^[+\d][\d\s-]{7,}$/.test(v), "Please enter a valid phone number.");

const schema = z
  .object({
    kind: z.enum(["contact", "wholesale"]),
    name: z.string().trim().min(2, "Please enter your name.").max(80),
    email: z.string().trim().toLowerCase().max(254).email("Please enter a valid email address."),
    phone,
    company: z.string().trim().max(120).default(""),
    country: z.string().trim().max(60).default(""),
    subject: z.string().trim().max(120).default(""),
    quantity: z.string().trim().max(120).default(""),
    interest: z.string().trim().max(80).default(""),
    message: z
      .string()
      .trim()
      .min(10, "Please tell us a little more — at least 10 characters.")
      .max(4000, "Please keep your message under 4,000 characters."),
    website: z.string().max(200).default(""),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.kind === "wholesale" && value.company.length < 2) {
      ctx.addIssue({ code: "custom", path: ["company"], message: "Please enter your company name." });
    }
  });

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitEnquiry(form: FormData): Promise<EnquiryResult> {
  const parsed = schema.safeParse({
    kind: text(form, "kind"),
    name: text(form, "name"),
    email: text(form, "email"),
    phone: text(form, "phone"),
    company: text(form, "company"),
    country: text(form, "country"),
    subject: text(form, "subject"),
    quantity: text(form, "quantity"),
    interest: text(form, "interest"),
    message: text(form, "message"),
    website: text(form, "website"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }

  const input = parsed.data;

  // A bot filled in the field nobody can see. Say thank you, save nothing:
  // telling it that it was caught only teaches it to stop.
  if (input.website) return { ok: true };

  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? head.get("x-real-ip") ?? "unknown";
  const ipHash = createHash("sha256")
    .update(`${env.IP_HASH_SALT ?? "local-development"}:${ip}`)
    .digest("hex");

  if (limiter.isLockedOut(ipHash)) {
    return {
      ok: false,
      message: "We have received several messages from you already. Please call or WhatsApp us instead.",
    };
  }
  limiter.recordFailure(ipHash);

  await db.insert(enquiries).values({
    type: input.kind,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    company: input.company || null,
    country: input.country || null,
    subject: input.subject || null,
    estimatedQuantity: input.quantity || null,
    productInterest: input.interest ? [input.interest] : null,
    message: input.message,
    sourceUrl: input.kind === "wholesale" ? "/wholesale" : "/contact",
    ipHash,
    userAgent: head.get("user-agent")?.slice(0, 300) ?? null,
  });

  return { ok: true };
}
