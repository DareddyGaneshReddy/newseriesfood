import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Your Orders — New Series Food Corner" }] }),
  component: OrdersPage,
});

const statusLabel: Record<string, string> = {
  placed: "Placed", accepted: "Accepted", preparing: "Preparing", ready: "Ready",
  out_for_delivery: "On the way", delivered: "Delivered", cancelled: "Cancelled",
};

function OrdersPage() {
  const { user, ready } = useSession();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { if (ready) setEnabled(true); }, [ready]);

  const q = useQuery({
    queryKey: ["orders", user?.id],
    enabled: enabled && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("id, code, status, total, created_at, order_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (ready && !user) {
    return (
      <MobileShell title="Your orders">
        <div className="flex flex-col items-center px-8 pt-24 text-center animate-fade-up">
          <div className="text-5xl">📋</div>
          <h2 className="mt-4 text-lg font-semibold">Sign in to view your orders</h2>
          <Link to="/auth" search={{ next: "/orders" }} className="press mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
            Sign in
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Your orders">
      <div className="flex flex-col gap-3 px-5 pt-4">
        {q.isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}
        {q.data?.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-2 text-center">
            <div className="text-5xl">🍲</div>
            <div className="text-sm text-muted-foreground">No orders yet. Let's fix that.</div>
            <Link to="/menu" className="press mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Browse menu
            </Link>
          </div>
        )}
        {q.data?.map((o) => (
          <Link
            key={o.id}
            to="/order/$id"
            params={{ id: o.id }}
            className="press flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-soft hover-lift"
          >
            <div>
              <div className="text-sm font-semibold">{o.code}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {new Date(o.created_at as string).toLocaleString()} · {o.order_type}
              </div>
              <div className="mt-2 inline-flex rounded-full bg-[color-mix(in_oklab,var(--terracotta)_10%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-primary">
                {statusLabel[o.status as string] ?? o.status}
              </div>
            </div>
            <div className="text-right text-sm font-semibold">{inr(Number(o.total))}</div>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
