import { Link } from "@tanstack/react-router";
import { Plus, Star, Clock, Minus } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { inr } from "@/lib/format";
import { VegDot } from "./mobile-shell";

export type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_veg: boolean;
  is_bestseller: boolean;
  is_chef_special: boolean;
  prep_time_min: number;
  rating: number | null;
  image_url: string;
};

export function MenuCard({ item }: { item: MenuItemRow }) {
  const { items, add, setQty } = useCart();
  const inCart = items.find((c) => c.id === item.id);

  return (
    <div className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft hover-lift">
      <Link
        to="/item/$id"
        params={{ id: item.id }}
        className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary"
      >
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            if (!el.dataset.fallback) {
              el.dataset.fallback = "1";
              el.src = "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=900&q=80";
            }
          }}
          className="h-full w-full object-cover"
        />

      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link to="/item/$id" params={{ id: item.id }} className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <VegDot veg={item.is_veg} />
              {item.is_bestseller && (
                <span className="rounded-full bg-[color-mix(in_oklab,var(--mustard)_20%,transparent)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[oklch(0.5_0.12_82)]">
                  Bestseller
                </span>
              )}
              {item.is_chef_special && (
                <span className="rounded-full bg-[color-mix(in_oklab,var(--terracotta)_15%,transparent)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                  Chef's
                </span>
              )}
            </div>
            <h3 className="mt-1 truncate text-[15px] font-semibold leading-tight text-foreground">
              {item.name}
            </h3>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
                {item.description}
              </p>
            )}
          </Link>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">{inr(item.price)}</span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[oklch(0.74_0.13_82)] text-[oklch(0.74_0.13_82)]" />
              {item.rating?.toFixed(1) ?? "4.5"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.prep_time_min}m
            </span>
          </div>
          {inCart ? (
            <div className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground">
              <button
                className="press flex h-8 w-8 items-center justify-center rounded-full"
                onClick={() => setQty(item.id, inCart.qty - 1)}
                aria-label="Decrease"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-5 text-center text-sm font-semibold">{inCart.qty}</span>
              <button
                className="press flex h-8 w-8 items-center justify-center rounded-full"
                onClick={() => setQty(item.id, inCart.qty + 1)}
                aria-label="Increase"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              className="press inline-flex items-center gap-1 rounded-full border border-primary/40 bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-soft"
              onClick={() =>
                add({
                  id: item.id,
                  name: item.name,
                  price: Number(item.price),
                  image: item.image_url,
                  is_veg: item.is_veg,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MenuCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3">
      <div className="shimmer h-24 w-24 shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="shimmer h-4 w-1/2 rounded" />
        <div className="shimmer h-3 w-3/4 rounded" />
        <div className="shimmer mt-auto h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}
