import { createRoot } from "react-dom/client";
import "../index.css";
import { AppProviders } from "./providers";
import { KuryeApp } from "./KuryeApp";

createRoot(document.getElementById("root")!).render(
  <AppProviders panel="kurye" lockedRole="courier">
    <KuryeApp />
  </AppProviders>,
);
