import { randomUUID, timingSafeEqual } from "node:crypto";
import type { AddressInfo } from "node:net";
import { hostHeaderValidation } from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express, { type NextFunction, type Request, type Response } from "express";
import { SERVER_NAME, SERVER_VERSION, type AppConfig, assertHttpSecurity } from "./config.js";
import { createServer } from "./server.js";
import { log, setLogLevel } from "./utils/logger.js";

interface SessionRecord {
  transport: StreamableHTTPServerTransport;
  open: number;
  lastActive: number;
}

export interface HttpHandle {
  port: number;
  close: () => Promise<void>;
}

function tokensMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(right, right);
    return false;
  }
  return timingSafeEqual(left, right);
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function clientAddress(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export async function startHttp(config: AppConfig): Promise<HttpHandle> {
  assertHttpSecurity(config);
  setLogLevel(config.logLevel);
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy ? 1 : false);
  app.use(hostHeaderValidation(config.allowedHosts));
  app.use(express.json({ limit: config.maxBodyBytes }));

  if (config.nodeEnv === "production" && config.trustProxy) {
    app.use((req, res, next) => {
      if (req.path === "/health") {
        next();
        return;
      }
      const forwarded = headerValue(req.headers["x-forwarded-proto"]);
      if (forwarded && forwarded !== "https") {
        res.status(403).json({ error: "https_required" });
        return;
      }
      next();
    });
  }

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: SERVER_NAME,
      version: SERVER_VERSION,
      transport: "streamable-http",
    });
  });

  const sessions = new Map<string, SessionRecord>();
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  const idleMs = 30 * 60 * 1000;

  const idleTimer = setInterval(() => {
    const cutoff = Date.now() - idleMs;
    for (const [key, bucket] of rateBuckets) {
      if (bucket.resetAt <= Date.now()) rateBuckets.delete(key);
    }
    for (const [id, session] of sessions) {
      if (session.open === 0 && session.lastActive < cutoff) {
        session.transport.close().catch((error: unknown) => {
          log("warn", "failed to close idle session", { error: error instanceof Error ? error.message : "unknown" });
        });
        sessions.delete(id);
      }
    }
  }, 60_000);
  idleTimer.unref();

  function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!config.authToken || config.allowUnauthenticated) {
      next();
      return;
    }
    const headerToken = headerValue(req.headers["x-auth-token"]);
    const authorization = headerValue(req.headers.authorization);
    const bearer = authorization?.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : undefined;
    const presented = headerToken || bearer;
    if (!presented || !tokensMatch(presented, config.authToken)) {
      res.status(401).json({ error: "invalid_token", error_description: "Missing or invalid x-auth-token" });
      return;
    }
    next();
  }

  function enforceOrigin(req: Request, res: Response, next: NextFunction): void {
    const origin = headerValue(req.headers.origin);
    if (!origin) {
      next();
      return;
    }
    if (config.allowedOrigins.includes(origin)) {
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Headers", "Authorization, X-Auth-Token, Content-Type, Mcp-Session-Id, Last-Event-ID");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      next();
      return;
    }
    res.status(403).json({ error: "origin_not_allowed" });
  }

  function enforceRate(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const key = clientAddress(req);
    const current = rateBuckets.get(key);
    if (!current || current.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
      next();
      return;
    }
    if (current.count >= config.requestsPerMinute) {
      res.status(429).json({ error: "rate_limit_exceeded" });
      return;
    }
    current.count += 1;
    next();
  }

  function track(session: SessionRecord, res: Response): void {
    session.open += 1;
    session.lastActive = Date.now();
    res.on("close", () => {
      session.open = Math.max(0, session.open - 1);
      session.lastActive = Date.now();
    });
  }

  async function handleMcp(req: Request, res: Response): Promise<void> {
    const sessionId = headerValue(req.headers["mcp-session-id"]);
    try {
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        if (!session) {
          res.status(404).json({ jsonrpc: "2.0", error: { code: -32001, message: "Session not found" }, id: null });
          return;
        }
        track(session, res);
        await session.transport.handleRequest(req, res, req.body);
        return;
      }
      if (sessionId) {
        res.status(404).json({ jsonrpc: "2.0", error: { code: -32001, message: "Session not found" }, id: null });
        return;
      }
      if (req.method === "POST" && isInitializeRequest(req.body)) {
        if (sessions.size >= config.maxSessions) {
          res.status(503).json({ jsonrpc: "2.0", error: { code: -32000, message: "Too many open sessions" }, id: null });
          return;
        }
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            sessions.set(id, { transport, open: 0, lastActive: Date.now() });
          },
        });
        transport.onclose = () => {
          if (transport.sessionId) sessions.delete(transport.sessionId);
        };
        transport.onerror = (error) => {
          log("error", "http transport error", { error: error.message });
        };
        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID provided" },
        id: null,
      });
    } catch (error) {
      log("error", "mcp request failed", { error: error instanceof Error ? error.message : "unknown" });
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
      }
    }
  }

  app.options("/mcp", enforceOrigin, (_req, res) => {
    res.status(204).end();
  });
  app.post("/mcp", enforceOrigin, enforceRate, requireAuth, (req, res) => {
    void handleMcp(req, res);
  });
  app.get("/mcp", enforceOrigin, enforceRate, requireAuth, (req, res) => {
    void handleMcp(req, res);
  });
  app.delete("/mcp", enforceOrigin, enforceRate, requireAuth, (req, res) => {
    void handleMcp(req, res);
  });

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const record = typeof error === "object" && error !== null ? error as { type?: unknown; status?: unknown } : {};
    const tooLarge = record.type === "entity.too.large" || record.status === 413;
    res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? "payload_too_large" : "invalid_request" });
  });

  const httpServer = app.listen(config.port, config.host);
  await new Promise<void>((resolve, reject) => {
    httpServer.once("listening", () => resolve());
    httpServer.once("error", reject);
  });
  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("HTTP server did not bind to a TCP port");
  }
  log("info", "http transport listening", { host: config.host, port: address.port });

  return {
    port: (address as AddressInfo).port,
    close: async () => {
      clearInterval(idleTimer);
      await Promise.all([...sessions.values()].map(async (session) => {
        await session.transport.close();
      }));
      sessions.clear();
      httpServer.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}
