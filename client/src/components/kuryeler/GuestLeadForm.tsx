import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { whatsappHref } from "@/lib/contact";
import { submitGuestLead } from "@/lib/kuryelerApi";
import { areaClass, checkLabelClass, fieldClass, ghostBtn, goldBtn } from "@/lib/kuryelerTheme";
import {
  buildGuestWhatsappText,
  formatConsumerGross,
  formatConsumerVatLine,
  isHoneypotFilled,
  quoteGuestLead,
  validateGuestLead,
  type GuestLeadInput,
} from "@shared/guestLead";
import { firstError, type FieldErrors } from "@shared/kuryelerValidation";
import { ORDER_CHECKBOX_LABELS } from "@shared/legalTexts";
import { type PricingSettings } from "@shared/kuryeler";
import { useMemo, useState, type FormEvent } from "react";

const emptyLead = {
  fullName: "",
  phone: "",
  pickupAddress: "",
  dropoffAddress: "",
  product: "Kurye gönderisi",
  website: "",
  preInfoOk: false,
  withdrawOk: false,
};

export function GuestLeadForm({
  distanceKm,
  pricing,
}: {
  distanceKm: number;
  pricing: PricingSettings;
}) {
  const [form, setForm] = useState(emptyLead);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = useMemo(() => quoteGuestLead(distanceKm, pricing), [distanceKm, pricing]);
  const lead: GuestLeadInput = { ...form, distanceKm };
  const fieldErrors = validateGuestLead(lead);
  const whatsappText = buildGuestWhatsappText(lead, price);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (isHoneypotFilled(form.website)) {
      setDone(true);
      return;
    }
    const first = firstError(fieldErrors as FieldErrors);
    if (first) {
      setError(first);
      return;
    }
    setBusy(true);
    try {
      await submitGuestLead(lead);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talep gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-3" role="status">
        <p className="text-sm font-semibold text-[#f5edd6]">Talebiniz alındı.</p>
        <p className="text-sm leading-6 text-[#8a7c52]">
          Dilerseniz aynı metni kendi telefonunuzdan WhatsApp ile de iletebilirsiniz. Sistem kimseye
          otomatik mesaj göndermez.
        </p>
        <a
          className={`${ghostBtn} inline-flex min-h-11 w-full items-center justify-center px-4 text-base`}
          href={whatsappHref(whatsappText)}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp ile gönder
        </a>
      </div>
    );
  }

  return (
    <form className="grid grid-cols-1 gap-3" onSubmit={onSubmit} noValidate>
      <p className="break-words text-base text-[#b4a882]">
        {formatConsumerGross(price)}
        <span className="mt-1 block text-sm">{formatConsumerVatLine(price)}</span>
      </p>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label htmlFor="guest-name">Ad soyad</Label>
          <Input
            id="guest-name"
            name="fullName"
            autoComplete="name"
            autoCapitalize="words"
            className={`mt-1 w-full ${fieldClass}`}
            value={form.fullName}
            onChange={e => setForm(current => ({ ...current, fullName: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="guest-phone">Telefon</Label>
          <Input
            id="guest-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={`mt-1 w-full ${fieldClass}`}
            value={form.phone}
            onChange={e => setForm(current => ({ ...current, phone: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="guest-pickup">Alım adresi</Label>
        <Textarea
          id="guest-pickup"
          name="pickupAddress"
          autoComplete="street-address"
          className={`mt-1 w-full ${areaClass}`}
          value={form.pickupAddress}
          onChange={e => setForm(current => ({ ...current, pickupAddress: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="guest-dropoff">Teslim adresi</Label>
        <Textarea
          id="guest-dropoff"
          name="dropoffAddress"
          autoComplete="street-address"
          className={`mt-1 w-full ${areaClass}`}
          value={form.dropoffAddress}
          onChange={e => setForm(current => ({ ...current, dropoffAddress: e.target.value }))}
        />
      </div>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="guest-website">Website</label>
        <input
          id="guest-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={e => setForm(current => ({ ...current, website: e.target.value }))}
        />
      </div>
      <label className={checkLabelClass}>
        <input
          className="mt-1 size-5 shrink-0"
          type="checkbox"
          checked={form.preInfoOk}
          onChange={e => setForm(current => ({ ...current, preInfoOk: e.target.checked }))}
        />
        <span>
          {ORDER_CHECKBOX_LABELS.preInfo}{" "}
          <a href="/on-bilgilendirme" className="inline-flex min-h-11 items-center font-bold text-[var(--gold)]" target="_blank" rel="noreferrer">
            Ön Bilgilendirme
          </a>
          {" · "}
          <a href="/mesafeli-sozlesme" className="inline-flex min-h-11 items-center font-bold text-[var(--gold)]" target="_blank" rel="noreferrer">
            Mesafeli Sözleşme
          </a>
        </span>
      </label>
      <label className={checkLabelClass}>
        <input
          className="mt-1 size-5 shrink-0"
          type="checkbox"
          checked={form.withdrawOk}
          onChange={e => setForm(current => ({ ...current, withdrawOk: e.target.checked }))}
        />
        <span>{ORDER_CHECKBOX_LABELS.withdraw}</span>
      </label>
      {error ? (
        <p className="text-sm text-[#c45c5c]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Button type="submit" className={`h-12 w-full ${goldBtn}`} disabled={busy}>
          {busy ? "Gönderiliyor…" : "Talebi gönder"}
        </Button>
        <a
          className={`${ghostBtn} inline-flex h-12 w-full items-center justify-center px-4 text-base`}
          href={whatsappHref(whatsappText)}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp ile gönder
        </a>
      </div>
      <p className="text-sm leading-5 text-[#8a7c52]">
        WhatsApp bağlantısı yalnızca sizin tıklamanızla açılır; otomatik mesaj yoktur.
      </p>
    </form>
  );
}
