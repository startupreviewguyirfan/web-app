declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title
  });
}

export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params);
}
