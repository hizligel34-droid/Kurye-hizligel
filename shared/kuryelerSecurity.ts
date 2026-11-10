/** Güvenlik yardımcıları: medya URL, takip kodu entropisi, mesafe sağduyusu. */

export type LatLngLike = { lat: number; lng: number };

export function haversineKm(a: LatLngLike, b: LatLngLike): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isPlausibleDrivingDistance(
  distanceKm: number,
  pickup: LatLngLike,
  dropoff: LatLngLike,
): boolean {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return false;
  const straight = haversineKm(pickup, dropoff);
  if (distanceKm + 0.2 < straight * 0.5) return false;
  if (distanceKm > Math.max(100, straight * 8 + 10)) return false;
  return true;
}

export function safeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^data:image\/svg/i.test(trimmed)) return null;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:") return trimmed;
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}

export function randomTrackingCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, byte => (byte % 36).toString(36).toUpperCase()).join("");
  return `KY-${rand}`;
}
