import {
  EvaluateBodySchema,
  QuietHoursSchema,
  UpdatePreferencesBodySchema,
} from "../api/dto/schemas";

describe("zod schemas", () => {
  describe("QuietHoursSchema", () => {
    it("accepts valid IANA timezone", () => {
      const result = QuietHoursSchema.safeParse({
        timezone: "Europe/Berlin",
        startTime: "22:00",
        endTime: "08:00",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid timezone", () => {
      const result = QuietHoursSchema.safeParse({
        timezone: "Lol/Not_A_Zone",
        startTime: "22:00",
        endTime: "08:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects equal start and end times", () => {
      const result = QuietHoursSchema.safeParse({
        timezone: "UTC",
        startTime: "12:00",
        endTime: "12:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects malformed HH:mm", () => {
      const result = QuietHoursSchema.safeParse({
        timezone: "UTC",
        startTime: "25:61",
        endTime: "08:00",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdatePreferencesBodySchema", () => {
    it("rejects empty body", () => {
      const result = UpdatePreferencesBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("accepts preferences only", () => {
      const result = UpdatePreferencesBodySchema.safeParse({
        preferences: [
          {
            notificationType: "marketing_email",
            channel: "email",
            enabled: false,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts explicit null quietHours (to clear)", () => {
      const result = UpdatePreferencesBodySchema.safeParse({
        quietHours: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("EvaluateBodySchema", () => {
    it("rejects bad datetime", () => {
      const result = EvaluateBodySchema.safeParse({
        userId: "u1",
        notificationType: "marketing_email",
        channel: "email",
        region: "EU",
        datetime: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty userId", () => {
      const result = EvaluateBodySchema.safeParse({
        userId: "",
        notificationType: "marketing_email",
        channel: "email",
        region: "EU",
        datetime: "2026-05-21T12:00:00Z",
      });
      expect(result.success).toBe(false);
    });
  });
});
