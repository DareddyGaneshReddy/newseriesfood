import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const APP_CALLBACK = "nsfoodxljdzzw.https://newseriesfood.lovable.app/auth/callback";
const ALLOWED_AUTH_PARAMS = new Set([
  "access_token",
  "refresh_token",
  "expires_in",
  "expires_at",
  "token_type",
  "provider_token",
  "provider_refresh_token",
  "code",
  "state",
  "type",
  "error",
  "error_code",
  "error_description",
]);

export const Route = createFileRoute("/auth/bridge")({
  head: () => ({
    meta: [
      { title: "Returning to app — New Series Food Corner" },
      { name: "description", content: "Securely returning your Google sign-in to New Series Food Corner." },
      { property: "og:title", content: "Returning to app — New Series Food Corner" },
      { property: "og:description", content: "Securely returning your Google sign-in to New Series Food Corner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthBridgePage,
});

function buildAppCallback(): string {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  new URLSearchParams(hash).forEach((value, key) => params.set(key, value));

  const forwarded = new URLSearchParams();
  params.forEach((value, key) => {
    if (ALLOWED_AUTH_PARAMS.has(key)) forwarded.set(key, value);
  });

  if (!forwarded.has("code") && !forwarded.has("access_token") && !forwarded.has("error")) {
    forwarded.set("error", "invalid_oauth_return");
    forwarded.set("error_description", "Google sign-in did not return a session.");
  }

  return `${APP_CALLBACK}?${forwarded.toString()}`;
}

function AuthBridgePage() {
  const callbackUrl = useMemo(() => buildAppCallback(), []);
  const [automaticReturnFailed, setAutomaticReturnFailed] = useState(false);
  const hasError = callbackUrl.includes("error=");

  useEffect(() => {
    window.location.replace(callbackUrl);
    const timer = window.setTimeout(() => setAutomaticReturnFailed(true), 1400);
    return () => window.clearTimeout(timer);
  }, [callbackUrl]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[440px] items-center justify-center bg-background px-6 text-center">
      <div>
        {hasError ? (
          <CircleAlert className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
        ) : (
          <div className="text-4xl" aria-hidden="true">🍽️</div>
        )}
        <h1 className="mt-4 text-xl font-semibold">
          {hasError ? "Google sign-in needs attention" : "Returning to New Series"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasError ? "Return to the app to try signing in again." : "Your Google account was verified. Opening the app…"}
        </p>
        {automaticReturnFailed && (
          <Button asChild className="mt-6 rounded-full">
            <a href={callbackUrl}>
              Return to app
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        )}
      </div>
    </main>
  );
}