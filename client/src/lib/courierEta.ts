export function speedKmhFromMetersPerSecond(speed: number | null | undefined): number | null {
  if (speed == null || !Number.isFinite(speed) || speed < 0) return null;
  return Math.round(speed * 3.6);
}

export function etaMinutesFromRoute(routeDurationMinutes: number | null | undefined, status: string | undefined): number | null {
  if (routeDurationMinutes == null || !Number.isFinite(routeDurationMinutes) || routeDurationMinutes <= 0) return null;
  if (status === "delivered" || status === "cancelled") return 0;
  return Math.max(1, Math.round(routeDurationMinutes));
}
