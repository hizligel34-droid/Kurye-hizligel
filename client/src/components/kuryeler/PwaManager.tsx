import { PWA_APPS, type PwaPanel } from "@shared/kuryelerPwa";
import { useEffect } from "react";

export function PwaManager({ panel }: { panel?: PwaPanel }) {
  useEffect(() => {
    if (!panel) return;
    if (import.meta.env.DEV) return;
    if (!("serviceWorker" in navigator)) return;
    const app = PWA_APPS[panel];
    void navigator.serviceWorker.register(app.swPath, { scope: app.scope }).catch(() => undefined);
  }, [panel]);

  return null;
}
