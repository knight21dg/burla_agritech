"use server";

import { search } from "@/server/catalogue";
import type { Product } from "@/types/catalog";

/**
 * Search, for the overlay in the header.
 *
 * The overlay used to filter an in-memory copy of the whole catalogue, which
 * was possible only because the catalogue was a TypeScript file in the browser
 * bundle. Now it asks the server, which searches Postgres — a weighted
 * `tsvector` over name, descriptor, keywords and description, plus a trigram
 * index for near-misses. Better results, and the browser downloads nothing.
 *
 * Deliberately the only thing this action returns: products, capped. No
 * counts, no facets, nothing about drafts. An unpublished product cannot come
 * back here because the repository's public queries filter to published — not
 * because this action remembered to ask.
 */
const SUGGESTIONS = 6;

export async function searchSuggestions(query: unknown): Promise<Product[]> {
  if (typeof query !== "string") return [];

  // A cap on the input, not just the output: the query reaches a database
  // index, and there is no sentence anyone types to find a pickle.
  const term = query.trim().slice(0, 80);
  if (term.length < 2) return [];

  const results = await search(term, SUGGESTIONS);
  return results.products;
}
