import {
  DEFAULT_PRICING,
  type Geocoder,
  type LatLng,
  type PricingSettings,
  type RoutingProvider,
} from "./kuryeler";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const NOMINATIM_POLICY =
  "Nominatim: otomatik tamamlama yok; Ara düğmesi ve en fazla saniyede 1 istek.";

const NOMINATIM_MIN_INTERVAL_MS = 1000;
let lastNominatimAt = 0;

async function throttleNominatim() {
  const wait = NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimAt);
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  lastNominatimAt = Date.now();
}

export type GeoHit = LatLng & { label: string };

export type DrivingRoute = {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
};

const CONTACT = "serif.tekin@hotmail.com";
const APP_REF = "https://kuryeler.tr";

function headers(): HeadersInit {
  return {
    Accept: "application/json",
    "Accept-Language": "tr",
  };
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export async function searchAddress(
  query: string,
  geocoder: Geocoder = "nominatim",
): Promise<GeoHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  if (geocoder === "photon") {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", q);
    url.searchParams.set("lang", "tr");
    url.searchParams.set("limit", "6");
    url.searchParams.set("lat", "41.01");
    url.searchParams.set("lon", "28.98");
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error("Adres araması başarısız (Photon).");
    const data = (await res.json()) as {
      features?: Array<{ geometry: { coordinates: [number, number] }; properties: Record<string, string> }>;
    };
    return (data.features ?? []).map(item => ({
      lat: item.geometry.coordinates[1],
      lng: item.geometry.coordinates[0],
      label: [item.properties.name, item.properties.street, item.properties.district, item.properties.city]
        .filter(Boolean)
        .join(", "),
    }));
  }
  await throttleNominatim();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "tr");
  url.searchParams.set("email", CONTACT);
  const res = await fetch(url, { headers: headers(), referrer: APP_REF });
  if (!res.ok) throw new Error("Adres araması başarısız (Nominatim).");
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return data.map(item => ({
    lat: Number(item.lat),
    lng: Number(item.lon),
    label: item.display_name,
  }));
}

export async function reverseGeocode(point: LatLng, geocoder: Geocoder = "nominatim"): Promise<string> {
  if (geocoder === "photon") {
    const url = new URL("https://photon.komoot.io/reverse");
    url.searchParams.set("lat", String(point.lat));
    url.searchParams.set("lon", String(point.lng));
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
    const data = (await res.json()) as {
      features?: Array<{ properties: Record<string, string> }>;
    };
    const props = data.features?.[0]?.properties;
    return [props?.name, props?.street, props?.district, props?.city].filter(Boolean).join(", ")
      || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  }
  await throttleNominatim();
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("email", CONTACT);
  const res = await fetch(url, { headers: headers(), referrer: APP_REF });
  if (!res.ok) return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

function osrmBase(pricing: PricingSettings) {
  const custom = pricing.routingUrl?.replace(/\/$/, "");
  if (pricing.routingProvider === "custom" && custom) return custom;
  if (pricing.routingProvider === "osrm") {
    return custom && custom.includes("osrm") ? custom : "https://router.project-osrm.org";
  }
  return custom || "https://router.project-osrm.org";
}

async function fetchOsrm(pickup: LatLng, dropoff: LatLng, base: string): Promise<DrivingRoute> {
  const path = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
  const url = `${base}/route/v1/driving/${path}?overview=full&geometries=geojson`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error("Sürüş rotası alınamadı. Biraz sonra tekrar deneyin.");
  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
    }>;
  };
  const route = data.routes?.[0];
  if (!route) throw new Error("Bu iki nokta arasında sürüş rotası bulunamadı.");
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
  };
}

async function fetchOrs(
  pickup: LatLng,
  dropoff: LatLng,
  apiKey: string,
): Promise<DrivingRoute> {
  const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
    method: "POST",
    headers: {
      ...headers(),
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [pickup.lng, pickup.lat],
        [dropoff.lng, dropoff.lat],
      ],
    }),
  });
  if (!res.ok) throw new Error("OpenRouteService rotası alınamadı.");
  const data = (await res.json()) as {
    features?: Array<{
      geometry: { coordinates: [number, number][] };
      properties: { summary: { distance: number; duration: number } };
    }>;
  };
  const feature = data.features?.[0];
  if (!feature) throw new Error("Bu iki nokta arasında sürüş rotası bulunamadı.");
  return {
    distanceKm: feature.properties.summary.distance / 1000,
    durationMin: feature.properties.summary.duration / 60,
    geometry: feature.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
  };
}

export async function fetchDrivingRoute(
  pickup: LatLng,
  dropoff: LatLng,
  pricing: PricingSettings = DEFAULT_PRICING,
  orsKey?: string,
): Promise<DrivingRoute> {
  if (pickup.lat === dropoff.lat && pickup.lng === dropoff.lng) {
    throw new Error("Alım ve teslim noktaları aynı olamaz.");
  }
  const provider: RoutingProvider = pricing.routingProvider;
  if (provider === "ors") {
    const key =
      orsKey ||
      (typeof import.meta !== "undefined" ? String(import.meta.env.VITE_ORS_API_KEY ?? "") : "") ||
      "";
    if (key) return fetchOrs(pickup, dropoff, key);
    // Anahtar yoksa ücretsiz OSRM’e düş (kuş uçuşu değil, yine sürüş).
  }
  return fetchOsrm(pickup, dropoff, osrmBase(pricing));
}

export function parseRouteGeometry(raw: string | null): [number, number][] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as [number, number][] | { coordinates: [number, number][] };
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.coordinates)) {
      return parsed.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    }
  } catch {
    return [];
  }
  return [];
}
