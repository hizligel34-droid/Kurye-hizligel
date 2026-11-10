import { describe, expect, it } from "vitest";
import {
  haversineKm,
  isPlausibleDrivingDistance,
  randomTrackingCode,
  safeMediaUrl,
} from "./kuryelerSecurity";

describe("kuryeler güvenlik yardımcıları", () => {
  it("takip kodunu KY- ve 32 hex karakterle üretir", () => {
    const codes = new Set(Array.from({ length: 40 }, () => randomTrackingCode()));
    expect(codes.size).toBe(40);
    for (const code of codes) {
      expect(code).toMatch(/^KY-[A-F0-9]{32}$/);
    }
  });

  it("img XSS vektörlerini reddeder, jpeg data URL kabul eder", () => {
    expect(safeMediaUrl("javascript:alert(1)")).toBeNull();
    expect(safeMediaUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeMediaUrl("data:image/svg+xml,<svg onload=alert(1)>")).toBeNull();
    expect(safeMediaUrl("data:image/jpeg;base64,/9j/4AAQ")).toBe("data:image/jpeg;base64,/9j/4AAQ");
    expect(safeMediaUrl("https://kuryeler.tr/pwa/icons/musteri-192.png")).toContain("https://");
  });

  it("kuş uçuşundan kısa sürüş mesafesini reddeder", () => {
    const pickup = { lat: 40.9879, lng: 29.0256 };
    const dropoff = { lat: 41.0814, lng: 29.0119 };
    const straight = haversineKm(pickup, dropoff);
    expect(straight).toBeGreaterThan(10);
    expect(isPlausibleDrivingDistance(0.5, pickup, dropoff)).toBe(false);
    expect(isPlausibleDrivingDistance(7.4, pickup, dropoff)).toBe(true);
    expect(isPlausibleDrivingDistance(500, pickup, dropoff)).toBe(false);
  });
});
