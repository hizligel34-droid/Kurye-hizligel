import { describe, expect, it, vi } from "vitest";
import { resolveOfflineRoute, type OfflineRouteProvider } from "@shared/offlineRouting";

describe("offline route adapter", () => {
  const pickup = { lat: 41.0082, lng: 28.9784 };
  const delivery = { lat: 41.0422, lng: 29.0067 };

  it("returns a verified Valhalla result only when the engine is ready", async () => {
    const provider: OfflineRouteProvider = {
      state: "ready",
      route: vi.fn().mockResolvedValue({
        distanceKm: 8.4,
        durationMinutes: 22,
        pickup,
        delivery,
        provider: "valhalla_offline",
        status: "verified",
      }),
    };

    await expect(resolveOfflineRoute(provider, pickup, delivery)).resolves.toMatchObject({
      distanceKm: 8.4,
      provider: "valhalla_offline",
      status: "verified",
    });
    expect(provider.route).toHaveBeenCalledWith({ pickup, delivery });
  });

  it.each(["unavailable", "downloading", "stale", "unsupported"] as const)(
    "does not claim a route while engine is %s",
    async state => {
      const provider: OfflineRouteProvider = {
        state,
        route: vi.fn(),
      };

      await expect(resolveOfflineRoute(provider, pickup, delivery)).resolves.toBeNull();
      expect(provider.route).not.toHaveBeenCalled();
    },
  );

  it("rejects coordinates outside Istanbul before invoking the native bridge", async () => {
    const provider: OfflineRouteProvider = {
      state: "ready",
      route: vi.fn(),
    };

    await expect(resolveOfflineRoute(provider, { lat: 39.9, lng: 32.8 }, delivery)).resolves.toBeNull();
    expect(provider.route).not.toHaveBeenCalled();
  });

  it("turns malformed or failing native responses into a safe null result", async () => {
    const failingProvider: OfflineRouteProvider = {
      state: "ready",
      route: vi.fn().mockRejectedValue(new Error("tile missing")),
    };
    const malformedProvider: OfflineRouteProvider = {
      state: "ready",
      route: vi.fn().mockResolvedValue({
        distanceKm: 0,
        durationMinutes: 0,
        pickup,
        delivery,
        provider: "valhalla_offline",
        status: "verified",
      }),
    };

    await expect(resolveOfflineRoute(failingProvider, pickup, delivery)).resolves.toBeNull();
    await expect(resolveOfflineRoute(malformedProvider, pickup, delivery)).resolves.toBeNull();
  });
});
