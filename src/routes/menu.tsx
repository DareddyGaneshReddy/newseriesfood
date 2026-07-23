import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { z } from "zod";
import { MobileShell } from "@/components/mobile-shell";
import { MenuCard, MenuCardSkeleton } from "@/components/menu-card";
import { fetchCategories, fetchMenu } from "@/lib/queries";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  cat: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — New Series Food Corner" },
      { name: "description", content: "Browse the full menu: Veg meals, breads, curries, biryanis, Chinese and more." },
      { property: "og:title", content: "Menu — New Series Food Corner" },
      { property: "og:description", content: "Browse the full menu: Veg, Non-Veg, Biryani, Chinese and beverages." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: MenuPage,
});

type FilterMode = "all" | "veg" | "nonveg";

function MenuPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const cats = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const menu = useQuery({ queryKey: ["menu"], queryFn: fetchMenu });

  const [q, setQ] = useState(search.q ?? "");
  const [mode, setMode] = useState<FilterMode>("all");

  const activeSlug = search.cat ?? cats.data?.[0]?.slug;
  const activeCat = cats.data?.find((c) => c.slug === activeSlug);

  const filtered = useMemo(() => {
    if (!menu.data) return [];
    const query = q.trim().toLowerCase();
    return menu.data.filter((m) => {
      if (!query && activeCat && m.category_id !== activeCat.id) return false;
      if (mode === "veg" && !m.is_veg) return false;
      if (mode === "nonveg" && m.is_veg) return false;
      if (query && !m.name.toLowerCase().includes(query) && !(m.description ?? "").toLowerCase().includes(query)) return false;
      return true;
    });
  }, [menu.data, activeCat, q, mode]);

  return (
    <MobileShell title="Full Menu">
      {/* Search */}
      <div className="sticky top-[57px] z-20 bg-background/85 px-5 pb-3 pt-3 backdrop-blur">
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-2.5 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dishes"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button className="press" onClick={() => setQ("")} aria-label="Clear">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          {(["all", "veg", "nonveg"] as FilterMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "press rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                mode === m
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/70",
              )}
            >
              {m === "all" ? "All" : m === "veg" ? "Veg" : "Non-veg"}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3 pt-1">
        {cats.data?.map((c) => (
          <button
            key={c.id}
            onClick={() => nav({ search: { cat: c.slug, q: q || undefined } })}
            className={cn(
              "press flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              c.slug === activeSlug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/80",
            )}
          >
            <span>{c.icon}</span>
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5 pt-1">
        {menu.isLoading && Array.from({ length: 5 }).map((_, i) => <MenuCardSkeleton key={i} />)}
        {!menu.isLoading && filtered.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-2 text-center">
            <div className="text-5xl">🍽️</div>
            <div className="text-sm text-muted-foreground">No dishes match your search.</div>
          </div>
        )}
        {filtered.map((m) => <MenuCard key={m.id} item={m} />)}
      </div>
      <div className="px-5 pt-6 text-center">
        <Link to="/" className="press text-xs font-medium text-primary">Back to home</Link>
      </div>
    </MobileShell>
  );
}
