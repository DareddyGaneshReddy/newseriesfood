import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { schemeUrlFor } from "@/lib/oauth-pkce";

export const Route = createFileRoute("/auth/bridge")({
  head: () => ({
    meta: [
      { title: "Returning to the app — New Series Food Corner" },
      { name: "description", content: "Handing your completed Google sign-in back to the New Series Food Corner app." },
      { property: "og:title", content: "Returning to the app — New Series Food Corner" },
      { property: "og:description", content: "Handing your completed Google sign-in back to the New Series Food Corner app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthBridgePage,
});

/**
 * Runs in Median's App Browser after the managed broker finishes. It never
 * talks to the backend: it only forwards whatever the broker returned (tokens,
 * state, or an error) into the app WebView using the custom URL scheme, where
 * the session is actually established.
 */
function AuthBridgePage() {
  const [target, setTarget] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const search = (window.location.search || "").replace(/^\?/, "");
    const hash = window.location.hash?.replace(/^#/, "") ?? "";
    // Some hosts deliver params in the hash; merge both so nothing is lost.
    const params = new URLSearchParams(search);
    if (hash) {
      new URLSearchParams(hash).forEach((v, k) => {
        if (!params.has(k)) params.set(k, v);
      });
    }

    const hasResult =
      params.has("access_token") || params.has("code") || params.has("error") || params.has("error_description");
    if (!hasResult) {
      // Broker was reached without a result — usually a cancelled sign-in.
      params.set("error", "cancelled");
      params.set("error_description", "Google sign-in was cancelled.");
      setFailed("Google sign-in was cancelled.");
    }

    const url = schemeUrlFor(`/auth/callback?${params.toString()}`);
    setTarget(url);
    try {
      window.location.replace(url);
    } catch {
      // Fall back to the visible button below.
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[440px] items-center justify-center bg-background px-6 text-center">
      <div>
        <div className="text-4xl">🍽️</div>
        <h1 className="mt-4 text-lg font-semibold">{failed ? "Sign-in not completed" : "Signed in with Google"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {failed ?? "Taking you back to New Series Food Corner…"}
        </p>
        {target && (
          <a
            href={target}
            className="press mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Return to the app
          </a>
        )}
      </div>
    </main>
  );
}
