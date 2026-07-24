import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, ChevronRight, Sparkles } from "lucide-react";
import { MobileShell, VegDot } from "@/components/mobile-shell";
import { MenuCard, MenuCardSkeleton } from "@/components/menu-card";
import { fetchCategories, fetchMenu } from "@/lib/queries";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Series Food Corner — Home" },
      { name: "description", content: "Warm, home-style Veg, Non-Veg, Biryani and Chinese. Order fresh from New Series Food Corner." },
      { property: "og:title", content: "New Series Food Corner — Home" },
      { property: "og:description", content: "Warm, home-style Veg, Non-Veg, Biryani and Chinese. Order fresh from New Series Food Corner." },
    ],
  }),
  component: HomePage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const cats = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const menu = useQuery({ queryKey: ["menu"], queryFn: fetchMenu });

  const specials = menu.data?.filter((m) => m.is_chef_special).slice(0, 6) ?? [];
  const popular = menu.data?.filter((m) => m.is_popular).slice(0, 6) ?? [];
  const bestsellers = menu.data?.filter((m) => m.is_bestseller).slice(0, 4) ?? [];

  return (
    <MobileShell title="New Series Food Corner">
      <div className="px-5 pt-4 pb-2 animate-fade-up">
        <div className="text-[13px] text-muted-foreground">{greeting()},</div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Hungry? Let's fix that.</h1>
      </div>

      {/* Search */}
      <Link
        to="/menu"
        className="press mx-5 flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground shadow-soft"
      >
        <Search className="h-4 w-4" />
        Search biryani, paneer, chinese…
      </Link>

      {/* Restaurant banner */}
      <div className="mx-5 mt-5 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft animate-fade-up">
        <div className="relative h-36 w-full">
          <img
            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.75_0.15_140)]" />
              Open now
            </div>
            <div className="mt-0.5 text-lg font-semibold">New Series Food Corner</div>
            <div className="text-xs opacity-90">Veg • Non-Veg • Chinese • Biryani</div>
          </div>
        </div>
        <div className="flex divide-x divide-border/60 px-1 py-2 text-center text-[11px]">
          <div className="flex-1 py-1">
            <div className="font-semibold text-foreground">30–40 min</div>
            <div className="text-muted-foreground">Delivery</div>
          </div>
          <div className="flex-1 py-1">
            <div className="font-semibold text-foreground">4.6 ★</div>
            <div className="text-muted-foreground">Rating</div>
          </div>
          <div className="flex-1 py-1">
            <div className="font-semibold text-foreground">Fresh</div>
            <div className="text-muted-foreground">Home-style</div>
          </div>
        </div>

      </div>

      {/* Categories */}
      <SectionHeader title="What are you craving?" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {cats.data?.map((c) => (
          <Link
            key={c.id}
            to="/menu"
            search={{ cat: c.slug }}
            className="press flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center shadow-soft hover-lift"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">{c.icon}</div>
            <div className="text-[11px] font-medium leading-tight">{c.name}</div>
          </Link>
        ))}
        {!cats.data && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer h-24 w-20 shrink-0 rounded-2xl" />
        ))}
      </div>

      {/* Chef's specials horizontal */}
      <SectionHeader
        title="Chef's specials"
        icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
      />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
        {specials.map((s) => (
          <Link
            key={s.id}
            to="/item/$id"
            params={{ id: s.id }}
            className="press w-[240px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft hover-lift"
          >
            <div className="relative h-32 w-full overflow-hidden bg-secondary">
              <img src={s.image_url} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                Chef's
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5">
                <VegDot veg={s.is_veg} />
                <h3 className="truncate text-sm font-semibold">{s.name}</h3>
              </div>
              <div className="mt-1 flex items-center justify-between text-[12px]">
                <span className="font-semibold">{inr(s.price)}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {s.prep_time_min}m
                </span>
              </div>
            </div>
          </Link>
        ))}
        {menu.isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shimmer h-52 w-[240px] shrink-0 rounded-2xl" />
        ))}
      </div>

      {/* Popular */}
      <SectionHeader title="Popular right now" href="/menu" />
      <div className="flex flex-col gap-3 px-5">
        {menu.isLoading && Array.from({ length: 3 }).map((_, i) => <MenuCardSkeleton key={i} />)}
        {popular.map((m) => <MenuCard key={m.id} item={m} />)}
      </div>

      {/* Bestsellers */}
      <SectionHeader title="Bestsellers" />
      <div className="flex flex-col gap-3 px-5 pb-8">
        {bestsellers.map((m) => <MenuCard key={m.id} item={m} />)}
      </div>
    </MobileShell>
  );
}

function SectionHeader({ title, href, icon }: { title: string; href?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between px-5 pb-3 pt-6">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
      </div>
      {href && (
        <Link to={href} className="press flex items-center gap-0.5 text-xs font-medium text-primary">
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
