import type {
  OfflineRouteProvider,
  OfflineRouteResult,
  RoutePoint,
} from "@shared/offlineRouting";

type ValhallaFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type ValhallaResponse = {
  trip?: {
    summary?: { length?: number; time?: number };
    locations?: Array<{ lat?: number; lon?: number }>;
  };
};

function validPoint(point: RoutePoint) {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

/**
 * Valhalla tile/native servisinin HTTP JSON sözleşmesi için provider.
 * URL verilmezse provider unavailable kalır; uygulama kesin rota iddiasında bulunmaz.
 */
export function createValhallaProvider(
  baseUrl: string | undefined,
  fetchImpl: ValhallaFetch = fetch,
): OfflineRouteProvider {
  const normalized = baseUrl?.replace(/\/$/, "");

  return {
    state: normalized ? "ready" : "unavailable",
    async route({ pickup, delivery }): Promise<OfflineRouteResult | null> {
      if (!normalized || !validPoint(pickup) || !validPoint(delivery)) return null;

      const url = new URL(`${normalized}/route`);
      url.searchParams.set("json", JSON.stringify({
        locations: [
          { lat: pickup.lat, lon: pickup.lng },
          { lat: delivery.lat, lon: delivery.lng },
        ],
        costing: "auto",
        units: "kilometers",
      }));

      const response = await fetchImpl(url, { headers: { accept: "application/json" } });
      if (!response.ok) return null;
      const payload = (await response.json()) as ValhallaResponse;
      const summary = payload.trip?.summary;
      const locations = payload.trip?.locations;
      if (!summary?.length || !summary.time || !locations || locations.length < 2) return null;

      return {
        distanceKm: summary.length,
        durationMinutes: summary.time / 60,
        pickup,
        delivery,
        provider: "valhalla_offline",
        status: "verified",
      };
    },
  };
}
