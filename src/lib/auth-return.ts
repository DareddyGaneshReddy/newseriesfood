import { supabase } from "@/integrations/supabase/client";

type Result = { signedIn: boolean; error?: string };

function readParams(): URLSearchParams | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const merged = new URLSearchParams(window.location.search);
  if (hash) {
    new URLSearchParams(hash).forEach((v, k) => merged.set(k, v));
  }
  return merged;
}

function cleanUrl() {
  try {
    const url = new URL(window.location.href);
    ["access_token", "refresh_token", "expires_in", "expires_at", "token_type", "provider_token", "type", "code", "state", "error", "error_description", "error_code"].forEach((k) =>
      url.searchParams.delete(k),
    );
    url.hash = "";
    window.history.replaceState({}, "", url.pathname + (url.search || "") );
  } catch {
    // Ignore: cosmetic cleanup only.
  }
}

/**
 * Completes any sign-in that came back through a URL, whichever way the host
 * delivered it: tokens in the hash (implicit), tokens in the query string, or a
 * PKCE `code`. App wrappers (e.g. Median APK builds) frequently drop the hash or
 * reload the page, so this runs on every route, not just /auth/callback.
 */
export async function completeAuthFromUrl(): Promise<Result> {
  const params = readParams();
  if (!params) return { signedIn: false };

  const errorDescription = params.get("error_description") || params.get("error");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const code = params.get("code");

  if (!errorDescription && !accessToken && !code) {
    const { data } = await supabase.auth.getSession();
    return { signedIn: !!data.session };
  }

  try {
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      cleanUrl();
      return { signedIn: true };
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      cleanUrl();
      return { signedIn: true };
    }
  } catch (err) {
    cleanUrl();
    return { signedIn: false, error: err instanceof Error ? err.message : "Sign in could not be completed" };
  }

  cleanUrl();
  const { data } = await supabase.auth.getSession();
  if (data.session) return { signedIn: true };
  return { signedIn: false, error: errorDescription ?? undefined };
}
