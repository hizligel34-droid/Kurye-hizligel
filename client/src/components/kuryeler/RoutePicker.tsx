import { RouteMap } from "@/components/kuryeler/RouteMap";
import { fieldClass, ghostBtn } from "@/lib/kuryelerTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PRICING, type PricingSettings } from "@shared/kuryeler";
import {
  fetchDrivingRoute,
  reverseGeocode,
  searchAddress,
  type DrivingRoute,
  type GeoHit,
} from "@shared/kuryelerRouting";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export type RouteSelection = {
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
};

type Props = {
  pricing: PricingSettings;
  value: Partial<RouteSelection> | null;
  onChange: (next: RouteSelection | null, error?: string) => void;
};

export function RoutePicker({ pricing, value, onChange }: Props) {
  const [active, setActive] = useState<"pickup" | "dropoff">("pickup");
  const [pickupQ, setPickupQ] = useState(value?.pickupAddress ?? "");
  const [dropoffQ, setDropoffQ] = useState(value?.dropoffAddress ?? "");
  const [pickupHits, setPickupHits] = useState<GeoHit[]>([]);
  const [dropoffHits, setDropoffHits] = useState<GeoHit[]>([]);
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(
    value?.pickupLat
      ? { lat: value.pickupLat, lng: value.pickupLng!, address: value.pickupAddress ?? "" }
      : null,
  );
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(
    value?.dropoffLat
      ? { lat: value.dropoffLat, lng: value.dropoffLng!, address: value.dropoffAddress ?? "" }
      : null,
  );
  const [route, setRoute] = useState<DrivingRoute | null>(
    value?.distanceKm
      ? {
          distanceKm: value.distanceKm,
          durationMin: value.durationMin ?? 0,
          geometry: value.geometry ?? [],
        }
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState<"pickup" | "dropoff" | null>(null);
  const [hint, setHint] = useState("Adresi yazıp Ara’ya basın veya haritaya dokunun.");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!pickup || !dropoff) {
      setRoute(null);
      onChangeRef.current(null);
      return;
    }
    let alive = true;
    setBusy(true);
    setHint("Sürüş rotası hesaplanıyor…");
    void fetchDrivingRoute(pickup, dropoff, pricing)
      .then(next => {
        if (!alive) return;
        setRoute(next);
        setHint("");
        onChangeRef.current({
          pickupAddress: pickup.address,
          dropoffAddress: dropoff.address,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          distanceKm: next.distanceKm,
          durationMin: next.durationMin,
          geometry: next.geometry,
        });
      })
      .catch(error => {
        if (!alive) return;
        setRoute(null);
        const message = error instanceof Error ? error.message : "Sürüş rotası alınamadı.";
        setHint(message);
        onChangeRef.current(null, message);
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, pricing.routingProvider, pricing.routingUrl]);

  const choosePickup = async (lat: number, lng: number, label?: string) => {
    const address = label || (await reverseGeocode({ lat, lng }, pricing.geocoder));
    setPickup({ lat, lng, address });
    setPickupQ(address);
    setPickupHits([]);
    setActive("dropoff");
  };
  const chooseDropoff = async (lat: number, lng: number, label?: string) => {
    const address = label || (await reverseGeocode({ lat, lng }, pricing.geocoder));
    setDropoff({ lat, lng, address });
    setDropoffQ(address);
    setDropoffHits([]);
  };

  const runSearch = async (which: "pickup" | "dropoff") => {
    const q = which === "pickup" ? pickupQ : dropoffQ;
    setSearching(which);
    try {
      const hits = await searchAddress(q, pricing.geocoder);
      if (which === "pickup") setPickupHits(hits);
      else setDropoffHits(hits);
      if (hits.length === 0) setHint("Adres bulunamadı. Haritaya dokunarak da seçebilirsiniz.");
    } catch {
      if (which === "pickup") setPickupHits([]);
      else setDropoffHits([]);
      setHint("Adres araması başarısız. Biraz sonra Ara’ya tekrar basın.");
    } finally {
      setSearching(null);
    }
  };

  const onSearchKey = (which: "pickup" | "dropoff") => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      void runSearch(which);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="pickup-search">
            Alım yeri
          </label>
          <div className="flex gap-2">
            <Input
              id="pickup-search"
              className={`min-w-0 flex-1 ${fieldClass}`}
              placeholder="Adres yazın, Ara’ya basın"
              autoComplete="street-address"
              enterKeyHint="search"
              value={pickupQ}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={pickupHits.length > 0}
              aria-controls="pickup-hits"
              onFocus={() => setActive("pickup")}
              onChange={e => setPickupQ(e.target.value)}
              onKeyDown={onSearchKey("pickup")}
            />
            <Button type="button" variant="outline" className={`${ghostBtn} min-h-11 shrink-0`} disabled={searching === "pickup"} onClick={() => void runSearch("pickup")}>
              {searching === "pickup" ? "…" : "Ara"}
            </Button>
          </div>
          {pickupHits.length > 0 ? (
            <ul
              id="pickup-hits"
              role="listbox"
              aria-label="Alım adresi önerileri"
              className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-[#3a3014] bg-black text-sm"
            >
              {pickupHits.map(hit => (
                <li key={`${hit.lat}-${hit.lng}`} role="option">
                  <button
                    type="button"
                    className="min-h-11 w-full px-3 py-2 text-left hover:bg-[#1a1508]"
                    onClick={() => void choosePickup(hit.lat, hit.lng, hit.label)}
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative">
          <label className="mb-1 block text-sm font-bold text-[#D4AF37]" htmlFor="dropoff-search">
            Gidecek yer
          </label>
          <div className="flex gap-2">
            <Input
              id="dropoff-search"
              className={`min-w-0 flex-1 ${fieldClass}`}
              placeholder="Adres yazın, Ara’ya basın"
              autoComplete="street-address"
              enterKeyHint="search"
              value={dropoffQ}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={dropoffHits.length > 0}
              aria-controls="dropoff-hits"
              onFocus={() => setActive("dropoff")}
              onChange={e => setDropoffQ(e.target.value)}
              onKeyDown={onSearchKey("dropoff")}
            />
            <Button type="button" variant="outline" className={`${ghostBtn} min-h-11 shrink-0`} disabled={searching === "dropoff"} onClick={() => void runSearch("dropoff")}>
              {searching === "dropoff" ? "…" : "Ara"}
            </Button>
          </div>
          {dropoffHits.length > 0 ? (
            <ul
              id="dropoff-hits"
              role="listbox"
              aria-label="Teslim adresi önerileri"
              className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-[#3a3014] bg-black text-sm"
            >
              {dropoffHits.map(hit => (
                <li key={`${hit.lat}-${hit.lng}`} role="option">
                  <button
                    type="button"
                    className="min-h-11 w-full px-3 py-2 text-left hover:bg-[#1a1508]"
                    onClick={() => void chooseDropoff(hit.lat, hit.lng, hit.label)}
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={`min-h-11 flex-1 rounded-xl border text-xs font-bold ${
            active === "pickup" ? "border-[#D4AF37] bg-[#1a1508] text-[#D4AF37]" : "border-[#3a3014] text-[#8a7c52]"
          }`}
          onClick={() => setActive("pickup")}
        >
          Haritada alım
        </button>
        <button
          type="button"
          className={`min-h-11 flex-1 rounded-xl border text-xs font-bold ${
            active === "dropoff" ? "border-[#D4AF37] bg-[#1a1508] text-[#D4AF37]" : "border-[#3a3014] text-[#8a7c52]"
          }`}
          onClick={() => setActive("dropoff")}
        >
          Haritada teslim
        </button>
      </div>
      <RouteMap
        className="h-72 sm:h-80"
        pickup={pickup}
        dropoff={dropoff}
        geometry={route?.geometry}
        active={active}
        onPickup={(lat, lng) => void choosePickup(lat, lng)}
        onDropoff={(lat, lng) => void chooseDropoff(lat, lng)}
      />
      <p className="text-sm text-[#8a7c52]">
        Harita: OpenStreetMap. Adres araması Nominatim kullanım politikasına göre Ara düğmesiyledir (otomatik
        tamamlama yok, saniyede en fazla 1 istek). Rota: {pricing.routingProvider === "ors" ? "OpenRouteService" : "OSRM"}{" "}
        sürüş mesafesi (kuş uçuşu değil). {busy ? "Hesaplanıyor…" : hint}
      </p>
    </div>
  );
}

export const defaultPickerPricing = DEFAULT_PRICING;
