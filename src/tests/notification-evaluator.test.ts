import { NotificationEvaluatorService } from "../domain/services/notification-evaluator.service";

const service = new NotificationEvaluatorService();

describe("NotificationEvaluatorService", () => {
  it("denies when global policy disallows", () => {
    const result = service.evaluate({
      notificationType: "marketing_sms",
      globalPolicyEnabled: false,
      userPreferenceEnabled: true,
      defaultPreferenceEnabled: true,
      isQuietHours: false,
    });
    expect(result).toEqual({
      decision: "deny",
      reason: "blocked_by_global_policy",
    });
  });

  it("denies marketing during quiet hours", () => {
    const result = service.evaluate({
      notificationType: "marketing_push",
      globalPolicyEnabled: null,
      userPreferenceEnabled: true,
      defaultPreferenceEnabled: true,
      isQuietHours: true,
    });
    expect(result.decision).toBe("deny");
    expect(result.reason).toBe("blocked_by_quiet_hours");
  });

  it("allows transactional during quiet hours", () => {
    const result = service.evaluate({
      notificationType: "transactional_email",
      globalPolicyEnabled: null,
      userPreferenceEnabled: null,
      defaultPreferenceEnabled: true,
      isQuietHours: true,
    });
    expect(result.decision).toBe("allow");
  });

  it("user preference disabled wins over enabled default", () => {
    const result = service.evaluate({
      notificationType: "marketing_email",
      globalPolicyEnabled: null,
      userPreferenceEnabled: false,
      defaultPreferenceEnabled: true,
      isQuietHours: false,
    });
    expect(result).toEqual({
      decision: "deny",
      reason: "blocked_by_user_preference",
    });
  });

  it("user preference enabled wins over disabled default", () => {
    const result = service.evaluate({
      notificationType: "marketing_email",
      globalPolicyEnabled: null,
      userPreferenceEnabled: true,
      defaultPreferenceEnabled: false,
      isQuietHours: false,
    });
    expect(result.decision).toBe("allow");
  });

  it("falls back to default when no user preference", () => {
    const result = service.evaluate({
      notificationType: "transactional_email",
      globalPolicyEnabled: null,
      userPreferenceEnabled: null,
      defaultPreferenceEnabled: true,
      isQuietHours: false,
    });
    expect(result.decision).toBe("allow");
  });

  it("denies with no_preference_configured when nothing is known", () => {
    const result = service.evaluate({
      notificationType: "marketing_push",
      globalPolicyEnabled: null,
      userPreferenceEnabled: null,
      defaultPreferenceEnabled: null,
      isQuietHours: false,
    });
    expect(result).toEqual({
      decision: "deny",
      reason: "no_preference_configured",
    });
  });
});
