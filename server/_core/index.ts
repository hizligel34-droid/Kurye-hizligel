import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerAddressProxy } from "../addressProxy";
import { registerOfflineMapProxy } from "../offlineMapProxy";
import { getOrderByTrackingCode } from "../db";
import { sdk } from "./sdk";
import { subscribeToCourierLocation } from "../realtime";

function canAccessRealtimeOrder(user: { id: number; role: string }, order: { customerId: number; courierId: number | null }) {
  return user.role === "admin" || user.role === "accountant" || order.customerId === user.id || (user.role === "courier" && order.courierId === user.id);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerAddressProxy(app);
  registerOfflineMapProxy(app);
  app.get("/api/realtime/orders/:trackingCode", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const order = await getOrderByTrackingCode(String(req.params.trackingCode));
      if (!order || !user || !canAccessRealtimeOrder(user, order)) {
        res.status(401).json({ error: "Canlı konum akışına erişim yetkiniz yok" });
        return;
      }
      res.status(200).set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
      res.flushHeaders();
      const unsubscribe = subscribeToCourierLocation(order.id, res);
      req.on("close", unsubscribe);
    } catch {
      if (!res.headersSent) res.status(401).json({ error: "Canlı konum akışı başlatılamadı" });
      else res.end();
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
