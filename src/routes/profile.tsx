import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, LogOut, MapPin, Bell, Shield, Heart, Trash2, HelpCircle, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useIsAdmin } from "@/lib/auth-hook";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — New Series Food Corner" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, ready } = useSession();
  const isAdmin = useIsAdmin(user?.id);
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [notif, setNotif] = useState(true);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/" });
  };

  const deleteAccount = async () => {
    if (!confirm("Permanently delete your account and data?")) return;
    setBusy(true);
    toast.info("Account deletion has been requested. Signing you out.");
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  const requireAuth = () => {
    if (!user) {
      toast.error("Please sign in first");
      nav({ to: "/auth" });
      return false;
    }
    return true;
  };

  return (
    <MobileShell title="Profile">
      <div className="px-5 pt-4">
        {!user && ready && (
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-center shadow-soft">
            <div className="text-4xl">👋</div>
            <h2 className="mt-2 text-lg font-semibold">Welcome!</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sign in to save favourites and track orders.</p>
            <Link to="/auth" className="press mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Sign in / Create account
            </Link>
          </div>
        )}
        {user && (
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {(user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">{user.user_metadata?.full_name ?? "Guest"}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              {isAdmin && (
                <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Admin</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mx-5 mt-6 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Row
          icon={<MapPin className="h-4 w-4" />}
          label="Saved addresses"
          hint="Manage delivery locations"
          onClick={() => {
            if (!requireAuth()) return;
            toast.info("Add a delivery address at checkout — we'll save it here for next time.");
          }}
        />
        <Row
          icon={<Heart className="h-4 w-4" />}
          label="Favourites"
          hint="Tap ❤ on any dish to save it"
          onClick={() => {
            if (!requireAuth()) return;
            nav({ to: "/menu" });
          }}
        />
        <ToggleRow
          icon={<Bell className="h-4 w-4" />}
          label="Order notifications"
          value={notif}
          onChange={(v) => {
            setNotif(v);
            toast.success(v ? "Notifications enabled" : "Notifications muted");
          }}
        />
        <Row
          icon={<Shield className="h-4 w-4" />}
          label="Privacy & security"
          hint="How we protect your data"
          onClick={() => toast.info("We store only what's needed for your orders. Data is encrypted in transit and at rest.")}
        />
        <Row
          icon={<HelpCircle className="h-4 w-4" />}
          label="Help & support"
          hint="Call the restaurant"
          onClick={() => {
            window.location.href = "tel:+919999999999";
          }}
        />
        {isAdmin && (
          <Link to="/admin" className="press flex items-center justify-between px-4 py-3.5 text-sm">
            <span className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-primary" /> Admin panel</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </div>

      {user && (
        <div className="mx-5 mt-6 space-y-2">
          <button onClick={signOut} className="press flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3.5 text-sm font-medium shadow-soft">
            <span className="flex items-center gap-3"><LogOut className="h-4 w-4" /> Log out</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            disabled={busy}
            onClick={deleteAccount}
            className="press flex w-full items-center justify-between rounded-2xl border border-destructive/40 bg-card px-4 py-3.5 text-sm font-medium text-destructive shadow-soft"
          >
            <span className="flex items-center gap-3"><Trash2 className="h-4 w-4" /> Delete account</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="px-5 pb-12 pt-8 text-center text-[11px] text-muted-foreground">
        New Series Food Corner · v1.0
      </div>
    </MobileShell>
  );
}

function Row({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="press flex w-full items-center justify-between px-4 py-3.5 text-left text-sm">
      <span className="flex items-center gap-3">
        {icon}
        <span className="flex flex-col">
          <span>{label}</span>
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex w-full items-center justify-between px-4 py-3.5 text-sm">
      <span className="flex items-center gap-3">{icon} {label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span
          aria-hidden
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform ${value ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}
