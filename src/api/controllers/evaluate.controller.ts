import http from "node:http";
import { EvaluateUseCase } from "../../application/use-cases/evaluate.use-case";
import { EvaluateBodySchema } from "../dto/schemas";
import { readJsonBody, sendJson } from "../http/http-helpers";
import { RequestContext } from "../http/request-context";

export class EvaluateController {
  constructor(private readonly evaluate: EvaluateUseCase) {}

  async handle(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    ctx: RequestContext,
  ): Promise<void> {
    let raw: unknown;
    try {
      raw = await readJsonBody(req);
    } catch (err) {
      const message = err instanceof Error ? err.message : "invalid_body";
      const status = message === "payload_too_large" ? 413 : 400;
      sendJson(res, status, { error: message });
      return;
    }

    const parsed = EvaluateBodySchema.safeParse(raw);
    if (!parsed.success) {
      sendJson(res, 400, {
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await this.evaluate.execute(parsed.data, ctx.logger);
    sendJson(res, 200, result);
  }
}
