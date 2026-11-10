import { BrandMark, DemoBanner, StatusBadge } from "@/components/kuryeler/BrandShell";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { EmptyState, ErrorState, SkipLink } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackPublic, type PublicTrack } from "@/lib/kuryelerApi";
import { cardClass, fieldClass, goldBtn } from "@/lib/kuryelerTheme";
import { PUBLIC_STATUSES, STATUS_LABELS, displayStatus, formatKm, statusTone } from "@shared/kuryeler";
import { validateTrackingCode } from "@shared/kuryelerValidation";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function TrackPage() {
  const params = useParams<{ code?: string }>();
  const [code, setCode] = useState(params.code ?? "");
  const [result, setResult] = useState<PublicTrack | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const inMusteriApp = typeof window !== "undefined" && window.location.pathname.startsWith("/musteri");

  const search = async (value: string) => {
    const invalid = validateTrackingCode(value);
    if (invalid) {
      setError(invalid);
      toast.error(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    setSearched(true);
    try {
      const found = await trackPublic(value);
      setResult(found);
      if (!found) setError("Bu takip kodu bulunamadı. Kodun KY- ile başladığını kontrol edin.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Takip başarısız");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (params.code) void search(params.code);
  }, [params.code]);

  const orderCta = inMusteriApp ? (
    <Button variant="ghost" className="text-[#D4AF37]" asChild>
      <Link href="/">Sipariş ver</Link>
    </Button>
  ) : (
    <Button variant="ghost" className="text-[#D4AF37]" asChild>
      <a href="/musteri/">Hızlıgel Müşteri</a>
    </Button>
  );

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-[#f5edd6]">
      <SkipLink />
      <DemoBanner />
      <header className="border-b border-[#3a3014] bg-black pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <BrandMark compact href={inMusteriApp ? "/" : "/"} />
          {orderCta}
        </div>
      </header>
      <main id="icerik" className="mx-auto max-w-lg px-4 py-8">
        <div className={cardClass + " p-5"}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Canlı takip</p>
          <h1 className="mt-2 text-2xl font-black">Siparişiniz nerede?</h1>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={event => {
              event.preventDefault();
              void search(code);
            }}
          >
            <label className="sr-only" htmlFor="tracking-code">
              Takip numarası
            </label>
            <Input
              id="tracking-code"
              className={fieldClass}
              placeholder="KY-…"
              value={code}
              onChange={e => setCode(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "tracking-error" : undefined}
            />
            <Button className={`${goldBtn} w-full sm:w-auto`} disabled={busy}>
              {busy ? "Aranıyor…" : "Bak"}
            </Button>
          </form>
        </div>
        {error && searched ? (
          <div className="mt-4" id="tracking-error">
            <ErrorState message={error} onRetry={() => void search(code)} />
          </div>
        ) : null}
        {!result && !error && searched && !busy ? (
          <div className="mt-4">
            <EmptyState title="Sonuç yok" body="Takip kodunu sipariş onayından kopyalayıp tekrar deneyin." />
          </div>
        ) : null}
        {result ? (
          <div className={`${cardClass} mt-4 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono font-bold text-[#D4AF37]">{result.trackingCode}</p>
              <StatusBadge
                label={STATUS_LABELS[displayStatus(result.status)]}
                className={statusTone(result.status)}
              />
            </div>
            <p className="mt-3 text-sm text-[#b4a882]">
              {result.product}
              {result.distanceKm > 0 ? ` · ${formatKm(result.distanceKm)}` : result.bolge ? ` · ${result.bolge}` : ""}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#8a7c52]">
              Alım: {result.pickupAddress}
              <br />
              Gidecek yer: {result.dropoffAddress}
            </p>
            <ol className="mt-5 space-y-2">
              {PUBLIC_STATUSES.filter(status => status !== "cancelled").map(status => {
                const current = displayStatus(result.status);
                const reached =
                  PUBLIC_STATUSES.indexOf(current) >= PUBLIC_STATUSES.indexOf(status) &&
                  result.status !== "cancelled";
                return (
                  <li
                    key={status}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      reached ? "border-[#D4AF37] text-[#D4AF37]" : "border-[#3a3014] text-[#8a7c52]"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </main>
      {inMusteriApp ? null : <SiteFooter />}
    </div>
  );
}
