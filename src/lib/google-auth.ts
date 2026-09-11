import { supabase } from "@/integrations/supabase/client";
import { isEmbeddedAppWebView } from "@/lib/webview";

/**
 * Google sign-in, handled entirely by Supabase Auth.
 *
 * The same call works on the web and inside a Capacitor Android build: the
 * authorization request is a normal top-level navigation and Supabase returns
 * to `${origin}/auth/callback`, which the Android app claims through App Links
 * (assetlinks.json on the published domain), so the user lands back in the app.
 */
export async function signInWithGoogle(): Promise<{ error?: string }> {
  // A normal browser can finish OAuth in the same storage context. Median opens
  // Google in its App Browser, so return there first and let the bridge hand the
  // result back to the original WebView where the Supabase session is persisted.
  const redirectPath = isEmbeddedAppWebView() ? "/auth/bridge" : "/auth/callback";
  const redirectTo = `${window.location.origin}${redirectPath}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) return { error: error.message || "Google sign-in failed" };
  return {};
}
