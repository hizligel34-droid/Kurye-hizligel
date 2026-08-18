export type OfflineRouteEngineState =
  | "unavailable"
  | "downloading"
  | "ready"
  | "stale"
  | "unsupported";

export type RoutePoint = { lat: number; lng: number };

export type OfflineRouteResult = {
  distanceKm: number;
  durationMinutes: number;
  pickup: RoutePoint;
  delivery: RoutePoint;
  provider: "valhalla_offline";
  status: "verified";
};

export type OfflineRouteProvider = {
  state: OfflineRouteEngineState;
  route: (input: {
    pickup: RoutePoint;
    delivery: RoutePoint;
  }) => Promise<OfflineRouteResult | null>;
};

function isIstanbulPoint(point: RoutePoint) {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= 40.7 &&
    point.lat <= 41.5 &&
    point.lng >= 28.4 &&
    point.lng <= 29.5
  );
}

function isValidRouteResult(result: OfflineRouteResult | null) {
  return Boolean(
    result &&
      result.status === "verified" &&
      result.provider === "valhalla_offline" &&
      Number.isFinite(result.distanceKm) &&
      result.distanceKm > 0 &&
      Number.isFinite(result.durationMinutes) &&
      result.durationMinutes > 0 &&
      isIstanbulPoint(result.pickup) &&
      isIstanbulPoint(result.delivery),
  );
}

/**
 * Native Android/iOS Valhalla bridge için güvenli adapter.
 * Hazır ve İstanbul kapsamındaki bir engine yoksa null döner; böylece
 * offline harita paketi hiçbir zaman tek başına doğrulanmış rota gibi sunulmaz.
 */
export async function resolveOfflineRoute(
  provider: OfflineRouteProvider | null | undefined,
  pickup: RoutePoint,
  delivery: RoutePoint,
): Promise<OfflineRouteResult | null> {
  if (!provider || provider.state !== "ready") return null;
  if (!isIstanbulPoint(pickup) || !isIstanbulPoint(delivery)) return null;

  try {
    const result = await provider.route({ pickup, delivery });
    return isValidRouteResult(result) ? result : null;
  } catch {
    return null;
  }
}
