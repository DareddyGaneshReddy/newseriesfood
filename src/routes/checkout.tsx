import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Bike, Store, UtensilsCrossed, Banknote, Smartphone, CreditCard, Wallet, LocateFixed, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UPI_APPS, buildUpiParams, isValidVpa } from "@/lib/upi";

const searchSchema = z.object({
  discount: z.number().default(0),
  tax: z.number().default(0),
  delivery: z.number().default(0),
  packing: z.number().default(0),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Checkout — New Series Food Corner" }] }),
  component: CheckoutPage,
});

type OrderType = "delivery" | "pickup" | "dine_in";
type PayMethod = "cash" | "upi" | "card" | "wallet";

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { discount, tax, delivery, packing } = Route.useSearch();
  const { user, ready } = useSession();
  const nav = useNavigate();

  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [pay, setPay] = useState<PayMethod>("upi");
  const [addr, setAddr] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [upiSettings, setUpiSettings] = useState<{ vpa: string | null; payeeName: string | null }>({ vpa: null, payeeName: null });

  useEffect(() => {
    supabase
      .from("payment_settings")
      .select("upi_vpa, payee_name")
      .eq("singleton", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUpiSettings({ vpa: data.upi_vpa, payeeName: data.payee_name });
      });
  }, []);

  const detectLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location not supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const j = await res.json();
          const a = j.address ?? {};
          const parts = [
            [a.house_number, a.road].filter(Boolean).join(" "),
            a.neighbourhood || a.suburb || a.village,
            a.city || a.town || a.county,
            a.state,
            a.postcode,
          ].filter(Boolean);
          const line = parts.join(", ") || j.display_name || "";
          if (line) {
            setAddr(line);
            toast.success("Location detected");
          } else {
            toast.error("Couldn't resolve address");
          }
        } catch {
          toast.error("Couldn't fetch address");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error("Location permission denied");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };


  const total = Math.max(0, subtotal + tax + (orderType === "delivery" ? delivery : 0) + packing - discount);

  if (ready && !user) {
    return (
      <MobileShell showTopBar={false}>
        <div className="flex flex-col items-center px-8 pt-24 text-center animate-fade-up">
          <div className="text-5xl">🔐</div>
          <h2 className="mt-4 text-lg font-semibold">Sign in to place your order</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your cart is saved. You'll come right back here.</p>
          <Link to="/auth" search={{ next: "/checkout" }} className="press mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
            Sign in
          </Link>
          <Link to="/cart" className="mt-3 text-xs text-muted-foreground">Back to cart</Link>
        </div>
      </MobileShell>
    );
  }
  if (items.length === 0) {
    return (
      <MobileShell showTopBar={false}>
        <div className="p-10 text-center text-sm text-muted-foreground">Your cart is empty.</div>
      </MobileShell>
    );
  }

  const place = async (upiAppScheme?: (params: string) => string) => {
    if (!user) return;
    if (orderType === "delivery" && !addr.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }
    if (pay === "upi" && (!upiSettings.vpa || !isValidVpa(upiSettings.vpa))) {
      toast.error("UPI is not configured yet. Please choose another method or contact the restaurant.");
      return;
    }
    setPlacing(true);
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      status: "placed",
      order_type: orderType,
      payment_method: pay,
      subtotal, tax,
      delivery_fee: orderType === "delivery" ? delivery : 0,
      packing_fee: packing,
      discount,
      total,
      address_line: orderType === "delivery" ? addr : null,
      notes: notes || null,
    }).select("id, code").single();

    if (error || !order) {
      setPlacing(false);
      toast.error("Could not place order. Please try again.");
      return;
    }

    const rows = items.map((i) => ({
      order_id: order.id,
      menu_item_id: i.id.split("::")[0],
      name: i.name,
      price: i.price,
      quantity: i.qty,
      notes: i.notes ?? null,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) {
      setPlacing(false);
      toast.error("Order could not be finalized.");
      return;
    }
    clear();
    toast.success(`Order ${order.code} placed`);

    if (pay === "upi" && upiAppScheme && upiSettings.vpa) {
      const params = buildUpiParams({
        vpa: upiSettings.vpa,
        payeeName: upiSettings.payeeName || "New Series Food Corner",
        amount: total,
        note: `Order ${order.code}`,
        txnRef: order.code,
      });
      // Launch UPI intent — Android/iOS will open the target app.
      window.location.href = upiAppScheme(params);
      setTimeout(() => nav({ to: "/order/$id", params: { id: order.id } }), 800);
      return;
    }

    nav({ to: "/order/$id", params: { id: order.id } });
  };

  return (
    <MobileShell showTopBar={false} showBottomNav={false}>
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur">
        <button onClick={() => history.back()} className="press flex h-9 w-9 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-semibold">Checkout</h1>
      </div>


      <Section title="How would you like it?">
        <div className="grid grid-cols-3 gap-2">
          <TypeCard active={orderType === "delivery"} onClick={() => setOrderType("delivery")} icon={<Bike className="h-5 w-5" />} label="Delivery" hint="30–40 min" />
          <TypeCard active={orderType === "pickup"} onClick={() => setOrderType("pickup")} icon={<Store className="h-5 w-5" />} label="Pickup" hint="15 min" />
          <TypeCard active={orderType === "dine_in"} onClick={() => setOrderType("dine_in")} icon={<UtensilsCrossed className="h-5 w-5" />} label="Dine-in" hint="Reserve" />
        </div>
      </Section>

      {orderType === "delivery" && (
        <Section title="Delivery address">
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="press mb-2 flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary disabled:opacity-70"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            {locating ? "Detecting your location…" : "Use my current location"}
          </button>
          <textarea
            rows={3}
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="Flat / Building, Street, Landmark, Pincode"
            className="w-full resize-none rounded-2xl border border-border/70 bg-card p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </Section>
      )}


      <Section title="Payment">
        <div className="grid grid-cols-2 gap-2">
          <PayCard active={pay === "upi"} onClick={() => setPay("upi")} icon={<Smartphone className="h-4 w-4" />} label="UPI" />
          <PayCard active={pay === "cash"} onClick={() => setPay("cash")} icon={<Banknote className="h-4 w-4" />} label="Cash on delivery" />
          <PayCard active={pay === "card"} onClick={() => setPay("card")} icon={<CreditCard className="h-4 w-4" />} label="Card" />
          <PayCard active={pay === "wallet"} onClick={() => setPay("wallet")} icon={<Wallet className="h-4 w-4" />} label="Wallet" />
        </div>

        {pay === "upi" && (
          <div className="mt-3 rounded-2xl border border-border/60 bg-card p-3">
            {upiSettings.vpa && isValidVpa(upiSettings.vpa) ? (
              <>
                <div className="text-[11px] text-muted-foreground">
                  Pay <span className="font-semibold text-foreground">{inr(total)}</span> to{" "}
                  <span className="font-semibold text-foreground">{upiSettings.vpa}</span> — pick your UPI app below.
                  The amount will be pre-filled.
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      disabled={placing}
                      onClick={() => place(app.scheme)}
                      className="press flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm font-medium shadow-soft disabled:opacity-60"
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                        style={{ backgroundColor: app.color }}
                      >
                        {app.name.slice(0, 1)}
                      </span>
                      <span className="flex-1 truncate">{app.name}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Tapping an app places your order and opens it with the amount ready to pay.
                </p>
              </>
            ) : (
              <div className="text-[11px] text-muted-foreground">
                UPI isn't set up yet by the restaurant. Please choose another payment method.
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="Order notes (optional)">
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ring the bell twice, leave at the door…"
          className="w-full resize-none rounded-2xl border border-border/70 bg-card p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] border-t border-border/60 bg-background/95 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur">
        <button
          onClick={place}
          disabled={placing}
          className="press flex w-full items-center justify-between rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift disabled:opacity-70"
        >
          <span>{inr(total)}</span>
          <span>{placing ? "Placing…" : "Place order"}</span>
        </button>
      </div>
    </MobileShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 pt-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function TypeCard({ active, onClick, icon, label, hint }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; hint: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "press flex flex-col items-start gap-1 rounded-2xl border bg-card p-3 text-left shadow-soft transition-colors",
        active ? "border-primary ring-1 ring-primary/40" : "border-border",
      )}
    >
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70")}>{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </button>
  );
}

function PayCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "press flex items-center gap-2 rounded-2xl border bg-card px-3 py-3 text-left shadow-soft transition-colors",
        active ? "border-primary ring-1 ring-primary/40" : "border-border",
      )}
    >
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70")}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
