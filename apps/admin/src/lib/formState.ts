/**
 * What every admin form gets back after "Save": whether it worked, a sentence
 * to show, and — when something needs fixing — which field and why.
 */
export interface FormState {
  ok?: boolean;
  message?: string;
  /** Shown quieter than an error: it saved, but something else is worth saying. */
  note?: string;
  fieldErrors?: Record<string, string>;
}
