import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, Tag } from "lucide-react";
import { useState } from "react";
import { MobileShell, VegDot } from "@/components/mobile-shell";
import { useCart } from "@/lib/cart-store";
import { inr } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — New Series Food Corner" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, count } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const packing = items.length ? 15 : 0;
  const delivery = subtotal >= 300 || subtotal === 0 ? 0 : 29;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * 0.05);
  const total = Math.max(0, subtotal + tax + delivery + packing - discount);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await supabase.from("coupons").select("*").eq("code", code).eq("active", true).maybeSingle();
    if (error || !data) { setCouponMsg("Invalid coupon"); setDiscount(0); return; }
    if (subtotal < Number(data.min_order ?? 0)) {
      setCouponMsg(`Add ${inr(Number(data.min_order) - subtotal)} more to use ${code}`);
      setDiscount(0); return;
    }
    let d = 0;
    if (data.discount_flat) d = Number(data.discount_flat);
    else if (data.discount_percent) d = Math.round((subtotal * Number(data.discount_percent)) / 100);
    setDiscount(d);
    setCouponMsg(`Applied · saved ${inr(d)}`);
    toast.success(`Coupon ${code} applied`);
  };

  if (items.length === 0) {
    return (
      <MobileShell title="Your cart">
        <div className="flex flex-col items-center px-8 pt-16 text-center animate-fade-up">
          <div className="text-6xl">🛒</div>
          <h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add some warm, home-cooked favourites to get started.</p>
          <Link to="/menu" className="press mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft">
            Browse menu
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell title={`${count} item${count > 1 ? "s" : ""}`}>
      <div className="flex flex-col gap-3 px-5 pt-4">
        {items.map((i) => (
          <div key={i.id} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft animate-fade-up">
            {i.image && <img src={i.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <VegDot veg={i.is_veg} />
                <h3 className="truncate text-sm font-semibold">{i.name}</h3>
              </div>
              {i.notes && <div className="mt-0.5 truncate text-[11px] italic text-muted-foreground">"{i.notes}"</div>}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-semibold">{inr(i.price * i.qty)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => remove(i.id)} className="press flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center rounded-full border border-border">
                    <button className="press flex h-8 w-8 items-center justify-center" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-5 text-center text-xs font-semibold">{i.qty}</span>
                    <button className="press flex h-8 w-8 items-center justify-center" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="mx-5 mt-5 rounded-2xl border border-dashed border-primary/40 bg-card p-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Coupon code (try WELCOME10)"
            className="flex-1 bg-transparent text-sm uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground"
          />
          <button onClick={applyCoupon} className="press rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            Apply
          </button>
        </div>
        {couponMsg && <div className="mt-2 text-[11px] text-muted-foreground">{couponMsg}</div>}
      </div>

      {/* Bill */}
      <div className="mx-5 mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <h3 className="text-sm font-semibold">Bill details</h3>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Item total" value={inr(subtotal)} />
          {discount > 0 && <Row label="Coupon discount" value={`− ${inr(discount)}`} accent />}
          <Row label="Taxes (5%)" value={inr(tax)} />
          <Row label="Packing" value={inr(packing)} />
          <Row label="Delivery" value={delivery === 0 ? "Free" : inr(delivery)} />
        </div>
        <div className="my-3 h-px bg-border/70" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Grand total</span>
          <span className="text-base font-semibold">{inr(total)}</span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-[440px] px-5">
        <Link
          to="/checkout"
          search={{ discount, tax, delivery, packing }}
          className="press flex items-center justify-between rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift"
        >
          <span>{inr(total)} · {count} item{count > 1 ? "s" : ""}</span>
          <span>Checkout →</span>
        </Link>
      </div>
    </MobileShell>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-[oklch(0.55_0.16_140)]" : ""}>{value}</span>
    </div>
  );
}
