import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Flame, Minus, Plus, Star } from "lucide-react";
import { useState } from "react";
import { MobileShell, VegDot } from "@/components/mobile-shell";
import { fetchMenuItem } from "@/lib/queries";
import { imageFor } from "@/lib/menu-images";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/item/$id")({
  component: ItemPage,
});

const addOns = [
  { key: "extra_butter", label: "Extra butter", price: 20 },
  { key: "extra_cheese", label: "Extra cheese", price: 40 },
  { key: "extra_gravy", label: "Extra gravy", price: 30 },
  { key: "extra_spicy", label: "Extra spicy", price: 0 },
];

function ItemPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["item", id], queryFn: () => fetchMenuItem(id) });
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <MobileShell showTopBar={false} showBottomNav={false}>
        <div className="shimmer h-72 w-full" />
        <div className="p-5 space-y-3">
          <div className="shimmer h-6 w-1/2 rounded" />
          <div className="shimmer h-4 w-3/4 rounded" />
        </div>
      </MobileShell>
    );
  }
  if (!data) {
    return (
      <MobileShell>
        <div className="p-10 text-center text-sm text-muted-foreground">This dish isn't available.</div>
      </MobileShell>
    );
  }

  const addOnTotal = addOns.filter((a) => selected[a.key]).reduce((s, a) => s + a.price, 0);
  const total = (Number(data.price) + addOnTotal) * qty;

  const handleAdd = () => {
    const chosen = addOns.filter((a) => selected[a.key]);
    const image = data.image_url ?? imageFor(data.name);
    add(
      {
        id: chosen.length || notes ? `${data.id}::${chosen.map((c) => c.key).join(",")}::${notes}` : data.id,
        name: chosen.length ? `${data.name} (+${chosen.length} add-on${chosen.length > 1 ? "s" : ""})` : data.name,
        price: Number(data.price) + addOnTotal,
        image,
        is_veg: data.is_veg,
        notes: notes || undefined,
      },
      qty,
    );
    toast.success("Added to cart");
    router.history.back();
  };

  return (
    <MobileShell showTopBar={false} showBottomNav={false}>
      <div className="relative">
        <img src={data.image_url ?? imageFor(data.name)} alt={data.name} className="h-72 w-full object-cover" />
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/30 to-transparent p-4 pt-[max(env(safe-area-inset-top),1rem)]">
          <button
            onClick={() => router.history.back()}
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 animate-fade-up">
        <div className="flex items-center gap-2">
          <VegDot veg={data.is_veg} />
          {data.is_chef_special && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Chef's special
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{data.name}</h1>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[oklch(0.74_0.13_82)] text-[oklch(0.74_0.13_82)]" />
            {data.rating?.toFixed(1) ?? "4.5"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {data.prep_time_min} min
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Flame className="h-3.5 w-3.5" />
            {data.spice_level ?? "medium"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {data.description ?? "A house favourite, made fresh to order."}
        </p>
      </div>

      <div className="mt-6 px-5">
        <h3 className="text-sm font-semibold">Customize</h3>
        <div className="mt-3 space-y-2">
          {addOns.map((a) => (
            <label
              key={a.key}
              className={cn(
                "press flex cursor-pointer items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-soft",
                selected[a.key] ? "border-primary" : "border-border/70",
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!selected[a.key]}
                  onChange={(e) => setSelected((s) => ({ ...s, [a.key]: e.target.checked }))}
                  className="h-4 w-4 accent-[color:var(--terracotta)]"
                />
                <span className="text-sm">{a.label}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{a.price ? `+ ${inr(a.price)}` : "Free"}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 px-5">
        <h3 className="text-sm font-semibold">Special instructions</h3>
        <textarea
          rows={3}
          value={notes}
          maxLength={200}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Make it less spicy, no onions…"
          className="mt-2 w-full resize-none rounded-2xl border border-border/70 bg-card p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] border-t border-border/60 bg-background/95 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-border bg-card">
            <button className="press flex h-10 w-10 items-center justify-center" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-6 text-center text-sm font-semibold">{qty}</span>
            <button className="press flex h-10 w-10 items-center justify-center" onClick={() => setQty(qty + 1)} aria-label="Increase">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="press flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Add to cart · {inr(total)}
          </button>
        </div>
        <Link to="/" className="mt-2 block text-center text-[11px] text-muted-foreground">or head back home</Link>
      </div>
    </MobileShell>
  );
}
