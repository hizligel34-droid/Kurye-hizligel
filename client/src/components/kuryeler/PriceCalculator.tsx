import { DeliveryTargetsBlock } from "@/components/kuryeler/DeliveryTargetsBlock";
import { GuestLeadForm } from "@/components/kuryeler/GuestLeadForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cardClass, fieldClass, goldBtn } from "@/lib/kuryelerTheme";
import {
  formatConsumerGross,
  formatConsumerVatLine,
  quoteGuestLead,
} from "@shared/guestLead";
import { CALL_CTA } from "@shared/landingCopy";
import {
  deliveryTargetForDistance,
  formatTariffInclusive,
  isDeliveryTargetsPublic,
  type PricingSettings,
} from "@shared/kuryeler";
import { useMemo, useState } from "react";

export function PriceCalculator({
  pricing,
  id = "cagir",
}: {
  pricing: PricingSettings;
  id?: string;
}) {
  const [kmText, setKmText] = useState("10");
  const [openForm, setOpenForm] = useState(false);
  const distanceKm = Number(kmText.replace(",", ".")) || 0;
  const price = useMemo(() => quoteGuestLead(distanceKm, pricing), [distanceKm, pricing]);
  const target = deliveryTargetForDistance(distanceKm, pricing.deliveryTargetTiers);

  return (
    <section id={id} className={`${cardClass} scroll-mt-24 p-5 sm:p-6`} aria-labelledby="fiyat-baslik">
      <h2 id="fiyat-baslik" className="text-lg font-black">
        Anında fiyat
      </h2>
      <p className="mt-1 text-sm text-[#b4a882]">{formatTariffInclusive(pricing)}</p>
      <div className="mt-4">
        <Label htmlFor="fiyat-km">Sürüş mesafesi (km)</Label>
        <Input
          id="fiyat-km"
          name="distanceKm"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          className={`mt-1 ${fieldClass}`}
          value={kmText}
          onChange={e => {
            setKmText(e.target.value);
            setOpenForm(false);
          }}
        />
      </div>
      <div className="mt-4 rounded-2xl border border-[#3a3014] bg-black p-4">
        <p className="text-3xl font-black leading-tight text-[var(--gold)] sm:text-4xl">
          {distanceKm > 0 ? formatConsumerGross(price) : "—"}
        </p>
        <p className="mt-1 text-xs text-[#8a7c52]">
          {distanceKm > 0 ? formatConsumerVatLine(price) : "Kilometre yazınca KDV dahil tutar görünür."}
        </p>
      </div>
      {isDeliveryTargetsPublic(pricing) && distanceKm > 0 ? (
        <p className="mt-3 text-sm font-semibold text-[#f5edd6]">
          Hedef süre: {target.label}
        </p>
      ) : null}
      <div className="mt-3">
        <DeliveryTargetsBlock pricing={pricing} variant="compact" />
      </div>
      <Button
        type="button"
        className={`mt-4 h-12 w-full ${goldBtn}`}
        disabled={!(distanceKm > 0)}
        onClick={() => {
          setOpenForm(true);
          requestAnimationFrame(() => {
            document.getElementById("kisa-talep")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
      >
        {CALL_CTA}
      </Button>
      {openForm ? (
        <div id="kisa-talep" className="mt-5 scroll-mt-24 border-t border-[#3a3014] pt-5">
          <GuestLeadForm distanceKm={distanceKm} pricing={pricing} />
        </div>
      ) : null}
    </section>
  );
}
