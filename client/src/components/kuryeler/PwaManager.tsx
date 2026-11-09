import { panelFromPath, PWA_APPS } from "@shared/kuryelerPwa";
import { useEffect } from "react";
import { useLocation } from "wouter";

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[data-kuryeler="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    el.dataset.kuryeler = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (extra) {
    for (const [key, value] of Object.entries(extra)) el.setAttribute(key, value);
  }
}

function upsertMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[data-kuryeler="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    el.dataset.kuryeler = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

export function PwaManager() {
  const [location] = useLocation();

  useEffect(() => {
    const panel = panelFromPath(location);
    const app = PWA_APPS[panel];
    upsertLink("manifest", app.manifestPath);
    upsertLink("apple-touch-icon", app.iconPath);
    upsertMeta("theme-color", app.themeColor);
    upsertMeta("apple-mobile-web-app-title", app.shortName);
    upsertMeta("apple-mobile-web-app-capable", "yes");
    upsertMeta("mobile-web-app-capable", "yes");
  }, [location]);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
