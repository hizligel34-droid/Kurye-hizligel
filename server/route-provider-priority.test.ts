import { describe, expect, it } from "vitest";
import { createValhallaProvider } from "./valhallaAdapter";
import { resolveOfflineRoute } from "@shared/offlineRouting";
import { calculateOrderFinancials } from "./db";

describe("route provider priority contract", () => {
  it("uses verified Istanbul Valhalla output when the configured provider responds", async () => {
    const provider = createValhallaProvider("https://valhalla.example", async (input) => {
      const url = String(input);
      expect(url).toContain("/route?");
      return new Response(JSON.stringify({
        trip: {
          summary: { length: 8.4, time: 900 },
          locations: [{ lat: 41.01, lon: 29.02 }, { lat: 41.03, lon: 29.10 }],
        },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const route = await resolveOfflineRoute(provider, { lat: 41.01, lng: 29.02 }, { lat: 41.03, lng: 29.10 });
    expect(route).toMatchObject({ distanceKm: 8.4, durationMinutes: 15, provider: "valhalla_offline", status: "verified" });
    expect(calculateOrderFinancials(route!.distanceKm)).toMatchObject({ total: 940, commission: 188 });
  });

  it("rejects stale Valhalla tiles so the caller can use online fallback", async () => {
    const provider = createValhallaProvider("https://valhalla.example", async () => { throw new Error("should not call stale provider"); }, "2000-01-01T00:00:00.000Z");
    expect(provider.state).toBe("stale");
    await expect(resolveOfflineRoute(provider, { lat: 41.01, lng: 29.02 }, { lat: 41.03, lng: 29.10 })).resolves.toBeNull();
  });

  it("returns null so the caller can use Google fallback when Valhalla is unavailable", async () => {
    const provider = createValhallaProvider(undefined);
    await expect(resolveOfflineRoute(provider, { lat: 41.01, lng: 29.02 }, { lat: 41.03, lng: 29.10 })).resolves.toBeNull();
  });
});

// This contract is intentionally provider-level: orders/pricing keep their existing
// Google driving fallback when no VALHALLA_BASE_URL is configured.
