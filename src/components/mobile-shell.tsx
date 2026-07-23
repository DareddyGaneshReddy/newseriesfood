import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, ShoppingBag, Receipt, User, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  title,
  showTopBar = true,
  showBottomNav = true,
  hero,
}: {
  children: ReactNode;
  title?: string;
  showTopBar?: boolean;
  showBottomNav?: boolean;
  hero?: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-background shadow-lift">
        {showTopBar && <TopBar title={title} />}
        {hero}
        <main className="flex-1 pb-28">{children}</main>
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}

function TopBar({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Deliver to</div>
          <div className="text-sm font-medium">{title ?? "Your Location"}</div>
        </div>
      </div>
      <Link
        to="/profile"
        className="press flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/80"
        aria-label="Profile"
      >
        <User className="h-4 w-4" />
      </Link>
    </header>
  );
}

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 border-t border-border/60 bg-background/90 backdrop-blur">
      <ul className="flex items-stretch justify-around px-3 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "press relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
                  {to === "/cart" && count > 0 && (
                    <span
                      key={count}
                      className="animate-bounce-in absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
                    >
                      {count}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function VegDot({ veg }: { veg: boolean }) {
  return (
    <span
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      className={cn(
        "inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border-[1.5px]",
        veg ? "border-[oklch(0.55_0.16_140)]" : "border-[oklch(0.55_0.2_25)]",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          veg ? "bg-[oklch(0.55_0.16_140)]" : "bg-[oklch(0.55_0.2_25)]",
        )}
      />
    </span>
  );
}
