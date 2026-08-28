import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnalyticsConsentProvider } from "./components/AnalyticsConsent";

if (import.meta.env.VITE_TEMPO === "true") {
  const _m = "tempo-devtools";
  import(_m)
    .then((mod) => {
      try {
        mod?.TempoDevtools?.init?.();
      } catch {
        // ignore devtools init errors
      }
    })
    .catch(() => {
      // tempo-devtools not installed; skip
    });
}

const basename = import.meta.env.BASE_URL;

const root = document.getElementById("root")!;
const isHydrating = root.hasChildNodes();
const prerenderedTitle = isHydrating ? document.head.querySelector("title") : null;

if (isHydrating) {
  document.head
    .querySelectorAll('[data-prerendered-head="true"]')
    .forEach((element) => element.remove());
}

if (prerenderedTitle) {
  const observer = new MutationObserver(() => {
    const hydratedTitle = [...document.head.querySelectorAll("title")]
      .find((title) => title !== prerenderedTitle);
    if (!hydratedTitle) return;
    prerenderedTitle.remove();
    observer.disconnect();
  });
  observer.observe(document.head, { childList: true });
}

const application = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename}>
        <AnalyticsConsentProvider>
          <App />
        </AnalyticsConsentProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

if (isHydrating) hydrateRoot(root, application);
else createRoot(root).render(application);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).catch(() => {
      // Offline support is a progressive enhancement; the converter remains usable without it.
    });
  });
}
