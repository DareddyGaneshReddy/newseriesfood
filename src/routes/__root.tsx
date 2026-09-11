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
      { title: "New Series Food Corner — Home" },
      { name: "description", content: "Warm, home-style Veg, Non-Veg, Biryani and Chinese. Order fresh from New Series Food Corner." },
      { name: "author", content: "New Series Food Corner" },
      { property: "og:title", content: "New Series Food Corner — Home" },
      { property: "og:description", content: "Warm, home-style Veg, Non-Veg, Biryani and Chinese. Order fresh from New Series Food Corner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "New Series Food Corner — Home" },
      { name: "twitter:description", content: "Warm, home-style Veg, Non-Veg, Biryani and Chinese. Order fresh from New Series Food Corner." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/29ad6b61-3fb0-4c7a-a0e6-7ed06fb20771/id-preview-3c435d54--f3697a43-2674-41bf-9b2d-11ab22f49977.lovable.app-1784834200960.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/29ad6b61-3fb0-4c7a-a0e6-7ed06fb20771/id-preview-3c435d54--f3697a43-2674-41bf-9b2d-11ab22f49977.lovable.app-1784834200960.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" },
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

// App wrappers (e.g. an APK built from this site) can hand the sign-in return
// back on any URL, so finish it wherever it lands.
function AuthReturnHandler() {
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "") + "&" + window.location.search.replace(/^\?/, "");
    if (!/(?:^|[&?])(access_token|code|error|error_description)=/.test(raw)) return;
    // The external-browser bridge must forward the untouched OAuth payload to
    // the Median WebView. Consuming it here would store the session in the
    // external browser and strip the tokens before the bridge can deep-link.
    if (window.location.pathname.startsWith("/auth/bridge")) return;
    if (window.location.pathname.startsWith("/auth/callback")) return;
    if (window.location.pathname.startsWith("/reset-password")) return;

    void (async () => {
      const { completeAuthFromUrl } = await import("@/lib/auth-return");
      const { takeAuthDestination } = await import("@/lib/webview");
      const result = await completeAuthFromUrl();
      if (result.signedIn) {
        const destination = takeAuthDestination();
        if (destination !== window.location.pathname) window.location.replace(destination);
      }
    })();
  }, []);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <AuthReturnHandler />
        <Outlet />
        <Toaster position="top-center" richColors closeButton />
      </CartProvider>
    </QueryClientProvider>
  );
}
