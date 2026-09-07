import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Section";
import { categories } from "@/data/catalog";

export default function NotFound() {
  return (
    <Section tone="ivory" size="lg">
      <Container>
        <div className="max-w-xl">
          <p className="t-label text-ink-faint">404</p>
          <h1 className="t-h1 mt-4">We couldn&rsquo;t find that page</h1>
          <p className="t-lead mt-5">
            The link may be out of date, or the product may have moved. Here is
            where to pick things up again.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/shop">Browse all products</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Back to home
            </ButtonLink>
          </div>

          <h2 className="t-label mt-14 text-ink-faint">Our ranges</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/shop/${c.slug}`}
                  className="inline-block rounded-sm border border-sand bg-paper px-4 py-2 text-[0.875rem] text-ink transition-colors hover:border-green hover:text-green-text"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
