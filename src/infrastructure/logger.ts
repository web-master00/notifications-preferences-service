type LogLevel = "info" | "warn" | "error";

export interface Logger {
  info(event: string, data?: Record<string, unknown>): void;
  warn(event: string, data?: Record<string, unknown>): void;
  error(event: string, data?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}

function createLogger(bindings: Record<string, unknown> = {}): Logger {
  const emit = (
    level: LogLevel,
    event: string,
    data?: Record<string, unknown>,
  ) => {
    const payload = {
      level,
      event,
      timestamp: new Date().toISOString(),
      ...bindings,
      ...(data ?? {}),
    };
    const line = JSON.stringify(payload);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  };

  return {
    info: (event, data) => emit("info", event, data),
    warn: (event, data) => emit("warn", event, data),
    error: (event, data) => emit("error", event, data),
    child: (extra) => createLogger({ ...bindings, ...extra }),
  };
}

export const logger: Logger = createLogger();

import { createHash } from "node:crypto";

export function pseudonymize(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}
