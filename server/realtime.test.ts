import { describe, expect, it, vi } from "vitest";
import { getLatestCourierLocation, isValidIstanbulLocation, publishCourierLocation, subscribeToCourierLocation } from "./realtime";

describe("realtime courier location", () => {
  it("yalnızca İstanbul hizmet alanındaki koordinatları kabul eder", () => {
    expect(isValidIstanbulLocation({ lat: 41.0082, lng: 28.9784 })).toBe(true);
    expect(isValidIstanbulLocation({ lat: 39.9334, lng: 32.8597 })).toBe(false);
    expect(isValidIstanbulLocation({ lat: Number.NaN, lng: 28.9784 })).toBe(false);
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
