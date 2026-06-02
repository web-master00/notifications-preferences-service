import { buildTestContainer } from "./test-container";

describe("Notification Preferences Scenarios", () => {
  describe("Scenario 1: new user defaults", () => {
    it("returns default preferences for a brand-new user", async () => {
      const c = buildTestContainer();

      const view = await c.getPrefs.execute("user-new");

      expect(view.userId).toBe("user-new");
      expect(view.quietHours).toBeNull();
      expect(view.preferences.every((p) => p.source === "default")).toBe(true);

      const transactional = view.preferences.find(
        (p) => p.notificationType === "transactional_email",
      );
      const marketing = view.preferences.find(
        (p) => p.notificationType === "marketing_email",
      );
      expect(transactional?.enabled).toBe(true);
      expect(marketing?.enabled).toBe(false);
    });

    it("evaluator follows defaults when no override exists", async () => {
      const c = buildTestContainer();

      const txResult = await c.evaluate.execute({
        userId: "user-new",
        notificationType: "transactional_email",
        channel: "email",
        region: "US",
        datetime: "2026-05-21T12:00:00Z",
      });
      expect(txResult.decision).toBe("allow");

      const mktResult = await c.evaluate.execute({
        userId: "user-new",
        notificationType: "marketing_email",
        channel: "email",
        region: "US",
        datetime: "2026-05-21T12:00:00Z",
      });
      expect(mktResult.decision).toBe("deny");
      expect(mktResult.reason).toBe("blocked_by_default_preference");
    });
  });

  describe("Scenario 2: user changes preferences", () => {
    it("disables marketing email but keeps transactional", async () => {
      const c = buildTestContainer();

      await c.updatePrefs.execute({
        userId: "user-1",
        preferences: [
          {
            notificationType: "marketing_email",
            channel: "email",
            enabled: false,
          },
        ],
      });

      const view = await c.getPrefs.execute("user-1");

      const marketing = view.preferences.find(
        (p) => p.notificationType === "marketing_email",
      );
      const transactional = view.preferences.find(
        (p) => p.notificationType === "transactional_email",
      );
      expect(marketing).toMatchObject({ enabled: false, source: "user" });
      expect(transactional).toMatchObject({ enabled: true, source: "default" });

      const evalMarketing = await c.evaluate.execute({
        userId: "user-1",
        notificationType: "marketing_email",
        channel: "email",
        region: "US",
        datetime: "2026-05-21T12:00:00Z",
      });
      expect(evalMarketing.decision).toBe("deny");
      expect(evalMarketing.reason).toBe("blocked_by_user_preference");

      const evalTransactional = await c.evaluate.execute({
        userId: "user-1",
        notificationType: "transactional_email",
        channel: "email",
        region: "US",
        datetime: "2026-05-21T12:00:00Z",
      });
      expect(evalTransactional.decision).toBe("allow");
    });

    it("re-enabling overrides default of false", async () => {
      const c = buildTestContainer();

      await c.updatePrefs.execute({
        userId: "user-1",
        preferences: [
          { notificationType: "marketing_email", channel: "email", enabled: true },
        ],
      });

      const result = await c.evaluate.execute({
        userId: "user-1",
        notificationType: "marketing_email",
        channel: "email",
        region: "US",
        datetime: "2026-05-21T12:00:00Z",
      });
      expect(result.decision).toBe("allow");
    });
  });

  describe("Scenario 3: quiet hours", () => {
    it("blocks marketing push during quiet hours and allows transactional", async () => {
      const c = buildTestContainer();

      await c.updatePrefs.execute({
        userId: "user-2",
        preferences: [
          { notificationType: "marketing_push", channel: "push", enabled: true },
        ],
        quietHours: {
          timezone: "Europe/Berlin",
          startTime: "22:00",
          endTime: "08:00",
        },
      });

      const blocked = await c.evaluate.execute({
        userId: "user-2",
        notificationType: "marketing_push",
        channel: "push",
        region: "EU",
        datetime: "2026-05-21T21:30:00Z",
      });
      expect(blocked.decision).toBe("deny");
      expect(blocked.reason).toBe("blocked_by_quiet_hours");

      const transactional = await c.evaluate.execute({
        userId: "user-2",
        notificationType: "transactional_email",
        channel: "email",
        region: "EU",
        datetime: "2026-05-21T21:30:00Z",
      });
      expect(transactional.decision).toBe("allow");

      const dayMarketing = await c.evaluate.execute({
        userId: "user-2",
        notificationType: "marketing_push",
        channel: "push",
        region: "EU",
        datetime: "2026-05-22T10:00:00Z",
      });
      expect(dayMarketing.decision).toBe("allow");
    });
  });

  describe("Scenario 4: global policies", () => {
    it("blocks marketing_sms in EU even if user enabled it", async () => {
      const c = buildTestContainer();
      c.globalPolicies.seed([
        {
          region: "EU",
          notificationType: "marketing_sms",
          channel: "sms",
          enabled: false,
        },
      ]);

      await c.updatePrefs.execute({
        userId: "user-3",
        preferences: [
          { notificationType: "marketing_sms", channel: "sms", enabled: true },
        ],
      });

      const blocked = await c.evaluate.execute({
        userId: "user-3",
        notificationType: "marketing_sms",
        channel: "sms",
        region: "EU",
        datetime: "2026-05-21T12:00:00Z",
      });
      expect(blocked.decision).toBe("deny");
      expect(blocked.reason).toBe("blocked_by_global_policy");

      const allowedElsewhere = await c.evaluate.execute({
        userId: "user-3",
        notificationType: "marketing_sms",
        channel: "sms",
        region: "US",
        datetime: "2026-05-21T12:00:00Z",
      });
      expect(allowedElsewhere.decision).toBe("allow");
    });
  });

  describe("Scenario 5: idempotency", () => {
    it("applying the same change twice yields the same state and no duplicates", async () => {
      const c = buildTestContainer();

      const command = {
        userId: "user-4",
        preferences: [
          {
            notificationType: "marketing_email" as const,
            channel: "email" as const,
            enabled: false,
          },
        ],
      };

      await c.updatePrefs.execute(command);
      await c.updatePrefs.execute(command);

      const all = await c.userPrefs.findAllForUser("user-4");
      expect(all).toHaveLength(1);
      expect(all[0]).toMatchObject({
        notificationType: "marketing_email",
        channel: "email",
        enabled: false,
      });

      const view = await c.getPrefs.execute("user-4");
      const marketing = view.preferences.find(
        (p) => p.notificationType === "marketing_email",
      );
      expect(marketing).toMatchObject({ enabled: false, source: "user" });
    });

    it("updating quiet hours twice keeps a single record", async () => {
      const c = buildTestContainer();

      const qh = {
        timezone: "Europe/Berlin",
        startTime: "22:00",
        endTime: "08:00",
      };

      await c.updatePrefs.execute({ userId: "user-5", quietHours: qh });
      await c.updatePrefs.execute({ userId: "user-5", quietHours: qh });

      const stored = await c.quietHours.findOne("user-5");
      expect(stored).toMatchObject(qh);
    });
  });
});
