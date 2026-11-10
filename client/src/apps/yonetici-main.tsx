import { createRoot } from "react-dom/client";
import "../index.css";
import { AppProviders } from "./providers";
import { YoneticiApp } from "./YoneticiApp";

createRoot(document.getElementById("root")!).render(
  <AppProviders panel="yonetici" lockedRole="admin">
    <YoneticiApp />
  </AppProviders>,
);
