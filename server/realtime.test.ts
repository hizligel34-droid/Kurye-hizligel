import { describe, expect, it, vi } from "vitest";
import { getLatestCourierLocation, isValidTurkeyLocation, publishCourierLocation, subscribeToCourierLocation } from "./realtime";

describe("realtime courier location", () => {
  it("Türkiye sınırlarındaki koordinatları kabul eder", () => {
    expect(isValidTurkeyLocation({ lat: 41.0082, lng: 28.9784 })).toBe(true);
    expect(isValidTurkeyLocation({ lat: 39.9334, lng: 32.8597 })).toBe(true);
    expect(isValidTurkeyLocation({ lat: 48.8566, lng: 2.3522 })).toBe(false);
    expect(isValidTurkeyLocation({ lat: Number.NaN, lng: 28.9784 })).toBe(false);
  });

  it("son konumu yayınlar ve sonraki SSE abonelerine hazırlar", () => {
    const location = { orderId: 77, trackingCode: "RUN-REALTIME", lat: 41.02, lng: 29.01, accuracy: 8, heading: 90, speed: 7, updatedAt: 123456 };
    publishCourierLocation(location);
    expect(getLatestCourierLocation(77)).toEqual(location);
  });

  it("aboneye ilk bağlantı ve son konum olaylarını yazar", () => {
    const writes: string[] = [];
    const response = { write: vi.fn((chunk: string) => { writes.push(chunk); return true; }) } as never;
    const unsubscribe = subscribeToCourierLocation(77, response);
    expect(writes.join(""))
      .toContain('event: courier-location')
      .and.toContain('event: connection');
    unsubscribe();
  });
});
