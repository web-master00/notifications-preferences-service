import http from "node:http";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PreferencesController } from "../controllers/preferences.controller";
import { EvaluateController } from "../controllers/evaluate.controller";
import { sendJson } from "../http/http-helpers";
import { Logger } from "../../infrastructure/logger";

export interface RouterDependencies {
  preferences: PreferencesController;
  evaluate: EvaluateController;
  logger: Logger;
  prisma?: Pick<PrismaClient, "$queryRawUnsafe">;
}

const USER_PREFS_REGEX = /^\/users\/([^/]+)\/preferences\/?$/;

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function createRouter({
  preferences,
  evaluate,
  logger,
  prisma,
}: RouterDependencies): http.RequestListener {
  return async (req, res) => {
    const incomingRequestId = req.headers["x-request-id"];
    const requestId =
      typeof incomingRequestId === "string" && incomingRequestId.length > 0
        ? incomingRequestId
        : randomUUID();
    res.setHeader("X-Request-Id", requestId);

    const method = req.method ?? "GET";
    const rawUrl = req.url ?? "/";
    const reqLogger = logger.child({ requestId, method, path: rawUrl });

    let pathname = rawUrl;
    try {
      pathname = new URL(rawUrl, "http://localhost").pathname;
    } catch {
      sendJson(res, 400, { error: "invalid_url" });
      return;
    }

    const ctx = { logger: reqLogger, requestId };

    try {
      if (method === "GET" && (pathname === "/live" || pathname === "/health")) {
        return sendJson(res, 200, { status: "ok" });
      }

      if (method === "GET" && pathname === "/ready") {
        if (!prisma) {
          return sendJson(res, 200, { status: "ok" });
        }
        try {
          await prisma.$queryRawUnsafe("SELECT 1");
          return sendJson(res, 200, { status: "ok" });
        } catch (err) {
          reqLogger.error("readiness_failed", {
            message: err instanceof Error ? err.message : "unknown",
          });
          return sendJson(res, 503, { status: "unavailable" });
        }
      }

      if (method === "POST" && pathname === "/evaluate") {
        return await evaluate.handle(req, res, ctx);
      }

      const match = USER_PREFS_REGEX.exec(pathname);
      if (match && match[1] !== undefined) {
        const decoded = safeDecode(match[1]);
        if (decoded === null || decoded.length === 0) {
          return sendJson(res, 400, { error: "invalid_user_id" });
        }
        const userId = decoded;

        if (method === "GET") {
          return await preferences.getUserPreferences(res, userId, ctx);
        }
        if (method === "POST" || method === "PUT") {
          return await preferences.updateUserPreferences(req, res, userId, ctx);
        }
        res.setHeader("Allow", "GET, POST, PUT");
        return sendJson(res, 405, { error: "method_not_allowed" });
      }

      sendJson(res, 404, { error: "not_found" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown_error";
      const stack = err instanceof Error ? err.stack : undefined;
      reqLogger.error("request_failed", { message, stack });
      sendJson(res, 500, { error: "internal_error" });
    }
  };
}
