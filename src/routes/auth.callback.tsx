import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

function getDestination() {
  try {
    const stored = window.sessionStorage.getItem("auth-next");
    window.sessionStorage.removeItem("auth-next");
    return stored && stored.startsWith("/") && !stored.startsWith("//") ? stored : "/";
  } catch {
    return "/";
  }
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign in…");

  useEffect(() => {
    let active = true;
    const destination = getDestination();
    let subscription: { unsubscribe: () => void } | undefined;

    const finish = (signedIn: boolean) => {
      if (!active) return;
      if (signedIn) {
        navigate({ to: destination });
      } else {
        setMessage("We couldn't complete sign in. Please try again.");
      }
    };

    const complete = async () => {
      const authState = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) finish(true);
      });
      subscription = authState.data.subscription;

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        finish(false);
        return;
      }
      if (data.session) finish(true);
    };

    void complete();

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
      </div>
    </main>
  );
}