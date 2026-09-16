"use client";

/**
 * What a refusal looks like.
 *
 * `requirePermission` throws when an actor lacks a capability, and this is
 * where that lands. It says no without saying what exists: no row name, no
 * id, no "you would need the X role" — only that this account cannot do it
 * and who to ask.
 *
 * Next passes a digest here rather than the real message in production, which
 * is the behaviour we want: stack traces and database errors belong in the
 * server log, never on screen (docs/ADMIN-ARCHITECTURE.md §9).
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const forbidden = error.name === "ForbiddenError";

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-lg">
        {forbidden ? "You do not have access to this" : "Something went wrong"}
      </h1>
      <p className="mt-2 text-[0.875rem] text-ink-2">
        {forbidden
          ? "Your account does not have permission for this section. An administrator can change that."
          : "The page could not be loaded. Try again; if it keeps happening, tell whoever maintains the site."}
      </p>

      {!forbidden && error.digest && (
        <p className="mt-3 font-mono text-[0.75rem] text-ink-3">
          Reference: {error.digest}
        </p>
      )}

      <button type="button" onClick={reset} className="btn btn-quiet mt-6">
        Try again
      </button>
    </div>
  );
}
