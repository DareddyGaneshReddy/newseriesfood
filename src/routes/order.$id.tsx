import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock, Phone, MessageCircle } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { DeliveryMap } from "@/components/delivery-map";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order/$id")({
  component: OrderTrackPage,
});

const STAGES = [
  { key: "placed", label: "Order placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

function OrderTrackPage() {
  const { id } = Route.useParams();
  const [tick, setTick] = useState(0);

  const q = useQuery({
    queryKey: ["order", id, tick],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 8000,
  });

  useEffect(() => {
    const c = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(c); };
  }, [id]);

  const order = q.data;
  const activeIdx = STAGES.findIndex((s) => s.key === order?.status);

  return (
    <MobileShell showTopBar={false}>
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur">
        <Link to="/orders" className="press flex h-9 w-9 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-base font-semibold">Tracking order</h1>
          <div className="text-[11px] text-muted-foreground">{order?.code}</div>
        </div>
      </div>

      {!order && (
        <div className="space-y-3 p-5">
          <div className="shimmer h-32 rounded-2xl" />
          <div className="shimmer h-40 rounded-2xl" />
        </div>
      )}

      {order && (
        <>
          <div className="mx-5 mt-4 flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-soft animate-fade-up">
            <div>
              <div className="text-xs text-muted-foreground">Estimated arrival</div>
              <div className="mt-0.5 text-lg font-semibold">{order.eta_minutes ?? 35} min</div>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </div>

          {order.order_type === "delivery" && (
            <div className="mx-5 mt-4 animate-fade-up">
              <DeliveryMap
                status={order.status}
                address={order.address_line ?? null}
                etaMinutes={order.eta_minutes ?? null}
              />
            </div>
          )}

          <div className="mx-5 mt-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">

            <h3 className="text-sm font-semibold">Progress</h3>
            <ol className="mt-4 space-y-3">
              {STAGES.map((s, i) => {
                const done = i <= activeIdx;
                const current = i === activeIdx;
                return (
                  <li key={s.key} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                        done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <div className={cn("flex-1 border-b border-border/50 pb-3 text-sm", current && "font-semibold")}>
                      {s.label}
                      {current && <span className="ml-2 text-[11px] font-normal text-primary">Now</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mx-5 mt-4 flex gap-3">
            <a href="tel:+910000000000" className="press flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card py-3 text-sm font-medium shadow-soft">
              <Phone className="h-4 w-4 text-primary" /> Call restaurant
            </a>
            <a href="https://wa.me/910000000000" className="press flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card py-3 text-sm font-medium shadow-soft">
              <MessageCircle className="h-4 w-4 text-[oklch(0.55_0.16_140)]" /> WhatsApp
            </a>
          </div>

          <div className="mx-5 mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <h3 className="text-sm font-semibold">Items</h3>
            <ul className="mt-3 space-y-2">
              {order.order_items?.map((i: { id: string; name: string; quantity: number; price: number }) => (
                <li key={i.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{i.quantity}× {i.name}</span>
                  <span className="text-muted-foreground">{inr(Number(i.price) * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="my-3 h-px bg-border/60" />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{inr(Number(order.total))}</span>
            </div>
          </div>

          <div className="p-5 text-center">
            <Link to="/" className="press text-xs font-medium text-primary">Back to home</Link>
          </div>
        </>
      )}
    </MobileShell>
  );
}
