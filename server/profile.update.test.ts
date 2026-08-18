import { describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, updateUserProfile: vi.fn(async () => ({ id: 1, name: "Ayşe Yılmaz", phone: "05551234567" })) };
});

const { appRouter } = await import("./routers");

describe("profile.update", () => {
  it("returns the newly saved name and phone for immediate account refresh", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "customer", name: "Eski Ad", email: "customer@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const updated = await caller.profile.update({ name: "Ayşe Yılmaz", phone: "05551234567" });
    expect(updated).toMatchObject({ name: "Ayşe Yılmaz", phone: "05551234567" });
  });
});
