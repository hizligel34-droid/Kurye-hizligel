import { describe, expect, it, vi } from "vitest";

const storedMessages: any[] = [];
const addMessageMock = vi.fn(async (payload: any) => {
  const record = { id: storedMessages.length + 1, createdAt: new Date(), ...payload };
  storedMessages.push(record);
  return [...storedMessages];
});

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ sourceLanguage: "en", translatedText: "Siparişim nerede?" }) } }] })),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  const fakeDb = { select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 7, customerId: 1, courierId: null }] }) }) }) };
  return {
    ...actual,
    getDb: vi.fn(async () => fakeDb),
    getMessages: vi.fn(async () => [...storedMessages]),
    addMessage: addMessageMock,
  };
});

const { appRouter } = await import("./routers");

describe("chat translation tRPC flow", () => {
  it("writes translated metadata and reads the same record through chat.messages", async () => {
    storedMessages.length = 0;
    addMessageMock.mockClear();
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "customer", name: "Customer", email: "customer@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    await caller.chat.send({ orderId: 7, content: "Where is my order?", senderRole: "customer" });
    const writtenPayload = addMessageMock.mock.calls[0]?.[0];
    const messages = await caller.chat.messages({ orderId: 7 });

    expect(writtenPayload).toMatchObject({ detectedLanguage: "en", translatedContent: "Siparişim nerede?" });
    expect(messages[0]).toMatchObject(writtenPayload);
  });
});
