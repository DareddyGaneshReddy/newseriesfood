import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, TrendingUp, IndianRupee, Package, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useIsAdmin } from "@/lib/auth-hook";
import { fetchMenu, fetchCategories } from "@/lib/queries";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MenuManager } from "@/components/menu-manager";
import { PaymentsManager } from "@/components/payments-manager";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — New Series Food Corner" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const ORDER_STATUSES = ["placed", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"] as const;

function AdminPage() {
  const { user, ready } = useSession();
  const isAdmin = useIsAdmin(user?.id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "orders" | "menu" | "payments">("overview");

  useEffect(() => {
    if (ready && !user) nav({ to: "/auth", search: { next: "/admin" } });
  }, [ready, user, nav]);

  const menu = useQuery({ queryKey: ["menu"], queryFn: fetchMenu });
  const cats = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const orders = useQuery({
    queryKey: ["admin-orders"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  if (!ready) return null;
  if (user && !isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl">🔒</div>
        <h2 className="mt-4 text-lg font-semibold">Admin access required</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          You're signed in as {user.email}, but you don't have admin permissions.
        </p>
        <p className="mt-4 rounded-2xl border border-border bg-card p-3 text-[11px] text-muted-foreground">
          To grant admin: open the backend dashboard and add a row in <b>user_roles</b> with your user id and role = <b>admin</b>.
        </p>
        <Link to="/" className="press mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Back home</Link>
      </div>
    );
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaysOrders = orders.data?.filter((o) => new Date(o.created_at as string) >= today) ?? [];
  const revenueToday = todaysOrders.reduce((s, o) => s + Number(o.total), 0);
  const liveCount = orders.data?.filter((o) => !["delivered", "cancelled"].includes(o.status as string)).length ?? 0;

  const updateOrder = async (id: string, status: (typeof ORDER_STATUSES)[number]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order → ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase.from("menu_items").update({ is_available: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["menu"] });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px] bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to="/" className="press flex h-9 w-9 items-center justify-center rounded-full bg-secondary" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-base font-semibold">Admin</h1>
        </div>
      </header>

      <div className="flex gap-2 px-5 pt-4">
        {(["overview", "orders", "menu", "payments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "press flex-1 rounded-full border px-3 py-1.5 text-xs font-medium capitalize",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3 px-5 pt-4">
          <Stat icon={<IndianRupee className="h-4 w-4" />} label="Revenue today" value={inr(revenueToday)} />
          <Stat icon={<Package className="h-4 w-4" />} label="Orders today" value={String(todaysOrders.length)} />
          <Stat icon={<TrendingUp className="h-4 w-4" />} label="Live orders" value={String(liveCount)} />
          <Stat icon={<ChefHat className="h-4 w-4" />} label="Menu items" value={String(menu.data?.length ?? 0)} />
        </div>
      )}

      {tab === "orders" && (
        <div className="flex flex-col gap-3 px-5 pt-4 pb-10">
          {orders.data?.length === 0 && <div className="pt-8 text-center text-sm text-muted-foreground">No orders yet.</div>}
          {orders.data?.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{o.code}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(o.created_at as string).toLocaleString()} · {o.order_type} · {o.payment_method}
                  </div>
                </div>
                <div className="text-sm font-semibold">{inr(Number(o.total))}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateOrder(o.id, s)}
                    className={cn(
                      "press rounded-full border px-2.5 py-1 text-[10px] font-medium",
                      o.status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/70",
                    )}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "menu" && <MenuManager />}
      {tab === "payments" && <PaymentsManager />}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

function MenuAvailabilityToggle({ id, onToggle }: { id: string; onToggle: (id: string, cur: boolean) => void }) {
  // Fetch fresh state from a subquery — simpler: query the row directly
  const q = useQuery({
    queryKey: ["item-availability", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("is_available").eq("id", id).maybeSingle();
      if (error) throw error;
      return data?.is_available ?? true;
    },
  });
  const avail = q.data ?? true;
  return (
    <button
      onClick={() => onToggle(id, avail)}
      className={cn(
        "press rounded-full px-3 py-1 text-[11px] font-semibold",
        avail ? "bg-[color-mix(in_oklab,var(--olive)_20%,transparent)] text-[oklch(0.4_0.07_118)]" : "bg-destructive/10 text-destructive",
      )}
    >
      {avail ? "Available" : "Sold out"}
    </button>
  );
}
