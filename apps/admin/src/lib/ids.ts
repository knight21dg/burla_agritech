/**
 * Row ids arrive in URLs, and a URL is something anyone can type.
 *
 * Every id column in this database is a `uuid`. Handing Postgres a string that
 * is not one does not return "no rows" — it raises `invalid input syntax for
 * type uuid`, which reaches the page as a server error. So an id from a URL is
 * checked for shape first, and a malformed one is simply "not found", exactly
 * like a well-formed id that matches nothing. Neither tells the visitor which
 * ids exist.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
