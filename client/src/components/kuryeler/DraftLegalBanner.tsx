import { LEGAL_DRAFT_BANNER } from "@shared/legalTexts";

export function DraftLegalBanner({ className = "" }: { className?: string }) {
  return (
    <p
      role="status"
      className={`inline-flex items-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#D4AF37] ${className}`.trim()}
    >
      {LEGAL_DRAFT_BANNER}
    </p>
  );
}
