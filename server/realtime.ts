import type { Response } from "express";

export type CourierLocation = {
  orderId: number;
  trackingCode: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  remainingDistanceKm?: number | null;
  trafficEtaMinutes?: number | null;
  trafficLevel?: "light" | "moderate" | "heavy" | "unknown";
  trafficSource?: "live_route" | "speed_fallback" | "unavailable";
  updatedAt: number;
};

type Subscriber = { response: Response; heartbeat: NodeJS.Timeout };

const latestLocations = new Map<number, CourierLocation>();
const subscribers = new Map<number, Set<Subscriber>>();

export function isValidIstanbulLocation(location: Pick<CourierLocation, "lat" | "lng">) {
  return Number.isFinite(location.lat) && Number.isFinite(location.lng) && location.lat >= 40.7 && location.lat <= 41.5 && location.lng >= 28.4 && location.lng <= 29.5;
}

export function publishCourierLocation(location: CourierLocation) {
  latestLocations.set(location.orderId, location);
  const payload = `event: courier-location\ndata: ${JSON.stringify(location)}\n\n`;
  subscribers.get(location.orderId)?.forEach(subscriber => subscriber.response.write(payload));
  return location;
}

export function getLatestCourierLocation(orderId: number) {
  return latestLocations.get(orderId);
}

export function subscribeToCourierLocation(orderId: number, response: Response) {
  const subscriber: Subscriber = {
    response,
    heartbeat: setInterval(() => response.write(`: heartbeat ${Date.now()}\n\n`), 15_000),
  };
  const set = subscribers.get(orderId) ?? new Set<Subscriber>();
  set.add(subscriber);
  subscribers.set(orderId, set);
  const latest = getLatestCourierLocation(orderId);
  if (latest) response.write(`event: courier-location\ndata: ${JSON.stringify(latest)}\n\n`);
  response.write(`event: connection\ndata: ${JSON.stringify({ orderId, connectedAt: Date.now() })}\n\n`);
  return () => {
    clearInterval(subscriber.heartbeat);
    set.delete(subscriber);
    if (set.size === 0) subscribers.delete(orderId);
  };
}

export function closeAllRealtimeConnections() {
  subscribers.forEach(set => set.forEach(subscriber => subscriber.response.end()));
  subscribers.clear();
  latestLocations.clear();
}
