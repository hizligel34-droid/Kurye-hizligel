import { PWA_APPS, type PwaPanel } from "@shared/kuryelerPwa";
import { Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const firefoxIosMark = ["F", "xiOS"].join("");
  const notOther = !/CriOS|EdgiOS|OPiOS/.test(ua) && !ua.includes(firefoxIosMark);
  return ios && webkit && notOther;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean((window.navigator as { standalone?: boolean }).standalone))
  );
}

export function InstallPrompt({ panel }: { panel: PwaPanel }) {
  const app = PWA_APPS[panel];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosSafari() || isStandalone()) return;
    const key = `hizligel.install.${panel}`;
    if (sessionStorage.getItem(key) === "gizle") return;
    setVisible(true);
  }, [panel]);

  if (!visible) {
    return (
      <p className="mt-2 flex min-h-11 items-center gap-2 text-sm text-[#8a7c52]">
        <Smartphone className="size-5 shrink-0 text-[#D4AF37]" aria-hidden />
        <span>Ana ekrana ekle</span>
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-[#D4AF37]/50 bg-[#1a1508] p-3 text-sm text-[#f5edd6]">
      <p className="flex min-h-11 items-center gap-2 font-bold text-[#D4AF37]">
        <Smartphone className="size-5 shrink-0" aria-hidden />
        Ana ekrana ekle
      </p>
      <ol className="mt-2 space-y-1 text-sm leading-6 text-[#b4a882]">
        <li className="flex min-h-11 items-center gap-2">
          <Share className="size-4 shrink-0 text-[#D4AF37]" aria-hidden />
          Paylaş → Ekle · {app.shortName}
        </li>
      </ol>
      <button
        type="button"
        className="mt-2 inline-flex min-h-11 min-w-11 items-center px-3 text-sm font-bold text-[#b4a882]"
        onClick={() => {
          sessionStorage.setItem(`hizligel.install.${panel}`, "gizle");
          setVisible(false);
        }}
      >
        Gizle
      </button>
    </div>
  );
}
