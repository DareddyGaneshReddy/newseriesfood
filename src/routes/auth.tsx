import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  canUseMedianGoogleSignIn,
  isEmbeddedAppWebView,
  rememberAuthDestination,
  signInWithMedianGoogle,
} from "@/lib/webview";
import { startWrapperGoogleOAuth } from "@/lib/oauth-pkce";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — New Series Food Corner" },
      { name: "description", content: "Sign in to New Series Food Corner to place orders, track deliveries, and manage your food profile." },
      { property: "og:title", content: "Sign in — New Series Food Corner" },
      { property: "og:description", content: "Access your New Series Food Corner account for orders, delivery tracking, and saved details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const goNext = () => nav({ to: destination });

  const sendPasswordSetup = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Password setup link sent. Check your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send password setup email");
    } finally {
      setBusy(false);
    }
  };

  const resendConfirmation = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      toast.success("A new confirmation link has been sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend the confirmation email");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail, password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: name || null },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created. Welcome!");
          goNext();
        } else {
          setConfirmationSent(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        if (!data.user) throw new Error("Sign in did not create a session");
        toast.success("Welcome back!");
        goNext();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("email not confirmed")) {
        toast.error("Please confirm your email before signing in.");
      } else if (message.includes("invalid login credentials")) {
        toast.error("Invalid password, or this email was created with Google. Use Set password below.");
      } else {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      rememberAuthDestination(destination);

      if (canUseMedianGoogleSignIn()) {
        const idToken = await signInWithMedianGoogle();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (error) throw error;
        if (!data.user) throw new Error("Google sign-in did not create a session");
        toast.success("Welcome!");
        goNext();
        return;
      }

      // App-wrapper builds (Median APK): launch the managed Google sign-in
      // itself into the app browser so the whole round trip stays in one
      // browser context, and let /auth/bridge hand the result back into the app.
      if (isEmbeddedAppWebView()) {
        const { error } = startWrapperGoogleOAuth();
        if (error) toast.error(error);
        return;
      }


      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        const raw = result.error.message || "";
        const stateIssue = /state/i.test(raw);
        toast.error(
          stateIssue
            ? "Sign-in session expired. Tap Continue with Google again without switching apps."
            : raw || "Google sign-in failed",
        );
        return;
      }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Google sign-in did not create a session");
      goNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-6">
        <Link to="/" className="press flex h-9 w-9 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link to="/" className="text-xs font-medium text-muted-foreground">Continue as guest</Link>
      </header>

      <div className="px-6 pt-10 animate-fade-up">
        <div className="text-3xl">🍽️</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Welcome to New Series</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to track your orders and favourites." : "Create an account to save your details."}
        </p>
      </div>

      <div className="mt-6 px-6">
        <button
          onClick={google}
          disabled={busy}
          className="press flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-soft disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
        </div>

        {confirmationSent && mode === "signup" ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <p>We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>. Confirm it, then return here to sign in.</p>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={resendConfirmation}
              className="mt-3 h-auto px-0 py-1 text-xs font-semibold text-primary hover:bg-transparent hover:text-primary"
            >
              Resend confirmation email
            </Button>
          </div>
        ) : (
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field icon={<User className="h-4 w-4" />} label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </Field>
          )}
          <Field icon={<Mail className="h-4 w-4" />} label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </Field>
          <Field icon={<Lock className="h-4 w-4" />} label="Password">
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </Field>
          <button
            type="submit"
            disabled={busy}
            className="press mt-2 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-70"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          {mode === "signin" && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={sendPasswordSetup}
              className="mt-1 h-auto w-full rounded-2xl py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Set or reset password
            </Button>
          )}
          {resetSent && (
            <p className="text-center text-xs text-muted-foreground">
              Open the email link to set your password, then return here to sign in.
            </p>
          )}
        </form>
        )}

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className={cn("mt-4 block w-full text-center text-xs text-muted-foreground")}
        >
          {mode === "signin" ? (
            <>Don't have an account? <span className="font-semibold text-primary">Create one</span></>
          ) : (
            <>Already have an account? <span className="font-semibold text-primary">Sign in</span></>
          )}
        </button>
      </div>

      <div className="px-6 pb-10 pt-6 text-center text-[11px] text-muted-foreground">
        By continuing, you agree to our terms & privacy.
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 focus-within:border-primary">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8a6 6 0 010-12c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.4 12 2.4a9.6 9.6 0 100 19.2c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-2H12z" />
    </svg>
  );
}
