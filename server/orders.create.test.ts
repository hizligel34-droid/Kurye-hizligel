import { describe, expect, it, vi } from "vitest";

const inserted: Record<string, unknown>[] = [];
const fakeDb = {
  insert: () => ({ values: async (value: Record<string, unknown>) => { inserted.push(value); } }),
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => [inserted[0]],
        orderBy: async () => inserted,
      }),
      orderBy: async () => inserted,
    }),
  }),
};

vi.mock("./_core/map", () => ({
  makeRequest: vi.fn(async (path: string) => {
    if (path.includes("directions")) {
      return { routes: [{ legs: [{ distance: { value: 8400 }, duration: { value: 1500 } }] }] };
    }
    return { results: [{ geometry: { location: path.includes("geocode") ? { lat: 41.01, lng: 28.97 } : undefined } }] };
  }),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getDb: vi.fn(async () => fakeDb), listOrders: vi.fn(async () => inserted), addNotification: vi.fn(async () => undefined) };
});

const { appRouter } = await import("./routers");

describe("orders.create address and route persistence", () => {
  it("writes detail fields, verified road distance, and fixed commission together", async () => {
    inserted.length = 0;
    const caller = appRouter.createCaller({
      user: { id: 7, openId: "customer-orders", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.orders.create({
      pickupAddress: "Kadıköy İstanbul",
      pickupProvince: "İstanbul",
      pickupDistrict: "Kadıköy",
      pickupNeighborhood: "Caferağa",
      pickupStreet: "Moda Caddesi",
      pickupBuildingNo: "10",
      pickupAddressDetail: "No: 10",
      deliveryAddress: "Beşiktaş İstanbul",
      deliveryProvince: "İstanbul",
      deliveryDistrict: "Beşiktaş",
      deliveryNeighborhood: "Vişnezade",
      deliveryStreet: "Dolmabahçe Caddesi",
      deliveryBuildingNo: "4",
      deliveryAddressDetail: "D: 4",
      productDescription: "Evrak",
      customerPhone: "05551234567",
    });

    expect(result).toMatchObject({ distanceKm: 8.4, total: 940, commission: 188, routeStatus: "verified" });
    expect(inserted[0]).toMatchObject({ pickupAddressDetail: "No: 10", deliveryAddressDetail: "D: 4", distanceKm: "8.40", totalPrice: "940.00", commission: "188.00", routeStatus: "verified" });

    const readBack = await caller.orders.mine();
    expect(readBack[0]).toMatchObject({ pickupAddressDetail: "No: 10", deliveryAddressDetail: "D: 4" });
  });

  it("keeps the Istanbul-only payload consistent from estimate to order creation", async () => {
    inserted.length = 0;
    const caller = appRouter.createCaller({
      user: { id: 8, openId: "customer-mobile", name: "Mobile Test", email: "mobile@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });
    const payload = {
      pickupAddress: "Caferağa Mahallesi, Moda Caddesi, Kadıköy, İstanbul",
      pickupProvince: "İstanbul",
      pickupDistrict: "Kadıköy",
      pickupNeighborhood: "Caferağa",
      pickupStreet: "Moda Caddesi",
      pickupBuildingNo: "10",
      pickupAddressDetail: "No: 10",
      deliveryAddress: "Vişnezade Mahallesi, Dolmabahçe Caddesi, Beşiktaş, İstanbul",
      deliveryProvince: "İstanbul",
      deliveryDistrict: "Beşiktaş",
      deliveryNeighborhood: "Vişnezade",
      deliveryStreet: "Dolmabahçe Caddesi",
      deliveryBuildingNo: "4",
      deliveryAddressDetail: "D: 4",
      productDescription: "Mobil sipariş",
      customerPhone: "05550000008",
    };
    const estimate = await caller.pricing.estimate({ pickupAddress: payload.pickupAddress, deliveryAddress: payload.deliveryAddress });
    const created = await caller.orders.create(payload);

    expect(estimate).toMatchObject({ distanceKm: 8.4, total: 940, commission: 188, routeStatus: "verified" });
    expect(created).toMatchObject({ distanceKm: estimate.distanceKm, total: estimate.total, commission: estimate.commission });
    expect(inserted[0]).toMatchObject({ pickupProvince: "İstanbul", deliveryProvince: "İstanbul", pickupDistrict: "Kadıköy", deliveryDistrict: "Beşiktaş", routeStatus: "verified" });
  });

  it("estimates a Turkey address route with the same fixed commission rule", async () => {
    const caller = appRouter.createCaller({ user: null, req: { protocol: "https", headers: {} } as any, res: {} as any });
    const estimate = await caller.pricing.estimate({ pickupAddress: "Caferağa Mahallesi, Kadıköy, İstanbul", deliveryAddress: "Vişnezade Mahallesi, Beşiktaş, İstanbul" });
    expect(estimate).toMatchObject({ distanceKm: 8.4, total: 940, commission: 188, routeStatus: "verified", provider: "google_driving" });
  });
});
