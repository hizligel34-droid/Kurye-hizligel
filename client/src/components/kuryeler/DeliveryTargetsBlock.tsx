import { cardClass } from "@/lib/kuryelerTheme";
import {
  DEFAULT_DELIVERY_TARGET_TIERS,
  DEFAULT_PRICING,
  DELIVERY_TARGET_DISCLAIMER,
  deliveryTargetTable,
  isDeliveryTargetsPublic,
  PUBLIC_DELIVERY_DETAIL,
  PUBLIC_DELIVERY_PROMISE,
  SAME_DAY_CITY_DELIVERY,
  type PricingSettings,
} from "@shared/kuryeler";

export function DeliveryTargetsBlock({
  pricing = DEFAULT_PRICING,
  variant = "full",
}: {
  pricing?: PricingSettings;
  variant?: "full" | "compact";
}) {
  if (!isDeliveryTargetsPublic(pricing)) {
    return (
      <div>
        <p className={variant === "full" ? "text-lg font-black text-[#D4AF37]" : "text-sm font-semibold text-[#f5edd6]"}>
          {PUBLIC_DELIVERY_PROMISE}
        </p>
        {variant === "full" ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b4a882]">{PUBLIC_DELIVERY_DETAIL}</p>
        ) : null}
      </div>
    );
  }

  const rows = deliveryTargetTable(pricing.deliveryTargetTiers ?? DEFAULT_DELIVERY_TARGET_TIERS);
  return (
    <div>
      <p className={variant === "full" ? "text-lg font-black text-[#D4AF37]" : "text-sm font-semibold text-[#f5edd6]"}>
        {SAME_DAY_CITY_DELIVERY}
      </p>
      {variant === "full" ? (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {rows.map(row => (
            <li key={row.range} className={`${cardClass} p-4`}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8a7c52]">{row.range}</p>
              <p className="mt-2 text-lg font-black text-[#D4AF37]">{row.label}</p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-2 space-y-1 text-xs text-[#b4a882]">
          {rows.map(row => (
            <li key={row.range}>
              {row.range} {row.label}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-[#8a7c52]">{DELIVERY_TARGET_DISCLAIMER}</p>
    </div>
  );
}
