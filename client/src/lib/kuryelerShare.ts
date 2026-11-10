import { publicTrackingPath } from "@shared/kuryeler";

export function trackingUrl(code: string) {
  const path = publicTrackingPath(code);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export async function copyTrackingLink(code: string) {
  const url = trackingUrl(code);
  await copyText(url);
  return url;
}

export async function shareTrackingLink(code: string) {
  const url = trackingUrl(code);
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    await navigator.share({ title: "Sipariş durumu", text: code, url });
    return "shared";
  }
  await copyText(url);
  return "copied";
}
