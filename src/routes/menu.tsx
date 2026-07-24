import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { z } from "zod";
import { MobileShell } from "@/components/mobile-shell";
import { MenuCard, MenuCardSkeleton } from "@/components/menu-card";
import { fetchCategories, fetchMenu, type Category } from "@/lib/queries";
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

const NONVEG_ONLY_CATS = new Set(["non-veg", "chinese-non-veg"]);
const MIXED_CATS = new Set(["biryani", "chef-specials"]); // contain both veg and non-veg
const BEVERAGES = "beverages";
const CHEF = "chef-specials";


function MenuPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const cats = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const menu = useQuery({ queryKey: ["menu"], queryFn: fetchMenu });

  const [q, setQ] = useState(search.q ?? "");
  const [mode, setMode] = useState<FilterMode>("all");

  // Which categories to show as secondary chips, based on mode.
  const visibleCats: Category[] = useMemo(() => {
    const list = cats.data ?? [];
    if (mode === "veg") return list.filter((c) => !NONVEG_ONLY_CATS.has(c.slug) && !MIXED_CATS.has(c.slug) && c.slug !== "beverages");
    if (mode === "nonveg") return list.filter((c) => c.slug !== "beverages" && c.slug !== "chefs-special" && !isVegOnlyCat(c.slug));
    return list;
  }, [cats.data, mode]);

  // Whenever mode changes, clear cat if it's no longer visible.
  const activeSlug = useMemo(() => {
    if (!search.cat) return undefined;
    return visibleCats.some((c) => c.slug === search.cat) ? search.cat : undefined;
  }, [search.cat, visibleCats]);
  const activeCat = cats.data?.find((c) => c.slug === activeSlug);

  const filtered = useMemo(() => {
    if (!menu.data) return [];
    const query = q.trim().toLowerCase();
    const catBySlug = new Map((cats.data ?? []).map((c) => [c.id, c.slug]));
    return menu.data.filter((m) => {
      if (mode === "veg" && !m.is_veg) return false;
      if (mode === "nonveg" && m.is_veg) return false;
      // Under Veg/Non-Veg, hide beverages entirely; hide chef's specials under veg/nonveg.
      const slug = catBySlug.get(m.category_id);
      if (mode !== "all") {
        if (slug === "beverages") return false;
        if (slug === "chefs-special") return false;
      }
      // Secondary category filter only applies under "all"
      if (mode === "all" && activeCat && m.category_id !== activeCat.id) return false;
      if (query) {
        const hay = (m.name + " " + (m.description ?? "")).toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [menu.data, cats.data, activeCat, q, mode]);

  const setMode2 = (m: FilterMode) => {
    setMode(m);
    // Clear category filter whenever mode changes.
    nav({ search: { q: q || undefined } });
  };

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
              onClick={() => setMode2(m)}
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

      {/* Category chips — only under "All" */}
      {mode === "all" && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3 pt-1">
          <button
            onClick={() => nav({ search: { q: q || undefined } })}
            className={cn(
              "press flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              !activeSlug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/80",
            )}
          >
            Everything
          </button>
          {visibleCats.map((c) => (
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
      )}

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

// Fully veg-only categories — none of our items are non-veg here.
function isVegOnlyCat(slug: string) {
  return ["veg-meals", "indian-breads", "veg-curries", "chinese-veg"].includes(slug);
}
