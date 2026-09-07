import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — New Series Food Corner" },
      { name: "description", content: "Set a new password for your New Series Food Corner account." },
      { property: "og:title", content: "Reset password — New Series Food Corner" },
      { property: "og:description", content: "Set a new password for your New Series Food Corner account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function hasRecoveryMarker() {
  if (typeof window === "undefined") return false;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  return hash.get("type") === "recovery" || search.get("type") === "recovery";
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You can sign in now.");
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-6">
        <Link to="/auth" className="press flex h-9 w-9 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      <section className="px-6 pt-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Set your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasRecoveryMarker()
            ? "Create a new password for your account."
            : "Open this page from the password setup email so we can verify your account."}
        </p>
      </section>

      <form onSubmit={submit} className="mt-6 space-y-3 px-6">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">New password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            placeholder="At least 6 characters"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Confirm password</span>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            placeholder="Repeat password"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="press mt-2 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-70"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}