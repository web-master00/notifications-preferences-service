import http from "node:http";
import { AddressInfo } from "node:net";
import { buildAppGraph } from "../app-graph";
import { createRouter } from "../api/routes/router";
import {
  DEFAULT_PREFERENCES_SEED,
  InMemoryDefaultPreferenceRepository,
  InMemoryGlobalPolicyRepository,
  InMemoryQuietHoursRepository,
  InMemoryUnitOfWork,
  InMemoryUserPreferenceRepository,
  silentLogger,
} from "./in-memory-repositories";

interface HttpResult {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  json: () => unknown;
}

function startServer() {
  const defaults = new InMemoryDefaultPreferenceRepository();
  defaults.seed(DEFAULT_PREFERENCES_SEED);
  const userPrefs = new InMemoryUserPreferenceRepository();
  const quietHours = new InMemoryQuietHoursRepository();
  const globalPolicies = new InMemoryGlobalPolicyRepository();
  const uow = new InMemoryUnitOfWork(userPrefs, quietHours);

  const graph = buildAppGraph(
    { defaults, userPrefs, quietHours, globalPolicies },
    uow,
    silentLogger,
  );

  const router = createRouter({
    preferences: graph.preferencesController,
    evaluate: graph.evaluateController,
    logger: silentLogger,
  });

  const server = http.createServer(router);
  return new Promise<{ server: http.Server; port: number }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ server, port });
    });
  });
}

function request(
  port: number,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method,
        path,
        headers: {
          "Content-Type": "application/json",
          ...(data
            ? { "Content-Length": Buffer.byteLength(data).toString() }
            : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: text,
            json: () => JSON.parse(text),
          });
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

describe("HTTP router", () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    const started = await startServer();
    server = started.server;
    port = started.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("GET /live returns 200", async () => {
    const r = await request(port, "GET", "/live");
    expect(r.status).toBe(200);
    expect(r.json()).toEqual({ status: "ok" });
  });

  it("GET /health (legacy alias) returns 200", async () => {
    const r = await request(port, "GET", "/health");
    expect(r.status).toBe(200);
  });

  it("accepts user preferences URL with query string", async () => {
    const r = await request(port, "GET", "/users/abc/preferences?foo=bar");
    expect(r.status).toBe(200);
    const body = r.json() as { userId: string };
    expect(body.userId).toBe("abc");
  });

  it("returns 400 on malformed percent-encoding in userId", async () => {
    const r = await request(port, "GET", "/users/%E0%A4%A/preferences");
    expect(r.status).toBe(400);
  });

  it("returns 405 with Allow header for unsupported method on preferences route", async () => {
    const r = await request(port, "DELETE", "/users/abc/preferences");
    expect(r.status).toBe(405);
    expect(r.headers["allow"]).toContain("GET");
  });

  it("returns 400 on validation error (invalid timezone)", async () => {
    const r = await request(port, "POST", "/users/abc/preferences", {
      quietHours: {
        timezone: "Nope/Nope",
        startTime: "22:00",
        endTime: "08:00",
      },
    });
    expect(r.status).toBe(400);
    expect((r.json() as { error: string }).error).toBe("validation_failed");
  });

  it("sets X-Request-Id response header and echoes provided requestId", async () => {
    const r = await request(port, "GET", "/live", undefined, {
      "X-Request-Id": "req-123",
    });
    expect(r.headers["x-request-id"]).toBe("req-123");
  });

  it("returns 413 for oversize body", async () => {
    const big = "a".repeat(2_000_000);
    const r = await request(port, "POST", "/evaluate", {
      userId: big,
      notificationType: "marketing_email",
      channel: "email",
      region: "EU",
      datetime: "2026-05-21T12:00:00Z",
    });
    expect(r.status).toBe(413);
  });

  it("returns 400 on invalid JSON", async () => {
    const r = await new Promise<HttpResult>((resolve, reject) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          method: "POST",
          path: "/evaluate",
          headers: { "Content-Type": "application/json", "Content-Length": "4" },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              body: text,
              json: () => JSON.parse(text),
            });
          });
        },
      );
      req.on("error", reject);
      req.write("{bad");
      req.end();
    });
    expect(r.status).toBe(400);
  });

  it("end-to-end: POST then GET reflects new preference", async () => {
    const post = await request(port, "POST", "/users/u-e2e/preferences", {
      preferences: [
        {
          notificationType: "marketing_email",
          channel: "email",
          enabled: true,
        },
      ],
    });
    expect(post.status).toBe(200);

    const get = await request(port, "GET", "/users/u-e2e/preferences");
    const body = get.json() as {
      preferences: Array<{
        notificationType: string;
        channel: string;
        enabled: boolean;
        source: string;
      }>;
    };
    const mk = body.preferences.find(
      (p) => p.notificationType === "marketing_email" && p.channel === "email",
    );
    expect(mk).toMatchObject({ enabled: true, source: "user" });
  });
});
