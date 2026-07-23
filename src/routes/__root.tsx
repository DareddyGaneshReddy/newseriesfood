import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart-store";

function NotFoundComponent() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col items-center justify-center bg-background px-6 text-center">
      <div className="text-6xl">🍽️</div>
      <h1 className="mt-4 text-2xl font-semibold">Not on the menu</h1>
      <p className="mt-2 text-sm text-muted-foreground">The page you were looking for isn't here.</p>
      <Link
        to="/"
        className="press mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
      >
        Back to home
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="press rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
        >
          Try again
        </button>
        <a href="/" className="press rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium">
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FFF8F0" },
      { title: "New Series Food Corner — Order Veg, Non-Veg & Chinese" },
      { name: "description", content: "Order authentic Veg, Non-Veg, Biryani and Chinese from New Series Food Corner. Warm, home-style cooking, delivered fresh." },
      { name: "author", content: "New Series Food Corner" },
      { property: "og:title", content: "New Series Food Corner" },
      { property: "og:description", content: "Order authentic Veg, Non-Veg, Biryani and Chinese — warm, home-style cooking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Outlet />
        <Toaster position="top-center" richColors closeButton />
      </CartProvider>
    </QueryClientProvider>
  );
}
