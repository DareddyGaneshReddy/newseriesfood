import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MapPin, Phone, Search, User2, Printer, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ORDER_STATUSES = ["placed", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"] as const;
type Status = (typeof ORDER_STATUSES)[number];

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations: unknown;
  notes: string | null;
};

type AdminOrder = {
  id: string;
  code: string;
  status: string;
  order_type: string;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  packing_fee: number;
  discount: number;
  total: number;
  address_line: string | null;
  notes: string | null;
  created_at: string;
  user_id: string;
  order_items: OrderItem[];
};

const FILTERS = [
  { key: "live", label: "Live" },
  { key: "unpaid", label: "Unpaid" },
  { key: "all", label: "All" },
  { key: "delivered", label: "Delivered" },
] as const;

function customizationText(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([k, v]) =>
      `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`,
    );
  }
  return [String(value)];
}

export function OrdersManager() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("live");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["admin-orders-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      return (data ?? []) as unknown as AdminOrder[];
    },
    refetchInterval: 15000,
  });

  const userIds = useMemo(() => Array.from(new Set((orders.data ?? []).map((o) => o.user_id))), [orders.data]);

  const customers = useQuery({
    queryKey: ["admin-customers", userIds.join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, phone").in("id", userIds);
      if (error) throw error;
      const map: Record<string, { full_name: string | null; phone: string | null }> = {};
      for (const p of data ?? []) map[p.id] = { full_name: p.full_name, phone: p.phone };
      return map;
    },
  });

  const list = useMemo(() => {
    let rows = orders.data ?? [];
    if (filter === "live") rows = rows.filter((o) => !["delivered", "cancelled"].includes(o.status));
    if (filter === "delivered") rows = rows.filter((o) => o.status === "delivered");
    if (filter === "unpaid") rows = rows.filter((o) => o.payment_status !== "paid");
    const needle = q.trim().toLowerCase();
    if (needle) {
      rows = rows.filter(
        (o) =>
          o.code.toLowerCase().includes(needle) ||
          (customers.data?.[o.user_id]?.full_name ?? "").toLowerCase().includes(needle) ||
          (customers.data?.[o.user_id]?.phone ?? "").includes(needle) ||
          o.order_items?.some((i) => i.name.toLowerCase().includes(needle)),
      );
    }
    return rows;
  }, [orders.data, filter, q, customers.data]);

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order → ${status.replace(/_/g, " ")}`);
    qc.invalidateQueries({ queryKey: ["admin-orders-full"] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const setPaid = async (id: string, paid: boolean) => {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: paid ? "paid" : "pending", paid_at: paid ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(paid ? "Marked as paid" : "Marked as unpaid");
    qc.invalidateQueries({ queryKey: ["admin-orders-full"] });
  };

  const printTicket = (o: AdminOrder, customer?: { full_name: string | null; phone: string | null }) => {
    const lines = o.order_items
      .map((i) => {
        const extras = customizationText(i.customizations);
        return `${i.quantity} x ${i.name}${extras.length ? `\n     (${extras.join("; ")})` : ""}${i.notes ? `\n     Note: ${i.notes}` : ""}`;
      })
      .join("\n");
    const text = `KITCHEN TICKET — ${o.code}
${new Date(o.created_at).toLocaleString()}
${o.order_type.replace(/_/g, " ")} · ${o.payment_method} · ${o.payment_status}
${customer?.full_name ?? "Customer"}${customer?.phone ? ` · ${customer.phone}` : ""}
${o.address_line ? `${o.address_line}\n` : ""}
${lines}

