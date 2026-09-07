// Detects app-wrapper webviews (Median / GoNative / generic Android WebView, iOS WKWebView).
// Used to keep sign-in on a single same-tab redirect instead of popups or
// cross-window messaging, which wrappers routinely block.
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
    // localStorage (not sessionStorage): a wrapper may hand the OAuth return
    // back to a fresh webview session.
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
