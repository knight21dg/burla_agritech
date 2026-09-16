import { defineConfig } from "vitest/config";

/**
 * Unit tests for logic that decides something: permissions, validation,
 * state transitions, pricing.
 *
 * Deliberately not a browser environment and deliberately not a database
 * connection — these run in milliseconds so they are run often. Tests that
 * need a database get their own throwaway one and their own config, and
 * never point at `burla_dev` or anything further upstream.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "apps/*/src/**/*.test.ts"],
    passWithNoTests: false,
  },
});
