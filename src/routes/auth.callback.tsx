import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { completeAuthFromUrl } from "@/lib/auth-return";
import { takeAuthDestination } from "@/lib/webview";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Completing sign in — New Series Food Corner" },
      { name: "description", content: "Securely completing your New Series Food Corner sign-in." },
      { property: "og:title", content: "Completing sign in — New Series Food Corner" },
      { property: "og:description", content: "Securely completing your New Series Food Corner sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign in…");

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;

    const run = async () => {
      const destination = takeAuthDestination();

      const authState = supabase.auth.onAuthStateChange((event, session) => {
        if (active && event === "SIGNED_IN" && session) navigate({ to: destination });
      });
      subscription = authState.data.subscription;

      const result = await completeAuthFromUrl();
      if (!active) return;
      if (result.signedIn) {
        navigate({ to: destination });
        return;
      }
      // Give a slow wrapper webview a moment to deliver the session.
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (data.session) navigate({ to: destination });
        else setMessage(result.error ?? "We couldn't complete sign in. Please try again.");
      }, 2500);
    };

    void run();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[440px] items-center justify-center bg-background px-6 text-center">
      <div>
        <div className="text-4xl">🍽️</div>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        <a href="/auth" className="mt-6 inline-block text-xs font-semibold text-primary">
          Back to sign in
        </a>
      </div>
    </main>
  );
}
