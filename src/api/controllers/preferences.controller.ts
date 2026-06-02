import http from "node:http";
import { GetUserPreferencesUseCase } from "../../application/use-cases/get-user-preferences.use-case";
import { UpdateUserPreferencesUseCase } from "../../application/use-cases/update-user-preferences.use-case";
import { UpdatePreferencesBodySchema } from "../dto/schemas";
import { readJsonBody, sendJson } from "../http/http-helpers";
import { RequestContext } from "../http/request-context";

export class PreferencesController {
  constructor(
    private readonly getPrefs: GetUserPreferencesUseCase,
    private readonly updatePrefs: UpdateUserPreferencesUseCase,
  ) {}

  async getUserPreferences(
    res: http.ServerResponse,
    userId: string,
    _ctx: RequestContext,
  ): Promise<void> {
    const view = await this.getPrefs.execute(userId);
    sendJson(res, 200, view);
  }

  async updateUserPreferences(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    userId: string,
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

    const parsed = UpdatePreferencesBodySchema.safeParse(raw);
    if (!parsed.success) {
      sendJson(res, 400, {
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
      return;
    }

    await this.updatePrefs.execute(
      {
        userId,
        preferences: parsed.data.preferences,
        quietHours: parsed.data.quietHours,
      },
      ctx.logger,
    );

    const view = await this.getPrefs.execute(userId);
    sendJson(res, 200, view);
  }
}
