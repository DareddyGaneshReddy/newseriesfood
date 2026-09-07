import { supabase } from "@/integrations/supabase/client";

/**
 * Median (Android APK) custom URL scheme. The bridge page uses it to hand the
 * OAuth `code` back into the original WebView, where the PKCE verifier lives.
 */
export const APP_URL_SCHEME = "nsfoodxljdzzw";

export function bridgeUrl(): string {
  return `${window.location.origin}/auth/bridge`;
}

/** `scheme.https://host/path?query` — Median's documented scheme format. */
export function schemeUrlFor(pathAndQuery: string): string {
  const host = window.location.host;
  const suffix = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${APP_URL_SCHEME}.https://${host}${suffix}`;
}

/**
 * Starts Google sign-in with Supabase's own PKCE flow instead of the Lovable
 * broker. The verifier is persisted by supabase-js in this WebView's storage,
 * so only the short-lived `code` has to travel through the external browser —
 * which is exactly why this survives Median's split browser contexts where the
 * broker's in-memory `state` cannot.
 */
export async function startWrapperGoogleOAuth(): Promise<{ error?: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: bridgeUrl(),
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) return { error: error.message };
  if (!data?.url) return { error: "Could not start Google sign-in." };

  // Median routes accounts.google.com to the App Browser / Custom Tab; Google
  // rejects plain embedded WebViews, so a top-level navigation is correct here.
  window.location.assign(data.url);
  return {};
}
