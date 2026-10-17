const DEFAULT_AFTER_LOGIN = "/dashboard";

/**
 * Validate a post-login redirect target. Only same-site paths are allowed, so
 * a crafted ?next= link cannot send users to another site.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return DEFAULT_AFTER_LOGIN;
  }
  return next;
}

/** Post-login destination taken from the current URL's ?next= parameter. */
export function nextPathFromLocation(): string {
  if (typeof window === "undefined") return DEFAULT_AFTER_LOGIN;
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}
