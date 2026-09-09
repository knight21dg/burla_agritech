/**
 * The service layer, as one import.
 *
 * Pages import from here. They do not import repositories, and they never
 * import `server/db` — docs/SYSTEM-DESIGN.md §2.
 *
 * Namespaced rather than flattened, so a call site reads
 * `catalogService.listByCategory(slug)` and it is obvious which layer is being
 * crossed. Twenty bare exports in a page import list would not be.
 */
export * as catalogService from "./catalogService";
export * as settingsService from "./settingsService";
