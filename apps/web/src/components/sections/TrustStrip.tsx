import { BadgeCheck, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { Container } from "@/components/ui/Section";

/**
 * The four-point band that closes several pages in the client's mockup.
 *
 * Every claim here is about care and process rather than outcome — nothing
 * asserts a health benefit, a certification or a measurable property, because
 * none of those are verified yet. "Farm sourced" and "quality checked"
 * describe how the business says it works; "rich in nutrition", which appears
 * in the mockup, would be a health claim under the FSS Act and is omitted.
 */
const points = [
  { Icon: Sprout, label: "Farm Sourced" },
  { Icon: Leaf, label: "Carefully Processed" },
  { Icon: ShieldCheck, label: "Quality Checked" },
  { Icon: BadgeCheck, label: "For a Healthier Tomorrow" },
];

export function TrustStrip() {
  return (
    <section className="border-t border-line bg-surface py-6">
      <Container>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          {points.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon
                className="size-5 shrink-0 text-green"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="text-[0.875rem] font-medium text-ink">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
