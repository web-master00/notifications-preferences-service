import http from "node:http";

const DEFAULT_MAX_BODY_BYTES = 1_000_000;

export function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown,
): void {
  if (res.destroyed || res.writableEnded) return;

  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(payload).toString());
  if (status === 413 || status === 431) {
    res.setHeader("Connection", "close");
  }
  res.end(payload);
}

export function readJsonBody(
  req: http.IncomingMessage,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;

    const settle = (
      resolver: (v: unknown) => void,
      arg: unknown,
    ) => {
      if (settled) return;
      settled = true;
      resolver(arg);
    };

    req.on("data", (chunk: Buffer) => {
      if (settled) return;
      size += chunk.length;
      if (size > maxBytes) {
        settle(reject, new Error("payload_too_large"));
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (settled) return;
      if (size === 0) {
        settle(resolve, {});
        return;
      }
      try {
        const text = Buffer.concat(chunks, size).toString("utf8");
        settle(resolve, JSON.parse(text));
      } catch {
        settle(reject, new Error("invalid_json"));
      }
    });

    req.on("error", (err) => settle(reject, err));
    req.on("close", () => {
      if (!settled) settle(reject, new Error("client_disconnected"));
    });
  });
}
