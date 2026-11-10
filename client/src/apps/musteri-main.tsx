import { createRoot } from "react-dom/client";
import "../index.css";
import { AppProviders } from "./providers";
import { MusteriApp } from "./MusteriApp";

createRoot(document.getElementById("root")!).render(
  <AppProviders panel="musteri" lockedRole="customer">
    <MusteriApp />
  </AppProviders>,
);
