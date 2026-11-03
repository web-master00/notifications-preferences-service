import { DateTime, IANAZone } from "luxon";
import { z } from "zod";
import { CHANNELS, NOTIFICATION_TYPES, REGIONS } from "../../domain/enums";

export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const ChannelSchema = z.enum(CHANNELS);
export const RegionSchema = z.enum(REGIONS);

const TimeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "expected HH:mm");

const TimezoneSchema = z
  .string()
  .min(1, "timezone is required")
  .refine((tz) => IANAZone.isValidZone(tz), "invalid IANA timezone");

export const QuietHoursSchema = z
  .object({
    timezone: TimezoneSchema,
    startTime: TimeStringSchema,
    endTime: TimeStringSchema,
  })
  .refine(
    (v) => v.startTime !== v.endTime,
    "startTime and endTime must differ",
  );

export const PreferenceToggleSchema = z.object({
  notificationType: NotificationTypeSchema,
  channel: ChannelSchema,
  enabled: z.boolean(),
});

export const UpdatePreferencesBodySchema = z
  .object({
    preferences: z.array(PreferenceToggleSchema).max(64).optional(),
    quietHours: QuietHoursSchema.nullable().optional(),
  })
  .refine(
    (v) => v.preferences !== undefined || v.quietHours !== undefined,
    "Provide at least one of: preferences, quietHours",
  )
  .superRefine((value, context) => {
    const seen = new Set<string>();

    for (const [index, preference] of (value.preferences ?? []).entries()) {
      const key = `${preference.notificationType}::${preference.channel}`;
      if (seen.has(key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["preferences", index],
          message: "duplicate notificationType/channel combination",
        });
      }
      seen.add(key);
    }
  });

export const EvaluateBodySchema = z.object({
  userId: z.string().min(1).max(256),
  notificationType: NotificationTypeSchema,
  channel: ChannelSchema,
  region: RegionSchema,
  datetime: z.string().refine(
    (value) => {
      const hasExplicitOffset = /[Tt].*(?:[Zz]|[+-]\d{2}:\d{2})$/.test(value);
      return hasExplicitOffset && DateTime.fromISO(value, { setZone: true }).isValid;
    },
    "expected ISO 8601 datetime with an explicit timezone offset",
  ),
});

export type UpdatePreferencesBody = z.infer<typeof UpdatePreferencesBodySchema>;
export type EvaluateBody = z.infer<typeof EvaluateBodySchema>;
export type QuietHoursBody = z.infer<typeof QuietHoursSchema>;
export type PreferenceToggle = z.infer<typeof PreferenceToggleSchema>;
