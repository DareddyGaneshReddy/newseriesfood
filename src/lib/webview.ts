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

type MedianGoogleResponse = {
  idToken?: string;
  error?: string;
};

type MedianGoogleBridge = {
  login: (options: { callback: (response: MedianGoogleResponse) => void }) => void;
};

function getMedianGoogleBridge(): MedianGoogleBridge | null {
  if (typeof window === "undefined") return null;
  const candidate = window as unknown as {
    median?: { socialLogin?: { google?: MedianGoogleBridge } };
  };
  return candidate.median?.socialLogin?.google ?? null;
}

export function canUseMedianGoogleSignIn(): boolean {
  return isEmbeddedAppWebView() && getMedianGoogleBridge() !== null;
}

/** Uses Median's native account picker so Google never leaves the APK WebView. */
export function signInWithMedianGoogle(): Promise<string> {
  const bridge = getMedianGoogleBridge();
  if (!bridge) return Promise.reject(new Error("Native Google sign-in is not available in this app build."));

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("Google sign-in timed out. Please try again."));
    }, 120_000);

    const finish = (response: MedianGoogleResponse) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (response.idToken) resolve(response.idToken);
      else reject(new Error(response.error || "Google sign-in was cancelled."));
    };

    try {
      bridge.login({ callback: finish });
    } catch (error) {
      window.clearTimeout(timeout);
      settled = true;
      reject(error instanceof Error ? error : new Error("Could not open Google sign-in."));
    }
  });
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
