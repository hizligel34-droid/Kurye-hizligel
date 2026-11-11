import { contactPhoneTel } from "@/lib/contact";
import { ghostBtn, goldBtn } from "@/lib/kuryelerTheme";
import { PRIMARY_CTA, SECONDARY_CTA } from "@shared/landingCopy";
import { Phone } from "lucide-react";

export function MobileCallBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--gold)]/35 bg-black/95 px-3 pt-2 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <a
          href="#cagir"
          className={`${goldBtn} inline-flex min-h-11 items-center justify-center px-3 text-base`}
        >
          {PRIMARY_CTA}
        </a>
        <a
          href={contactPhoneTel()}
          className={`${ghostBtn} inline-flex min-h-11 items-center justify-center gap-2 px-3 text-base`}
        >
          <Phone className="size-4" aria-hidden />
          {SECONDARY_CTA}
        </a>
      </div>
    </div>
  );
}