Total: ${inr(Number(o.total))}${o.notes ? `\nOrder note: ${o.notes}` : ""}`;
    const w = window.open("", "_blank", "width=380,height=640");
    if (!w) return toast.error("Allow pop-ups to print the ticket");
    w.document.write(`<pre style="font:13px/1.5 ui-monospace,monospace;white-space:pre-wrap;padding:16px">${text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))}</pre>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="flex flex-col gap-3 px-5 pt-4 pb-10">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search order code, customer, dish"
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex gap-1.5">
        {FILTERS.map((f) => {
          const count =
            f.key === "live"
              ? (orders.data ?? []).filter((o) => !["delivered", "cancelled"].includes(o.status)).length
              : f.key === "unpaid"
                ? (orders.data ?? []).filter((o) => o.payment_status !== "paid").length
                : f.key === "delivered"
                  ? (orders.data ?? []).filter((o) => o.status === "delivered").length
                  : (orders.data ?? []).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "press flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium",
                filter === f.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              {f.label} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {orders.isLoading && <div className="pt-8 text-center text-sm text-muted-foreground">Loading orders…</div>}
      {!orders.isLoading && list.length === 0 && (
        <div className="pt-8 text-center text-sm text-muted-foreground">No orders here.</div>
      )}

      {list.map((o) => {
        const customer = customers.data?.[o.user_id];
        const isOpen = open === o.id;
        const paid = o.payment_status === "paid";
        const itemCount = o.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
        return (
          <div key={o.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
            <button onClick={() => setOpen(isOpen ? null : o.id)} className="w-full px-4 py-3 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{o.code}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize">
                      {o.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()} · {itemCount} item{itemCount === 1 ? "" : "s"} · {o.order_type.replace(/_/g, " ")}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {customer?.full_name ?? "Customer"}{customer?.phone ? ` · ${customer.phone}` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold">{inr(Number(o.total))}</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      paid
                        ? "bg-[color-mix(in_oklab,var(--olive)_20%,transparent)] text-[oklch(0.4_0.07_118)]"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {paid ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {paid ? "Paid" : "Unpaid"} · {o.payment_method}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </div>
              </div>

              {!isOpen && o.order_items?.length > 0 && (
                <div className="mt-2 truncate text-[11px] text-foreground/70">
                  {o.order_items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </div>
              )}
            </button>

            {isOpen && (
              <div className="border-t border-border/60 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Items to pack</div>
                <div className="mt-2 flex flex-col gap-2">
                  {(o.order_items ?? []).map((i) => {
                    const extras = customizationText(i.customizations);
                    return (
                      <div key={i.id} className="flex items-start justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold">
                            <span className="text-primary">{i.quantity}×</span> {i.name}
                          </div>
                          {extras.length > 0 && (
                            <div className="mt-0.5 text-[11px] text-muted-foreground">{extras.join(" · ")}</div>
                          )}
                          {i.notes && <div className="mt-0.5 text-[11px] italic text-muted-foreground">“{i.notes}”</div>}
                        </div>
                        <div className="text-xs font-medium">{inr(Number(i.price) * i.quantity)}</div>
                      </div>
                    );
                  })}
                  {(o.order_items ?? []).length === 0 && (
                    <div className="text-[11px] text-muted-foreground">No item records for this order.</div>
                  )}
                </div>

                {o.notes && (
                  <div className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-[11px]">
                    <b>Order note:</b> {o.notes}
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-1 text-[11px] text-muted-foreground">
                  <Row label="Subtotal" value={inr(Number(o.subtotal))} />
                  {Number(o.packing_fee) > 0 && <Row label="Packing" value={inr(Number(o.packing_fee))} />}
                  {Number(o.delivery_fee) > 0 && <Row label="Delivery" value={inr(Number(o.delivery_fee))} />}
                  {Number(o.tax) > 0 && <Row label="Taxes" value={inr(Number(o.tax))} />}
                  {Number(o.discount) > 0 && <Row label="Discount" value={`- ${inr(Number(o.discount))}`} />}
                  <div className="mt-1 flex justify-between border-t border-border pt-1 text-xs font-semibold text-foreground">
                    <span>Total</span>
                    <span>{inr(Number(o.total))}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User2 className="h-3.5 w-3.5" /> {customer?.full_name ?? "Customer"}
                  </div>
                  {customer?.phone && (
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 font-medium text-primary">
                      <Phone className="h-3.5 w-3.5" /> {customer.phone}
                    </a>
                  )}
                  {o.address_line && (
                    <div className="flex items-start gap-1.5 text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {o.address_line}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setPaid(o.id, !paid)}
                    className={cn(
                      "press flex-1 rounded-full border px-3 py-2 text-[11px] font-semibold",
                      paid ? "border-border bg-card" : "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {paid ? "Mark unpaid" : "Mark payment received"}
                  </button>
                  <button
                    onClick={() => printTicket(o, customer)}
                    className="press flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-[11px] font-semibold"
                  >
                    <Printer className="h-3.5 w-3.5" /> Ticket
                  </button>
                </div>

                <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Update status</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ORDER_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(o.id, s)}
                      className={cn(
                        "press rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize",
                        o.status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/70",
                      )}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
