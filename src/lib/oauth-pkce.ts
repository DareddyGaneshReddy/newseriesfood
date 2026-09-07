/**
 * Google sign-in for app-wrapper builds (Median Android APK).
 *
 * Verified against the live flow: the Lovable-managed broker starts at
 *   {origin}/~oauth/initiate?provider=google&redirect_uri=<url>&state=<random>
 * which 302s to https://oauth.lovable.app/initiate?... (adding project_id),
 * sets a short-lived `__Host-oauth_csrf` cookie, and then 302s to Google.
 * Because that cookie belongs to whichever browser started /initiate, the WHOLE
 * round trip has to happen in one browser context — that is why starting it in
 * the WebView and finishing it in Median's App Browser fails with
 * "State verification failed".
 *
 * So in a wrapper we launch the broker itself into the App Browser and let it
 * return to the HTTPS bridge page, which forwards the result back into the app
 * WebView through the Median custom URL scheme.
 */

/** Median (Android APK) custom URL scheme configured in the app build. */
export const APP_URL_SCHEME = "nsfoodxljdzzw";

const STATE_KEY = "broker-oauth-state";

export function bridgeUrl(): string {
  return `${window.location.origin}/auth/bridge`;
}

/** `scheme.https://host/path?query` — Median's documented scheme format. */
export function schemeUrlFor(pathAndQuery: string): string {
  const host = window.location.host;
  const suffix = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${APP_URL_SCHEME}.https://${host}${suffix}`;
}

function randomState(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Persisted in the WebView so the in-app callback can verify the round trip. */
function rememberState(state: string) {
  try {
    window.localStorage.setItem(STATE_KEY, state);
  } catch {
    // Non-fatal: we simply skip verification if storage is unavailable.
  }
}

export function takeExpectedState(): string | null {
  try {
    const value = window.localStorage.getItem(STATE_KEY);
    window.localStorage.removeItem(STATE_KEY);
    return value;
  } catch {
    return null;
  }
}

/** The managed broker URL, returning to the HTTPS bridge page. */
export function brokerGoogleUrl(): string {
  const state = randomState();
  rememberState(state);
  const params = new URLSearchParams({
    provider: "google",
    redirect_uri: bridgeUrl(),
    state,
  });
  return `${window.location.origin}/~oauth/initiate?${params.toString()}`;
}

/**
 * Starts Google sign-in inside a wrapper build. Median's link rules send
 * `/~oauth`, `oauth.lovable.app` and `accounts.google.com` to the App Browser,
 * so this single top-level navigation keeps initiate → Google → broker callback
 * in one browser context.
 */
export function startWrapperGoogleOAuth(): { error?: string } {
  try {
    window.location.assign(brokerGoogleUrl());
    return {};
  } catch {
    return { error: "Could not open Google sign-in." };
  }
}
