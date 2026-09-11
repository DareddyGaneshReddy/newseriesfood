// Detects app-wrapper webviews (Android WebView / Capacitor / iOS WKWebView).
// Used only for presentation decisions; authentication is handled by Supabase.
export function isEmbeddedAppWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const wrapperSignals = /median|gonative|webintoapp|cordova|capacitor|wv\)|; wv/i;
  const iosWebView = /iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua);
  return wrapperSignals.test(ua) || iosWebView;
}

const KEY = "auth-next";

export function rememberAuthDestination(path: string) {
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  try {
    // localStorage (not sessionStorage): the OAuth return may land in a fresh
    // webview session inside a packaged app.
    window.localStorage.setItem(KEY, safe);
    window.sessionStorage.setItem(KEY, safe);
  } catch {
    // Non-fatal: sign-in still completes, we just land on home.
  }
}

export function takeAuthDestination(): string {
  let value: string | null = null;
  try {
    value = window.sessionStorage.getItem(KEY) || window.localStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY);
  } catch {
    value = null;
  }
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
