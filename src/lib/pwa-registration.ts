export async function registerProductionServiceWorker() {
  if (typeof window === "undefined") return;

  const host = window.location.hostname;
  const isPreview =
    window.self !== window.top ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  if (!import.meta.env.PROD || isPreview || new URLSearchParams(window.location.search).has("sw")) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => {
          const scriptUrl = registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL;
          return scriptUrl ? new URL(scriptUrl).pathname === "/sw.js" : false;
        })
        .map((registration) => registration.unregister()),
    );
    return;
  }

  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}
