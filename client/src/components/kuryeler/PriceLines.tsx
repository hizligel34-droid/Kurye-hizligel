import {
  formatConsumerGross,
  formatConsumerVatLine,
  formatTl,
  formatVatPercent,
  VAT_EXCL_LABEL,
  VAT_INCL_LABEL,
  type PriceBreakdown,
} from "@shared/kuryeler";

export function PriceLines({
  price,
  size = "normal",
  audience = "consumer",
}: {
  price: PriceBreakdown;
  size?: "normal" | "large";
  audience?: "consumer" | "business";
}) {
  if (audience === "consumer") {
    const grossClass = size === "large" ? "text-3xl font-black text-[var(--gold)]" : "text-base font-black text-[var(--gold)]";
    return (
      <div className="space-y-1">
        <p className={grossClass}>{formatConsumerGross(price)}</p>
        <p className="text-sm text-[#8a7c52]">{formatConsumerVatLine(price)}</p>
      </div>
    );
  }

  const netClass = size === "large" ? "text-lg font-black text-[#f5edd6]" : "text-sm font-semibold text-[#f5edd6]";
  const grossClass = size === "large" ? "text-3xl font-black text-[var(--gold)]" : "text-base font-black text-[var(--gold)]";
  return (
    <div className="space-y-1">
      <p className={netClass}>
        {formatTl(price.netTl)} <span className="text-sm font-bold text-[#8a7c52]">{VAT_EXCL_LABEL}</span>
      </p>
      <p className="text-sm text-[#8a7c52]">
        KDV ({formatVatPercent(price.vatRate)}): {formatTl(price.vatTl)}
      </p>
      <p className={grossClass}>
        {formatTl(price.grossTl)} <span className="text-xs font-bold">{VAT_INCL_LABEL}</span>
      </p>
    </div>
  );
}
